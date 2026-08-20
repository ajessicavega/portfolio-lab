import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export const SCRAMBLE_CONFIG = Object.freeze({
  characters: "01#@%&+=?*/\\[]{}<>!",
  duration: 420
});

const waveLabels = [
  ["Volt R2", "Tesla"],
  ["Éclat", "Chanel"],
  ["Project Ion", "Apple"],
  ["AeroLine", "BMW"],
  ["Série Noir", "Saint Laurent"],
  ["UltraRun", "Nike"],
  ["Atelier 03", "Hermès"],
  ["Pulse One", "Adidas"],
  ["Linea 24", "Prada"],
  ["Echo Series", "Google"],
  ["Zero", "Polestar"],
  ["Shift/Black", "Balenciaga"],
  ["Solar Drift", "Audi"],
  ["Nº 27", "Valentino"],
  ["Mode/3", "Samsung"],
  ["Pure Form", "Bottega Veneta"],
  ["Edge", "Sony"],
  ["Stillwater", "Aesop"],
  ["Parfum Nº8", "Dior"],
  ["Vantage", "Porsche"],
  ["Core", "Microsoft"],
  ["Archive Green", "Lexus"],
  ["Rosso Linea", "Mercedes-Benz"],
  ["A-17", "Huawei"]
];

export const creativeLabels = Object.freeze({
  "01": { left: "Sistema 3C", right: "PPV" },
  "02": { left: "Sistema 3C", right: "PPV" },
  "03": { left: "Fábrica Resultados", right: "RNA" },
  "04": { left: "Fábrica Resultados", right: "RNA" },
  "05": { left: "Fábrica Resultados", right: "RNA" },
  "06": { left: "Fábrica Resultados", right: "RNA" },
  "07": { left: "Fábrica Resultados", right: "RNA" },
  "08": { left: "Fábrica Resultados", right: "RNA" },
  "09": { left: "Fábrica Resultados", right: "RNA" },
  "10": { left: "Lab Contoterapia", right: "Lisandra" },
  "11": { left: "Lab Contoterapia", right: "Lisandra" },
  "12": { left: "Lab Contoterapia", right: "Lisandra" },
  "13": { left: "Lab Contoterapia", right: "Lisandra" },
  "14": { left: "PSS", right: "Outsider School" },
  "15": { left: "A Carta", right: "PPV" },
  "16": { left: "CP26", right: "PPV" },
  "17": { left: "CP26", right: "PPV" },
  "18": { left: "CP26", right: "PPV" },
  "19": { left: "CP26", right: "PPV" },
  "20": { left: "CP26", right: "PPV" },
  "21": { left: "CP26", right: "PPV" },
  "22": { left: "CP26", right: "PPV" },
  "23": { left: "PSS", right: "Outsider School" },
  "24": { left: "Sistema 3C", right: "PPV" },
  "25": { left: "Sistema 3C", right: "PPV" },
  "26": { left: "Sistema 3C", right: "PPV" },
  "27": { left: "Sistema 3C", right: "PPV" },
  "28": { left: "Super Plano", right: "Ricos na América" },
  "29": { left: "Black Pass", right: "Outsider School" },
  "30": { left: "Black Pass", right: "Outsider School" },
  "31": { left: "Black Pass", right: "Outsider School" },
  "32": { left: "Black Pass", right: "Outsider School" },
  "33": { left: "Black Pass", right: "Outsider School" },
  "34": { left: "Black Pass", right: "Outsider School" },
  "35": { left: "Black Pass", right: "Outsider School" },
  "36": { left: "Black Pass", right: "Outsider School" },
  "37": { left: "Black Pass", right: "Outsider School" },
  "38": { left: "Black Pass", right: "Outsider School" },
  "39": { left: "Black Pass", right: "Outsider School" },
  "40": { left: "Black Pass", right: "Outsider School" }
});

