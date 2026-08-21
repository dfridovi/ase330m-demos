import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from https://<user>.github.io/ase330m-demos/rocket-landing/ (a project Pages
  // site under a subpath, not the domain root), so asset URLs need this base prefix.
  base: '/ase330m-demos/rocket-landing/',
})
