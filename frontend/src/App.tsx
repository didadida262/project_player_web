import { ToastContainer } from "react-toastify";
import ErrorBoundary from "@/ErrorBoundary";
import "react-toastify/dist/ReactToastify.css";
import { RouterProvider } from "react-router-dom";
import { router } from "@/router/index";
import { ResourcesProvider } from "./provider/resource-context";
import { GridBackground } from "./components/ui/grid-background";
import { Sparkles } from "./components/ui/sparkles";
import { FloatingParticles } from "./components/ui/floating-particles";
import { AuroraBackground } from "./components/ui/aurora-background";

function App() {
  return (
    <ErrorBoundary>
      <ResourcesProvider>
        {/* 你的应用内容 */}
        <div className="h-screen w-screen text-[white] relative overflow-hidden">
          {/* 多层次背景效果 */}
          <AuroraBackground className="absolute inset-0 z-0" />
          <GridBackground className="absolute inset-0 z-0 opacity-60" />
          <FloatingParticles className="absolute inset-0 z-0" />
          <Sparkles className="absolute inset-0 z-0 opacity-30" />
          
          <div className="relative z-10 h-full w-full">
            <ToastContainer
              theme="dark"
              autoClose={3000}
              newestOnTop={false}
              closeOnClick={true}
              rtl={false}
              draggable={false}
              pauseOnHover={false}
            />
            <RouterProvider router={router} />
          </div>
        </div>
      </ResourcesProvider>
    </ErrorBoundary>
  );
}

export default App;
