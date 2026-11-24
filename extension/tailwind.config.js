/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./sidepanel.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Official FormSaathi Palette Tokens
        teal: {
          brand: '#174B4F',      // Primary Teal
          hover: '#133E41',      // Deep action hover
          active: '#0E2E31',
        },
        sage: {
          secondary: '#496A60',  // Secondary Sage
          soft: '#DCE8E2',       // Soft Sage (selected / active tint)
          muted: '#65847A',
          subtle: '#EEF4F1',
        },
        paper: {
          ivory: '#F7F6F1',      // Main Paper Ivory background
          card: '#FFFFFF',       // Layered White surface
          elevated: '#FCFCFA',
        },
        ink: {
          deep: '#263433',       // Main Headings & Primary Text
          body: '#3A4B4A',       // Body copy
          muted: '#5F7371',      // Secondary labels & captions
          subtle: '#889C9A',     // Placeholders & hints
        },
        line: {
          border: '#E3E5DD',     // Fine borders
          soft: '#ECEEE6',
        },
        ochre: {
          warm: '#A96F2D',       // Accent Warm Ochre
          pale: '#F1E6D5',       // Pale Ochre container
          light: '#FAF4EB',
        },
        semantic: {
          success: '#287A52',
          warning: '#A96F2D',
          error: '#B54747',
          info: '#346C87',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'fine': '0 1px 2px 0 rgba(38, 52, 51, 0.04)',
        'surface': '0 2px 8px -2px rgba(38, 52, 51, 0.05), 0 1px 2px 0 rgba(38, 52, 51, 0.02)',
        'pop': '0 6px 16px -4px rgba(38, 52, 51, 0.08), 0 2px 6px -2px rgba(38, 52, 51, 0.04)',
      },
      borderRadius: {
        'organic-sm': '10px 4px 10px 4px',
        'organic-md': '14px 6px 14px 6px',
        'organic-lg': '18px 8px 18px 8px',
      },
    },
  },
  plugins: [],
}
