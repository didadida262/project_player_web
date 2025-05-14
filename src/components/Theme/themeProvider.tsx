/*
 * @Description:
 * @Author: didadida262
 * @Date: 2024-04-23 11:19:35
 * @LastEditors: didadida262
 * @LastEditTime: 2024-07-30 10:54:26
 */
import React, { createContext, useEffect, useState } from "react";

export enum ThemeMode {
  DARK_MODE = "Dark Mode",
  LIGHT_MODE = "Light Mode",
}

const darkModeStyles = [
  /* 字体色 */
  { key: "--text-primary-color", value: "#FFFFFF" },
  { key: "--text-second-color", value: "#D1D5DA" },
  { key: "--text-third-color", value: "#E1E4E8" },
  { key: "--text-fourth-color", value: "#D1D5DA" },
  { key: "--text-fifth-color", value: "#959DA5" },
  { key: "--text-sixth-color", value: "#CED3DB" },
  { key: "--text-seventh-color", value: "#95A0AB" },
  { key: "--text-eight-color", value: "#D77915" },
  { key: "--text-nine-color", value: "#D1D5DAB2" },

  /* 背景色 */
  { key: "--bg-primary-color", value: "#121416" },
  { key: "--bg-secondary-color", value: "#2D343E" },
  { key: "--bg-third-color", value: "#202329" },
  { key: "--bg-fourth-color", value: "#146EF5" },
  { key: "--bg-fifth-color", value: "#1AB13F" },
  { key: "--bg-six-color", value: "#0366D6" },
  { key: "--bg-seven-color", value: "#252629" },
  { key: "--bg-eight-color", value: "#25272D" },
  { key: "--bg-nine-color", value: "#D779150D" },
  { key: "--bg-ten-color", value: "#141519" },
  { key: "--bg-eleven-color", value: "#000000" },

  /* 边框色 */

  { key: "--border-first-color", value: "#262B33" },
  { key: "--border-second-color", value: "#383B45" },
  { key: "--border-third-color", value: "#D7791599" },
  { key: "--border-four-color", value: "#4A4F59" },
];
const lightModeStyles = [
  /* 字体色 */
  { key: "--text-primary-color", value: "#525253" },
  { key: "--text-second-color", value: "#D1D5DA" },
  { key: "--text-third-color", value: "#E1E4E8" },
  { key: "--text-fourth-color", value: "#D1D5DA" },
  { key: "--text-fifth-color", value: "#959DA5" },
  { key: "--text-sixth-color", value: "#CED3DB" },
  { key: "--text-seventh-color", value: "#95A0AB" },
  { key: "--text-eight-color", value: "#D77915" },
  { key: "--text-nine-color", value: "#D1D5DAB2" },

  /* 背景色 */
  { key: "--bg-primary-color", value: "#F0F1F2" },
  { key: "--bg-secondary-color", value: "#D0E3F1" },
  { key: "--bg-third-color", value: "#202329" },
  { key: "--bg-fourth-color", value: "#146EF5" },
  { key: "--bg-fifth-color", value: "#1AB13F" },
  { key: "--bg-six-color", value: "#0366D6" },
  { key: "--bg-seven-color", value: "#252629" },
  { key: "--bg-eight-color", value: "#25272D" },
  { key: "--bg-nine-color", value: "#D779150D" },
  { key: "--bg-ten-color", value: "#141519" },
  { key: "--bg-eleven-color", value: "#FFFFFF" },

  /* 边框色 */
  { key: "--border-first-color", value: "#262B33" },
  { key: "--border-second-color", value: "#383B45" },
  { key: "--border-third-color", value: "#D7791599" },
  { key: "--border-four-color", value: "#4A4F59" },
];

interface ThemeContext {
  currentTheme: ThemeMode;
  setCurrentTheme: React.Dispatch<React.SetStateAction<ThemeMode>>;
}

interface PropsType {
  children?: JSX.Element;
}

export const ThemeContext = createContext({} as ThemeContext);

export const ThemeProvider = (props: PropsType) => {
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(
    ThemeMode.DARK_MODE,
  );

  useEffect(() => {
    console.log({ currentTheme });
    if (currentTheme === ThemeMode.LIGHT_MODE) {
      lightModeStyles.forEach((item) =>
        document.documentElement.style.setProperty(item.key, item.value),
      );
    }
    if (currentTheme === ThemeMode.DARK_MODE) {
      darkModeStyles.forEach((item) =>
        document.documentElement.style.setProperty(item.key, item.value),
      );
    }
  }, [currentTheme]);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setCurrentTheme,
      }}
    >
      {props.children}
    </ThemeContext.Provider>
  );
};
