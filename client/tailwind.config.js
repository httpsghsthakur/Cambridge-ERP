module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1d4ed8', // Royal Blue
        'primary-hover': '#1e40af', // Deep Royal Blue
        'primary-light': '#eff6ff',
        secondary: '#facc15', // Cambridge Yellow
        'secondary-hover': '#eab308', // Warm Gold
        'secondary-dark': '#ca8a04',
        accent: '#facc15',
        'accent-yellow': '#facc15',
        'accent-blue': '#2563eb',
        sidebar: '#0a1226', // Deep Cambridge Navy Blue
        'sidebar-hover': '#131e3d',
        'sidebar-active': '#1d4ed8',
        'sidebar-yellow': '#facc15',
        'bg-main': '#f8fafd', // Crisp Soft Slate/Blue-White
        'card-border': '#e2e8f0',
        
        // Cambridge Royal Blue Palette
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Vibrant Royal Blue
          700: '#1d4ed8', // Classic Deep Blue
          800: '#1e40af', // Navy Royal
          900: '#1e3a8a', // Deep Cambridge Navy
          950: '#0a1226', // Midnight Navy
        },

        // Cambridge Golden Yellow Palette
        yellow: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15', // Vibrant Cambridge Yellow
          500: '#eab308', // Rich Golden Yellow
          600: '#ca8a04', // Deep Gold / Amber
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },

        // Map purple to warm golden yellow / amber so existing purple utility classes render in theme
        purple: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
        },

        // Map indigo to deep royal / cobalt navy blue
        indigo: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0a1226',
        },

        // EdTech Accents
        edtech: {
          blue: '#1d4ed8',
          yellow: '#facc15',
          green: '#16a34a',
          orange: '#ea580c',
          pink: '#e11d48',
        },

        // Attendance Status Colors
        present: '#16a34a',
        absent: '#e11d48',
        holiday: '#94a3b8',
        
        // Fees Status Colors
        paid: '#16a34a',
        pending: '#eab308',
        overdue: '#e11d48',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 30px -5px rgba(29, 78, 216, 0.08), 0 5px 15px -5px rgba(250, 204, 21, 0.05)',
        'glow': '0 0 20px -3px rgba(37, 99, 235, 0.35)',
        'glow-yellow': '0 0 20px -3px rgba(250, 204, 21, 0.45)',
        'card': '0 4px 20px -2px rgba(29, 78, 216, 0.04), 0 2px 8px -1px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 20px 40px -15px rgba(29, 78, 216, 0.12)'
      }
    }
  },
  plugins: []
};
