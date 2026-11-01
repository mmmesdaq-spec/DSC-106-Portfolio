import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');

renderProjects(projects, projectsContainer, 'h2');

const projectsTitle = document.querySelector('.projects-title');

if (projectsTitle) {
    projectsTitle.textContent = `Projects (${projects.length})`;
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let arc = arcGenerator({
    startAngle: 0,
    endAngle: 2 * Math.PI,
});

let selectedYear = null;

function renderPieChart(projectsGiven) {
    d3.select('#projects-pie-plot').selectAll('path').remove();
    d3.select('.legend').selectAll('li').remove();
    
    let rolledData = d3.rollups(
        projectsGiven,
        v => v.length,
        d => d.year
    );

    let data = rolledData.map(([year, count]) => ({
        value: count,
        label: year
    }));

let colors = d3.scaleOrdinal()
    .domain([...new Set(projects.map(project => project.year))].sort())
    .range(d3.schemeTableau10);

let sliceGenerator = d3.pie().value(d => d.value);
let arcData = sliceGenerator(data);

let arcs = arcData.map(d => arcGenerator(d));

arcs.forEach((arc, idx) => {
    d3.select('#projects-pie-plot')
        .append('path')
        .attr('d', arc)
        .attr('fill', colors(data[idx].label))
        .classed('selected', selectedYear === data[idx].label)
        .on('click', () => {
            selectedYear = selectedYear === data[idx].label
                ? null
                : data[idx].label;

            console.log('Selected year:', selectedYear);

            let query = searchInput.value.toLowerCase();

            let filteredProjects = projects.filter((project) => {
                let values = Object.values(project).join(' ').toLowerCase();

                let matchesSearch = values.includes(query);
                let matchesYear = selectedYear === null || project.year === selectedYear;

                return matchesSearch && matchesYear;
            });

            renderProjects(filteredProjects, projectsContainer, 'h2');
            renderPieChart(projectsGiven);
        });
});

let legend = d3.select('.legend');

data.forEach((d, idx) => {
    legend.append('li')
        .attr('style', `--color: ${colors(data[idx].label)}`)
        .attr('class', 'legend-item')
        .classed('selected', selectedYear === d.label)
        .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
});
}

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    let query = event.target.value.toLowerCase();
    

    let filteredProjects = projects.filter((project) => {
        let values = Object.values(project).join(' ').toLowerCase();

        let matchesSearch = values.includes(query);
        let matchesYear = selectedYear === null || project.year === selectedYear;

        return matchesSearch && matchesYear;
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});
renderPieChart(projects);