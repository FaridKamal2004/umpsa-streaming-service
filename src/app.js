import { catalog, selectMovies, recommend } from "./catalog.js";
import {
  freshState,
  loadState,
  saveState,
  toggleSaved,
  recordProgress,
  isInProgress,
} from "./store.js";

const $ = (selector) => document.querySelector(selector);
const ids = catalog.map((movie) => movie.id);
// Accessing localStorage itself can throw when browser persistence is disabled.
let storage;
try {
  storage = window.localStorage;
} catch {
  storage = {
    getItem: () => null,
    setItem: () => {
      throw Error("Storage unavailable");
    },
  };
}
let state = loadState(storage, ids);
let view = "discover";
let genre = "All";
let activeMovie = null;
let detailMovie = null;
let toastTimer;
let lastSavedSecond = -1;
let persistenceFailed = false;
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const formatTime = (seconds) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

function toast(message) {
  clearTimeout(toastTimer);
  $("#toast").textContent =
    message +
    (persistenceFailed
      ? " Browser storage is unavailable; changes last for this visit only."
      : "");
  $("#toast").hidden = false;
  toastTimer = setTimeout(() => {
    $("#toast").hidden = true;
  }, 3500);
}
function persist() {
  persistenceFailed = !saveState(storage, state);
  if (persistenceFailed) toast("Your changes are available in memory.");
}
function artwork(movie, extra = "") {
  return `<div class="poster ${movie.motif} ${extra}" style="--art:${movie.color}" aria-hidden="true"><div class="art-orbit"></div><div class="art-peak"></div><div class="art-shape"></div><span class="art-edition">OPEN CINEMA / ${movie.year}</span><span class="art-title">${movie.title === "Big Buck Bunny" ? "BIG BUCK<br>BUNNY" : escape(movie.title).toUpperCase().replace(" ", "<br>")}</span><span class="art-bottom">A BLENDER OPEN FILM <span>↗</span></span></div>`;
}
function render() {
  $("#viewer-name").textContent = state.name;
  $("#avatar").textContent = Array.from(state.name)[0].toUpperCase();
  $("#list-count").textContent = state.saved.length;
  const headings = {
    discover: [
      "Find your next little escape",
      "Independent spirit. Open cinema. Yours to explore.",
    ],
    list: [
      "Your stories, saved for later",
      "A little collection of films you don’t want to miss.",
    ],
    history: [
      "Pick up where you left off",
      "Your unfinished stories are right here.",
    ],
  };
  $("#section-title").textContent = headings[view][0] + ".";
  $("#section-description").textContent = headings[view][1];
  $("#hero").hidden = view !== "discover";
  for (const button of document.querySelectorAll("[data-view]")) {
    button.classList.toggle("active", button.dataset.view === view);
    if (button.dataset.view === view)
      button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  }
  const selectedIds =
    view === "list"
      ? state.saved
      : view === "history"
        ? ids.filter((id) => isInProgress(state.progress[id]))
        : null;
  const movies = selectMovies(recommend(catalog, state.saved, state.progress), {
    query: $("#search").value,
    genre,
    sort: $("#sort").value,
    ids: selectedIds,
  });
  $("#results-summary").textContent =
    `${movies.length} ${movies.length === 1 ? "film" : "films"}${genre !== "All" ? ` · ${genre}` : ""} · Free to watch`;
  $("#catalog").innerHTML = movies
    .map((movie, index) => {
      const saved = state.saved.includes(movie.id);
      const progress = state.progress[movie.id];
      return `<article class="film-card"><div class="poster-wrap"><button class="poster-button" data-details="${movie.id}" aria-label="View details for ${movie.title}">${artwork(movie)}<span class="poster-hover">Explore film ↗</span></button><button class="save-button ${saved ? "saved" : ""}" data-save="${movie.id}" aria-pressed="${saved}" aria-label="${saved ? "Remove" : "Save"} ${movie.title}${saved ? " from" : " to"} my list">${saved ? "✓" : "+"}</button>${isInProgress(progress) ? `<div class="progress-track" role="img" aria-label="${Math.round((progress.seconds / progress.duration) * 100)} percent watched"><div style="width:${Math.min(100, (progress.seconds / progress.duration) * 100)}%"></div></div>` : ""}</div><div class="card-meta"><span>${movie.genre.toUpperCase()}</span><span>${String(index + 1).padStart(2, "0")}</span></div><h3><button class="title-button" data-details="${movie.id}">${movie.title}</button></h3><div class="card-bottom"><span>${movie.year} <span class="dot">·</span> ${movie.minutes} min</span><button class="play-small" data-play="${movie.id}" aria-label="${isInProgress(progress) ? "Resume" : "Play"} ${movie.title}">${isInProgress(progress) ? `Resume ${formatTime(progress.seconds)}` : "Watch film"} <span>↗</span></button></div></article>`;
    })
    .join("");
  $("#empty").hidden = movies.length > 0;
  const filtered = $("#search").value.trim() || genre !== "All";
  $("#empty-title").textContent = filtered
    ? "No films found"
    : view === "list"
      ? "Your list starts with a little curiosity."
      : "Your next story is waiting.";
  $("#empty-description").textContent = filtered
    ? "Try another search or clear your filters."
    : view === "list"
      ? "Save a film using the + button, and find it here anytime."
      : "Start a film and your progress will appear here.";
  $("#reset-filters").textContent = filtered
    ? "Clear filters"
    : "Explore films";
}

