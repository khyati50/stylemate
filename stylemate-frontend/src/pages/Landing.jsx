import { Link } from "react-router-dom";
import "../styles/Landing.css";

function Landing() {
  return (
    <div className="landing-page">
      <h1>StyleMate</h1>

      <p>Your smart wardrobe assistant</p>

      <div className="auth-buttons">
        <Link to="/login">
          <button>Login</button>
        </Link>

        <Link to="/register">
          <button>Register</button>
        </Link>
      </div>
    </div>
  );
}

export default Landing;
