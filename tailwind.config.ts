// Path: /tailwind.config.ts
// Module: Tailwind Configuration
// Depends on: tailwindcss/types/config
// Description: Tailwind configuration for app and component source files.

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/lib/**/*.{ts,tsx}',
    './src/services/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('@tailwindcss/forms')],
}

export default config
