import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // Dracula Theme Colors
        background: '#282a36', // Dracula Background
        foreground: '#f8f8f2', // Dracula Foreground
        current: '#f8f8f2',    // Dracula Current Line
        comment: '#6272a4',   // Dracula Comment
        cyan: '#8be9fd',      // Dracula Cyan
        green: '#50fa7b',     // Dracula Green
        orange: '#ffb86c',    // Dracula Orange
        pink: '#ff79c6',      // Dracula Pink
        purple: '#bd93f9',    // Dracula Purple
        red: '#ff5555',       // Dracula Red
        yellow: '#f1fa8c',    // Dracula Yellow

        // Shadcn UI Overrides (using Dracula colors)
        'card': {
          DEFAULT: '#44475a', // Darker card background
          foreground: 'hsl(var(--foreground))',
        },
        'popover': {
          DEFAULT: '#44475a', // Darker popover
          foreground: 'hsl(var(--foreground))',
        },
        'primary': {
          DEFAULT: 'hsl(var(--purple))', // Use Dracula Purple
          foreground: '#282a36', // Dark text on purple
        },
        'secondary': {
          DEFAULT: '#44475a', // Darker secondary
          foreground: 'hsl(var(--foreground))',
        },
        'muted': {
          DEFAULT: '#6272a4', // Use Dracula Comment (muted)
          foreground: '#f8f8f2',
        },
        'accent': {
          DEFAULT: '#6272a4', // Use Dracula Comment
          foreground: '#f8f8f2',
        },
        'destructive': {
          DEFAULT: 'hsl(var(--red))', // Use Dracula Red
          foreground: '#f8f8f2',
        },
        'border': '#6272a4', // Use Dracula Comment for borders
        'input': '#6272a4',   // Use Dracula Comment for inputs
        'ring': 'hsl(var(--purple))', // Use Dracula Purple
        'chart': { // Keep chart colors, but adjust for Dracula
          '1': 'hsl(var(--cyan))',
          '2': 'hsl(var(--green))',
          '3': 'hsl(var(--orange))',
          '4': 'hsl(var(--pink))',
          '5': 'hsl(var(--yellow))',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;
