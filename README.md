# Hariharan R — Portfolio

This repository contains a production-ready, strict black-and-white personal portfolio website for Hariharan R.

Overview

Contents

Deploy

Notes

## How to run locally

1. Open `index.fixed.html` in your browser, or serve the folder with a static server such as:

```bash
python -m http.server 8000
# then open http://localhost:8000/index.fixed.html
```

## Changelog

- 2025-12-28: Updated layout and styling to strict black & white (pure #000 / #fff). Implemented replayable entrance/scroll-reveal animations (opacity + translate only) and a small JS controller that replays them on each page load while respecting the `prefers-reduced-motion` setting. Consolidated primary styles into `minimal_bw.css` and the main markup into `index.fixed.html`. Removed duplicate/unused files (`main.js`, `main.fixed.js`, `site.js`, `styles.css`) and pushed the cleaned workspace to GitHub remote `https://github.com/future-genius/genius_portfolio.git`.

- 2025-12-27: Fixed earlier script issues.

---

If you want the changelog extended or a different release note, tell me what to include and I'll update it.

# Hariharan R — Portfolio

This repository contains a production-ready, pure-black personal portfolio website for Hariharan R.

Overview

Contents

Deploy

Notes

## Changelog

- 2025-12-27: Fixed broken `main.js` (it contained Markdown fences which prevented execution). Replaced with corrected `main.js`. Also added `main.fixed.js` during troubleshooting; `main.js` now contains the working script.
