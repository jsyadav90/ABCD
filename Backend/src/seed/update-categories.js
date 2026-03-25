import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import dns from "dns";

// Fix for ECONNREFUSED DNS issue by using Google DNS
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (error) {
  console.warn("Could not set custom DNS servers:", error.message);
}

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const { default: connectDB } = await import("../config/db.js");
const { AssetCategory } = await import("../models/assetcategory.model.js");

async function updateCategoryNames() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("Missing MONGO_URI");
      process.exit(1);
    }

    await connectDB();

    const updates = [
      { code: "fixed", newName: "Fixed Assets" },
      { code: "peripheral", newName: "Peripherals" },
      { code: "consumable", newName: "Consumables" },
      { code: "intangible", newName: "Intangible" },
    ];

    for (const update of updates) {
      const category = await AssetCategory.findOne({ name: update.code });
      if (category) {
        category.name = update.newName;
        await category.save();
        console.log(`Updated ${update.code} to ${update.newName}`);
      } else {
        console.log(`Category ${update.code} not found`);
      }
    }

    console.log("Category names updated.");
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

updateCategoryNames();