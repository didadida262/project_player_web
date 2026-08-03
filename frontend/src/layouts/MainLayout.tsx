// src/layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import HeaderComponent from "@/components/HeaderComponent";
export default function MainLayout() {
  return (
    <div className="relative h-screen w-screen text-white">
      <div className="w-full h-full flex flex-col justify-between items-center">
        <div className="app-header w-full shrink-0">
          <HeaderComponent />
        </div>
        <div className="app-shell-main w-full h-[calc(100%-3.5rem)] flex justify-between items-center">
          <Outlet />
        </div>
      </div>
      <div
        className="app-version pointer-events-none absolute bottom-1.5 left-2 z-20 text-[11px] font-mono tracking-wide text-white/35 select-none"
        aria-hidden
      >
        v{__APP_VERSION__}
      </div>
    </div>
  );
}
