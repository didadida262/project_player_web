/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontSize: {
      textFirstSize: "20px",
      textSecondSize: "18px",
      textThirdSize: "16px",
      textFourthSize: "14px",
      textFifthSize: "13px",
      textSixSize: "12px",
    },
    extend: {
      padding: {
        common: "18px",
      },
      fontFamily: {
        IBMPlexSans: ["Segoe UI"],
        Poppins: ["Poppins"],
        outfit: ["Outfit"],
      },
      colors: {
        // 文本
        // #FFFFFF
        textPrimaryColor: "var(--text-primary-color)",
        // #D1D5DA
        textSecondColor: "var(--text-second-color)",
        // #E1E4E8
        textThirdColor: "var(--text-third-color)",
        // #D1D5DA
        textFourthColor: "var(--text-fourth-color)",
        // #959DA5
        textFifthColor: "var(--text-fifth-color)",
        // #CED3DB
        textSixColor: "var(--text-sixth-color)",
        // #95A0AB
        textSevenColor: "var(--text-seventh-color)",
        // #D77915
        textEightColor: "var(--text-eight-color)",
        // #D1D5DAB2
        textNineColor: "var(--text-nine-color)",
        // [rgb(55,61,65)
        // 背景
        // #121416
        bgPrimaryColor: "var(--bg-primary-color)",
        // #2D343E
        bgSecondColor: "var(--bg-secondary-color)",
        // #202329
        bgThirdColor: "var(--bg-third-color)",
        // #146EF5
        bgFourthColor: "var(--bg-fourth-color)",
        // #1AB13F
        bgFifthColor: "var(--bg-fifth-color)",
        // #0366D6
        bgSixColor: "var(--bg-six-color)",
        // #252629
        bgSevenColor: "var(--bg-seven-color)",
        // #25272D
        bgEightColor: "var(--bg-eight-color)",
        // #D779150D;
        bgNineColor: "var(--bg-nine-color)",
        // #141519
        bgTenColor: "var(--bg-ten-color)",
        // #000000
        bgElevenColor: "var(--bg-eleven-color)",

        // #262B33
        borderFirstColor: "var(--border-first-color)",
        // #383B45
        borderSecondColor: "var(--border-second-color)",
        // #D7791599
        borderThirdColor: "var(--border-third-color)",
        // #4A4F59
        borderFourColor: "var(--border-four-color)",
      },
      borderRadius: {
        common: "var(--radius-common)",
      },
      screens: {
        xs: "300px",
        // => @media (min-width: 400px) { ... }

        sm: "640px",
        // => @media (min-width: 640px) { ... }

        md: "768px",
        // => @media (min-width: 768px) { ... }

        lg: "1024px",
        // => @media (min-width: 1024px) { ... }

        xl: "1280px",
        // => @media (min-width: 1280px) { ... }

        "1xl": "1380px",
        // => @media (min-width: 1380px) { ... }
        "2xl": "1440px",
        // => @media (min-width: 1440x820px) { ... }
        "3xl": "1920px",
        // '3xl': '1920x1080'
        // => @media (min-width: 1920px) { ... }
        "4xl": "3840px",
        // => @media (min-width: 3840x2160px) { ... }
      },
      boxShadow: {
        common: "0px 0px 10px 0px rgba(0,0,0,0.30)",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
};
