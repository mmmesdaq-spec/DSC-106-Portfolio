import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

const projects = await fetchJSON('./lib/projects.json');

const latestProjects = projects.slice(0, 3);

const projectsContainer = document.querySelector('.projects');

renderProjects(latestProjects, projectsContainer, 'h2');

const githubData = await fetchGitHubData('mmmesdaq-spec');

console.log('GitHub Data:', githubData);

const profileStats = document.querySelector('#profile-stats');

if (githubData) {
    profileStats.innerHTML = `
        <dl>
            <div class="stat-card">
                <dd>${githubData.public_repos}</dd>
                <dt>Public Repositories</dt>
            </div>

            <div class="stat-card">
                <dd>${githubData.public_gists}</dd>
                <dt>Public Gists</dt>
            </div>

            <div class="stat-card">
                <dd>${githubData.followers}</dd>
                <dt>Followers</dt>
            </div>

            <div class="stat-card">
                <dd>${githubData.following}</dd>
                <dt>Following</dt>
            </div>
        </dl>
    `;
}