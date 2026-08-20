import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import logo01 from "../logos/01.svg";
import logo02 from "../logos/02.svg";
import logo03 from "../logos/03.svg";
import logo04 from "../logos/04.svg";
import logo05 from "../logos/05.svg";
import logo06 from "../logos/06.svg";
import logo07 from "../logos/07.svg";
import logo08 from "../logos/08.svg";
import logo09 from "../logos/09.svg";
import logo10 from "../logos/10.svg";
import logo11 from "../logos/11.svg";
import logo12 from "../logos/12.svg";
import logo13 from "../logos/13.svg";
import logo14 from "../logos/14.svg";
import logo15 from "../logos/15.svg";
import logo16 from "../logos/16.svg";
import logo17 from "../logos/17.svg";

export const brandLogos = [
  ["01", logo01],
  ["02", logo02],
  ["03", logo03],
  ["04", logo04],
  ["05", logo05],
  ["06", logo06],
  ["07", logo07],
  ["08", logo08],
  ["09", logo09],
  ["10", logo10],
  ["11", logo11],
  ["12", logo12],
  ["13", logo13],
  ["14", logo14],
  ["15", logo15],
  ["16", logo16],
  ["17", logo17]
].map(([id, src]) => ({ id, name: `Logo ${id}`, src, alt: `Logo da marca ${id}` }));

export const MARQUEE_CONFIG = Object.freeze({
  baseSpeed: 28,
  scrollReactivity: 0.06,
  maxScrollBoost: 140,
  impulseDecay: 0.22,
  scrollIdleDelay: 100,
  hoverResponse: 0.25
});

const rowOneBrands = brandLogos.slice(0, 9);
const rowTwoBrands = brandLogos.slice(9);

const renderBrand = (brand, isDuplicate = false) => {
  if (brand.src) {
    return `
      <span class="logo-marquee__item">
        <img class="logo-marquee__image" src="${brand.src}" alt="${isDuplicate ? "" : brand.alt || brand.name}">
      </span>
    `;
  }

  return `<span class="logo-marquee__item logo-marquee__wordmark">${brand.name}</span>`;
};

const renderGroup = (brands, isDuplicate = false) => `
  <div class="logo-marquee__group"${isDuplicate ? ' aria-hidden="true"' : ""}>
    ${brands.map((brand) => renderBrand(brand, isDuplicate)).join("")}
  </div>
`;

const renderRow = (brands, direction, label) => `
  <div class="logo-marquee__row" data-direction="${direction}" aria-label="${label}">
    <div class="logo-marquee__track">
      ${renderGroup(brands)}
      ${renderGroup(brands, true)}
    </div>
  </div>
`;

export const renderBrandsShowcase = () => `
  <section class="brands-showcase" id="brands-showcase" aria-labelledby="brands-showcase-title">
    <div class="brands-showcase__intro">
      <h2 id="brands-showcase-title" class="brands-showcase__headline">Marcas, ideias e campanhas que ajudamos a dar vida.</h2>
    </div>

    <div class="logo-marquee" aria-label="Marcas selecionadas">
      ${renderRow(rowOneBrands, -1, "Marcas selecionadas, linha um")}
      ${renderRow(rowTwoBrands, 1, "Marcas selecionadas, linha dois")}
    </div>
  </section>
`;

const wrapPosition = (value, cycleWidth) => {
  if (!cycleWidth) return 0;
  return ((value % cycleWidth) + cycleWidth) % cycleWidth - cycleWidth;
};

export class LogoVelocityMarquee {
  constructor(section, options = {}) {
    this.section = section instanceof Element ? section : document.querySelector(section);
    this.config = { ...MARQUEE_CONFIG, ...options };
    this.prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.currentImpulse = 0;
    this.targetImpulse = 0;
    this.lastScrollSignalTime = 0;
    this.isActive = false;
  }

