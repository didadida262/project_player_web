import cn from "classnames";
import { useContext } from "react";
import { BsFillMoonFill, BsFillSunFill } from "react-icons/bs";

import { ButtonCommon, EButtonType } from "@/components/ButtonCommon";
import { ThemeContext, ThemeMode } from "@/components/Theme/themeProvider";

const ButtonTheme = ({ className }: any) => {
  const { currentTheme, setCurrentTheme } = useContext(ThemeContext);
  console.log("currentTheme>>>", currentTheme);
  return (
    <div className={cn("h-[60px] px-2 py-2", className)}>
      <ButtonCommon
        type={EButtonType.SIMPLE}
        onClick={() => {
          setCurrentTheme(
            currentTheme === "Dark Mode"
              ? ThemeMode.LIGHT_MODE
              : ThemeMode.DARK_MODE,
          );
        }}
      >
        {currentTheme === "Dark Mode" ? <BsFillMoonFill /> : <BsFillSunFill />}
        <span className="ml-[8px]">{currentTheme}</span>
      </ButtonCommon>
    </div>
  );
};

export default ButtonTheme;
