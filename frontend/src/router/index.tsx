// src/router.js
import { createHashRouter } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import HomePage from "@/pages/HomeComponent";
import NotFoundPage from "@/components/NotFoundPage";

export const router = createHashRouter([
  {
    path: "/",
    element: <MainLayout />, // 顶层布局
    children: [
      {
        index: true,
        element: <HomePage />,
      },
    ],
  },
  // 404路由放在最后
  {
    path: "*",
    element: <NotFoundPage />, // 可以有不同于主布局的404布局
  },
]);
