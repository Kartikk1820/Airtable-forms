const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const connectDB = require("./config/db.js");
const MongoStore = require("connect-mongo");
const cors = require("cors");

dotenv.config();

// DB Connection
connectDB();
const app = express();

// Enable trust proxy in production so secure cookies work behind proxies
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Optional CORS for separate frontend domain
if (process.env.FRONTEND_URL) {
  app.use(
    cors({
      origin: process.env.FRONTEND_URL,
      credentials: true,
    })
  );
}

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
      // If doing cross-site (separate frontend domain), set CROSS_SITE_COOKIES=true
      secure:
        process.env.CROSS_SITE_COOKIES === "true" ||
        process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: process.env.CROSS_SITE_COOKIES === "true" ? "none" : "lax",
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
