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
const { AssetType } = await import("../models/assettype.model.js");

const AssetTypesData = {
  "Fixed Assets": [
    "CPU", "Monitor", "Laptop", "Printer", "Tablet", "Interactive Panel", "Projector", "Network Switch", "Router", "Firewall", "Barcode Printer", "Barcode Scanner", "Scanner", "Biometric Device", "NAS Storage"
  ],
  "Peripherals": [
    "Keyboard", "Camera", "Mouse", "Headphone"
  ],
  "Consumables": [
    "Toner", "Cable"
  ],
  "Intangible": [
    "Software License", "Domain"
  ]
};

async function seedAssetTypes() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("Missing MONGO_URI");
      process.exit(1);
    }

    await connectDB();

    for (const [categoryName, items] of Object.entries(AssetTypesData)) {
      const category = await AssetCategory.findOne({ name: categoryName });
      if (!category) {
        console.log(`Category ${categoryName} not found, skipping`);
        continue;
      }

      for (const AssetName of items) {
        const existing = await AssetType.findOne({ name: AssetName, category: category._id });
        if (existing) {
          console.log(`Item type ${AssetName} already exists for ${categoryName}`);
          continue;
        }

        const newAssetType = await AssetType.create({
          name: AssetName,
          category: category._id,
          isActive: true,
          isDeleted: false,
        });

        console.log(`Created item type: ${AssetName} for ${categoryName}`);
      }
    }

    console.log("Item types seeding completed.");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding item types:", error);
    process.exit(1);
  }
}

seedAssetTypes();
