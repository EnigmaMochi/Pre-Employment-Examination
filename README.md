# Pre-Employment Medical Examination Report

A Vite + React form for E. Zarate Hospital's Pre-Employment Medical Examination Report.

## Recent updates

- **Applications record** — every saved report is written to the browser's `localStorage`
  (see `src/utils/applicationsStore.js`) and listed in the new **Applications** section, with
  a **Preview PDF** button for each saved record.
- **PDF preview** — the filled application can be rendered to a multi-page PDF (via `jspdf` +
  `html2canvas`, see `src/utils/generatePdf.js` and `src/components/PrintableReport.jsx`) and
  previewed in-browser before downloading.
- **Physical Examination** — every finding now has a **Not Done** option in addition to
  Normal / Abnormal.
- **Visual Acuity** — Uncorrected / Corrected is now a clickable toggle, with a scoring text
  box for OD/OS and a Near Sighted / Far Sighted toggle underneath.
- **Color Vision & Hearing** — added scoring fields.
- **Dental Examination** — removed.
- **X-Ray / Lab** — choosing **Abnormal** reveals a findings text box, plus a **Not Done**
  option, matching the Physical Examination pattern.
- **Medical History** — added a **Personal / Social History** column.
- **Screening Test** — "FA / DS Test" renamed to **AIDS Test**.
- **Disposition** — limited to four classes (A–D), plus an **Other Disease / Findings** text box.

After pulling these changes, run `npm install` once to pick up the new `jspdf` and
`html2canvas` dependencies before `npm run dev`.

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
