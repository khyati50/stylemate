import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Register.css";
function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [message, setMessage] = useState("");
  async function HandleRegister() {
    if (formData.password != formData.confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setMessage("");
    console.log("Form submitted:", formData);

    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "post",
      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      }),
    });

    const data = await response.json();
    setMessage(data.message);

    if (response.ok) {
      navigate("/login");
    }
  }

  const navigate = useNavigate();

  return (
    <div className="register-page">
      <div className="register-form">
        <h1>Register</h1>
        <input
          type="text"
          placeholder="username"
          value={formData.username}
          onChange={(event) =>
            setFormData({
              ...formData,
              username: event.target.value,
            })
          }
        />
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
        <input
          type="password"
          placeholder="confirm password"
          value={formData.confirmPassword}
          onChange={(event) =>
            setFormData({ ...formData, confirmPassword: event.target.value })
          }
        />
        {message && <p>{message}</p>}
        <button onClick={HandleRegister}>register</button>
      </div>
    </div>
  );
}
export default Register;
