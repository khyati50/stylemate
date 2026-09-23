import { Navigate } from "react-router-dom";
import { isTokenValid } from "../utils/auth";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isTokenValid(token)) {
    return <Navigate to="/login?session=expired" replace />;
  }

  return children;
}

export default ProtectedRoute;
