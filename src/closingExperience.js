import { ScrollTrigger } from "gsap/ScrollTrigger";
import { renderGooeyMarquee } from "./gooeyMarquee";

export const closingWords = [
  "CRIATIVOS",
  "DIREÇÕES VISUAIS",
  "CAMPANHAS",
  "PÁGINAS DE VENDAS",
  "SITES"
];

export const CLOSING_SEGMENTS = [
  { type: "hold", start: 0, end: 0.08, word: 0 },
  { type: "morph", start: 0.08, end: 0.18, from: 0, to: 1 },
  { type: "hold", start: 0.18, end: 0.26, word: 1 },
  { type: "morph", start: 0.26, end: 0.36, from: 1, to: 2 },
  { type: "hold", start: 0.36, end: 0.44, word: 2 },
  { type: "morph", start: 0.44, end: 0.54, from: 2, to: 3 },
  { type: "hold", start: 0.54, end: 0.62, word: 3 },
  { type: "morph", start: 0.62, end: 0.72, from: 3, to: 4 },
  { type: "hold", start: 0.72, end: 0.8, word: 4 }
];

const REVEAL_START = 0.8;
const REVEAL_END = 0.96;
const CTA_START = 0.88;
const CTA_END = 1;
const EPSILON = 0.0001;

const clamp01 = (value) => Math.max(0, Math.min(1, value));
const rangeProgress = (progress, start, end) => clamp01((progress - start) / (end - start));
const interpolate = (from, to, progress) => from + (to - from) * progress;

const morphBlur = (fraction) => Math.min(8 / Math.max(fraction, EPSILON) - 8, 100);
const morphOpacity = (fraction) => Math.pow(clamp01(fraction), 0.4);

export const renderClosingExperience = () => `
  <section class="closing-experience" id="closing-experience" aria-labelledby="closing-cta-title">
    <div class="closing-experience__sticky">
      <div class="closing-experience__morph-stage" aria-hidden="true">
        <span class="closing-experience__word-layer closing-experience__word-layer--current">${closingWords[0]}</span>
        <span class="closing-experience__word-layer closing-experience__word-layer--next"></span>
      </div>

      <div class="closing-experience__reveal" aria-hidden="true">
        <div class="closing-experience__reveal-media"></div>
        <div class="closing-experience__cta" inert>
          <h2 id="closing-cta-title">Queremos ouvir<br>as suas ideias.</h2>
          <p>Entre em contato para falar sobre seu projeto.</p>
          <a href="mailto:hello@studionorte.com">Entrar em contato ↗</a>
        </div>
      </div>
    </div>
  </section>
`;

export const renderSiteFooter = () => `
  <footer class="site-footer">
    <div class="site-footer__meta">
      <p>MEZURASH STUDIOS</p>
      <div class="site-footer__links" aria-label="Redes sociais">
        <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">INSTAGRAM</a>
        <a href="https://www.behance.net/" target="_blank" rel="noreferrer">BEHANCE</a>
      </div>
      <p>© 2026</p>
    </div>

    <div class="site-footer__gooey-stage">
      ${renderGooeyMarquee({ headingTag: "div", className: "site-footer__gooey" })}
    </div>
  </footer>
`;

export class ClosingExperience {
  constructor(section) {
    this.section = section instanceof Element ? section : document.querySelector(section);
    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  init() {
    if (!this.section) return this;

    this.sticky = this.section.querySelector(".closing-experience__sticky");
    this.morphStage = this.section.querySelector(".closing-experience__morph-stage");
    this.currentLayer = this.section.querySelector(".closing-experience__word-layer--current");
    this.nextLayer = this.section.querySelector(".closing-experience__word-layer--next");
    this.reveal = this.section.querySelector(".closing-experience__reveal");
    this.cta = this.section.querySelector(".closing-experience__cta");

    if (this.prefersReducedMotion) {
      this.renderReducedMotion();
      return this;
    }

    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(this.sticky);
    this.measure();

    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.section,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => this.render(self.progress),
      onRefresh: (self) => this.render(self.progress)
    });

