const API_KEY = "269890f657dddf4635473cf4cf456576";
const BASE_URL = "https://api.themoviedb.org/3";
const IMG_URL = "https://image.tmdb.org/t/p/w500";
const BG_IMG_URL = "https://image.tmdb.org/t/p/original";

// --- Anti-Ad & Popup Blocking Tricks ---
// 1. Override window.open to prevent JS-based popups on the main site
window.open = function () {
  console.warn("Blocked popup attempt via window.open");
  return null;
};

// 2. Intercept clicks on links that try to open in new tabs
document.addEventListener("click", function (e) {
  const target = e.target.closest("a");
  if (target && target.getAttribute("target") === "_blank") {
    e.preventDefault();
    console.warn("Blocked new tab link click");
  }
});

// 3. Warn user if a script tries to redirect the entire page (Top Navigation Hijacking)
window.addEventListener("beforeunload", (e) => {
  if (document.activeElement && document.activeElement.tagName === "IFRAME") {
    // If an iframe is trying to redirect the page while active, warn the user
    // Modern browsers ignore custom messages, so we just call preventDefault()
    e.preventDefault();
  }
});
// ---------------------------------------

// DOM Elements
const navbar = document.getElementById("navbar");
const searchInput = document.getElementById("search-input");
const searchPopup = document.getElementById("search-popup");
const mainView = document.getElementById("main-view");
const searchResultsGrid = document.getElementById("search-results-grid");

const heroTitle = document.getElementById("hero-title");
const heroOverview = document.getElementById("hero-overview");
const hero = document.getElementById("hero");
const rowsContainer = document.getElementById("rows-container");

const detailsView = document.getElementById("details-view");
const backBtn = document.getElementById("back-btn");
const videoPlayer = document.getElementById("video-player");
const serverSelect = document.getElementById("server-select");
const tvControls = document.getElementById("tv-controls");
const seasonSelect = document.getElementById("season-select");
const episodeSelect = document.getElementById("episode-select");
const animeResolutionSelect = document.getElementById(
  "anime-resolution-select",
);

const moviesModeBtn = document.getElementById("movies-mode-btn");
const animeModeBtn = document.getElementById("anime-mode-btn");

const detailsTitle = document.getElementById("details-title");
const detailsYear = document.getElementById("details-year");
const detailsRating = document.getElementById("details-rating");
const detailsType = document.getElementById("details-type");
const detailsOverview = document.getElementById("details-overview");

// Global State
let currentMedia = null; // { id, type: 'movie' | 'tv' | 'anime', session }
let previousView = "main"; // Tracks if user came from 'main' or 'search'
let isAnimeMode = false;
let currentAnimeSources = [];
const ANIME_API_URL = "https://animepahe-api.vercel.app/api";

moviesModeBtn.addEventListener("click", () => {
  if (isAnimeMode) {
    isAnimeMode = false;
    animeModeBtn.classList.remove("active");
    moviesModeBtn.classList.add("active");
    loadHome();
  }
});

animeModeBtn.addEventListener("click", () => {
  if (!isAnimeMode) {
    isAnimeMode = true;
    moviesModeBtn.classList.remove("active");
    animeModeBtn.classList.add("active");
    loadHome();
  }
});

