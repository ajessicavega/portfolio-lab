import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const MEDIA_REVEAL = {
  y: 56,
  opacity: 0,
  duration: 1,
  ease: "power3.out",
  rootMargin: "0px 0px -12% 0px"
};

function createMediaElement(media) {
  if (media.type === "video") {
    const video = document.createElement("video");
    video.autoplay = true;
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "auto";
    video.controls = false;
    video.src = media.src;
    video.poster = media.poster || "";
    return video;
  }

  const image = document.createElement("img");
  image.src = media.src;
  image.alt = media.alt || "";
  image.loading = "lazy";
  image.decoding = "async";
  return image;
}

function createMediaFrame(media) {
  const frame = document.createElement("div");
  frame.className = "modal-media-item";
  frame.append(createMediaElement(media));
  return frame;
}

export function createProjectModal(projects, lenis = null) {
  const overlay = document.createElement("div");
  overlay.className = "project-modal";
  overlay.setAttribute("data-lenis-prevent", "");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <button class="modal-close" type="button" aria-label="Fechar projeto">Fechar <span aria-hidden="true">×</span></button>
    <div class="modal-layout">
      <div class="modal-media"></div>
      <aside class="modal-info"></aside>
    </div>
  `;
  document.body.append(overlay);

  const mediaContainer = overlay.querySelector(".modal-media");
  const info = overlay.querySelector(".modal-info");
  const closeButton = overlay.querySelector(".modal-close");
  const modalLayout = overlay.querySelector(".modal-layout");
  let savedHomeScroll = 0;
  let isOpen = false;
  let mediaRevealTweens = [];
  let mediaLoadController = null;
  let mediaRevealObserver = null;
  let videoObserver = null;

  function playVideoSafely(video) {
    video.muted = true;
    const playPromise = video.play();
    playPromise?.catch(() => {});
  }

  function setupVideoPlayback() {
    const videos = [...mediaContainer.querySelectorAll("video")];
    if (!videos.length) return;

    videos.forEach((video) => video.pause());

    videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(({ isIntersecting, target }) => {
          if (isIntersecting && isOpen) {
            playVideoSafely(target);
          } else {
            target.pause();
          }
        });
      },
      { root: overlay, threshold: 0.01 }
    );

    videos.forEach((video) => videoObserver.observe(video));
  }

  function teardownVideoPlayback() {
    videoObserver?.disconnect();
    videoObserver = null;
    mediaContainer.querySelectorAll("video").forEach((video) => video.pause());
  }

  function renderProject(project) {
    const eyebrow = project.eyebrow || "Projeto selecionado";
    const secondaryLabel = project.secondaryLabel || "Área";
    const secondaryValue = project.secondaryValue || project.category;

    info.innerHTML = `
      <div class="project-heading">
        <p class="eyebrow">${eyebrow}</p>
        <h2>${project.title}</h2>
      </div>
      <dl>
        <div><dt>Ano</dt><dd>${project.year}</dd></div>
        <div><dt>${secondaryLabel}</dt><dd>${secondaryValue}</dd></div>
      </dl>
      <p class="project-description">${project.description}</p>
      <span class="modal-scroll-indicator" aria-hidden="true">
        <svg viewBox="0 0 16 24" focusable="false">
          <path d="M8 1v20M2.5 15.5 8 21l5.5-5.5" />
        </svg>
      </span>
    `;
    mediaContainer.replaceChildren(...project.media.map(createMediaFrame));
  }

  function setupMediaReveals() {
    const items = [...mediaContainer.querySelectorAll(".modal-media-item")];
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      gsap.set(items, { x: 0, y: 0, autoAlpha: 1 });
      return;
    }

    const controller = new AbortController();
    mediaLoadController = controller;

    const waitForGeometry = (item) => {
      const media = item.firstElementChild;
      const isReady =
        media.tagName === "IMG"
          ? media.complete && media.naturalWidth > 0
          : media.readyState >= 1 && media.videoWidth > 0;
      if (isReady) return Promise.resolve();

      return new Promise((resolve) => {
        const readyEvent = media.tagName === "IMG" ? "load" : "loadedmetadata";
        media.addEventListener(readyEvent, resolve, { once: true, signal: controller.signal });
        media.addEventListener("error", resolve, { once: true, signal: controller.signal });
        controller.signal.addEventListener("abort", resolve, { once: true });
      });
    };

    const revealItem = (item) => {
      mediaRevealObserver?.unobserve(item);
      mediaRevealTweens.push(
        gsap.to(item, {
          x: 0,
          y: 0,
          autoAlpha: 1,
          duration: MEDIA_REVEAL.duration,
          ease: MEDIA_REVEAL.ease
        })
      );
    };

    gsap.set(items, { x: 0, y: MEDIA_REVEAL.y, autoAlpha: MEDIA_REVEAL.opacity });
    mediaRevealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) revealItem(entry.target);
        });
      },
      {
        root: overlay,
        rootMargin: MEDIA_REVEAL.rootMargin,
        threshold: 0
      }
    );

    waitForGeometry(items[0]).then(() => {
      if (!isOpen || controller.signal.aborted || !items[0].isConnected) return;
      revealItem(items[0]);
    });
    items.slice(1).forEach((item) => {
      waitForGeometry(item).then(() => {
        if (!isOpen || controller.signal.aborted || !item.isConnected) return;
        const overlayRect = overlay.getBoundingClientRect();
        const triggerLine = overlayRect.top + overlayRect.height * 0.88;
        if (item.getBoundingClientRect().top <= triggerLine) {
          revealItem(item);
        } else {
          mediaRevealObserver?.observe(item);
        }
      });
    });
  }

  function teardownMediaReveals() {
    mediaRevealObserver?.disconnect();
    mediaRevealObserver = null;
    mediaLoadController?.abort();
    mediaLoadController = null;
    mediaRevealTweens.forEach((tween) => {
      tween.kill();
    });
    mediaRevealTweens = [];
    gsap.killTweensOf(mediaContainer.querySelectorAll(".modal-media-item"));
  }

  function lockBodyScroll() {
    savedHomeScroll = lenis?.scroll ?? window.scrollY;
    lenis?.stop();
    document.body.style.position = "fixed";
    document.body.style.top = `-${savedHomeScroll}px`;
    document.body.style.width = "100%";
  }

  function unlockBodyScroll() {
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";

    if (lenis) {
      lenis.resize();
      lenis.scrollTo(savedHomeScroll, { immediate: true, force: true });
      ScrollTrigger.refresh();
      ScrollTrigger.update();
      lenis.start();
    } else {
      window.scrollTo(0, savedHomeScroll);
      ScrollTrigger.refresh();
      ScrollTrigger.update();
    }

    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  }

  function openProject(projectId) {
    const project = projects.find(({ id }) => id === projectId);
    if (!project || isOpen) return;

    isOpen = true;
    renderProject(project);
    lockBodyScroll();
    overlay.scrollTop = 0;
    mediaContainer.scrollTop = 0;
    overlay.setAttribute("aria-hidden", "false");
    setupVideoPlayback();
    setupMediaReveals();
    gsap.fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.24, ease: "power2.out" });
    gsap.fromTo(
      modalLayout,
      { x: -28, y: 28, scale: 0.975, transformOrigin: "bottom left" },
      { x: 0, y: 0, scale: 1, duration: 0.42, ease: "power2.out" }
    );
    closeButton.focus();
  }

  function closeProject() {
    if (!isOpen) return;
    isOpen = false;
    teardownVideoPlayback();
    teardownMediaReveals();

    gsap.to(overlay, {
      autoAlpha: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        overlay.setAttribute("aria-hidden", "true");
        mediaContainer.replaceChildren();
        info.replaceChildren();
        unlockBodyScroll();
      }
    });
  }

  closeButton.addEventListener("click", closeProject);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProject();
  });

  return { openProject, closeProject };
}
