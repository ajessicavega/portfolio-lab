import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const MOTION = {
  incomingScale: 0.28,
  exitScale: 4.1,
  firstRowScale: 0.42,
  firstRowScrollRange: 1.9,
  growthStart: 0.82,
  growthEnd: -0.15,
  acceleration: 1,
  slots: 9,
  focusSlot: 4
};

const PUSH = {
  gap: 12
};

const HERO_MOTION = {
  pushFactor: 1
};

const ENTRY_START = 1.06;
const ENTRY_JOIN = 0.7;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (start, end, progress) => start + (end - start) * progress;

function createCard(project, isFocus) {
  const card = document.createElement("button");
  card.className = "project-card";
  card.type = "button";
  card.dataset.projectId = project.id;
  if (isFocus) card.dataset.focus = "true";
  card.setAttribute("aria-label", `Abrir projeto ${project.title}`);

  card.innerHTML = `
    <span class="card-media">
      <img src="${project.thumb}" alt="" loading="lazy" decoding="async">
    </span>
    <span class="card-meta">
      <span class="card-title">${project.title}</span>
    </span>
  `;

  return card;
}

function getRowProjects(projects, focusIndex) {
  return Array.from({ length: MOTION.slots }, (_, slotIndex) => {
    const offset = slotIndex - MOTION.focusSlot;
    const projectIndex = ((focusIndex + offset) % projects.length + projects.length) % projects.length;
    return projects[projectIndex];
  });
}

function createRow(projects, focusIndex, laneId, laneOccurrence) {
  const focusProject = projects[focusIndex];
  const row = document.createElement("section");
  row.className = "project-row";
  row.dataset.focusProjectId = focusProject.id;
  row.dataset.lane = laneId;
  row.dataset.laneOccurrence = laneOccurrence;
  row.setAttribute("aria-label", `Destaque: ${focusProject.title}`);

  const scale = document.createElement("div");
  scale.className = "row-scale";
  const push = document.createElement("div");
  push.className = "row-push";
  const track = document.createElement("div");
  track.className = "row-track";

  getRowProjects(projects, focusIndex).forEach((project, slotIndex) => {
    track.append(createCard(project, slotIndex === MOTION.focusSlot));
  });

  scale.append(track);
  push.append(scale);
  row.append(push);
  return row;
}

function buildGalleryRows(projects, bases) {
  const lanes = [bases.A, bases.B];
  const laneOccurrences = [0, 0];

  return projects.map((_, rowIndex) => {
    const laneIndex = rowIndex % 2;
    const laneOccurrence = laneOccurrences[laneIndex];
    laneOccurrences[laneIndex] += 1;
    const focusIndex = (MOTION.focusSlot + laneOccurrence) % MOTION.slots;
    return createRow(lanes[laneIndex], focusIndex, laneIndex === 0 ? "A" : "B", laneOccurrence);
  });
}

export function createGallery(container, projects, onProjectSelect, bases) {
  const rows = buildGalleryRows(projects, bases);
  container.replaceChildren(...rows);
  const hero = document.querySelector(".hero");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let maxHeroPush = 0;

  const rowStates = rows.map((row, index) => ({
    row,
    push: row.querySelector(".row-push"),
    scale: row.querySelector(".row-scale"),
    track: row.querySelector(".row-track"),
    focus: row.querySelector("[data-focus='true']"),
    center: 0,
    bottom: 0,
    naturalHeight: 0,
    currentScale: MOTION.incomingScale,
    pushOffset: 0,
    visualTop: 0,
    visualBottom: 0,
    isFirst: index === 0
  }));

  function centerFocusedCards() {
    rowStates.forEach(({ row, track, focus }) => {
      const focalCenter = focus.offsetLeft + focus.offsetWidth / 2;
      gsap.set(track, { x: window.innerWidth / 2 - row.getBoundingClientRect().left - focalCenter });
    });
  }

  function measureRows() {
    maxHeroPush = hero.offsetHeight;
    rowStates.forEach((state) => {
      const rect = state.row.getBoundingClientRect();
      state.center = rect.top + window.scrollY + rect.height / 2;
      state.bottom = rect.top + window.scrollY + rect.height;
      state.naturalHeight = state.scale.offsetHeight;
    });
  }

  function calculateScaleProgress(rowCenter) {
    const rowViewportPosition = (rowCenter - window.scrollY) / window.innerHeight;
    const growthRange = MOTION.growthStart - MOTION.growthEnd;
    const rawProgress =
      (MOTION.growthStart - rowViewportPosition) / growthRange;
    const rawStart = (MOTION.growthStart - ENTRY_START) / growthRange;
    const rawJoin = (MOTION.growthStart - ENTRY_JOIN) / growthRange;
    let linearProgress;

    if (rawProgress <= rawStart) {
      linearProgress = 0;
    } else if (rawProgress >= rawJoin) {
      linearProgress = rawProgress;
    } else {
      const entryProgress = (rawProgress - rawStart) / (rawJoin - rawStart);
      linearProgress = rawJoin * entryProgress ** 3;
    }

    linearProgress = clamp(linearProgress, 0, 1);
    return linearProgress ** MOTION.acceleration;
  }

  function calculateFirstRowProgress() {
    return clamp(window.scrollY / (window.innerHeight * MOTION.firstRowScrollRange), 0, 1);
  }

  function updateMotion() {
    rowStates.forEach((state) => {
      const progress = state.isFirst ? calculateFirstRowProgress() : calculateScaleProgress(state.center);
      state.currentScale = lerp(
        state.isFirst ? MOTION.firstRowScale : MOTION.incomingScale,
        MOTION.exitScale,
        progress
      );
      state.pushOffset = 0;
      state.visualTop = state.bottom - state.naturalHeight * state.currentScale;
      state.visualBottom = state.bottom;
      state.progress = progress;
    });

    for (let index = rowStates.length - 1; index > 0; index -= 1) {
      const incoming = rowStates[index];
      const outgoing = rowStates[index - 1];
      const overlap =
        outgoing.visualBottom + outgoing.pushOffset -
        (incoming.visualTop + incoming.pushOffset - PUSH.gap);

      if (overlap > 0) outgoing.pushOffset -= overlap;
    }

    rowStates.forEach((state) => {
      gsap.set(state.scale, { scale: state.currentScale });
      gsap.set(state.push, { y: state.pushOffset });
      state.scale.style.setProperty("--row-inverse-scale", 1 / state.currentScale);
      state.row.style.zIndex = Math.round(state.progress * 100);
    });

    const firstRow = rowStates[0];
    const visualExpansion =
      firstRow.naturalHeight * (firstRow.currentScale - MOTION.firstRowScale) - firstRow.pushOffset;
    const heroPush = prefersReducedMotion
      ? 0
      : clamp(visualExpansion * HERO_MOTION.pushFactor, 0, maxHeroPush);
    gsap.set(hero, { y: -heroPush });
  }

  function refreshMeasurements() {
    centerFocusedCards();
    measureRows();
    updateMotion();
  }

  container.addEventListener("click", (event) => {
    const card = event.target.closest(".project-card");
    if (card) onProjectSelect(card.dataset.projectId);
  });

  ScrollTrigger.create({
    trigger: container,
    start: "top bottom",
    end: "bottom top",
    onUpdate: updateMotion,
    onRefreshInit: centerFocusedCards,
    onRefresh: refreshMeasurements
  });

  window.addEventListener("resize", refreshMeasurements, { passive: true });
  refreshMeasurements();
  ScrollTrigger.refresh();

  return () => {
    window.removeEventListener("resize", refreshMeasurements);
    gsap.set(hero, { clearProps: "transform" });
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  };
}
