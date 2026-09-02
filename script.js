const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');
const mobileBook = document.querySelector('.mobile-book');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionLines = [...document.querySelectorAll('[data-motion-lines]')];
const motionLineIndexes = new Map(motionLines.map((item, index) => [item, index]));
const activeMotionLines = new Set(reduceMotion || !('IntersectionObserver' in window) ? motionLines : []);
let lastScrollY = Math.max(window.scrollY, 0);
let scrollFrameRequested = false;
let anchorScrollLockUntil = 0;

const updateHeader = () => {
  const currentScrollY = Math.max(window.scrollY, 0);
  const scrollDelta = currentScrollY - lastScrollY;
  const menuIsOpen = document.body.classList.contains('nav-open');
  const anchorScrollIsLocked = performance.now() < anchorScrollLockUntil;

  header?.classList.toggle('is-scrolled', currentScrollY > 24);
  mobileBook?.classList.toggle('is-visible', currentScrollY > 500);

  if (menuIsOpen || anchorScrollIsLocked || currentScrollY < 96 || scrollDelta < -2) {
    header?.classList.remove('is-hidden');
  } else if (currentScrollY > 150 && scrollDelta > 2) {
    header?.classList.add('is-hidden');
  }

  lastScrollY = currentScrollY;
};

const updateMotionLines = () => {
  if (reduceMotion) {
    motionLines.forEach((item) => {
      item.style.setProperty('--motion-progress', '1');
      item.style.setProperty('--draw-progress', '1');
      item.style.setProperty('--draw-progress-late', '1');
      item.style.setProperty('--motion-scale', '1');
      item.style.setProperty('--motion-scale-y', '1');
      item.style.setProperty('--motion-opacity', '.28');
    });
    return;
  }

  const viewportHeight = window.innerHeight;
  const clamp01 = (value) => Math.max(0, Math.min(1, value));

  activeMotionLines.forEach((item) => {
    const index = motionLineIndexes.get(item) ?? 0;
    const bounds = item.getBoundingClientRect();
    const visibleTravel = Math.max(viewportHeight + bounds.height, 1);
    const progress = clamp01((viewportHeight - bounds.top) / visibleTravel);
    const isDirectionFrames = item.classList.contains('directions');
    const directionFrameTravel = Math.max(viewportHeight * .9, 1);
    const drawProgress = isDirectionFrames
      ? clamp01((viewportHeight - bounds.top) / directionFrameTravel)
      : clamp01(progress * 1.035 + .005);
    const lateDrawProgress = clamp01((drawProgress - .1) / .9);
    const centeredProgress = Math.max(-.65, Math.min(.65, progress - .5));
    const direction = index % 2 === 0 ? 1 : -1;
    const verticalDirection = index % 3 === 0 ? -1 : 1;
    const shift = centeredProgress * 34 * direction;
    const shiftY = centeredProgress * 22 * verticalDirection;
    const turn = centeredProgress * 26 * direction;
    const motionOpacity = .08 + progress * .2;

    item.style.setProperty('--motion-shift', `${shift.toFixed(2)}px`);
    item.style.setProperty('--motion-shift-reverse', `${(-shift).toFixed(2)}px`);
    item.style.setProperty('--motion-shift-y', `${shiftY.toFixed(2)}px`);
    item.style.setProperty('--motion-shift-y-reverse', `${(-shiftY).toFixed(2)}px`);
    item.style.setProperty('--motion-turn', `${turn.toFixed(2)}deg`);
    item.style.setProperty('--motion-turn-reverse', `${(-turn).toFixed(2)}deg`);
    item.style.setProperty('--motion-turn-soft', `${(turn * .18).toFixed(2)}deg`);
    item.style.setProperty('--motion-turn-soft-reverse', `${(-turn * .18).toFixed(2)}deg`);
    item.style.setProperty('--motion-turn-card', `${(turn * .28).toFixed(2)}deg`);
    item.style.setProperty('--motion-turn-card-reverse', `${(-turn * .25).toFixed(2)}deg`);
    item.style.setProperty('--motion-shift-y-soft', `${(shiftY * .65).toFixed(2)}px`);
    item.style.setProperty('--motion-scale', (.92 + progress * .08).toFixed(3));
    item.style.setProperty('--motion-scale-y', (.88 + progress * .12).toFixed(3));
    item.style.setProperty('--motion-opacity', motionOpacity.toFixed(3));
    item.style.setProperty('--motion-progress', progress.toFixed(3));
    item.style.setProperty('--draw-progress', drawProgress.toFixed(3));
    item.style.setProperty('--draw-progress-late', lateDrawProgress.toFixed(3));
  });
};

const updateScrollEffects = () => {
  updateHeader();
  updateMotionLines();
  scrollFrameRequested = false;
};

