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
		}, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
	}

	function resetAndPlay(){
		const all = Array.from(document.querySelectorAll('.' + BASE));
		all.forEach(el => el.classList.remove(VISIBLE));
		try { window.scrollTo(0,0); } catch(e){}
		// Stagger reveals: each element delays by 40ms for professional line-by-line effect
		all.forEach((el,i) => {
			const delay = Math.min(1200, i * 40); // max stagger window 1.2s
			el.style.animationDelay = (delay / 1000) + 's';
			setTimeout(()=> el.classList.add(VISIBLE), delay);
		});
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
