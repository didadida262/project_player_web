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
        <div className="app-shell-main w-full h-[calc(100%-72px)] flex justify-between items-center">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