// Servers configuration
const SERVERS = [
  {
    name: "Vidrock (Default)",
    id: "vidrock",
    getMovieUrl: (id) => `https://vidrock.ru/movie/${id}?theme=E50914`,
    getTvUrl: (id, s, e) =>
      `https://vidrock.ru/tv/${id}/${s}/${e}?theme=E50914`,
  },
  {
    name: "Vidzee",
    id: "vidzee",
    getMovieUrl: (id) => `https://player.vidzee.wtf/embed/movie/${id}`,
    getTvUrl: (id, s, e) =>
      `https://player.vidzee.wtf/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "111Movies",
    id: "111movies",
    getMovieUrl: (id) => `https://111movies.net/movie/${id}`,
    getTvUrl: (id, s, e) => `https://111movies.net/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidSRC 1",
    id: "vidsrc1",
    getMovieUrl: (id) => `https://vidsrc.me/embed/movie?tmdb=${id}`,
    getTvUrl: (id, s, e) =>
      `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    name: "VidSRC 2",
    id: "vidsrc2",
    getMovieUrl: (id) => `https://vidsrc.to/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidSRC 3",
    id: "vidsrc3",
    getMovieUrl: (id) => `https://vidsrc.net/embed/movie?tmdb=${id}`,
    getTvUrl: (id, s, e) =>
      `https://vidsrc.net/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    name: "VidLink",
    id: "vidlink",
    getMovieUrl: (id) => `https://vidlink.pro/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidlink.pro/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidEasy",
    id: "videasy",
    getMovieUrl: (id) => `https://videasy.net/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://videasy.net/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidNest",
    id: "vidnest",
    getMovieUrl: (id) => `https://vidnest.net/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidnest.net/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "Riverstream",
    id: "riverstream",
    getMovieUrl: (id) => `https://riverstream.net/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://riverstream.net/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidSRC ICU",
    id: "vidsrcicu",
    getMovieUrl: (id) => `https://vidsrc.icu/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.icu/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "VidSRC XYZ",
    id: "vidsrcxyz",
    getMovieUrl: (id) => `https://vidsrc.xyz/embed/movie/${id}`,
    getTvUrl: (id, s, e) => `https://vidsrc.xyz/embed/tv/${id}/${s}/${e}`,
  },
];

// Initialize Servers
function initServers() {
  serverSelect.innerHTML = "";
  SERVERS.forEach((server) => {
    const option = document.createElement("option");
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

  if (isAnimeMode) {
    // Fetch Airing Anime
    const airing = await fetchData(`${ANIME_API_URL}/airing`);
    if (airing && airing.data && airing.data.length > 0) {
      const heroAnime =
        airing.data[Math.floor(Math.random() * airing.data.length)];

      heroTitle.innerText = heroAnime.title;
      heroOverview.innerText = "Currently airing episode " + heroAnime.episode;
      hero.style.backgroundImage = `url(${heroAnime.image || heroAnime.poster})`;

      heroAnime.media_type = "anime";

      document.getElementById("hero-play").onclick = () =>
        openPlayer(heroAnime);
      document.getElementById("hero-info").onclick = () =>
        openPlayer(heroAnime);
    }

    const rows = [
      { title: "Top Anime This Season", url: `https://api.jikan.moe/v4/seasons/now?limit=20`, isJikan: true },
      { title: "New Releases", url: `${ANIME_API_URL}/airing`, isJikan: false },
      { title: "Top Action", url: `https://api.jikan.moe/v4/anime?genres=1&order_by=score&sort=desc&limit=20`, isJikan: true },
      { title: "Top Comedy", url: `https://api.jikan.moe/v4/anime?genres=4&order_by=score&sort=desc&limit=20`, isJikan: true },
      { title: "Top Romance", url: `https://api.jikan.moe/v4/anime?genres=22&order_by=score&sort=desc&limit=20`, isJikan: true },
    ];

    rowsContainer.innerHTML = "";

    for (const row of rows) {
      try {
        const rowData = await fetchData(row.url);
        if (rowData && rowData.data) {
          let mappedData = rowData.data;
          if (row.isJikan) {
            mappedData = rowData.data.map(anime => ({
              title: anime.title,
              altTitle: anime.title_english,
              image: anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
              synopsis: anime.synopsis,
              year: anime.year,
              score: anime.score,
              id: anime.mal_id
            }));
          }
          createRow(row.title, mappedData, true);
        }
        if (row.isJikan) {
          await new Promise(r => setTimeout(r, 400));
        }
      } catch (err) {
        console.error(`Error fetching ${row.title}:`, err);
      }
    }
  } else {
    // Fetch Trending
    const trending = await fetchData(
      `${BASE_URL}/trending/all/day?api_key=${API_KEY}`,
    );
    const heroMovie =
      trending.results[Math.floor(Math.random() * trending.results.length)];

    // Set Hero
    heroTitle.innerText = heroMovie.title || heroMovie.name;
    heroOverview.innerText = heroMovie.overview;
    hero.style.backgroundImage = `url(${BG_IMG_URL + heroMovie.backdrop_path})`;

    document.getElementById("hero-play").onclick = () => openPlayer(heroMovie);
    document.getElementById("hero-info").onclick = () => openPlayer(heroMovie); // Can be a different modal later

    // Load Rows
    const rows = [
      { title: "Trending Now", url: `/trending/all/week?api_key=${API_KEY}` },
      { title: "Top Rated Movies", url: `/movie/top_rated?api_key=${API_KEY}` },
      {
        title: "Action Movies",
        url: `/discover/movie?api_key=${API_KEY}&with_genres=28`,
      },
      {
        title: "Comedy Movies",
        url: `/discover/movie?api_key=${API_KEY}&with_genres=35`,
      },
      { title: "Popular TV Shows", url: `/tv/popular?api_key=${API_KEY}` },
      {
        title: "Sci-Fi & Fantasy",
        url: `/discover/tv?api_key=${API_KEY}&with_genres=10765`,
      },
    ];

    rowsContainer.innerHTML = "";

    for (const row of rows) {
      const rowData = await fetchData(BASE_URL + row.url);
      createRow(row.title, rowData.results, false);
    }
  }
}

function createRow(title, items, isAnime = false) {
  const rowDiv = document.createElement("div");
  rowDiv.classList.add("row");

  const h2 = document.createElement("h2");
  h2.innerText = title;
  rowDiv.appendChild(h2);

  const postersDiv = document.createElement("div");
  postersDiv.classList.add("row-posters");

  items.forEach((item) => {
    const posterUrl = isAnime
      ? item.poster || item.image
      : item.poster_path
        ? IMG_URL + item.poster_path
        : null;
    if (!posterUrl) return;
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("row-item");
    itemDiv.onclick = () => openPlayer(item);

    const img = document.createElement("img");
    img.src = posterUrl;
    img.classList.add("poster");
    img.alt = item.title || item.name;

    const title = document.createElement("div");
    title.classList.add("row-item-title");
    title.innerText = item.title || item.name || "Unknown Title";

    itemDiv.appendChild(img);
    itemDiv.appendChild(title);

    item.media_type = isAnime
      ? "anime"
      : item.media_type || (item.name ? "tv" : "movie");

    postersDiv.appendChild(itemDiv);
  });

  rowDiv.appendChild(postersDiv);
  rowsContainer.appendChild(rowDiv);
}

// Search Functionality
let searchTimeout;
searchInput.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  const query = e.target.value.trim();

  if (query.length > 0) {
    searchTimeout = setTimeout(() => {
      performSearch(query);
    }, 500);
  } else {
    searchPopup.classList.add("hidden");
  }
});

