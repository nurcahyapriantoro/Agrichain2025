/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      animation: {
        'fadeIn': 'fadeIn 0.5s ease-in-out',
        'fadeInSlide': 'fadeInSlide 0.5s ease-in-out forwards',
        'circuitPath': 'circuitPath 3s linear forwards',
        'float': 'float 6s ease-in-out infinite',
        'scanline': 'scanline 2s linear infinite',
        'scanning': 'scanning 1.5s linear infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'circuit-flow': 'circuitFlow 8s linear infinite',
        'rotate-slow': 'rotate 15s linear infinite',
        'blockchain-float': 'blockchainFloat 8s ease-in-out infinite alternate',
        'dash': 'dash 15s linear infinite',
        'product-flow': 'productFlow 20s linear infinite',
        'supply-path': 'supplyPath 25s linear infinite',
        'spin-slow': 'spin 8s linear infinite',
        'spin-slow-reverse': 'spin 12s linear infinite reverse',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInSlide: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        circuitPath: {
          '0%': { 
            'stroke-dasharray': '0, 1000',
            'stroke-dashoffset': '0',
            opacity: '0.3'
          },
          '50%': { 
            opacity: '0.8'
          },
          '100%': { 
            'stroke-dasharray': '1000, 1000',
            'stroke-dashoffset': '1000',
            opacity: '0.3'
          },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        scanline: {
          '0%': { top: '0%' },
          '100%': { top: '100%' },
        },
        scanning: {
          '0%': { left: '0%', opacity: '0.5' },
          '50%': { opacity: '0.8' },
          '100%': { left: '100%', opacity: '0.5' },
        },
        pulseGlow: {
          '0%, 100%': { 
            opacity: '0.6',
            filter: 'blur(8px)', 
            transform: 'scale(1)' 
          },
          '50%': { 
            opacity: '0.9',
            filter: 'blur(12px)', 
            transform: 'scale(1.05)' 
          },
        },
        circuitFlow: {
          '0%': { 'stroke-dashoffset': '1000' },
          '100%': { 'stroke-dashoffset': '0' },
        },
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        blockchainFloat: {
          '0%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
          '100%': { transform: 'translateY(0) rotate(0deg)' },
        },
        dash: {
          '0%': {
            'stroke-dashoffset': '1000',
          },
          '100%': {
            'stroke-dashoffset': '0',
          },
        },
        productFlow: {
          '0%': { transform: 'translate(0, 0) scale(1)', opacity: 0 },
          '10%': { opacity: 1 },
          '40%': { transform: 'translate(300px, 20px) scale(1.1)', opacity: 1 },
          '70%': { transform: 'translate(600px, -20px) scale(0.9)', opacity: 1 },
          '90%': { opacity: 0 },
          '100%': { transform: 'translate(900px, 0) scale(1)', opacity: 0 },
        },
        supplyPath: {
          '0%': { 'stroke-dashoffset': '2000' },
          '50%': { 'stroke-dashoffset': '1000' },
          '100%': { 'stroke-dashoffset': '0' },
        },
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2310b981' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'cyber-grid': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%238b5cf6' stroke-width='0.5' stroke-opacity='0.15'%3E%3Cpath d='M0 20h40M20 0v40'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'hexagon-pattern': "url(\"data:image/svg+xml,%3Csvg width='24' height='40' viewBox='0 0 24 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg stroke='%238b5cf6' stroke-width='0.5' stroke-opacity='0.2'%3E%3Cpath d='M0,20 L12,0 L24,20 L12,40 Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
} 