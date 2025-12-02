/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // COLORES DE LA MARCA - Decoraciones Ángel e Hijas
        // Para cambiar los colores, modifica los valores aquí
        // o en src/index.css (variables CSS)
        // ============================================
        primary: {
          50: 'var(--color-primary-50, #f0fdf4)',
          100: 'var(--color-primary-100, #dcfce7)',
          200: 'var(--color-primary-200, #bbf7d0)',
          300: 'var(--color-primary-300, #86efac)',
          400: 'var(--color-primary-400, #4ade80)',
          500: 'var(--color-primary-500, #22c55e)',  // Color principal del logo
          600: 'var(--color-primary-600, #16a34a)',
          700: 'var(--color-primary-700, #15803d)',
          800: 'var(--color-primary-800, #166534)',
          900: 'var(--color-primary-900, #14532d)',
        },
        accent: {
          500: 'var(--color-accent-500, #10b981)',
          600: 'var(--color-accent-600, #059669)',
        },
        // Colores de estado
        success: 'var(--color-success, #22c55e)',
        warning: 'var(--color-warning, #f59e0b)',
        danger: 'var(--color-danger, #ef4444)',
        info: 'var(--color-info, #3b82f6)',
      },
    },
  },
  plugins: [],
}
