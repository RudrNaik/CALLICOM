import scrollbar from "tailwind-scrollbar";

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      fontFamily: {
        geistMono: ["Geist_Mono", "monospace"],
      },
    },
  },
  plugins: [scrollbar],
};
