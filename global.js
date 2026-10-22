console.log('IT’S ALIVE!');

function $$(selector, context = document) {
    return Array.from(context.querySelectorAll(selector));
}

let pages = [
    { url: './', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'contact/', title: 'Contact' },
    { url: 'cv/', title: 'CV' },
    { url: 'https://github.com/mmmesdaq-spec', title: 'GitHub' }
];

let nav = document.createElement('nav');

let BASE_PATH = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? '/'
    : '/DSC-106-Portfolio/';

for (let page of pages) {
    let a = document.createElement('a');

    a.href = page.url.startsWith('http')
        ? page.url
        : BASE_PATH + (page.url === './' ? '' : page.url);

    a.textContent = page.title;

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }

    nav.append(a);
}

document.body.prepend(nav);

document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
        Theme:
        <select>
            <option value="light dark">Automatic</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
        </select>
    </label>
    `
);

let select = document.querySelector('.color-scheme select');

select.addEventListener('input', function(event) {
    document.documentElement.style.setProperty(
        'color-scheme',
        event.target.value
    );

    localStorage.colorScheme = event.target.value;
});

if (localStorage.colorScheme) {
    document.documentElement.style.setProperty(
        'color-scheme',
        localStorage.colorScheme
    );

    select.value = localStorage.colorScheme;
}

let form = document.querySelector('form');

form?.addEventListener('submit', function(event) {
    event.preventDefault();

    let data = new FormData(form);
    let url = form.action + '?';

    for (let [name, value] of data) {
        url += `${encodeURIComponent(name)}=${encodeURIComponent(value)}&`;
    }

    location.href = url;
});

export async function fetchJSON(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching JSON:', error);
    }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
    containerElement.innerHTML = '';

    for (let project of projects) {
        const article = document.createElement('article');

        article.innerHTML = `
            <${headingLevel}>${project.title}</${headingLevel}>
            <img src="${project.image}" alt="">
            <p>${project.description}</p>
        `;

        containerElement.appendChild(article);
    }
}

export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}