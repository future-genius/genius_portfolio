// REMOVED: unused site.js
// File intentionally emptied to avoid duplication. Active scripts are embedded in `index.fixed.html`.
/* no-op */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var pre = document.getElementById('preloader');
    if (pre) {
      window.setTimeout(function () { pre.classList.add('loaded'); pre.style.display = 'none'; }, 420);
    }

    var nav = document.getElementById('primary-nav');
    var toggle = document.getElementById('nav-toggle');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          var target = document.querySelector(href);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            if (nav && nav.classList.contains('open')) { nav.classList.remove('open'); toggle && toggle.setAttribute('aria-expanded', 'false'); }
          }
        }
      });
    });

    var topBtn = document.getElementById('back-to-top');
    topBtn && topBtn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      var observer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      var targets = document.querySelectorAll('.section, .project-card, .skill-card, .profile-photo, .timeline-item');
      targets.forEach(function (t) { t.classList.add('reveal'); observer.observe(t); });
    } else {
      document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
    }
  });
})();