searchInput.addEventListener("focus", (e) => {
  const query = e.target.value.trim();
  if (query.length > 0) {
    searchPopup.classList.remove("hidden");
  }
});

// Close search popup when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-container")) {
    searchPopup.classList.add("hidden");
  }
});

async function performSearch(query) {
  searchPopup.classList.remove("hidden");
  searchResultsGrid.innerHTML = "<p>Loading...</p>";

  if (isAnimeMode) {
    const data = await fetchData(
      `${ANIME_API_URL}/search?q=${encodeURIComponent(query)}`,
    );

    searchResultsGrid.innerHTML = "";
    if (!data || !data.data || data.data.length === 0) {
      searchResultsGrid.innerHTML = "<p>No results found.</p>";
      return;
    }

    data.data.forEach((item) => {
      const posterUrl = item.poster || item.image;
      if (!posterUrl) return;

      const itemDiv = document.createElement("div");
      itemDiv.classList.add("search-result-item");
      itemDiv.onclick = () => openPlayer(item);

      const img = document.createElement("img");
      img.src = posterUrl;
      img.classList.add("poster");
      img.alt = item.title;

      const title = document.createElement("div");
      title.classList.add("search-result-title");
      title.innerText = item.title || "Unknown Title";

      itemDiv.appendChild(img);
      itemDiv.appendChild(title);

      item.media_type = "anime";
      searchResultsGrid.appendChild(itemDiv);
    });
  } else {
    const data = await fetchData(
      `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`,
    );

    searchResultsGrid.innerHTML = "";
    if (data.results.length === 0) {
      searchResultsGrid.innerHTML = "<p>No results found.</p>";
      return;
    }

    data.results.forEach((item) => {
      if (!item.poster_path || item.media_type === "person") return;

      const itemDiv = document.createElement("div");
      itemDiv.classList.add("search-result-item");
      itemDiv.onclick = () => openPlayer(item);

      const img = document.createElement("img");
      img.src = IMG_URL + item.poster_path;
      img.classList.add("poster");
      img.alt = item.title || item.name;

      const title = document.createElement("div");
      title.classList.add("search-result-title");
      title.innerText = item.title || item.name || "Unknown Title";

      itemDiv.appendChild(img);
      itemDiv.appendChild(title);

      searchResultsGrid.appendChild(itemDiv);
    });
  }
}

