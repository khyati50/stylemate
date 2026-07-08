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
  const [filter, setFilter] = useState({
    category: "",
    colors: "",
    style: "",
    occasions: "",
    seasons: "",
  });
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

  function getUniqueValues(property) {
    const values = wardrobe.flatMap((item) => item[property]);
    return [...new Set(values)];
  }
  const uniqueCategories = getUniqueValues("category");
  const uniqueStyle = getUniqueValues("style");
  const uniqueColour = getUniqueValues("colors");
  const uniqueSeasons = getUniqueValues("seasons");
  const uniqueOccasions = getUniqueValues("occasions");
  const filteredWardrobe = wardrobe.filter((item) => {
    const categoryMatch =
      filter.category === "" || item.category === filter.category;

    const styleMatch = filter.style === "" || item.style === filter.style;

    const colorMatch =
      filter.colors === "" || item.colors.includes(filter.colors);

    const seasonMatch =
      filter.seasons === "" || item.seasons.includes(filter.seasons);

    const occasionMatch =
      filter.occasions === "" || item.occasions.includes(filter.occasions);

    return (
      categoryMatch && styleMatch && colorMatch && seasonMatch && occasionMatch
    );
  });

  console.log(filter);
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

      <select
        value={filter.category}
        onChange={(event) =>
          setFilter({ ...filter, category: event.target.value })
        }
      >
        <option value="">All Categories</option>
        {uniqueCategories.map((category) => (
          <option key={category}>{category}</option>
        ))}
      </select>

      <select
        value={filter.style}
        onChange={(event) =>
          setFilter({ ...filter, style: event.target.value })
        }
      >
        <option value="">All Styles</option>
        {uniqueStyle.map((style) => (
          <option key={style} value={style}>
            {style}
          </option>
        ))}
      </select>

      <select
        value={filter.colors}
        onChange={(event) =>
          setFilter({ ...filter, colors: event.target.value })
        }
      >
        <option value="">All colors</option>
        {uniqueColour.map((color) => (
          <option key={color} value={color}>
            {color}
          </option>
        ))}
      </select>

      <select
        value={filter.seasons}
        onChange={(event) =>
          setFilter({
            ...filter,
            seasons: event.target.value,
          })
        }
      >
        <option value="">All Seasons</option>

        {uniqueSeasons.map((season) => (
          <option key={season} value={season}>
            {season}
          </option>
        ))}
      </select>

      <select
        value={filter.occasions}
        onChange={(event) =>
          setFilter({
            ...filter,
            occasions: event.target.value,
          })
        }
      >
        <option value="">All Occasions</option>

        {uniqueOccasions.map((occasion) => (
          <option key={occasion} value={occasion}>
            {occasion}
          </option>
        ))}
      </select>

      <div className="wardrobe-grid">
        {filteredWardrobe.map((item) => (
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
