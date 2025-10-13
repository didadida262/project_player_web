import ReactDOM from "react-dom/client";

import { I18nextProvider } from "@/i18n";
import { ThemeProvider } from "@/components/Theme/themeProvider.tsx";

import App from "./App.tsx";
import "./global.css";
import React from "react";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* 你的应用内容 */}
    <ThemeProvider>
      <I18nextProvider>
        <App />
      </I18nextProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
