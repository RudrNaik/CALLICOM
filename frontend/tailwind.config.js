export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      scrollBehavior: ["smooth"],
      fontFamily: {
        geist: ['"Geist_Mono"', 'monospace']
      }
    },
  },
  plugins: [],
};
