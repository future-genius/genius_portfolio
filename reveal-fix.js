// reveal-fix.js — unified, minimal reveal controller using IntersectionObserver
(() => {
  'use strict';

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function collectTargets(root){
    if(!root) return [];
    const sel = ['h1','h2','h3','p','li','.project-card','.gui-box','.contact-link'];
    const nodes = [];
    sel.forEach(s => Array.from(root.querySelectorAll(s)).forEach(n => nodes.push(n)));
    return nodes.filter(Boolean);
  }

  function ensureReveal(el){
    if(!el) return;
    if(!el.classList.contains('reveal')) el.classList.add('reveal');
  }

  function playGroup(list, baseDelay = 0, stagger = 36){
    list.forEach((el,i)=>{
      const d = baseDelay + i * stagger;
      setTimeout(()=> el.classList.add('reveal-animated'), d);
    });
    return baseDelay + list.length * stagger;
  }

  let observer = null;
  function createObserver(){
    if(observer) return observer;
    observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const list = collectTargets(entry.target);
          playGroup(list, 0, 40);
          obs.unobserve(entry.target);
        }
      });
    }, { root: null, rootMargin: '0px 0px -12% 0px', threshold: 0.06 });
    return observer;
  }

  function resetAll(){
    document.querySelectorAll('.reveal').forEach(el=>{
      el.classList.remove('reveal-animated');
    });
  }

  function init(){
    // ensure base class on all relevant elements
    const header = document.querySelector('header');
    const hero = document.getElementById('hero');
    const sections = Array.from(document.querySelectorAll('main.container section')).filter(s => s.id !== 'hero');

    [header, hero].forEach(r => { if(r) collectTargets(r).forEach(ensureReveal); });
    sections.forEach(s => { collectTargets(s).forEach(ensureReveal); });

    if (prefersReduced){
      // reveal everything immediately without animation
      document.querySelectorAll('.reveal').forEach(el=> el.classList.add('reveal-animated'));
      return;
    }

    resetAll();

    // reveal header and hero with a subtle stagger
    let delay = 40;
    delay = playGroup(collectTargets(header), delay, 36);
    delay = playGroup(collectTargets(hero), delay + 80, 36);

    // observe sections
    const io = createObserver();
    sections.forEach(s => io.observe(s));
  }

  // Replay on pageshow (bfcache) and on load
  window.addEventListener('load', init);
  window.addEventListener('pageshow', init);

  // Expose manual triggers
  window.replayReveals = init;
  window.resetAndPlay = function(){ resetAll(); init(); };

  // Convert legacy .is-visible to canonical .reveal-animated
  // run once at boot for compatibility
  (function convertLegacy(){
    Array.from(document.querySelectorAll('.is-visible')).forEach(el => el.classList.add('reveal-animated'));
  })();

})();
/**
 * reveal-fix.js
 * Clean, single IntersectionObserver-based reveal logic
 * - canonical classes: .reveal (base), .reveal-animated (visible)
 * - respects prefers-reduced-motion
 * - triggers once per element, can replay on pageshow
 */
(function () {
	'use strict';

	const BASE = 'reveal';
	const VISIBLE = 'reveal-animated';
	const LEGACY = 'is-visible';

	const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Observe these container-like elements; children within will be revealed as they enter viewport
	const CONTAINERS = 'main.container section, .section, .project-card, .contact-link, header, main#hero';

	function addBase(el){ if (el && el.classList && !el.classList.contains(BASE)) el.classList.add(BASE); }
	function show(el){ if (!el || !el.classList) return; addBase(el); el.classList.add(VISIBLE); el.classList.remove(LEGACY); }

	function convertLegacy(){
		document.querySelectorAll('.' + LEGACY).forEach(el => { el.classList.remove(LEGACY); if (el.classList && !el.classList.contains(VISIBLE)) el.classList.add(VISIBLE); });
	}

	function createObserver(){
    return new IntersectionObserver((entries, obs) => {
			entries.forEach(en => {
				if (en.isIntersecting){
					show(en.target);
					obs.unobserve(en.target);
				}
			});
    }, { threshold: 0.06, rootMargin: '0px 0px -12% 0px' });
	}

	function resetAndPlay(){
		const all = Array.from(document.querySelectorAll('.' + BASE));
		all.forEach(el => el.classList.remove(VISIBLE));
		try { window.scrollTo(0,0); } catch(e){}
    all.forEach((el,i) => setTimeout(()=> el.classList.add(VISIBLE), Math.min(500, i*36)));
	}

	function init(){
		try{ document.querySelectorAll(CONTAINERS + ', header h1, .section h2, .project-card h3, p, li').forEach(addBase); }catch(e){}
		convertLegacy();

		if (prefersReduced){ document.querySelectorAll('.' + BASE).forEach(el => el.classList.add(VISIBLE)); return; }

		const io = createObserver();
		try{ document.querySelectorAll(CONTAINERS).forEach(c => io.observe(c)); }catch(e){}

		try{ document.querySelectorAll('header h1, .section h2, .project-card h3, p, li').forEach(t => { const r=t.getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 0) show(t); }); }catch(e){}

		if (window.MutationObserver){
			const mo = new MutationObserver(muts => muts.forEach(m => {
				if (m.type === 'attributes' && m.attributeName === 'class' && m.target && m.target.classList && m.target.classList.contains(LEGACY)){
					m.target.classList.remove(LEGACY); m.target.classList.add(VISIBLE);
				}
			}));
			mo.observe(document.documentElement || document, { attributes: true, subtree: true, attributeFilter: ['class'] });
			window._revealMO = mo;
		}
	}

	window.resetAndPlay = window.resetAndPlay || resetAndPlay;
	window.replayReveals = window.replayReveals || resetAndPlay;

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
	window.addEventListener('pageshow', resetAndPlay);
})();
							all.forEach((el,i) => setTimeout(()=> el.classList.add(VISIBLE), Math.min(500, i*40)));
