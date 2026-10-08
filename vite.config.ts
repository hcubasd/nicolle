import { defineConfig } from 'vite';
import { lightnessRings } from './scripts/lightness-rings.js';

// Relative assets also work at https://hcubasd.github.io/nicolle/.
export default defineConfig({ base: './', plugins: [lightnessRings()] });
