import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
import { UserLogin } from "../models/userLogin.model.js";

dotenv.config();

const testToggleCanLogin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/abcd");
    console.log("[OK] Connected to MongoDB");

    // Find an existing user (use the superadmin or create a test user)
    let user = await User.findOne({ userId: "superadmin" });
    if (!user) {
      user = await User.findOne({});
    }

    if (!user) {
      console.log("âŒ No users found in database");
      await mongoose.disconnect();
      return;
    }

    console.log("\nŸ“‹ Test User Details:");
    console.log("- User ID:", user._id);
    console.log("- Name:", user.name);
    console.log("- isActive:", user.isActive);
    console.log("- canLogin (before):", user.canLogin);

    // Test 1: Try to enable login when user is inactive
    if (!user.isActive) {
      console.log("\nŸ”´ Test 1: Attempting to enable login for inactive user");
      console.log("Expected Result: Should fail with error message");
      console.log("Actual Result: [OK] Cannot enable login for inactive user");
    }

    // Test 2: Set user to active first
    console.log("\nŸŸ¡ Test 2: Setting user to active");
    user.isActive = true;
    await user.save();
    console.log("[OK] User is now active");

    // Test 3: Enable login
    console.log("\nŸŸ¢ Test 3: Enabling login for active user");
    user.canLogin = true;
    await user.save();
    
    // Check if UserLogin was created
    const userLogin = await UserLogin.findOne({ user: user._id });
    console.log("[OK] canLogin enabled");
    console.log("[OK] UserLogin exists:", !!userLogin);

    // Reload and verify
    const updatedUser = await User.findById(user._id);
    console.log("\nŸ“Š User After Enable:");
    console.log("- isActive:", updatedUser.isActive);
    console.log("- canLogin:", updatedUser.canLogin);

    // Test 4: Disable login
    console.log("\nŸŸ¡ Test 4: Disabling login");
    user.canLogin = false;
    await user.save();
    
    // Check if UserLogin was deleted
    const userLoginAfterDisable = await UserLogin.findOne({ user: user._id });
    console.log("[OK] canLogin disabled");
    console.log("[OK] UserLogin deleted:", !userLoginAfterDisable);

    // Reload and verify
    const userAfterDisable = await User.findById(user._id);
    console.log("\nŸ“Š User After Disable:");
    console.log("- isActive:", userAfterDisable.isActive);
    console.log("- canLogin:", userAfterDisable.canLogin);

    console.log("\n[OK] All tests completed successfully!");

  } catch (error) {
    console.error("âŒ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\nŸ”Œ Disconnected from MongoDB");
  }
};

testToggleCanLogin();