function saveMovie(id) {
  state = toggleSaved(state, id, ids);
  persist();
  render();
  if (detailMovie === id) {
    renderDetails(id);
    $("#film-dialog")
      .querySelector(`[data-save="${id}"]`)
      ?.focus({ preventScroll: true });
  }
  const movie = catalog.find((movie) => movie.id === id);
  toast(
    `${movie.title} ${state.saved.includes(id) ? "added to" : "removed from"} your list.`,
  );
  // Renders replace the card; restore keyboard focus to its matching control.
  if (!$("#film-dialog").open)
    document
      .querySelector(`[data-save="${id}"]`)
      ?.focus({ preventScroll: true });
}
function renderDetails(id) {
  const movie = catalog.find((movie) => movie.id === id);
  if (!movie) return;
  detailMovie = id;
  const saved = state.saved.includes(id);
  $("#film-detail").innerHTML =
    `${artwork(movie, "detail-art")}<div class="detail-copy"><p class="eyebrow">THE OPEN COLLECTION</p><h2 id="film-title">${movie.title}</h2><p class="detail-meta">${movie.year} · ${movie.genre} · ${movie.minutes} min</p><p>${movie.description}</p><p>Directed by ${movie.director}</p><div class="detail-actions"><button class="primary" data-play="${id}">▶ ${isInProgress(state.progress[id]) ? "Resume film" : "Watch film"}</button><button class="secondary" data-save="${id}" aria-pressed="${saved}">${saved ? "✓ In my list" : "+ Save to my list"}</button></div><p class="credit">${movie.credit} · <a href="${movie.source}" target="_blank" rel="noopener noreferrer">Creator website ↗</a> · ${movie.license}</p></div>`;
}
function showDetails(id) {
  renderDetails(id);
  $("#film-dialog").showModal();
}
function captureProgress() {
  const video = $("#video");
  if (!activeMovie) return;
  state = recordProgress(
    state,
    activeMovie.id,
    video.currentTime,
    video.duration,
    ids,
  );
  persist();
}
function play(id) {
  const movie = catalog.find((movie) => movie.id === id);
  if (!movie) return;
  if ($("#film-dialog").open) $("#film-dialog").close();
  activeMovie = movie;
  lastSavedSecond = -1;
  $("#player-title").textContent = movie.title;
  $("#player-credit").textContent =
    `${movie.credit} · ${movie.license} · Unmodified film`;
  $("#player-status").textContent =
    "Loading film… Internet access is required.";
  $("#video").src = movie.video;
  $("#player-dialog").showModal();
  // Native controls provide pause, seeking, volume, fullscreen and keyboard access.
  $("#video")
    .play()
    .catch(() => {
      if (!$("#video").error)
        $("#player-status").textContent =
          "Press play in the video controls to begin.";
    });
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.details) showDetails(button.dataset.details);
  if (button.dataset.save) saveMovie(button.dataset.save);
  if (button.dataset.play) play(button.dataset.play);
  if (button.hasAttribute("data-close")) button.closest("dialog").close();
  if (button.dataset.view) {
    view = button.dataset.view;
    render();
  }
  if (button.dataset.genre) {
    genre = button.dataset.genre;
    for (const chip of document.querySelectorAll("[data-genre]")) {
      chip.classList.toggle("selected", chip.dataset.genre === genre);
      chip.setAttribute("aria-pressed", String(chip.dataset.genre === genre));
    }
    render();
  }
});
$("#search").addEventListener("input", render);
$("#sort").addEventListener("change", render);
$("#hero-play").addEventListener("click", () => play("sintel"));
$("#hero-details").addEventListener("click", () => showDetails("sintel"));
$("#reset-filters").addEventListener("click", () => {
  const filtered = $("#search").value.trim() || genre !== "All";
  $("#search").value = "";
  genre = "All";
  $("#sort").value = "curated";
  if (!filtered) view = "discover";
  for (const chip of document.querySelectorAll("[data-genre]")) {
    chip.classList.toggle("selected", chip.dataset.genre === "All");
    chip.setAttribute("aria-pressed", String(chip.dataset.genre === "All"));
  }
  render();
});
$("#profile-button").addEventListener("click", () => {
  $("#profile-name").value = state.name === "Guest" ? "" : state.name;
  $("#clear-confirm").hidden = true;
  $("#profile-dialog").showModal();
});
$("#profile-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#profile-name").value.trim();
  if (!name) {
    $("#profile-name").setCustomValidity("Please enter a display name.");
    $("#profile-name").reportValidity();
    return;
  }
  state = { ...state, name: name.slice(0, 32) };
  persist();
  render();
  $("#profile-dialog").close();
  toast(`Welcome, ${state.name}.`);
});
$("#profile-name").addEventListener("input", () =>
  $("#profile-name").setCustomValidity(""),
);
$("#clear-data").addEventListener("click", () => {
  $("#clear-confirm").hidden = false;
  $("#confirm-clear").focus();
});
$("#cancel-clear").addEventListener("click", () => {
  $("#clear-confirm").hidden = true;
  $("#clear-data").focus();
});
$("#confirm-clear").addEventListener("click", () => {
  state = freshState();
  persist();
  render();
  $("#profile-dialog").close();
  toast("Your local profile, list, and viewing history have been cleared.");
});
$("#about-button").addEventListener("click", () =>
  $("#about-dialog").showModal(),
);
$("#credits-button").addEventListener("click", () =>
  $("#about-dialog").showModal(),
);
$("#credits").innerHTML = catalog
  .map(
    (movie) =>
      `<p class="credit"><strong>${movie.title}</strong> (${movie.year}) · ${movie.director}<br>${movie.credit}<br><a href="${movie.source}" target="_blank" rel="noopener noreferrer">Creator website ↗</a> · <a href="https://creativecommons.org/licenses/by/${movie.license.endsWith("2.5") ? "2.5" : "3.0"}/" target="_blank" rel="noopener noreferrer">${movie.license} ↗</a></p>`,
  )
  .join("");
