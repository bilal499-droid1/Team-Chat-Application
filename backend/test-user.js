require("dotenv").config();
const mongoose = require("mongoose");

console.log("Testing User model import...");
try {
  const User = require("./models/User");
  console.log("✅ User model imported successfully");
} catch (error) {
  console.error("❌ Error importing User model:", error.message);
}
