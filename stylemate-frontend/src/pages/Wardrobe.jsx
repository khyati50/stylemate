import "../styles/Wardrobe.css";
import { useState, useEffect } from "react";

function Wardrobe() {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    colors: "",
    style: "",
    imageUrl: "",
    occasions: "",
    seasons: "",
  });

  const [message, setMessage] = useState("");
  const [editId, setEditId] = useState(null);
  const [wardrobe, setWardrobe] = useState([]);
  async function GetWardrobe() {
    const token = localStorage.getItem("token");
    const response = await fetch(
      "http://localhost:5000/api/clothing/my-wardrobe",
      {
        method: "GET",
        headers: {
          authorization: token,
        },
      },
    );
    const data = await response.json();
    setWardrobe(data.wardrobe);
  }

  useEffect(() => {
    GetWardrobe();
  }, []);

  async function HandleAddItem() {
    const token = localStorage.getItem("token");

    const response = await fetch(
      "http://localhost:5000/api/clothing/addClothes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          colors: formData.colors.split(",").map((c) => c.trim()),
          style: formData.style,
          imageUrl: formData.imageUrl,
          occasions: formData.occasions.split(",").map((o) => o.trim()),
          seasons: formData.seasons.split(",").map((s) => s.trim()),
        }),
      },
    );

    const data = await response.json();

    setMessage(data.message);
    if (response.ok) {
      GetWardrobe();
    }
    setFormData({
      name: "",
      category: "",
      colors: "",
      style: "",
      imageUrl: "",
      occasions: "",
      seasons: "",
    });
  }

  async function HandleDeleteItem(id) {
    const token = localStorage.getItem("token");
    const response = await fetch(`http://localhost:5000/api/clothing/${id}`, {
      method: "DELETE",
      headers: {
        authorization: token,
      },
    });
    const data = await response.json();
    setMessage(data.message);
    if (response.ok) {
      GetWardrobe();
    }
  }

  async function HandleUpdateItem() {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `http://localhost:5000/api/clothing/${editId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: token,
        },
        body: JSON.stringify({
          name: formData.name,
          category: formData.category,
          colors: formData.colors.split(",").map((c) => c.trim()),
          style: formData.style,
          imageUrl: formData.imageUrl,
          occasions: formData.occasions.split(",").map((o) => o.trim()),
          seasons: formData.seasons.split(",").map((s) => s.trim()),
        }),
      },
    );

    const data = await response.json();

    setMessage(data.message);

    if (response.ok) {
      GetWardrobe();

      setEditId(null);

      setFormData({
        name: "",
        category: "",
        colors: "",
        style: "",
        imageUrl: "",
        occasions: "",
        seasons: "",
      });
    }
  }
  return (
    <div className="wardrobe-page">
      <h1>Wardrobe</h1>

      <div className="wardrobe-form">
        <input
          type="text"
          placeholder="Clothing Name"
          value={formData.name}
          onChange={(event) =>
            setFormData({
              ...formData,
              name: event.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Category"
          value={formData.category}
          onChange={(event) =>
            setFormData({
              ...formData,
              category: event.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Colors"
          value={formData.colors}
          onChange={(event) =>
            setFormData({
              ...formData,
              colors: event.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Style"
          value={formData.style}
          onChange={(event) =>
            setFormData({
              ...formData,
              style: event.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Image URL"
          value={formData.imageUrl}
          onChange={(event) =>
            setFormData({
              ...formData,
              imageUrl: event.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="seasons"
          value={formData.seasons}
          onChange={(event) =>
            setFormData({ ...formData, seasons: event.target.value })
          }
        />

        <input
          type="text"
          placeholder="occasions"
          value={formData.occasions}
          onChange={(event) =>
            setFormData({ ...formData, occasions: event.target.value })
          }
        />

        <button onClick={editId === null ? HandleAddItem : HandleUpdateItem}>
          {editId === null ? "Add Item" : "Update Item"}
        </button>
      </div>

      {message && <p>{message}</p>}

      <div className="wardrobe-grid">
        {wardrobe.map((item) => (
          <div className="wardrobe-card" key={item.id}>
            <h3>{item.name}</h3>
            <p>{item.category}</p>
            <p>{item.colors.join(",")}</p>
            <p>{item.style}</p>
            <img src={item.imageUrl} alt={item.name} width="150" />
            <button onClick={() => HandleDeleteItem(item.id)}>Delete</button>
            <button
              onClick={() => {
                setEditId(item.id);
                setFormData({
                  name: item.name,
                  category: item.category,
                  colors: Array.isArray(item.colors)
                    ? item.colors.join(", ")
                    : "",
                  style: item.style,
                  imageUrl: item.imageUrl,
                  seasons: Array.isArray(item.seasons)
                    ? item.seasons.join(", ")
                    : "",
                  occasions: Array.isArray(item.occasions)
                    ? item.occasions.join(", ")
                    : "",
                });
              }}
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Wardrobe;
