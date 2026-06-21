import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LandingPage } from "@/pages/LandingPage";

const WorkspaceRoute = lazy(() => import("@/pages/WorkspaceRoute"));

function WorkspaceLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <div className="text-center">
        <p className="font-heading text-3xl text-foreground">FactorFi</p>
        <p className="mt-2 text-sm text-muted-foreground">Loading financing workspace...</p>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/app/*"
        element={
          <Suspense fallback={<WorkspaceLoading />}>
            <WorkspaceRoute />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
