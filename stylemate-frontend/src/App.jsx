import "./App.css";
import { Routes, Route } from "react-router-dom";

import Landing from "./pages/Landing";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Wardrobe from "./pages/Wardrobe";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/Register" element={<Register />} />
      <Route path="/Login" element={<Login />} />
      <Route path="/Wardrobe" element={<Wardrobe />} />
    </Routes>
  );
}

export default App;
