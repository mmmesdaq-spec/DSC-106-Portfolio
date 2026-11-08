import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
async function loadData() {
    const data = await d3.csv('loc.csv', row => ({
        ...row,
        line: Number(row.line),
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
    }));

    return data;
}

let data = await loadData();

console.log('Loaded data:', data);

function processCommits(data) {
    return d3.groups(data, d => d.commit).map(([commit, lines]) => {
        let first = lines[0];

        let { author, date, time, timezone, datetime } = first;

        let ret = {
            id: commit,
            url: 'https://github.com/mmmesdaq-spec/DSC-106-Portfolio/commit/' + commit,
            author,
            date,
            time,
            timezone,
            datetime,
            hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
            totalLines: lines.length,
        };

        Object.defineProperty(ret, 'lines', {
            value: lines,
            enumerable: false,
        });

        return ret;
    });
}

let commits = processCommits(data);

console.log('Processed commits:', commits);

function displayStats() {
    const stats = [
        { label: 'Total LOC', value: data.length },
        { label: 'Total Commits', value: commits.length },
        { label: 'Number of Files', value: d3.group(data, d => d.file).size },
        { label: 'Max Depth', value: d3.max(data, d => d.depth) },
        { label: 'Average Line Length', value: Math.round(d3.mean(data, d => d.length)) }
    ];

    d3.select('#stats')
        .append('dl')
        .selectAll('div')
        .data(stats)
        .join('div')
        .html(d => `
            <dt>${d.label}</dt>
            <dd>${d.value}</dd>
        `);
}

displayStats();

// Scatterplot dimensions
const width = 1000;
const height = 600;

const margin = {
    top: 20,
    right: 20,
    bottom: 50,
    left: 50
};

const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom
};

// Create SVG element
const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('max-width', '100%');

// X-axis: Commit dates
const xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

// Draw the X-axis
svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(d3.axisBottom(xScale));

// Y-axis: Time of day
const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

// Draw the Y-axis
svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
        d3.axisLeft(yScale)
            .tickFormat(d => `${String(d % 24).padStart(2, '0')}:00`)
    );

// Plot each GitHub commit as a circle
const rScale = d3.scaleSqrt()
    .domain([0, d3.max(commits, d => d.totalLines)])
    .range([2, 30]);

svg.append('g')
    .selectAll('circle')
    .data([...commits].sort((a, b) => a.totalLines - b.totalLines))    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .attr('opacity', 0.7);

// Add horizontal gridlines
svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
        d3.axisLeft(yScale)
            .tickSize(-usableArea.width)
            .tickFormat('')
    )
    .lower();

function renderTooltipContent(commit) {
    const link = document.querySelector('#commit-link');

    link.href = commit.url;
    link.textContent = commit.id.slice(0, 7);

    document.querySelector('#commit-date').textContent =
        commit.datetime.toLocaleDateString();

    document.querySelector('#commit-time').textContent =
        commit.datetime.toLocaleTimeString();

    document.querySelector('#commit-author').textContent =
        commit.author;

    document.querySelector('#commit-lines').textContent =
        commit.totalLines;
}

const tooltip = document.querySelector('#commit-tooltip');
let isBrushing = false;

document.addEventListener('pointerdown', () => {
    isBrushing = true;
    tooltip.hidden = true;
}, true);

document.addEventListener('pointerup', () => {
    isBrushing = false;
    tooltip.hidden = true;
}, true);

svg.selectAll('circle')
    .on('mouseenter', (event, commit) => {
        if (event.buttons !== 0 || isBrushing) return;

        renderTooltipContent(commit);
        tooltip.hidden = false;
    })
    .on('mousemove', (event) => {
        if (event.buttons !== 0 || isBrushing) {
            tooltip.hidden = true;
            return;
        }

        tooltip.style.left = `${event.clientX + 15}px`;
        tooltip.style.top = `${event.clientY + 15}px`;
    })
    .on('mouseleave', () => {
        tooltip.hidden = true;
    });

const brush = d3.brush()
    .extent([
        [usableArea.left, usableArea.top],
        [usableArea.right, usableArea.bottom]
    ]);

// Add the brush to the scatterplot
svg.append('g')
    .attr('class', 'brush')
    .call(brush)
    .lower();

function isCommitSelected(commit, selection) {
    if (!selection) {
        return false;
    }

    const [[x0, y0], [x1, y1]] = selection;

    const x = xScale(commit.datetime);
    const y = yScale(commit.hourFrac);

    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

// Update selected commits when brushing
function brushed(event) {
    const selection = event.selection;

    const selectedCommits = selection
        ? commits.filter(d => isCommitSelected(d, selection))
        : [];

    // Highlight selected circles
    svg.selectAll('circle')
        .classed('selected', d => selectedCommits.includes(d));

    // Update selection count
    d3.select('#selection-count')
        .text(
            selectedCommits.length === 0
                ? 'No commits selected'
                : `${selectedCommits.length} commits selected`
        );

    // Get all lines from selected commits
    const selectedLines = selectedCommits.flatMap(d => d.lines);

    // Group lines by programming language
    const languageCounts = d3.rollups(
        selectedLines,
        lines => lines.length,
        d => d.type
    );

    // Display the language breakdown
    d3.select('#language-breakdown')
        .selectAll('div')
        .data(languageCounts)
        .join('div')
        .html(([language, count]) => `
            <dt>${language}</dt>
            <dd>${count} lines</dd>
        `);
}

// Connect the brush to the selection function
brush
    .on('start', (event) => {
        isBrushing = true;
        tooltip.hidden = true;

        svg.selectAll('circle')
            .style('pointer-events', 'none');

        brushed(event);
    })
    .on('brush', (event) => {
        tooltip.hidden = true;
        brushed(event);
    })
    .on('end', (event) => {
        tooltip.hidden = true;
        brushed(event);
        isBrushing = false;

        svg.selectAll('circle')
            .style('pointer-events', null);
    });

// Apply the updated brush
svg.select('.brush').call(brush);

