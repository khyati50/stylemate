import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Wardrobe from "./pages/Wardrobe";
import Recommendation from "./pages/Recommendation";
import PublicRoute from "./components/PublicRoute";
import History from "./pages/History";

function App() {
  return (
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

      <Route path="/history" element={<History />} />
    </Routes>
  );
}

export default App;
