const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");

dotenv.config();
connectDB();

const app = express();

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Fix session configuration for OAuth flow
app.use(
  session({
    secret: process.env.SECRET || "keyboard cat",
    resave: true, // Changed to true to ensure session is saved
    saveUninitialized: true, // Changed to true to save new sessions
    cookie: {
      secure: false, // set true only in prod with HTTPS
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
    name: "connect.sid", // Explicitly set cookie name
  })
);

app.use("/api/auth/airtable", require("./routes/authRoutes"));
app.use("/api/airtable", require("./routes/airtableRoutes"));
app.use("/api/forms", require("./routes/formRoutes"));

// List all forms route for debugging
// app.get("/forms", async (req, res) => {
//   try {
//     const Form = require("./models/Form");
//     const forms = await Form.find({}).select("title slug createdAt");
//     res.json(forms);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch forms" });
//   }
// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on Port ${PORT}`);
});
