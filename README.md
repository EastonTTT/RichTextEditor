# RichTextEditor

Local-first rich text editor MVP built with Vue 3, Element Plus and Tiptap.

## Scripts

- `npm run dev`: start the Vite dev server
- `npm run build`: run type-check and production build
- `npm run lint`: run ESLint with autofix

## Current scope

- Local login session stored in `localStorage`
- Document list, create, open, delete and auto-save
- Rich text editing with headings, lists, code blocks, colors and PDF export
- Optional collaboration banner driven by `VITE_COLLAB_WS_URL`

## Project structure

```text
src/
  api/          local-first data access
  components/   shared Vue components
  constants/    static config and UI options
  pages/        route-level pages
  request/      axios wrapper utilities
  router/       router and guards
  styles/       global styles
  types/        shared TypeScript types
  utils/        editor and local storage helpers
```