// Player / Details Logic
async function openPlayer(item) {
  const type = item.media_type || (item.name ? "tv" : "movie"); // Best guess if media_type missing

  if (type === "anime" && !item.session && item.title) {
    // Show a loading indicator in case API takes time
    detailsTitle.innerText = "Finding streams...";
    try {
      let searchRes = await fetchData(`${ANIME_API_URL}/search?q=${encodeURIComponent(item.title)}`);

      if ((!searchRes || !searchRes.data || searchRes.data.length === 0) && item.altTitle) {
        searchRes = await fetchData(`${ANIME_API_URL}/search?q=${encodeURIComponent(item.altTitle)}`);
      }

      if (searchRes && searchRes.data && searchRes.data.length > 0) {
        const titleLower = item.title.toLowerCase();
        const altTitleLower = item.altTitle ? item.altTitle.toLowerCase() : "";
        const match = searchRes.data.find(a => {
          const t = a.title.toLowerCase();
          return t === titleLower || t === altTitleLower;
        }) || searchRes.data[0];
        item.session = match.session;
      } else {
        alert("Sorry, could not find streams for this anime.");
        return;
      }
    } catch (e) {
      console.error(e);
      alert("Error finding streams.");
      return;
    }
  }

  currentMedia = {
    id: item.id || item.session,
    type: type,
    session: item.session,
  };

  // Save where we came from to go back
  previousView = "main";

  // Push state for browser back button
  if (window.location.hash !== "#details") {
    history.pushState({ view: "details" }, "", "#details");
  }

  // Show details view immediately to avoid perceived delay
  mainView.classList.add("hidden");
  searchPopup.classList.add("hidden");
  detailsView.classList.remove("hidden");
  window.scrollTo(0, 0);

  // Set loading state
  detailsTitle.innerText = "Loading...";
  detailsOverview.innerText = "Please wait while we fetch the details...";
  detailsYear.innerText = "";
  detailsRating.innerText = "";
  detailsType.innerText = type.toUpperCase();
  videoPlayer.src = ""; // Clear previous video

  // Reset controls
  serverSelect.selectedIndex = 0; // Default to Vidrock
  seasonSelect.innerHTML = "";
  episodeSelect.innerHTML = "";
  animeResolutionSelect.innerHTML = "";

  if (type === "anime") {
    const details = await fetchData(`${ANIME_API_URL}/${item.session}`);

    detailsTitle.innerText = details.title || item.title;
    detailsOverview.innerText = details.synopsis || item.synopsis || "";
    detailsYear.innerText =
      (details.aired || "").split(" ")[0] || item.year || "";
    detailsRating.innerText = details.score ? `${details.score}/10` : "N/A";
    detailsType.innerText = "ANIME";

    tvControls.classList.remove("hidden");
    serverSelect.closest(".server-selection").classList.add("hidden"); // Hide server select
    seasonSelect.classList.add("hidden"); // Hide seasons
    episodeSelect.innerHTML = "<option>Loading episodes...</option>";
    episodeSelect.classList.remove("hidden");
    animeResolutionSelect.innerHTML = "<option>Loading...</option>";
    animeResolutionSelect.classList.remove("hidden"); // Show anime resolutions

    await loadAnimeEpisodes(item.session);
  } else {
    detailsTitle.innerText = item.title || item.name;
    detailsOverview.innerText = item.overview;
    detailsYear.innerText = (
      item.release_date ||
      item.first_air_date ||
      ""
    ).split("-")[0];
    detailsRating.innerText = item.vote_average
      ? `${item.vote_average.toFixed(1)}/10`
      : "N/A";
    detailsType.innerText = type.toUpperCase();

    serverSelect.closest(".server-selection").classList.remove("hidden");

    if (type === "tv") {
      tvControls.classList.remove("hidden");
      seasonSelect.classList.remove("hidden");
      episodeSelect.classList.remove("hidden");
      animeResolutionSelect.classList.add("hidden");
      await loadTvSeasons(item.id);
    } else {
      tvControls.classList.add("hidden");
      updatePlayerSrc();
    }
  }
}

