import { MotionConfig } from "motion/react";
import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router";
import { Layout } from "./components/Layout";
import "./index.css";
import Overview from "./pages/Overview";

const Paper = lazy(() => import("./pages/Paper"));
const Presentation = lazy(() => import("./pages/Presentation"));
const Requirements = lazy(() => import("./pages/Requirements"));
const Traceability = lazy(() => import("./pages/Traceability"));
const Diagrams = lazy(() => import("./pages/Diagrams"));
const Modules = lazy(() => import("./pages/Modules"));
const Tests = lazy(() => import("./pages/Tests"));
const OpenItems = lazy(() => import("./pages/OpenItems"));
const Schedule = lazy(() => import("./pages/Schedule"));
const Wireframes = lazy(() => import("./pages/Wireframes"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Downloads = lazy(() => import("./pages/Downloads"));

const Loading = () => <p className="text-muted">Loading…</p>;
const page = (el: React.ReactNode) => <Suspense fallback={<Loading />}>{el}</Suspense>;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* "user": transform animations are switched off when prefers-reduced-motion is set */}
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Overview />} />
            <Route path="paper" element={page(<Paper />)} />
            <Route path="presentation" element={page(<Presentation />)} />
            <Route path="requirements" element={page(<Requirements />)} />
            <Route path="traceability" element={page(<Traceability />)} />
            <Route path="diagrams" element={page(<Diagrams />)} />
            <Route path="modules" element={page(<Modules />)} />
            <Route path="tests" element={page(<Tests />)} />
            <Route path="open-items" element={page(<OpenItems />)} />
            <Route path="schedule" element={page(<Schedule />)} />
            <Route path="dashboard" element={page(<Dashboard />)} />
            <Route path="wireframes" element={page(<Wireframes />)} />
            <Route path="downloads" element={page(<Downloads />)} />
            <Route path="*" element={<p>Page not found.</p>} />
          </Route>
        </Routes>
      </HashRouter>
    </MotionConfig>
  </StrictMode>,
);
