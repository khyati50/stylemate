const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const { Op } = require("sequelize");
const db = require("./config/db");
const User = require("./models/User");
const ClothingItem = require("./models/ClothingItem");

const UPLOADS_DIR = path.resolve(__dirname, "uploads");

// Download helper with redirects and fallback
const downloadFile = (url, destPath) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    const client = url.startsWith("https") ? https : http;

    const request = client.get(url, (response) => {
      // Handle redirects (HTTP 301, 302, 307, 308)
      if (
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location
      ) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        return reject(
          new Error(`Failed to download ${url}: status code ${response.statusCode}`)
        );
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          const stats = fs.statSync(destPath);
          if (stats.size < 1000) {
            fs.unlinkSync(destPath);
            return reject(new Error("File too small"));
          }
          resolve(destPath);
        });
      });
    });

    request.on("error", (err) => {
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });

    request.setTimeout(10000, () => {
      request.destroy();
      file.close();
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(new Error("Request timeout"));
    });
  });
};

const ensureImageFile = async (item) => {
  const destPath = path.join(__dirname, item.imageUrl);

  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000) {
    console.log(`Image already exists: ${item.imageUrl}`);
    return;
  }

  if (item.downloadUrl) {
    try {
      console.log(`Downloading ${item.name} from ${item.downloadUrl}...`);
      await downloadFile(item.downloadUrl, destPath);
      console.log(`Downloaded ${item.name} -> ${item.imageUrl}`);
      return;
    } catch (err) {
      console.warn(`Download failed for ${item.name}: ${err.message}. Using fallback.`);
    }
  }

  // Fallback to existing local image
  if (item.fallbackFile) {
    const fallbackPath = path.join(UPLOADS_DIR, item.fallbackFile);
    if (fs.existsSync(fallbackPath)) {
      fs.copyFileSync(fallbackPath, destPath);
      console.log(`Copied fallback ${item.fallbackFile} -> ${item.imageUrl}`);
      return;
    }
  }

  console.warn(`No fallback available for ${item.imageUrl}`);
};

const user1Pieces = [
  {
    name: "Little Black Dress",
    category: "Full Body",
    colors: ["black"],
    styles: ["formal", "smart", "party", "chic"],
    occasions: ["date", "party", "dinner", "casual"],
    seasons: ["all"],
    imageUrl: "uploads/coord-user1-black-dress.jpg",
    downloadUrl:
      "https://images.unsplash.com/photo-1539008835657-9e8e9680c956?w=600&auto=format&fit=crop&q=80",
    fallbackFile: "1785575724829-pink dress.jpeg",
  },
  {
    name: "Emerald Green Satin Top",
    category: "Top",
    colors: ["green", "emerald"],
    styles: ["smart", "party"],
    occasions: ["date", "party", "dinner", "casual"],
    seasons: ["all"],
    imageUrl: "uploads/coord-user1-emerald-satin-top.jpg",
    downloadUrl:
      "https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=600&auto=format&fit=crop&q=80",
    fallbackFile: "1785608620278-green_tshirt.jpg",
  },
  {
    name: "High-Waist White Trousers",
    category: "Bottom",
    colors: ["white"],
    styles: ["smart", "formal"],
    occasions: ["date", "dinner", "cafe", "party", "casual"],
    seasons: ["all"],
    imageUrl: "uploads/coord-user1-white-trousers.jpg",
    downloadUrl:
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80",
    fallbackFile: "testuser-beige-chinos.jpg",
  },
  {
    name: "Burgundy Pleated Skirt",
    category: "Bottom",
    colors: ["burgundy", "maroon"],
    styles: ["smart", "party"],
    occasions: ["date", "party", "dinner", "casual"],
    seasons: ["all"],
    imageUrl: "uploads/coord-user1-burgundy-skirt.jpg",
    downloadUrl:
      "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=600&auto=format&fit=crop&q=80",
    fallbackFile: "1785609204582-white skirts.jpeg",
  },
  {
    name: "Nude Strappy Block Heels",
    category: "Footwear",
    colors: ["nude", "beige"],
    styles: ["smart", "formal", "party"],
    occasions: ["date", "party", "wedding", "dinner", "casual"],
    seasons: ["all"],
    imageUrl: "uploads/coord-user1-nude-heels.jpg",
    downloadUrl:
      "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80",
    fallbackFile: "1785609855928-peep toe heels.jpeg",
  },
];