function closeDetailsView() {
  detailsView.classList.add("hidden");
  videoPlayer.src = ""; // Stop video playback
  currentMedia = null;

  mainView.classList.remove("hidden");
  window.scrollTo(0, 0);
}

function backToHome() {
  if (window.location.hash === "#details") {
    history.back();
  } else {
    closeDetailsView();
  }
}

window.addEventListener("popstate", () => {
  if (window.location.hash !== "#details") {
    closeDetailsView();
  }
});

backBtn.onclick = backToHome;

async function loadTvSeasons(id) {
  seasonSelect.innerHTML = "<option>Loading seasons...</option>";
  episodeSelect.innerHTML = "<option>Loading episodes...</option>";
  const data = await fetchData(`${BASE_URL}/tv/${id}?api_key=${API_KEY}`);
  seasonSelect.innerHTML = "";

  // Fetch last watched episode from local storage if available
  let savedWatchProgress = getSavedProgress(id);
  let defaultSeason = 1;
  let defaultEpisode = 1;

  if (savedWatchProgress && savedWatchProgress.last_season_watched) {
    defaultSeason = parseInt(savedWatchProgress.last_season_watched);
    defaultEpisode = parseInt(savedWatchProgress.last_episode_watched);
  }

  data.seasons.forEach((season) => {
    if (season.season_number === 0) return; // Skip specials usually
    const option = document.createElement("option");
    option.value = season.season_number;
    option.textContent = `Season ${season.season_number}`;
    if (season.season_number === defaultSeason) option.selected = true;
    seasonSelect.appendChild(option);
  });

  await loadTvEpisodes(id, seasonSelect.value, defaultEpisode);
}

async function loadTvEpisodes(tvId, seasonNumber, defaultEpisode = 1) {
  episodeSelect.innerHTML = "<option>Loading episodes...</option>";
  const data = await fetchData(
    `${BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${API_KEY}`,
  );
  episodeSelect.innerHTML = "";

  data.episodes.forEach((episode) => {
    const option = document.createElement("option");
    option.value = episode.episode_number;
    option.textContent = `Ep ${episode.episode_number}: ${episode.name}`;
    if (episode.episode_number === defaultEpisode) option.selected = true;
    episodeSelect.appendChild(option);
  });

  updatePlayerSrc();
}

seasonSelect.addEventListener("change", () => {
  if (currentMedia && currentMedia.type === "tv") {
    loadTvEpisodes(currentMedia.id, seasonSelect.value);
  }
});

episodeSelect.addEventListener("change", () => {
  if (currentMedia && currentMedia.type === "anime") {
    updateAnimePlayerSrc();
  } else {
    updatePlayerSrc();
  }
});

animeResolutionSelect.addEventListener("change", () => {
  if (
    currentMedia &&
    currentMedia.type === "anime" &&
    currentAnimeSources.length > 0
  ) {
    const selectedRes = animeResolutionSelect.value;
    const source =
      currentAnimeSources.find((s) => s.resolution === selectedRes) ||
      currentAnimeSources[0];
    if (source && source.embed) {
      videoPlayer.src = source.embed;
    }
  }
});

serverSelect.addEventListener("change", updatePlayerSrc);

function updatePlayerSrc() {
  if (!currentMedia) return;

  const serverId = serverSelect.value;
  const server = SERVERS.find((s) => s.id === serverId);

  if (currentMedia.type === "tv") {
    const s = seasonSelect.value;
    const e = episodeSelect.value;
    videoPlayer.src = server.getTvUrl(currentMedia.id, s, e);
  } else {
    videoPlayer.src = server.getMovieUrl(currentMedia.id);
  }
}

