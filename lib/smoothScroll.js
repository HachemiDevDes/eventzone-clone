/**
 * Smoothly scroll to a target element or selector with custom easing and duration.
 * @param {string | HTMLElement | number} target - Element ID (with or without #), selector, DOM element, or pixel Y position
 * @param {object} options - Options { duration = 850, offset = 70, easing = 'easeInOutCubic' }
 */
export function smoothScrollTo(target, options = {}) {
  if (typeof window === "undefined") return;

  const {
    duration = 850,  // Base ms duration for buttery smooth glide
    offset = 70,     // Header height offset in px
    easing = "easeInOutCubic"
  } = options;

  let targetPosition = 0;
  const startPosition = window.pageYOffset || document.documentElement.scrollTop;

  if (typeof target === "number") {
    targetPosition = Math.max(0, target);
  } else {
    let targetElement = null;
    if (typeof target === "string") {
      const id = target.startsWith("#") ? target.slice(1) : target;
      targetElement = document.getElementById(id) || document.querySelector(target);
    } else if (target instanceof HTMLElement) {
      targetElement = target;
    }

    if (!targetElement) return;

    const elementPosition = targetElement.getBoundingClientRect().top;
    targetPosition = Math.max(0, elementPosition + startPosition - offset);
  }

  const distance = targetPosition - startPosition;
  if (Math.abs(distance) < 2) return;

  let startTime = null;
  let isCancelled = false;

  // Silky smooth Ease-In-Out Cubic (gentle acceleration -> smooth glide -> gentle deceleration)
  const easeInOutCubic = (t) => {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  };

  // Ease-In-Out Quart (even softer and more luxurious curve)
  const easeInOutQuart = (t) => {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  };

  const easeFn = easing === "easeInOutQuart" ? easeInOutQuart : easeInOutCubic;

  // Scale duration gracefully based on travel distance (700ms to 1200ms)
  const travelFactor = Math.min(Math.max(Math.abs(distance) / 1200, 0.8), 1.4);
  const totalDuration = duration * travelFactor;

  const cancelOnUserScroll = () => {
    isCancelled = true;
    window.removeEventListener("wheel", cancelOnUserScroll);
    window.removeEventListener("touchmove", cancelOnUserScroll);
  };

  window.addEventListener("wheel", cancelOnUserScroll, { passive: true });
  window.addEventListener("touchmove", cancelOnUserScroll, { passive: true });

  const step = (currentTime) => {
    if (isCancelled) return;
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / totalDuration, 1);
    const ease = easeFn(progress);

    window.scrollTo(0, startPosition + distance * ease);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      window.removeEventListener("wheel", cancelOnUserScroll);
      window.removeEventListener("touchmove", cancelOnUserScroll);
    }
  };

  requestAnimationFrame(step);
}