const requestScrollEffects = () => {
  if (scrollFrameRequested) return;
  scrollFrameRequested = true;
  window.requestAnimationFrame(updateScrollEffects);
};

if (!reduceMotion && 'IntersectionObserver' in window) {
  const motionVisibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        activeMotionLines.add(entry.target);
      } else {
        activeMotionLines.delete(entry.target);
      }
    });
    requestScrollEffects();
  }, { rootMargin: '50% 0px', threshold: 0 });

  motionLines.forEach((item) => motionVisibilityObserver.observe(item));
}

const ambientMotionRoots = [
  ...motionLines,
  ...document.querySelectorAll('.memberships__rings, .final-cta__rings'),
];

if (!reduceMotion && ambientMotionRoots.length && 'IntersectionObserver' in window) {
  ambientMotionRoots.forEach((item) => item.classList.add('is-motion-paused'));
  const ambientMotionObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('is-motion-paused', !entry.isIntersecting);
    });
  }, { rootMargin: '15% 0px', threshold: 0 });

  ambientMotionRoots.forEach((item) => ambientMotionObserver.observe(item));
}

updateScrollEffects();
window.addEventListener('scroll', requestScrollEffects, { passive: true });
window.addEventListener('resize', requestScrollEffects, { passive: true });

menuToggle?.addEventListener('click', () => {
  const isOpen = document.body.classList.toggle('nav-open');
  header?.classList.remove('is-hidden');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
});

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
    header?.classList.remove('is-hidden');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Открыть меню');
  });
});

const getAnchorHeaderHeight = () => {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--anchor-header-height');
  return Number.parseFloat(value) || header?.getBoundingClientRect().height || 0;
};

const getAnchorTarget = (hash) => {
  if (!hash || hash === '#') return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null;
  }
};

const scrollToSection = (hash, behavior = reduceMotion ? 'auto' : 'smooth') => {
  const target = getAnchorTarget(hash);
  if (!target) return false;

  const isTop = target.id === 'top';
  anchorScrollLockUntil = performance.now() + (behavior === 'smooth' ? 2000 : 600);
  header?.classList.remove('is-hidden');
  header?.classList.toggle('is-scrolled', !isTop);

  const targetTop = target.getBoundingClientRect().top + window.scrollY;
  const top = isTop ? 0 : targetTop - getAnchorHeaderHeight();
  window.scrollTo({ top: Math.max(0, top), behavior: behavior === 'auto' ? 'instant' : behavior });

  window.setTimeout(() => {
    header?.classList.remove('is-hidden');
    lastScrollY = Math.max(window.scrollY, 0);
  }, behavior === 'smooth' ? 1700 : 0);

  return true;
};

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');
    if (!getAnchorTarget(hash)) return;

    event.preventDefault();
    document.body.classList.remove('nav-open');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Открыть меню');

    if (window.location.hash === hash) {
      window.history.replaceState(null, '', hash);
    } else {
      window.history.pushState(null, '', hash);
    }
    scrollToSection(hash);
  });
});

if (window.location.hash && getAnchorTarget(window.location.hash)) {
  window.addEventListener('load', () => {
    window.requestAnimationFrame(() => scrollToSection(window.location.hash, 'auto'));
  }, { once: true });
}

window.addEventListener('hashchange', () => {
  if (getAnchorTarget(window.location.hash)) scrollToSection(window.location.hash);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
    document.body.classList.remove('nav-open');
    header?.classList.remove('is-hidden');
    menuToggle?.setAttribute('aria-expanded', 'false');
    menuToggle?.setAttribute('aria-label', 'Открыть меню');
    menuToggle?.focus();
  }
});

const revealItems = document.querySelectorAll('.reveal');

if (reduceMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('is-visible'));
} else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.04, rootMargin: '0px 0px 8% 0px' });

  revealItems.forEach((item) => revealObserver.observe(item));
}

const introCarousel = document.querySelector('[data-intro-carousel]');

if (introCarousel) {
  const slides = [...introCarousel.querySelectorAll('[data-carousel-slide]')];
  const previousButton = introCarousel.querySelector('[data-carousel-prev]');
  const nextButton = introCarousel.querySelector('[data-carousel-next]');
  const currentLabel = introCarousel.querySelector('[data-carousel-current]');
  let activeSlide = 0;
  let touchStartX = null;

  const showSlide = (nextIndex) => {
    activeSlide = (nextIndex + slides.length) % slides.length;
    slides.forEach((slide, index) => {
      const isActive = index === activeSlide;
      slide.classList.toggle('is-active', isActive);
      slide.setAttribute('aria-hidden', String(!isActive));
      slide.setAttribute('aria-label', `${index + 1} из ${slides.length}`);
    });

    if (currentLabel) currentLabel.textContent = String(activeSlide + 1).padStart(2, '0');
  };

  previousButton?.addEventListener('click', () => showSlide(activeSlide - 1));
  nextButton?.addEventListener('click', () => showSlide(activeSlide + 1));

  introCarousel.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    showSlide(activeSlide + (event.key === 'ArrowRight' ? 1 : -1));
  });

  introCarousel.addEventListener('touchstart', (event) => {
    touchStartX = event.changedTouches[0]?.clientX ?? null;
  }, { passive: true });

  introCarousel.addEventListener('touchend', (event) => {
    if (touchStartX === null) return;
    const touchEndX = event.changedTouches[0]?.clientX ?? touchStartX;
    const distance = touchEndX - touchStartX;
    touchStartX = null;
    if (Math.abs(distance) < 45) return;
    showSlide(activeSlide + (distance < 0 ? 1 : -1));
  }, { passive: true });

  showSlide(0);
}

