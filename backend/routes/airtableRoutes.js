const express = require("express");
const router = express.Router();
const airtable = require("../controllers/airtableController.js");

router.get("/bases", airtable.bases);
router.get("/tables", airtable.tables);
router.get("/:baseId/:tableId/fields", airtable.getTableFields);

module.exports = router;
