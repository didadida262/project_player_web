import { ToastContainer } from "react-toastify";
import ErrorBoundary from "@/ErrorBoundary";
import "react-toastify/dist/ReactToastify.css";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router/index";

function App() {
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
