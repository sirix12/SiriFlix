const API_KEY = '269890f657dddf4635473cf4cf456576';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BG_IMG_URL = 'https://image.tmdb.org/t/p/original';

// DOM Elements
const navbar = document.getElementById('navbar');
const searchInput = document.getElementById('search-input');
const searchView = document.getElementById('search-view');
const mainView = document.getElementById('main-view');
const searchResultsGrid = document.getElementById('search-results-grid');
const searchTermEl = document.getElementById('search-term');

const heroTitle = document.getElementById('hero-title');
const heroOverview = document.getElementById('hero-overview');
const hero = document.getElementById('hero');
const rowsContainer = document.getElementById('rows-container');

const detailsView = document.getElementById('details-view');
const backBtn = document.getElementById('back-btn');
const videoPlayer = document.getElementById('video-player');
const serverSelect = document.getElementById('server-select');
const tvControls = document.getElementById('tv-controls');
const seasonSelect = document.getElementById('season-select');
const episodeSelect = document.getElementById('episode-select');

const detailsTitle = document.getElementById('details-title');
const detailsYear = document.getElementById('details-year');
const detailsRating = document.getElementById('details-rating');
const detailsType = document.getElementById('details-type');
const detailsOverview = document.getElementById('details-overview');

// Global State
let currentMedia = null; // { id, type: 'movie' | 'tv' }
let previousView = 'main'; // Tracks if user came from 'main' or 'search'

// Servers configuration
const SERVERS = [
    {
        name: 'Vidrock (Default)',
        id: 'vidrock',
        getMovieUrl: (id) => `https://vidrock.ru/movie/${id}?theme=E50914`,
        getTvUrl: (id, s, e) => `https://vidrock.ru/tv/${id}/${s}/${e}?theme=E50914`
    },
    {
        name: 'Vidzee',
        id: 'vidzee',
        getMovieUrl: (id) => `https://player.vidzee.wtf/embed/movie/${id}`,
        getTvUrl: (id, s, e) => `https://player.vidzee.wtf/embed/tv/${id}/${s}/${e}`
    },
    {
        name: '111Movies',
        id: '111movies',
        getMovieUrl: (id) => `https://111movies.net/movie/${id}`,
        getTvUrl: (id, s, e) => `https://111movies.net/tv/${id}/${s}/${e}`
    },
    {
        name: 'VidSRC 1',
        id: 'vidsrc1',
        getMovieUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
        getTvUrl: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
    },
    {
        name: 'VidSRC 2',
        id: 'vidsrc2',
        getMovieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
        getTvUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`
    },
    {
        name: 'VidSRC 3',
        id: 'vidsrc3',
        getMovieUrl: (id) => `https://vidsrc.net/embed/movie?tmdb=${id}`,
        getTvUrl: (id, s, e) => `https://vidsrc.net/embed/tv?tmdb=${id}&season=${s}&episode=${e}`
    },
    {
        name: 'VidLink',
        id: 'vidlink',
        getMovieUrl: (id) => `https://vidlink.pro/movie/${id}`,
        getTvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`
    },
    {
        name: 'VidEasy',
        id: 'videasy',
        getMovieUrl: (id) => `https://videasy.net/embed/movie/${id}`,
        getTvUrl: (id, s, e) => `https://videasy.net/embed/tv/${id}/${s}/${e}`
    },
    {
        name: 'VidNest',
        id: 'vidnest',
        getMovieUrl: (id) => `https://vidnest.net/embed/movie/${id}`,
        getTvUrl: (id, s, e) => `https://vidnest.net/embed/tv/${id}/${s}/${e}`
    },
    {
        name: 'Riverstream',
        id: 'riverstream',
        getMovieUrl: (id) => `https://riverstream.net/embed/movie/${id}`,
        getTvUrl: (id, s, e) => `https://riverstream.net/embed/tv/${id}/${s}/${e}`
    },
    {
        name: 'VidSRC ICU',
        id: 'vidsrcicu',
        getMovieUrl: (id) => `https://vidsrc.icu/embed/movie/${id}`,
        getTvUrl: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`
    },
    {
        name: 'VidSRC XYZ',
        id: 'vidsrcxyz',
        getMovieUrl: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
        getTvUrl: (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`
    }
];

