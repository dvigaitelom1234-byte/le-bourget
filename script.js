const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');
const mobileBook = document.querySelector('.mobile-book');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const motionLines = [...document.querySelectorAll('[data-motion-lines]')];
let lastScrollY = Math.max(window.scrollY, 0);
let scrollFrameRequested = false;

const updateHeader = () => {
  const currentScrollY = Math.max(window.scrollY, 0);
  const scrollDelta = currentScrollY - lastScrollY;
  const menuIsOpen = document.body.classList.contains('nav-open');

  header?.classList.toggle('is-scrolled', currentScrollY > 24);
  mobileBook?.classList.toggle('is-visible', currentScrollY > 500);

  if (menuIsOpen || currentScrollY < 96 || scrollDelta < -2) {
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

  motionLines.forEach((item, index) => {
    const bounds = item.getBoundingClientRect();
    if (bounds.bottom < -200 || bounds.top > viewportHeight + 200) return;

    const progress = Math.max(0, Math.min(1, (viewportHeight - bounds.top) / (viewportHeight + bounds.height)));
    const centeredProgress = Math.max(-.65, Math.min(.65, progress - .5));
    const drawProgress = Math.max(0, Math.min(1, progress * 1.45));
    const lateDrawProgress = Math.max(0, Math.min(1, (progress - .18) * 1.55));
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

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && document.body.classList.contains('nav-open')) {
    document.body.classList.remove('nav-open');
    header?.classList.remove('is-hidden');
    menuToggle?.setAttribute('aria-expanded', 'false');
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
  const startHeroVideo = () => {
    let started = false;
    const revealAndPlay = () => {
      if (started) return;
      started = true;
      heroVideo.classList.add('is-ready');
      heroVideo.play().catch(() => {});
    };

    heroVideo.addEventListener('canplay', revealAndPlay, { once: true });
    attachVideoSource(heroVideo);

    if (heroVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      revealAndPlay();
    }
  };

  if (document.readyState === 'complete') {
    window.setTimeout(startHeroVideo, 500);
  } else {
    window.addEventListener('load', () => window.setTimeout(startHeroVideo, 500), { once: true });
  }
}

const lazyVideos = document.querySelectorAll('[data-lazy-video]');

if ('IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        attachVideoSource(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { rootMargin: '280px 0px', threshold: 0.01 });

  lazyVideos.forEach((video) => videoObserver.observe(video));
} else {
  lazyVideos.forEach(attachVideoSource);
}

const mobileBookBlockers = [...document.querySelectorAll('.story-section, .offers, .prices, .final-cta, .contacts')];

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