    this.render(this.scrollTrigger.progress);
    return this;
  }

  measure() {
    const { width, height } = this.sticky.getBoundingClientRect();
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.startDiameter = Math.min(112, Math.min(width, height) * 0.12);
    this.startInsetX = Math.max(0, (width - this.startDiameter) / 2);
    this.startInsetY = Math.max(0, (height - this.startDiameter) / 2);
    this.circleDiameter = Math.min(width, height) * 0.72;
    this.circleInsetX = Math.max(0, (width - this.circleDiameter) / 2);
    this.circleInsetY = Math.max(0, (height - this.circleDiameter) / 2);
  }

  render(progress) {
    const normalizedProgress = clamp01(progress);
    this.renderWords(normalizedProgress);
    this.renderReveal(normalizedProgress);
    this.renderCta(normalizedProgress);
  }

  renderWords(progress) {
    const activeSegment = CLOSING_SEGMENTS.find((segment) => progress >= segment.start && progress < segment.end);

    if (!activeSegment || progress >= REVEAL_START) {
      this.renderHold(closingWords.length - 1);
    } else if (activeSegment.type === "hold") {
      this.renderHold(activeSegment.word);
    } else {
      const fraction = rangeProgress(progress, activeSegment.start, activeSegment.end);
      this.renderMorph(activeSegment.from, activeSegment.to, fraction);
    }

    const stageOpacity = 1 - rangeProgress(progress, REVEAL_START, 0.9);
    this.morphStage.style.opacity = String(stageOpacity);
  }

  renderHold(wordIndex) {
    this.currentLayer.textContent = closingWords[wordIndex];
    this.currentLayer.style.opacity = "1";
    this.currentLayer.style.filter = "blur(0px)";
    this.nextLayer.textContent = "";
    this.nextLayer.style.opacity = "0";
    this.nextLayer.style.filter = "blur(100px)";
  }

  renderMorph(fromIndex, toIndex, fraction) {
    const leavingFraction = 1 - fraction;
    this.currentLayer.textContent = closingWords[fromIndex];
    this.currentLayer.style.opacity = String(morphOpacity(leavingFraction));
    this.currentLayer.style.filter = `blur(${morphBlur(leavingFraction)}px)`;
    this.nextLayer.textContent = closingWords[toIndex];
    this.nextLayer.style.opacity = String(morphOpacity(fraction));
    this.nextLayer.style.filter = `blur(${morphBlur(fraction)}px)`;
  }

  renderReveal(progress) {
    const fraction = rangeProgress(progress, REVEAL_START, REVEAL_END);
    const circlePhaseEnd = 0.45;
    let insetX;
    let insetY;
    let radius;

    if (fraction <= circlePhaseEnd) {
      const circleProgress = fraction / circlePhaseEnd;
      const diameter = interpolate(this.startDiameter, this.circleDiameter, circleProgress);
      insetX = (this.viewportWidth - diameter) / 2;
      insetY = (this.viewportHeight - diameter) / 2;
      radius = 999;
    } else {
      const panelProgress = (fraction - circlePhaseEnd) / (1 - circlePhaseEnd);
      insetX = interpolate(this.circleInsetX, 0, panelProgress);
      insetY = interpolate(this.circleInsetY, 0, panelProgress);
      radius = 999 * Math.pow(1 - panelProgress, 1.5);
    }
    const clipPath = `inset(${insetY}px ${insetX}px round ${radius}px)`;

    this.reveal.style.clipPath = clipPath;
    this.reveal.style.webkitClipPath = clipPath;
    this.reveal.style.opacity = String(rangeProgress(progress, REVEAL_START, 0.81));
  }

  renderCta(progress) {
    const fraction = rangeProgress(progress, CTA_START, CTA_END);
    this.cta.style.opacity = String(fraction);
    this.cta.style.transform = `translate3d(0, ${interpolate(20, 0, fraction)}px, 0)`;
    this.cta.style.filter = `blur(${interpolate(8, 0, fraction)}px)`;

    const isHidden = fraction === 0;
    this.cta.toggleAttribute("inert", isHidden);
    this.reveal.setAttribute("aria-hidden", String(isHidden));
  }

  renderReducedMotion() {
    this.section.dataset.reducedMotion = "true";
    this.reveal.style.clipPath = "none";
    this.reveal.style.webkitClipPath = "none";
    this.reveal.style.opacity = "1";
    this.reveal.setAttribute("aria-hidden", "false");
    this.cta.removeAttribute("inert");
    this.cta.style.opacity = "1";
    this.cta.style.transform = "none";
    this.cta.style.filter = "none";
  }

  destroy() {
    this.scrollTrigger?.kill();
    this.resizeObserver?.disconnect();
  }
}

export const initClosingExperience = (section) => new ClosingExperience(section).init();
