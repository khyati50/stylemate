import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  async function HandleLogin() {
    setMessage("");

    const request = await fetch("http://localhost:5000/api/auth/login", {
      method: "post",
      headers: { "content-Type": "application/json" },

      body: JSON.stringify({
        email: formData.email,
        password: formData.password,
      }),
    });

    const data = await request.json();
    localStorage.setItem("token", data.token);
    if (request.ok) {
      navigate("/wardrobe");
    }
    setMessage(data.message);
  }

  const navigate = useNavigate();

  return (
    <div className="login-page">
      <div className="login-form">
        <h1>Login</h1>
        <input
          type="email"
          placeholder="email"
          value={formData.email}
          onChange={(event) =>
            setFormData({ ...formData, email: event.target.value })
          }
        />

        <input
          type="password"
          placeholder="password"
          value={formData.password}
          onChange={(event) =>
            setFormData({ ...formData, password: event.target.value })
          }
        />
        {message && <p>{message}</p>}
        <button onClick={HandleLogin}>Login</button>
      </div>
    </div>
  );
}

export default Login;