const tabs = [...document.querySelectorAll('[data-price-tab]')];
const panels = [...document.querySelectorAll('[data-price-panel]')];

const activateTab = (tab) => {
  const target = tab.dataset.priceTab;

  tabs.forEach((item) => {
    item.setAttribute('aria-selected', String(item === tab));
    item.tabIndex = item === tab ? 0 : -1;
  });

  panels.forEach((panel) => {
    const active = panel.dataset.pricePanel === target;
    panel.hidden = !active;
    panel.classList.toggle('is-active', active);
  });
};

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    let nextIndex = index;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = tabs.length - 1;
    tabs[nextIndex].focus();
    activateTab(tabs[nextIndex]);
  });
});

const attachVideoSource = (video) => {
  if (!video?.dataset.src || video.dataset.loaded === 'true') return;
  const source = document.createElement('source');
  source.src = video.dataset.src;
  source.type = 'video/mp4';
  video.append(source);
  video.dataset.loaded = 'true';
  video.load();
};

const heroVideo = document.querySelector('#hero-video');

if (heroVideo && !reduceMotion && !navigator.connection?.saveData) {
  let heroIsVisible = false;
  let heroCanPlay = false;
  let heroLoadEnabled = false;

  const syncHeroPlayback = () => {
    if (!heroCanPlay || !heroIsVisible || document.hidden) {
      heroVideo.pause();
      return;
    }
    heroVideo.play().catch(() => {});
  };

  const startHeroVideo = () => {
    if (!heroLoadEnabled || !heroIsVisible || heroVideo.dataset.loaded === 'true') return;
    const revealAndPlay = () => {
      heroVideo.classList.add('is-ready');
      heroCanPlay = true;
      syncHeroPlayback();
    };

    heroVideo.addEventListener('canplay', revealAndPlay, { once: true });
    attachVideoSource(heroVideo);

    if (heroVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      revealAndPlay();
    }
  };

  const heroVisibilityObserver = new IntersectionObserver((entries) => {
    heroIsVisible = entries.some((entry) => entry.isIntersecting);
    if (heroIsVisible) startHeroVideo();
    syncHeroPlayback();
  }, { threshold: 0.01 });

  heroVisibilityObserver.observe(heroVideo);
  document.addEventListener('visibilitychange', syncHeroPlayback);

  const enableHeroVideo = () => {
    heroLoadEnabled = true;
    startHeroVideo();
  };

  if (document.readyState === 'complete') {
    window.setTimeout(enableHeroVideo, 500);
  } else {
    window.addEventListener('load', () => window.setTimeout(enableHeroVideo, 500), { once: true });
  }
}

const lazyVideos = document.querySelectorAll('[data-lazy-video]');

if ('IntersectionObserver' in window) {
  const videoLoadObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        attachVideoSource(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '280px 0px', threshold: 0.01 });

  const videoPlaybackObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting && !entry.target.paused) entry.target.pause();
    });
  }, { threshold: 0.01 });

  lazyVideos.forEach((video) => {
    videoLoadObserver.observe(video);
    videoPlaybackObserver.observe(video);
  });
} else {
  lazyVideos.forEach(attachVideoSource);
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) return;
  lazyVideos.forEach((video) => video.pause());
});

const mobileBookBlockers = [...document.querySelectorAll('.intro, .story-section, .swimming, .memberships, .offers, .prices, .final-cta, .contacts, .site-footer')];

if (mobileBook && mobileBookBlockers.length && 'IntersectionObserver' in window) {
  const visibleBlockers = new Set();
  const mobileBookObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        visibleBlockers.add(entry.target);
      } else {
        visibleBlockers.delete(entry.target);
      }
    });
    mobileBook.classList.toggle('is-paused', visibleBlockers.size > 0);
  }, { threshold: .12 });

  mobileBookBlockers.forEach((section) => mobileBookObserver.observe(section));
}

document.querySelectorAll('[data-year]').forEach((node) => {
  node.textContent = new Date().getFullYear();
});
