// src/layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import HeaderComponent from "@/components/HeaderComponent";
import MenuComponent from "@/components/Menu/MenuComponent";

export default function MainLayout() {
  return (
    <div className="h-screen w-screen text-white">
      <div className="w-full h-full flex flex-col justify-between items-center">
        <HeaderComponent />
        <div className="w-full h-[calc(100%-80px)] flex justify-between items-center">
          <Outlet /> {/* 子路由内容会渲染在这里 */}
        </div>
      </div>
    </div>
  );
}