const user2Pieces = [
  {
    name: "Black Textured Cuban Collar Shirt",
    category: "Top",
    colors: ["black"],
    styles: ["smart", "party", "casual"],
    occasions: ["date", "dinner", "party", "casual"],
    seasons: ["all"],
    imageUrl: "uploads/coord-user2-black-cuban-shirt.jpg",
    downloadUrl:
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
    fallbackFile: "1785169935267-black_shirt.jpeg",
  },
  {
    name: "Burgundy Knit Polo",
    category: "Top",
    colors: ["burgundy", "maroon"],
    styles: ["smart", "casual"],
    occasions: ["date", "dinner", "casual", "party"],
    seasons: ["all"],
    imageUrl: "uploads/coord-user2-burgundy-knit-polo.jpg",
    downloadUrl:
      "https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600&auto=format&fit=crop&q=80",
    fallbackFile: "testuser-navy-polo.jpg",
  },
  {
    name: "Off-White Slim Chinos",
    category: "Bottom",
    colors: ["cream", "white"],
    styles: ["smart", "casual"],
    occasions: ["date", "summer", "dinner", "casual", "party"],
    seasons: ["all"],
    imageUrl: "uploads/coord-user2-offwhite-chinos.jpg",
    downloadUrl:
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80",
    fallbackFile: "testuser-beige-chinos.jpg",
  },
  {
    name: "Suede Tan Loafers",
    category: "Footwear",
    colors: ["tan", "brown"],
    styles: ["smart", "formal", "casual"],
    occasions: ["date", "dinner", "casual", "party"],
    seasons: ["all"],
    imageUrl: "uploads/coord-user2-tan-loafers.jpg",
    downloadUrl:
      "https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&auto=format&fit=crop&q=80",
    fallbackFile: "testuser-tan-loafers.jpg",
  },
  {
    name: "Navy Casual Bomber Jacket",
    category: "Outerwear",
    colors: ["navy", "blue"],
    styles: ["smart", "casual"],
    occasions: ["date", "night out", "casual", "party"],
    seasons: ["all"],
    imageUrl: "uploads/coord-user2-navy-bomber.jpg",
    downloadUrl:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    fallbackFile: "testuser-denim-jacket.jpg",
  },
];

async function seed() {
  try {
    await db.authenticate();
    console.log("Database connected successfully.");

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    // Find User 1 (email khyatianand1134 or id 7)
    let user1 = await User.findOne({
      where: {
        [Op.or]: [{ id: 7 }, { email: "khyatianand1134" }],
      },
    });
    if (!user1) {
      user1 = await User.findOne({
        where: { email: { [Op.like]: "%khyati%" } },
      });
    }
    if (!user1) {
      user1 = await User.findByPk(1);
    }

    // Find User 2 (email test@gmail.com or id 8)
    let user2 = await User.findOne({
      where: {
        [Op.or]: [{ id: 8 }, { email: "test@gmail.com" }],
      },
    });
    if (!user2) {
      user2 = await User.findOne({
        where: { email: { [Op.like]: "%test%" } },
      });
    }
    if (!user2) {
      user2 = await User.findByPk(2);
    }

    if (!user1 || !user2) {
      throw new Error(`Users not found. User1: ${user1?.id}, User2: ${user2?.id}`);
    }

    console.log(
      `Found User 1: ID ${user1.id} (${user1.username}, ${user1.email})`
    );
    console.log(
      `Found User 2: ID ${user2.id} (${user2.username}, ${user2.email})`
    );

    // Seed User 1 pieces
    console.log("\n--- Seeding User 1 Pieces ---");
    for (const piece of user1Pieces) {
      await ensureImageFile(piece);

      const [item, created] = await ClothingItem.findOrCreate({
        where: { userId: user1.id, name: piece.name },
        defaults: {
          userId: user1.id,
          name: piece.name,
          category: piece.category,
          colors: piece.colors,
          styles: piece.styles,
          occasions: piece.occasions,
          seasons: piece.seasons,
          imageUrl: piece.imageUrl,
          status: "available",
        },
      });

      if (!created) {
        await item.update({
          category: piece.category,
          colors: piece.colors,
          styles: piece.styles,
          occasions: piece.occasions,
          seasons: piece.seasons,
          imageUrl: piece.imageUrl,
          status: "available",
        });
        console.log(`Updated: ${piece.name} (ID: ${item.id})`);
      } else {
        console.log(`Created: ${piece.name} (ID: ${item.id})`);
      }
    }

    // Seed User 2 pieces
    console.log("\n--- Seeding User 2 Pieces ---");
    for (const piece of user2Pieces) {
      await ensureImageFile(piece);

      const [item, created] = await ClothingItem.findOrCreate({
        where: { userId: user2.id, name: piece.name },
        defaults: {
          userId: user2.id,
          name: piece.name,
          category: piece.category,
          colors: piece.colors,
          styles: piece.styles,
          occasions: piece.occasions,
          seasons: piece.seasons,
          imageUrl: piece.imageUrl,
          status: "available",
        },
      });

      if (!created) {
        await item.update({
          category: piece.category,
          colors: piece.colors,
          styles: piece.styles,
          occasions: piece.occasions,
          seasons: piece.seasons,
          imageUrl: piece.imageUrl,
          status: "available",
        });
        console.log(`Updated: ${piece.name} (ID: ${item.id})`);
      } else {
        console.log(`Created: ${piece.name} (ID: ${item.id})`);
      }
    }

    console.log("\nAll coordinated pieces seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding error:", error);
    process.exit(1);
  }
}

seed();