$("#video").addEventListener("loadedmetadata", () => {
  const progress = state.progress[activeMovie?.id];
  if (isInProgress(progress))
    $("#video").currentTime = Math.min(progress.seconds, $("#video").duration);
  $("#player-status").textContent =
    "Use the video controls to play, seek, adjust volume, or enter fullscreen. Progress saves in this browser.";
});
$("#video").addEventListener("error", () => {
  $("#player-status").textContent =
    "The film could not load. Check your connection or try again later. Your saved list is still available.";
});
$("#video").addEventListener("timeupdate", () => {
  const second = Math.floor($("#video").currentTime);
  if (second % 5 === 0 && second !== lastSavedSecond) {
    lastSavedSecond = second;
    captureProgress();
  }
});
$("#video").addEventListener("pause", captureProgress);
$("#video").addEventListener("ended", captureProgress);
$("#player-dialog").addEventListener("close", () => {
  captureProgress();
  $("#video").pause();
  activeMovie = null;
  $("#video").removeAttribute("src");
  $("#video").load();
  render();
});
$("#film-dialog").addEventListener("close", () => {
  detailMovie = null;
});
for (const dialog of document.querySelectorAll("dialog")) {
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const controls = [
      ...dialog.querySelectorAll(
        'button, a[href], input, select, video[controls], [tabindex="0"]',
      ),
    ].filter((element) => !element.disabled && element.getClientRects().length);
    const first = controls[0];
    const last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  });
}
window.addEventListener("pagehide", captureProgress);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) captureProgress();
});
render();
