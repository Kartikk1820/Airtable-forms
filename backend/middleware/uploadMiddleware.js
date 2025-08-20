const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary.js");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "airtable_uploads", // Cloudinary folder
    allowed_formats: ["jpg", "png", "jpeg", "pdf"], // restrict file types
  },
});

const upload = multer({ storage });

module.exports = upload;
