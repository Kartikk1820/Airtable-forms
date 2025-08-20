const express = require("express");
const router = express.Router();
const form = require("../controllers/formController");
const upload = require("../middleware/uploadMiddleware"); // multer middleware

// private
router.post("/", upload.single("attachment"), form.create);
router.get("/", form.list);
router.get("/:id", form.get);
router.put("/:id", form.update);
router.delete("/:id", form.remove);

// form builder
router.post("/builder/preview", form.previewForm);

// form data for frontend
router.get("/:id/schema", form.getFormSchema);
router.post("/:id/visible-fields", form.getVisibleFields);
router.post("/:id/validate", form.validateSubmission);

// form submissions
router.get("/:id/submissions", form.getSubmissions);

// public
router.get("/public/:slug", form.publicForm);
router.post("/public/:slug/submit", upload.single("attachment"), form.submit);

module.exports = router;