const inactiveCharacters = ["0", "1"];
const createInactiveLabel = (index, offset) => {
  let state = (
    Math.imul(index + 1, 0x9E3779B1)
    ^ Math.imul(offset, 0x85EBCA6B)
  ) >>> 0;
  const length = 8 + ((index * 5 + offset * 3) % 7);

  return Array.from({ length }, () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return inactiveCharacters[(state >>> 0) & 1];
  }).join("");
};

export const inactiveWaveLabels = Object.freeze(
  Array.from({ length: 48 }, (_, index) => ({
    left: createInactiveLabel(index, 1),
    right: createInactiveLabel(index, 2)
  }))
);

export const CREATIVES_SHUFFLE_SEED = 2026;

const baseCreatives = Array.from(
  { length: 40 },
  (_, index) => {
    const id = String(index + 1).padStart(2, "0");
    return { id, src: `/section-2-creatives/${id}.webp` };
  }
);

const createSeededRandom = (seed) => {
  let state = seed >>> 0;

  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffle = (items, random) => {
  const shuffledItems = [...items];

  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
  }

  return shuffledItems;
};

const createMediaSequence = (seed) => {
  const random = createSeededRandom(seed);
  const shuffled40 = shuffle(baseCreatives, random);
  const extra8 = shuffle(shuffled40, random).slice(0, 8);
  return shuffle([...shuffled40, ...extra8], random);
};

export const mediaSequence = createMediaSequence(CREATIVES_SHUFFLE_SEED);

export const dualWaveItems = mediaSequence.map((creative, index) => {
  const labels = creativeLabels[creative.id];

  if (!labels) throw new Error(`Missing creative labels for ${creative.id}`);

  const [measurementLeft, measurementRight] = waveLabels[index % waveLabels.length];

  return {
    id: creative.id,
    image: creative.src,
    ...labels,
    measurement: { left: measurementLeft, right: measurementRight },
    inactive: inactiveWaveLabels[index]
  };
});

const renderedItems = dualWaveItems;

const headlineLines = ["Peças que fazem", "toda a diferença."];
const graphemeSegmenter = typeof Intl.Segmenter === "function"
  ? new Intl.Segmenter("pt-BR", { granularity: "grapheme" })
  : null;

const segmentGraphemes = (text) => graphemeSegmenter
  ? Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment)
  : Array.from(text);

const renderHeadlineLine = (text) => `<span class="dark-showcase__title-line" aria-hidden="true">${segmentGraphemes(text)
  .map((grapheme) => `<span class="dark-showcase__title-grapheme">${grapheme}</span>`)
  .join("")}</span>`;

const renderWaveItem = (item, side) => {
  const imageData = side === "left"
    ? ` data-image="${item.image}" data-alt="Selected creative work — ${item.left} / ${item.right}"`
    : "";

  return `<div class="portfolio-wave-text" data-real-label="${item[side]}" data-inactive-label="${item.inactive[side]}"${imageData}><span class="portfolio-wave-measurement" aria-hidden="true">${item.measurement[side]}</span><span class="portfolio-wave-visual">${item.inactive[side]}</span></div>`;
};

export const renderDualWaveShowcase = () => `
  <section class="dark-showcase" aria-labelledby="dark-showcase-title">
    <div class="dark-showcase__intro">
      <h2 id="dark-showcase-title" class="dark-showcase__title" aria-label="${headlineLines.join(" ")}">
        ${renderHeadlineLine(headlineLines[0])}<br>
        ${renderHeadlineLine(headlineLines[1])}
      </h2>
    </div>

    <div class="portfolio-dual-wave-frame">
      <div class="portfolio-dual-wave" data-wave-number="12" data-wave-speed="1">
        <div class="portfolio-wave-column portfolio-wave-column--left">
          ${renderedItems.map((item) => renderWaveItem(item, "left")).join("")}
        </div>

        <div class="portfolio-wave-image">
          <img class="portfolio-wave-thumbnail" src="${renderedItems[0].image}" alt="Selected creative work — ${renderedItems[0].left} / ${renderedItems[0].right}">
        </div>

        <div class="portfolio-wave-column portfolio-wave-column--right">
          ${renderedItems.map((item) => renderWaveItem(item, "right")).join("")}
        </div>
      </div>
    </div>
  </section>
`;

