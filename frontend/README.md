# Strateegia Interaction Networks (React + Vite)

This frontend rewrites the legacy Strateegia Interaction Networks pages using React and Vite. It includes:

- A login screen that reuses the existing Strateegia authentication helpers.
- The main visualization dashboard with D3-based graphs, beeswarm view, and statistics panels.
- Automatic periodic data refresh with configurable intervals.

## Getting started

```bash
npm install
npm run dev
```

The application will be available at the URL printed in the terminal. To build a production bundle run:

```bash
npm run build
```

## Project structure

- `src/pages` – React pages for login and dashboard views.
- `src/legacy` – Legacy visualization modules adapted to work inside the Vite build.
- `src/main.jsx` – Application entry point with routing and global styles.

The build output is generated in `dist/` (ignored in version control).
