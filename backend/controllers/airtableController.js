const User = require("../models/User");
const airtableService = require("../services/airtableService");

const airtableController = {
  bases: async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      if (!user.accessToken) {
        return res
          .status(401)
          .json({ error: "No Airtable access token. Please re-authenticate." });
      }
      const api = airtableService(user.accessToken);
      res.json(await api.listBases());
    } catch (error) {
      console.error("Error fetching bases:", error);
      res.status(500).json({ error: "Failed to fetch bases" });
    }
  },

  tables: async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      if (!user.accessToken) {
        return res
          .status(401)
          .json({ error: "No Airtable access token. Please re-authenticate." });
      }
      const api = airtableService(user.accessToken);
      res.json(await api.listTables(req.query.baseId));
    } catch (error) {
      console.error("Error fetching tables:", error);
      res.status(500).json({ error: "Failed to fetch tables" });
    }
  },
  getTableFields: async (req, res) => {
    try {
      const user = await User.findById(req.session.userId);
      if (!user) return res.status(401).json({ error: "Not authenticated" });

      const { baseId, tableId } = req.params;

      // Validate parameters
      if (!baseId || !tableId) {
        return res.status(400).json({
          error: "Missing parameters",
          required: ["baseId", "tableId"],
          received: { baseId, tableId },
        });
      }

      console.log(
        `Fetching table fields for base: ${baseId}, table: ${tableId}`
      );

      const api = airtableService(user.accessToken);
      const tableData = await api.getTableFields(baseId, tableId);

      console.log(`Successfully fetched table data:`, {
        tableId: tableData.id,
        fieldCount: tableData.fields?.length || 0,
      });

      res.json(tableData);
    } catch (error) {
      console.error("Error fetching table fields:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        baseId: req.params.baseId,
        tableId: req.params.tableId,
      });

      // Provide specific error messages
      if (error.response?.status === 404) {
        return res.status(404).json({
          error: "Table not found",
          message:
            "The specified table could not be found. Please check the base ID and table ID.",
          baseId: req.params.baseId,
          tableId: req.params.tableId,
          suggestion:
            "Verify you have access to this base and table in Airtable",
        });
      }

      if (error.response?.status === 403) {
        return res.status(403).json({
          error: "Access denied",
          message: "You don't have permission to access this table.",
          suggestion: "Check your Airtable permissions for this base",
        });
      }

      res.status(500).json({
        error: "Failed to fetch table fields",
        message: error.message,
        suggestion:
          "Try refreshing your Airtable connection or check the base/table IDs",
      });
    }
  },
};

module.exports = airtableController;