export class DualWaveAnimation {
  constructor(wrapper, options = {}) {
    this.wrapper = wrapper instanceof Element ? wrapper : document.querySelector(wrapper);
    const waveNumber = this.wrapper?.dataset.waveNumber
      ? Number.parseFloat(this.wrapper.dataset.waveNumber)
      : 2;
    const waveSpeed = this.wrapper?.dataset.waveSpeed
      ? Number.parseFloat(this.wrapper.dataset.waveSpeed)
      : 1;

    this.config = { waveNumber, waveSpeed, ...options };
    this.currentImage = null;
    this.focusedIndex = null;
    this.scrambleAnimations = new Map();
    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  init() {
    if (!this.wrapper) return this;

    this.section = this.wrapper.closest(".dark-showcase");
    this.intro = this.section?.querySelector(".dark-showcase__intro");
    this.headline = this.intro?.querySelector(".dark-showcase__title");
    this.headlineGraphemeLines = gsap.utils.toArray(
      this.intro?.querySelectorAll(".dark-showcase__title-line")
    ).map((line) =>
      gsap.utils.toArray(line.querySelectorAll(".dark-showcase__title-grapheme"))
    );
    this.leftColumn = this.wrapper.querySelector(".portfolio-wave-column--left");
    this.rightColumn = this.wrapper.querySelector(".portfolio-wave-column--right");
    this.thumbnail = this.wrapper.querySelector(".portfolio-wave-thumbnail");
    this.leftTexts = gsap.utils.toArray(this.leftColumn?.querySelectorAll(".portfolio-wave-text"));
    this.rightTexts = gsap.utils.toArray(this.rightColumn?.querySelectorAll(".portfolio-wave-text"));
    this.leftVisuals = this.leftTexts.map((text) => text.querySelector(".portfolio-wave-visual"));
    this.rightVisuals = this.rightTexts.map((text) => text.querySelector(".portfolio-wave-visual"));

    if (!this.leftTexts.length || !this.rightTexts.length) return this;

    this.preloadCreatives();

    this.scrambleLabels = new Map(
      [...this.leftVisuals, ...this.rightVisuals].map((text) => [text, text.textContent])
    );

    if (this.prefersReducedMotion) {
      this.wrapper.dataset.reducedMotion = "true";
      this.updateFocus(0);
      this.leftVisuals[0].textContent = this.leftTexts[0].dataset.realLabel;
      this.rightVisuals[0].textContent = this.rightTexts[0].dataset.realLabel;
      this.updateThumbnail(this.leftTexts[0], false);
      this.focusedIndex = 0;
      return this;
    }

    this.leftQuickSetters = this.leftTexts.map((text) =>
      gsap.quickTo(text, "x", { duration: 0.6, ease: "power4.out" })
    );
    this.rightQuickSetters = this.rightTexts.map((text) =>
      gsap.quickTo(text, "x", { duration: 0.6, ease: "power4.out" })
    );

    this.calculateRanges();
    this.setInitialPositions(this.leftTexts, this.leftRange, 1);
    this.setInitialPositions(this.rightTexts, this.rightRange, -1);
    this.setupHeadlineReveal();
    this.setupScrollTrigger();

    this.resizeHandler = () => this.calculateRanges();
    window.addEventListener("resize", this.resizeHandler);
    this.handleScroll(this.scrollTrigger);

    return this;
  }

  setupHeadlineReveal() {
    if (!this.section || !this.headline || this.headlineGraphemeLines.length !== 2) return;

    this.headlineRevealTimeline = gsap.timeline({ paused: true })
      .to(this.headlineGraphemeLines[0], {
        color: "var(--showcase-light)",
        duration: 1,
        stagger: 0.12,
        ease: "none"
      })
      .to(this.headlineGraphemeLines[1], {
        color: "var(--showcase-light)",
        duration: 1,
        stagger: 0.12,
        ease: "none"
      });

    this.headlineRevealTrigger = ScrollTrigger.create({
      trigger: this.section,
      start: "top 50%",
      end: () => `+=${this.headline.getBoundingClientRect().height}`,
      animation: this.headlineRevealTimeline,
      scrub: true,
      invalidateOnRefresh: true
    });
  }

  calculateRanges() {
    const maxLeftTextWidth = Math.max(...this.leftTexts.map((text) => text.offsetWidth));
    const maxRightTextWidth = Math.max(...this.rightTexts.map((text) => text.offsetWidth));

    this.leftRange = { minX: 0, maxX: this.leftColumn.offsetWidth - maxLeftTextWidth };
    this.rightRange = { minX: 0, maxX: this.rightColumn.offsetWidth - maxRightTextWidth };
  }

  setInitialPositions(texts, range, multiplier) {
    const rangeSize = range.maxX - range.minX;

    texts.forEach((text, index) => {
      const initialPhase = this.config.waveNumber * index - Math.PI / 2;
      const initialWave = Math.sin(initialPhase);
      const initialProgress = (initialWave + 1) / 2;
      const startX = (range.minX + initialProgress * rangeSize) * multiplier;
      gsap.set(text, { x: startX });
    });
  }

  setupScrollTrigger() {
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.wrapper,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => this.handleScroll(self)
    });
  }

  handleScroll(self) {
    const globalProgress = self.progress;
    const closestIndex = this.findClosestToViewportCenter();
    const focusChanged = closestIndex !== this.focusedIndex;

    this.updateColumn(this.leftTexts, this.leftQuickSetters, this.leftRange, globalProgress, closestIndex, 1);
    this.updateColumn(this.rightTexts, this.rightQuickSetters, this.rightRange, globalProgress, closestIndex, -1);
    this.updateThumbnail(this.leftTexts[closestIndex]);

    if (focusChanged) this.scrambleFocusedPair(closestIndex);
    this.focusedIndex = closestIndex;
  }

  scrambleFocusedPair(focusedIndex) {
    this.cancelAllScrambles();

    const startTime = performance.now();

    if (this.focusedIndex !== null && this.focusedIndex !== focusedIndex) {
      this.scrambleTo(
        this.leftVisuals[this.focusedIndex],
        this.leftTexts[this.focusedIndex].dataset.inactiveLabel,
        startTime
      );
      this.scrambleTo(
        this.rightVisuals[this.focusedIndex],
        this.rightTexts[this.focusedIndex].dataset.inactiveLabel,
        startTime
      );
    }

    this.scrambleTo(
      this.leftVisuals[focusedIndex],
      this.leftTexts[focusedIndex].dataset.realLabel,
      startTime
    );
    this.scrambleTo(
      this.rightVisuals[focusedIndex],
      this.rightTexts[focusedIndex].dataset.realLabel,
      startTime
    );
  }

  scrambleTo(element, finalText, startTime) {
    this.scrambleLabels.set(element, finalText);
    this.scrambleText(element, startTime);
  }

  scrambleText(element, startTime) {
    if (!element || this.prefersReducedMotion) return;

    const finalText = this.scrambleLabels.get(element);
    const finalCharacters = Array.from(finalText);
    const temporaryCharacters = Array.from(SCRAMBLE_CONFIG.characters);
    const animation = { frameId: 0 };

    const renderFrame = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / SCRAMBLE_CONFIG.duration, 1);
      const resolvedCount = Math.floor(progress * finalCharacters.length);
      const frame = Math.floor(elapsed / 32);

      element.textContent = finalCharacters.map((character, index) => {
        if (index < resolvedCount || character === " ") return character;
        return temporaryCharacters[(frame + index * 7) % temporaryCharacters.length];
      }).join("");

      if (progress < 1) {
        animation.frameId = requestAnimationFrame(renderFrame);
        return;
      }

      element.textContent = finalText;
      this.scrambleAnimations.delete(element);
    };

    animation.frameId = requestAnimationFrame(renderFrame);
    this.scrambleAnimations.set(element, animation);
  }

  cancelAllScrambles() {
    this.scrambleAnimations.forEach((animation, element) => {
      cancelAnimationFrame(animation.frameId);
      element.textContent = this.scrambleLabels.get(element);
    });
    this.scrambleAnimations.clear();
  }

  updateColumn(texts, setters, range, progress, focusedIndex, multiplier) {
    const rangeSize = range.maxX - range.minX;

    texts.forEach((text, index) => {
      const finalX = this.calculateWavePosition(index, progress, range.minX, rangeSize) * multiplier;
      setters[index](finalX);
      text.classList.toggle("is-focused", index === focusedIndex);
    });
  }

  updateFocus(focusedIndex) {
    this.leftTexts.forEach((text, index) => text.classList.toggle("is-focused", index === focusedIndex));
    this.rightTexts.forEach((text, index) => text.classList.toggle("is-focused", index === focusedIndex));
  }

  preloadCreatives() {
    const sources = [...new Set(
      this.leftTexts.map((text) => text.dataset.image).filter(Boolean)
    )];

    this.wrapper.dataset.creativesReady = "false";
    this.creativePreloadPromise = Promise.allSettled(
      sources.map((src) => new Promise((resolve) => {
        const image = new Image();
        const settle = () => resolve(src);

        image.onload = () => {
          if (typeof image.decode !== "function") {
            settle();
            return;
          }

          image.decode().catch(() => {}).finally(settle);
        };
        image.onerror = settle;
        image.src = src;
      }))
    ).then((results) => {
      this.wrapper.dataset.creativesReady = "true";
      return results;
    });
  }

  updateThumbnail(focusedText, updatePosition = true) {
    if (!this.thumbnail || !focusedText) return;

    const newImage = focusedText.dataset.image;
    if (newImage && this.currentImage !== newImage) {
      this.currentImage = newImage;
      this.thumbnail.src = newImage;
      this.thumbnail.alt = focusedText.dataset.alt || "Selected creative work";
    }

    if (!updatePosition) return;

    const wrapperRect = this.wrapper.getBoundingClientRect();
    const viewportCenter = window.innerHeight / 2;
    const thumbnailHeight = this.thumbnail.offsetHeight;
    const wrapperHeight = this.wrapper.offsetHeight;
    const idealY = viewportCenter - wrapperRect.top - thumbnailHeight / 2;
    const minY = -thumbnailHeight / 2;
    const maxY = wrapperHeight - thumbnailHeight / 2;
    const headlineRect = this.headline?.getBoundingClientRect();
    const headlineIsVisible = headlineRect
      && headlineRect.bottom > 0
      && headlineRect.top < window.innerHeight;
    const safeMinY = headlineIsVisible
      ? headlineRect.bottom + 120 - wrapperRect.top
      : minY;
    const contextualMinY = Math.max(minY, safeMinY);
    const clampedY = Math.max(contextualMinY, Math.min(maxY, idealY));

    gsap.set(this.thumbnail, { y: clampedY });
  }

  calculateWavePosition(index, globalProgress, minX, range) {
    const phase =
      this.config.waveNumber * index +
      this.config.waveSpeed * globalProgress * Math.PI * 2 -
      Math.PI / 2;
    const wave = Math.sin(phase);
    const cycleProgress = (wave + 1) / 2;
    return minX + cycleProgress * range;
  }

  findClosestToViewportCenter() {
    const viewportCenter = window.innerHeight / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    this.leftTexts.forEach((text, index) => {
      const rect = text.getBoundingClientRect();
      const elementCenter = rect.top + rect.height / 2;
      const distance = Math.abs(elementCenter - viewportCenter);

      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex;
  }

  destroy() {
    this.headlineRevealTrigger?.kill();
    this.headlineRevealTimeline?.kill();
    this.scrollTrigger?.kill();
    this.cancelAllScrambles();
    if (this.resizeHandler) window.removeEventListener("resize", this.resizeHandler);
    [...(this.leftQuickSetters || []), ...(this.rightQuickSetters || [])]
      .forEach((setter) => setter.tween?.kill());
  }
}

export const initDualWaveShowcase = (wrapper) => new DualWaveAnimation(wrapper).init();
