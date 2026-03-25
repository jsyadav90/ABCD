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

async function checkCategories() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("Missing MONGO_URI");
      process.exit(1);
    }

    await connectDB();

    const categories = await AssetCategory.find({});
    console.log("All categories:");
    categories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat._id}, Active: ${cat.isActive}, Deleted: ${cat.isDeleted})`);
    });

    const activeCategories = await AssetCategory.find({ isActive: true, isDeleted: false });
    console.log("\nActive categories:");
    activeCategories.forEach(cat => {
      console.log(`- ${cat.name} (ID: ${cat._id})`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkCategories();