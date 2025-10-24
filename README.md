# REAL Shahnameh

A modern, single-page showcase celebrating Ferdowsi’s *Shahnameh*. The experience blends atmospheric visuals with
curated journeys, timelines, and community highlights.

## Getting started

This is a static site. You can open `public/index.html` directly in a browser or serve it locally to enjoy smooth
scroll interactions.

```bash
# from the repository root
python -m http.server --directory public 4173
```

Visit <http://localhost:4173> to browse the site.

## Docker

A lightweight Docker image is available for local previews or deployment. It uses Nginx to serve the static assets.

```bash
# build the image
docker build -t real-shahnameh .

# run the container
docker run --rm -p 8080:80 real-shahnameh
```

Open <http://localhost:8080> to view the experience.

## Project structure

```
public/
  index.html       # Landing page markup
  styles/main.css  # Design system and layout
  scripts/main.js  # Progressive enhancements (nav, timeline highlights, form feedback)
Dockerfile         # Nginx-based static server
```

## Accessibility & polish checklist

- Semantic landmarks (`header`, `main`, `section`, `footer`) to aid screen readers.
- Focus-visible states for interactive elements.
- Reduced-motion friendly animations triggered on scroll with IntersectionObserver fallbacks.
- Responsive grid layouts covering mobile through desktop widths.

## Screenshot

A fresh UI capture accompanies this update in the attached project artifacts.
