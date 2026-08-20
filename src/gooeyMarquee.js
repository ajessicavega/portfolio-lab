export const renderGooeyMarquee = ({ titleId, headingTag = "div", className = "" } = {}) => {
  const Heading = headingTag;

  return `
    <div class="hero-gooey-marquee${className ? ` ${className}` : ""}">
      <div class="hero-gooey-marquee__plane">
        <div class="hero-gooey-marquee__goo" aria-hidden="true">
          <span class="hero-gooey-marquee__track">mezurash studios.</span>
        </div>
        <div class="hero-gooey-marquee__clean">
          <${Heading}${titleId ? ` id="${titleId}"` : ""} class="hero-gooey-marquee__track">mezurash studios.</${Heading}>
        </div>
      </div>
    </div>
  `;
};

const syncGooeyMarqueeScale = (marquee) => {
  const marqueeStyles = getComputedStyle(marquee);
  const rootFontSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
  const targetFontSize = Number.parseFloat(marqueeStyles.fontSize);
  const sourceFontSize = Number.parseFloat(marqueeStyles.getPropertyValue("--hero-source-font-size")) * rootFontSize;
  const sourceEdgeCrop = Number.parseFloat(marqueeStyles.getPropertyValue("--hero-goo-source-edge-crop")) * rootFontSize;
  const scale = targetFontSize / sourceFontSize;
  const sourcePlaneWidth = marquee.clientWidth / scale + 2 * sourceEdgeCrop;

  marquee.style.setProperty("--hero-effect-scale", String(scale));
  marquee.style.setProperty("--hero-source-plane-width", `${sourcePlaneWidth}px`);
};

export const initGooeyMarquees = (marquees) => {
  const elements = [...marquees].filter(Boolean);
  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => syncGooeyMarqueeScale(entry.target));
  });

  elements.forEach((marquee) => {
    resizeObserver.observe(marquee);
    syncGooeyMarqueeScale(marquee);
  });

  return {
    destroy() {
      resizeObserver.disconnect();
    }
  };
};
