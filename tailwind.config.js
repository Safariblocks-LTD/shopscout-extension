/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./sidepanel.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Palette - Fintech-level trust
        primary: {
          DEFAULT: '#1E88E5', // Trust Blue
          dark: '#1565C0',
          light: '#42A5F5',
        },
        accent: {
          DEFAULT: '#43A047', // Savings Green
          dark: '#2E7D32',
          light: '#66BB6A',
        },
        alert: {
          DEFAULT: '#FF9800', // Caution/Alert Orange
          dark: '#F57C00',
          light: '#FFB74D',
        },
        danger: {
          DEFAULT: '#E53935',
          dark: '#C62828',
          light: '#EF5350',
        },
        dark: {
          DEFAULT: '#0D1117', // Dark mode accent
          light: '#161B22',
        },
        neutral: {
          50: '#F9FAFB',  // Background light
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#868E96',
          700: '#495057',
          800: '#343A40',
          900: '#212529',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'Urbanist', 'system-ui', 'sans-serif'],
        body: ['Roboto', 'DM Sans', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'bounce-subtle': 'bounceSubtle 0.6s ease-in-out',
        'shine': 'shine 1.5s ease-in-out',
        'price-drop': 'priceDrop 0.6s ease-out',
        'expand': 'expand 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(30, 136, 229, 0.4)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(30, 136, 229, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shine: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        priceDrop: {
          '0%': { transform: 'translateY(-10px)', color: '#E53935' },
          '100%': { transform: 'translateY(0)', color: '#43A047' },
        },
        expand: {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.05)' },
        },
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(30, 136, 229, 0.3)',
        'glow-green': '0 0 20px rgba(67, 160, 71, 0.3)',
      },
    },
  },
  plugins: [],
}
