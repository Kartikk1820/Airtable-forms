const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    airtableUserId: String,
    name: String,
    email: String,
    accessToken: String,
    refreshToken: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
