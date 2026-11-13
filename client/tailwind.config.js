module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7C59D7', // Primary Purple
        'primary-hover': '#5B2DB8', // Deep Purple
        sidebar: '#101832', // Dark Navy
        'sidebar-hover': '#1e293b',
        'sidebar-active': '#5B2DB8',
        'bg-main': '#F7F3F9', // Soft Lavender
        'card-border': '#ede9f0',
        
        // Custom color palette overrides to map general colors to school identity
        blue: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7C59D7', // Primary Purple
          700: '#5B2DB8', // Deep Purple
          800: '#4c1d95',
          900: '#3a0ca3',
          950: '#2e0a82',
        },
        indigo: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },

        // EdTech Accents
        edtech: {
          blue: '#287BEA',
          green: '#16B981',
          orange: '#F59A23',
          pink: '#E85A91',
        },

        // Attendance Status Colors (using requested specific hexes)
        present: '#16B981',
        absent: '#E85A91', // Pinkish red
        holiday: '#94a3b8',
        
        // Fees Status Colors
        paid: '#16B981',
        pending: '#F59A23',
        overdue: '#E85A91'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px -5px rgba(124, 89, 215, 0.08), 0 5px 15px -5px rgba(124, 89, 215, 0.05)',
        'glow': '0 0 20px -3px rgba(124, 89, 215, 0.25)',
        'card': '0 4px 20px -2px rgba(124, 89, 215, 0.05), 0 2px 8px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 20px 40px -15px rgba(124, 89, 215, 0.12)'
      }
    }
  },
  plugins: []
};