import { ToastContainer } from "react-toastify";
import ErrorBoundary from "@/ErrorBoundary";
import "react-toastify/dist/ReactToastify.css";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router/index";
import { ResourcesProvider } from "./provider/resource-context";

function App() {
  return (
    <ErrorBoundary>
      <ResourcesProvider>
        {/* 你的应用内容 */}
        <div className="h-screen w-screen text-[white]  ">
          <ToastContainer
            theme="light"
            autoClose={3000}
            newestOnTop={false}
            closeOnClick={true}
            rtl={false}
            draggable={false}
            pauseOnHover={false}
          />
          <RouterProvider router={router} />
        </div>
      </ResourcesProvider>
    </ErrorBoundary>
  );
}

export default App;
