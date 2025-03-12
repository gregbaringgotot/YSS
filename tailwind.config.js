/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Ensure Tailwind scans all your files
  ],
  theme: {
    extend: { 
      animation: {
        marquee: "marquee 10s linear infinite",
        fadeInUp: "fadeInUp 0.5s ease-out forwards",
        fadeInDelay: "fadeInUp 0.5s ease-out forwards",
      },
      
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        fadeInOut: {
          "0%": { opacity: 0, transform: "scale(0.9)" }, // Initial state
          "10%": { opacity: 1, transform: "scale(1)" },  // Pop-in effect
          "90%": { opacity: 1, transform: "scale(1)" },  // Keep at full opacity
          "100%": { opacity: 0, transform: "scale(0.9)" }, // Fade out effect
        },
        fadeInUp: { // Added fadeInUp keyframes
          "0%": {
            opacity: "0",
            transform: "translateY(20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
          
        },
      },
      
      fontFamily: {
        cousine: ['Cousine', 'monospace','poppins',], // Define 'Cousine' as a custom font
      },
    },
  },
  plugins: [],
};