  init() {
    if (!this.section) return this;

    this.rows = gsap.utils.toArray(this.section.querySelectorAll(".logo-marquee__row")).map((element) => ({
      element,
      track: element.querySelector(".logo-marquee__track"),
      group: element.querySelector(".logo-marquee__group"),
      direction: Number.parseFloat(element.dataset.direction) || -1,
      x: 0,
      cycleWidth: 0,
      pauseTarget: 1,
      pauseFactor: 1,
      setX: gsap.quickSetter(element.querySelector(".logo-marquee__track"), "x", "px")
    }));

    this.measure();
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.rows.forEach((row) => this.resizeObserver.observe(row.group));

    const images = gsap.utils.toArray(this.section.querySelectorAll(".logo-marquee__image"));
    if (images.length) {
      Promise.all(images.map((image) => image.decode?.().catch(() => undefined)))
        .then(() => {
          this.measure();
          this.scrollTrigger?.refresh();
        });
    }

    if (this.prefersReducedMotion) {
      this.section.dataset.reducedMotion = "true";
      return this;
    }

    this.setupScrollTrigger();
    this.setupHover();
    this.ticker = (_, deltaTime) => this.tick(Math.min(deltaTime, 50) / 1000);
    gsap.ticker.add(this.ticker);

    return this;
  }

  measure() {
    this.rows?.forEach((row) => {
      const previousWidth = row.cycleWidth;
      const nextWidth = row.group.getBoundingClientRect().width;
      if (!nextWidth) return;

      if (previousWidth) {
        const phase = -wrapPosition(row.x, previousWidth) / previousWidth;
        row.x = -phase * nextWidth;
      } else {
        row.x = row.direction > 0 ? -nextWidth : 0;
      }

      row.cycleWidth = nextWidth;
      row.x = wrapPosition(row.x, row.cycleWidth);
      row.setX(row.x);
    });
  }

  setupScrollTrigger() {
    this.scrollTrigger = ScrollTrigger.create({
      trigger: this.section,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => {
        this.isActive = self.isActive;
        if (!this.isActive) this.targetImpulse = 0;
      },
      onUpdate: (self) => {
        const velocity = self.getVelocity();
        this.targetImpulse = gsap.utils.clamp(
          -this.config.maxScrollBoost,
          this.config.maxScrollBoost,
          velocity * this.config.scrollReactivity
        );
        this.lastScrollSignalTime = performance.now();
      }
    });

    this.isActive = this.scrollTrigger.isActive;
  }

  setupHover() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

    this.rows.forEach((row) => {
      row.onPointerEnter = () => { row.pauseTarget = 0; };
      row.onPointerLeave = () => { row.pauseTarget = 1; };
      row.element.addEventListener("pointerenter", row.onPointerEnter);
      row.element.addEventListener("pointerleave", row.onPointerLeave);
    });
  }

  tick(deltaSeconds) {
    if (!this.isActive) return;

    if (performance.now() - this.lastScrollSignalTime > this.config.scrollIdleDelay) {
      this.targetImpulse = 0;
    }

    const impulseBlend = 1 - Math.exp(-deltaSeconds / this.config.impulseDecay);
    const hoverBlend = 1 - Math.exp(-deltaSeconds / this.config.hoverResponse);
    this.currentImpulse += (this.targetImpulse - this.currentImpulse) * impulseBlend;

    this.rows.forEach((row) => {
      row.pauseFactor += (row.pauseTarget - row.pauseFactor) * hoverBlend;
      const velocity = row.direction * (this.config.baseSpeed + this.currentImpulse) * row.pauseFactor;
      row.x = wrapPosition(row.x + velocity * deltaSeconds, row.cycleWidth);
      row.setX(row.x);
    });
  }

  destroy() {
    this.scrollTrigger?.kill();
    this.resizeObserver?.disconnect();
    if (this.ticker) gsap.ticker.remove(this.ticker);

    this.rows?.forEach((row) => {
      if (row.onPointerEnter) row.element.removeEventListener("pointerenter", row.onPointerEnter);
      if (row.onPointerLeave) row.element.removeEventListener("pointerleave", row.onPointerLeave);
    });
  }
}

export const initLogoMarquee = (section) => new LogoVelocityMarquee(section).init();