// Initialize Servers
function initServers() {
    SERVERS.forEach(server => {
        const option = document.createElement('option');
        option.value = server.id;
        option.textContent = server.name;
        serverSelect.appendChild(option);
    });
}

// Fetch helper
async function fetchData(url) {
    const res = await fetch(url);
    const data = await res.json();
    return data;
}

// Load Home Page Data
async function loadHome() {
    initServers();
    
    // Fetch Trending
    const trending = await fetchData(`${BASE_URL}/trending/all/day?api_key=${API_KEY}`);
    const heroMovie = trending.results[Math.floor(Math.random() * trending.results.length)];
    
    // Set Hero
    heroTitle.innerText = heroMovie.title || heroMovie.name;
    heroOverview.innerText = heroMovie.overview;
    hero.style.backgroundImage = `url(${BG_IMG_URL + heroMovie.backdrop_path})`;
    
    document.getElementById('hero-play').onclick = () => openPlayer(heroMovie);
    document.getElementById('hero-info').onclick = () => openPlayer(heroMovie); // Can be a different modal later

    // Load Rows
    const rows = [
        { title: 'Trending Now', url: `/trending/all/week?api_key=${API_KEY}` },
        { title: 'Top Rated Movies', url: `/movie/top_rated?api_key=${API_KEY}` },
        { title: 'Action Movies', url: `/discover/movie?api_key=${API_KEY}&with_genres=28` },
        { title: 'Comedy Movies', url: `/discover/movie?api_key=${API_KEY}&with_genres=35` },
        { title: 'Popular TV Shows', url: `/tv/popular?api_key=${API_KEY}` },
        { title: 'Sci-Fi & Fantasy', url: `/discover/tv?api_key=${API_KEY}&with_genres=10765` }
    ];

    rowsContainer.innerHTML = '';
    
    for (const row of rows) {
        const rowData = await fetchData(BASE_URL + row.url);
        createRow(row.title, rowData.results);
    }
}

function createRow(title, movies) {
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('row');
    
    const h2 = document.createElement('h2');
    h2.innerText = title;
    rowDiv.appendChild(h2);
    
    const postersDiv = document.createElement('div');
    postersDiv.classList.add('row-posters');
    
    movies.forEach(movie => {
        if (!movie.poster_path) return;
        const img = document.createElement('img');
        img.src = IMG_URL + movie.poster_path;
        img.classList.add('poster');
        img.alt = movie.title || movie.name;
        img.onclick = () => openPlayer(movie);
        postersDiv.appendChild(img);
    });
    
    rowDiv.appendChild(postersDiv);
    rowsContainer.appendChild(rowDiv);
}

// Search Functionality
let searchTimeout;
searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    
    if (query.length > 0) {
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 500);
    } else {
        searchView.classList.add('hidden');
        mainView.classList.remove('hidden');
    }
});

