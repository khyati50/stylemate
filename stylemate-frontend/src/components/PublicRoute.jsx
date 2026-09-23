import { Navigate } from "react-router-dom";
import { isTokenValid } from "../utils/auth";

function PublicRoute({ children }) {
  const token = localStorage.getItem("token");

  if (isTokenValid(token)) {
    return <Navigate to="/wardrobe" replace />;
  }

  return children;
}

export default PublicRoute;