async function loadAnimeEpisodes(session) {
  let allEpisodes = [];
  const firstPage = await fetchData(
    `${ANIME_API_URL}/${session}/releases?page=1`,
  );

  if (firstPage && firstPage.data) {
    allEpisodes = allEpisodes.concat(firstPage.data);
    const lastPageNum = firstPage.paginationInfo.lastPage;

    // Fetch a few more pages if they exist to get a spread of episodes (up to 3 pages)
    const maxPagesToFetch = Math.min(lastPageNum, 3);
    const fetchPromises = [];
    for (let p = 2; p <= maxPagesToFetch; p++) {
      fetchPromises.push(
        fetchData(`${ANIME_API_URL}/${session}/releases?page=${p}`),
      );
    }

    const results = await Promise.all(fetchPromises);
    results.forEach((res) => {
      if (res && res.data) {
        allEpisodes = allEpisodes.concat(res.data);
      }
    });

    // Sort ascending by episode number
    allEpisodes.sort((a, b) => a.episode - b.episode);

    episodeSelect.innerHTML = "";
    allEpisodes.forEach((ep) => {
      const option = document.createElement("option");
      option.value = ep.session;
      option.textContent =
        `Ep ${ep.episode}` + (ep.title ? `: ${ep.title}` : "");
      episodeSelect.appendChild(option);
    });

    updateAnimePlayerSrc();
  } else {
    episodeSelect.innerHTML = "<option>No episodes found</option>";
  }
}

async function updateAnimePlayerSrc() {
  if (!currentMedia || currentMedia.type !== "anime") return;

  const epSession = episodeSelect.value;
  if (!epSession || epSession.startsWith("No")) return;

  const playData = await fetchData(
    `${ANIME_API_URL}/play/${currentMedia.session}?episodeId=${epSession}`,
  );

  if (playData && playData.sources && playData.sources.length > 0) {
    currentAnimeSources = playData.sources;
    animeResolutionSelect.innerHTML = "";

    // Populate resolution dropdown
    currentAnimeSources.forEach((source) => {
      const option = document.createElement("option");
      option.value = source.resolution;
      option.textContent = `${source.resolution}p`;
      animeResolutionSelect.appendChild(option);
    });

    // Find best resolution, defaulting to first
    const bestSource =
      currentAnimeSources.find((s) => s.resolution === "1080") ||
      currentAnimeSources.find((s) => s.resolution === "720") ||
      currentAnimeSources[0];

    // Select the best source in the dropdown
    if (bestSource) {
      animeResolutionSelect.value = bestSource.resolution;
      if (bestSource.embed) {
        videoPlayer.src = bestSource.embed;
      }
    }
  } else {
    currentAnimeSources = [];
    animeResolutionSelect.innerHTML = "<option>No resolutions</option>";
  }
}

// Navbar Scroll Effect
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// Watch Progress (Local Storage) Handling from Vidrock
window.addEventListener("message", (event) => {
  // Only accept messages from vidrock
  if (event.origin !== "https://vidrock.ru") return;

  // Store Media Data progress
  if (event.data?.type === "MEDIA_DATA") {
    const mediaData = event.data.data;
    let progressList = JSON.parse(
      localStorage.getItem("vidRockProgress") || "[]",
    );

    // Find and update, or add new
    const existingIndex = progressList.findIndex((p) => p.id === mediaData.id);
    if (existingIndex >= 0) {
      progressList[existingIndex] = mediaData;
    } else {
      progressList.push(mediaData);
    }

    localStorage.setItem("vidRockProgress", JSON.stringify(progressList));
  }
});

function getSavedProgress(tmdbId) {
  try {
    const progressList = JSON.parse(
      localStorage.getItem("vidRockProgress") || "[]",
    );
    return progressList.find((p) => p.id === parseInt(tmdbId));
  } catch (e) {
    return null;
  }
}

// Initialize
if (window.location.hash === "#details") {
  history.replaceState(null, "", window.location.pathname + window.location.search);
}
loadHome();
