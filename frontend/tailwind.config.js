import { background } from "storybook/internal/theming";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#171717",
        text: "#D7DADC",
        background: "#212121",
        secondary: "#ffffff",
      },
    },
  },
  plugins: [],
};
