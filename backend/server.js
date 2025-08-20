const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const MongoStore = require("connect-mongo");

dotenv.config();

// DB Connection
connectDB();
const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session Config
app.use(
  session({
    secret: process.env.SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    store:
      process.env.NODE_ENV === "production"
        ? MongoStore.create({ mongoUrl: process.env.MONGO_URI_PROD })
        : undefined, // In dev, default memory store is fine
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Routes
app.use("/api/auth/airtable", require("./routes/authRoutes"));
app.use("/api/airtable", require("./routes/airtableRoutes"));
app.use("/api/forms", require("./routes/formRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);
