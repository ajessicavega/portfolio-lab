import "./styles.css";
import "lenis/dist/lenis.css";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { galleryBases, projects } from "./projects";
import { createGallery } from "./gallery";
import { createProjectModal } from "./modal";
import { initDualWaveShowcase, renderDualWaveShowcase } from "./dualWave";
import { initLogoMarquee, renderBrandsShowcase } from "./logoMarquee";
import { initClosingExperience, renderClosingExperience, renderSiteFooter } from "./closingExperience";
import { initGooeyMarquees, renderGooeyMarquee } from "./gooeyMarquee";
import mezurashLogo from "../logo-mezurash-glass.svg";

gsap.registerPlugin(ScrollTrigger);

const app = document.querySelector("#app");

app.innerHTML = `
  <header class="site-header">
    <a class="brand" href="#top" aria-label="Mezurash Studios, início">MEZURASH STUDIOS.©</a>
    <p>OPERAÇÕES DE PRODUTOS DIGITAIS<br>E CAMPANHAS DE VENDAS.</p>
    <a class="contact-link" href="https://wa.me/5516997629003">ENTRE EM CONTATO ↗</a>
  </header>

  <main id="top">
    <section class="hero" aria-labelledby="hero-title">
      <img class="hero-kicker" src="${mezurashLogo}" alt="Mezurash Studios">
      <div class="hero-marquee-stage">
        ${renderGooeyMarquee({ titleId: "hero-title", headingTag: "h1" })}
      </div>
      <a class="scroll-cue" href="#selected-work">Explore o trabalho <span aria-hidden="true">↓</span></a>
    </section>

    <section class="work-intro" id="selected-work">
      <p>Trabalhos selecionados</p>
      <p>${String(projects.length).padStart(2, "0")} projetos em foco</p>
    </section>
    <div class="gallery" aria-label="Projetos selecionados"></div>
    ${renderDualWaveShowcase()}
    ${renderBrandsShowcase()}
    ${renderClosingExperience()}
  </main>

  ${renderSiteFooter()}
`;

const gooeyMarquees = initGooeyMarquees(document.querySelectorAll(".hero-gooey-marquee"));

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const MAX_WHEEL_DELTA = 32;
const lenis = prefersReducedMotion
  ? null
  : new Lenis({
      lerp: 0.06,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      syncTouch: false,
      virtualScroll: (input) => {
        if (input.event.type !== "wheel") return;
        input.deltaY = Math.sign(input.deltaY) * Math.min(Math.abs(input.deltaY), MAX_WHEEL_DELTA);
      }
    });

if (lenis) {
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

const modal = createProjectModal(projects, lenis);
document.body.append(document.querySelector(".site-footer"));
createGallery(document.querySelector(".gallery"), projects, modal.openProject, galleryBases);
const dualWave = initDualWaveShowcase(document.querySelector(".portfolio-dual-wave"));
const logoMarquee = initLogoMarquee(document.querySelector(".brands-showcase"));
const closingExperience = initClosingExperience(document.querySelector(".closing-experience"));
const dualWaveImage = document.querySelector(".portfolio-wave-thumbnail");
const refreshDualWave = () => {
  ScrollTrigger.refresh();
  if (dualWave.scrollTrigger) dualWave.handleScroll(dualWave.scrollTrigger);
};

if (dualWaveImage.complete) {
  refreshDualWave();
} else {
  dualWaveImage.addEventListener("load", refreshDualWave, { once: true });
}

window.addEventListener("pagehide", () => {
  dualWave.destroy();
  logoMarquee.destroy();
  closingExperience.destroy();
  gooeyMarquees.destroy();
}, { once: true });