async function performSearch(query) {
    searchTermEl.innerText = query;
    mainView.classList.add('hidden');
    searchView.classList.remove('hidden');
    searchResultsGrid.innerHTML = 'Loading...';
    
    const data = await fetchData(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    
    searchResultsGrid.innerHTML = '';
    if (data.results.length === 0) {
        searchResultsGrid.innerHTML = '<p>No results found.</p>';
        return;
    }

    data.results.forEach(item => {
        if (!item.poster_path || item.media_type === 'person') return;
        const img = document.createElement('img');
        img.src = IMG_URL + item.poster_path;
        img.classList.add('poster');
        img.alt = item.title || item.name;
        img.onclick = () => openPlayer(item);
        searchResultsGrid.appendChild(img);
    });
}

// Player / Details Logic
async function openPlayer(item) {
    const type = item.media_type || (item.name ? 'tv' : 'movie'); // Best guess if media_type missing
    currentMedia = { id: item.id, type: type };
    
    // Save where we came from to go back
    if (!searchView.classList.contains('hidden')) {
        previousView = 'search';
    } else {
        previousView = 'main';
    }
    
    detailsTitle.innerText = item.title || item.name;
    detailsOverview.innerText = item.overview;
    detailsYear.innerText = (item.release_date || item.first_air_date || '').split('-')[0];
    detailsRating.innerText = item.vote_average ? `${item.vote_average.toFixed(1)}/10` : 'N/A';
    detailsType.innerText = type.toUpperCase();

    // Reset controls
    serverSelect.selectedIndex = 0; // Default to Vidrock
    
    if (type === 'tv') {
        tvControls.classList.remove('hidden');
        await loadTvSeasons(item.id);
    } else {
        tvControls.classList.add('hidden');
        updatePlayerSrc();
    }
    
    // Show details view
    mainView.classList.add('hidden');
    searchView.classList.add('hidden');
    detailsView.classList.remove('hidden');
    
    // Scroll to top of details view
    window.scrollTo(0, 0);
}

function backToHome() {
    detailsView.classList.add('hidden');
    videoPlayer.src = ''; // Stop video playback
    currentMedia = null;
    
    if (previousView === 'search') {
        searchView.classList.remove('hidden');
    } else {
        mainView.classList.remove('hidden');
    }
    window.scrollTo(0, 0);
}

backBtn.onclick = backToHome;

async function loadTvSeasons(id) {
    const data = await fetchData(`${BASE_URL}/tv/${id}?api_key=${API_KEY}`);
    seasonSelect.innerHTML = '';
    
    // Fetch last watched episode from local storage if available
    let savedWatchProgress = getSavedProgress(id);
    let defaultSeason = 1;
    let defaultEpisode = 1;

    if (savedWatchProgress && savedWatchProgress.last_season_watched) {
        defaultSeason = parseInt(savedWatchProgress.last_season_watched);
        defaultEpisode = parseInt(savedWatchProgress.last_episode_watched);
    }

    data.seasons.forEach(season => {
        if (season.season_number === 0) return; // Skip specials usually
        const option = document.createElement('option');
        option.value = season.season_number;
        option.textContent = `Season ${season.season_number}`;
        if (season.season_number === defaultSeason) option.selected = true;
        seasonSelect.appendChild(option);
    });
    
    await loadTvEpisodes(id, seasonSelect.value, defaultEpisode);
}

async function loadTvEpisodes(tvId, seasonNumber, defaultEpisode = 1) {
    const data = await fetchData(`${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`);
    episodeSelect.innerHTML = '';
    
    data.episodes.forEach(episode => {
        const option = document.createElement('option');
        option.value = episode.episode_number;
        option.textContent = `Ep ${episode.episode_number}: ${episode.name}`;
        if (episode.episode_number === defaultEpisode) option.selected = true;
        episodeSelect.appendChild(option);
    });
    
    updatePlayerSrc();
}

seasonSelect.addEventListener('change', () => {
    if (currentMedia && currentMedia.type === 'tv') {
        loadTvEpisodes(currentMedia.id, seasonSelect.value);
    }
});

episodeSelect.addEventListener('change', updatePlayerSrc);
serverSelect.addEventListener('change', updatePlayerSrc);

function updatePlayerSrc() {
    if (!currentMedia) return;
    
    const serverId = serverSelect.value;
    const server = SERVERS.find(s => s.id === serverId);
    
    if (currentMedia.type === 'tv') {
        const s = seasonSelect.value;
        const e = episodeSelect.value;
        videoPlayer.src = server.getTvUrl(currentMedia.id, s, e);
    } else {
        videoPlayer.src = server.getMovieUrl(currentMedia.id);
    }
}

// Navbar Scroll Effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Watch Progress (Local Storage) Handling from Vidrock
window.addEventListener('message', (event) => {
    // Only accept messages from vidrock
    if (event.origin !== 'https://vidrock.ru') return;
    
    // Store Media Data progress
    if (event.data?.type === 'MEDIA_DATA') {
        const mediaData = event.data.data;
        let progressList = JSON.parse(localStorage.getItem('vidRockProgress') || '[]');
        
        // Find and update, or add new
        const existingIndex = progressList.findIndex(p => p.id === mediaData.id);
        if (existingIndex >= 0) {
            progressList[existingIndex] = mediaData;
        } else {
            progressList.push(mediaData);
        }
        
        localStorage.setItem('vidRockProgress', JSON.stringify(progressList));
    }
});

function getSavedProgress(tmdbId) {
    try {
        const progressList = JSON.parse(localStorage.getItem('vidRockProgress') || '[]');
        return progressList.find(p => p.id === parseInt(tmdbId));
    } catch (e) {
        return null;
    }
}

// Initialize
loadHome();
