import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import PageLoader from "./components/PageLoader";
import MobileBottomNav from "./components/MobileBottomNav";

const Landing = lazy(() => import("./pages/Landing"));
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const Wardrobe = lazy(() => import("./pages/Wardrobe"));
const Recommendation = lazy(() => import("./pages/Recommendation"));
const History = lazy(() => import("./pages/History"));
const GapAnalysis = lazy(() => import("./pages/GapAnalysis"));
const Preferences = lazy(() => import("./pages/Preferences"));
const Twinning = lazy(() => import("./pages/Twinning"));
const Chat = lazy(() => import("./pages/Chat"));
const PackingCapsule = lazy(() => import("./pages/PackingCapsule"));
const ShoppingAdvisor = lazy(() => import("./pages/ShoppingAdvisor"));
const NotFound = lazy(() => import("./pages/NotFound"));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicRoute>
                <Landing />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/wardrobe"
            element={
              <ProtectedRoute>
                <Wardrobe />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recommendation"
            element={
              <ProtectedRoute>
                <Recommendation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gap-analysis"
            element={
              <ProtectedRoute>
                <GapAnalysis />
              </ProtectedRoute>
            }
          />
          <Route
            path="/preferences"
            element={
              <ProtectedRoute>
                <Preferences />
              </ProtectedRoute>
            }
          />
          <Route
            path="/twinning"
            element={
              <ProtectedRoute>
                <Twinning />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/capsule"
            element={
              <ProtectedRoute>
                <PackingCapsule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shopping"
            element={
              <ProtectedRoute>
                <ShoppingAdvisor />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <MobileBottomNav />
    </ErrorBoundary>
  );
}

export default App;
