import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Wardrobe from "./pages/Wardrobe";
import Recommendation from "./pages/Recommendation";
import PublicRoute from "./components/PublicRoute";
import History from "./pages/History";
import GapAnalysis from "./pages/GapAnalysis";
import Preferences from "./pages/Preferences";
import Twinning from "./pages/Twinning";
import Chat from "./pages/Chat";
import PackingCapsule from "./pages/PackingCapsule";
import ShoppingAdvisor from "./pages/ShoppingAdvisor";
import MobileBottomNav from "./components/MobileBottomNav";

function App() {
  return (
    <>
      <Routes>
      <Route path="/" element={<Landing />} />
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

      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/gap-analysis" element={<ProtectedRoute><GapAnalysis /></ProtectedRoute>} />
      <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />
      <Route path="/twinning" element={<ProtectedRoute><Twinning /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/capsule" element={<ProtectedRoute><PackingCapsule /></ProtectedRoute>} />
      <Route path="/shopping" element={<ProtectedRoute><ShoppingAdvisor /></ProtectedRoute>} />
      </Routes>
      <MobileBottomNav />
    </>
  );
}

export default App;
