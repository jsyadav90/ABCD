import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const { default: connectDB } = await import("../config/db.js");
const { Branch } = await import("../models/branch.model.js");
const { Organization } = await import("../models/organization.model.js");

async function seedBranches() {
  try {
    // Ensure MONGO URI is available
    if (!process.env.MONGO_URI) {
      console.error("Missing MONGO_URI in environment. Please set MONGO_URI in your .env file before running the seed.");
      process.exit(1);
    }

    await connectDB();

    const orgId = "6991f27977da956717ec33f5";

    // Check if organization exists
    const org = await Organization.findById(orgId);
    if (!org) {
      console.error(`Organization with ID ${orgId} not found.`);
      process.exit(1);
    }

    console.log(`Using organization: ${org.name} (${orgId})`);

    // Define branches to seed
    const appName = process.env.APP_NAME || "ABCD";
    const branchesToSeed = [
      { branchName: `${appName} East`, branchCode: `${appName.toUpperCase()}-EAST` },
      { branchName: `${appName} West`, branchCode: `${appName.toUpperCase()}-WEST` },
      { branchName: `${appName} North`, branchCode: `${appName.toUpperCase()}-NORTH` },
      { branchName: `${appName} South`, branchCode: `${appName.toUpperCase()}-SOUTH` },
      { branchName: "Center", branchCode: "CENTER" },
    ];

    // Create or update branches
    for (const branchData of branchesToSeed) {
      const existingBranch = await Branch.findOne({
        organizationId: orgId,
        branchCode: branchData.branchCode,
      });

      if (existingBranch) {
        console.log(`Branch '${branchData.name}' already exists. Skipping...`);
      } else {
        const newBranch = await Branch.create({
          organizationId: orgId,
          branchName: branchData.branchName,
          branchCode: branchData.branchCode,
          type: "SUB",
          status: "ACTIVE",
        });
        console.log(`✅ Created branch: ${newBranch.branchName} (${newBranch._id.toString()})`);
      }
    }

    console.log("\n✅ Branch seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding branches:", error.message);
    process.exit(1);
  }
}

seedBranches();
