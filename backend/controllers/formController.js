const Form = require("../models/Form");
const Submission = require("../models/Submission");
const cloudinary = require("../config/cloudinary"); // import cloudinary instance
const airtableService = require("../services/airtableService");
const conditionalLogicService = require("../services/conditionalLogicService");
const formRendererService = require("../services/formRendererService");
const User = require("../models/User");

// Field type compatibility mapping
const isFieldTypeCompatible = (formType, airtableType) => {
  const typeMap = {
    short_text: ["singleLineText", "email", "phoneNumber"],
    long_text: ["multilineText"],
    single_select: ["singleSelect"],
    multi_select: ["multipleSelects"],
    attachment: ["multipleAttachments"],
  };

  return typeMap[formType]?.includes(airtableType) || false;
};

const formController = {
  create: async (req, res) => {
    try {
      let attachmentUrl = null;

      // if file is uploaded → send to cloudinary
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "form_attachments", // optional: keep things organized
        });
        attachmentUrl = result.secure_url;
      }

      // Check if form with this slug already exists
      const existingForm = await Form.findOne({ slug: req.body.slug });
      if (existingForm) {
        return res.status(400).json({
          error: "Form with this slug already exists",
          existingFormId: existingForm._id,
          slug: req.body.slug,
        });
      }

      // Validate conditional logic
      const conditionalValidation =
        conditionalLogicService.validateConditionalLogic(req.body.fields);
      if (!conditionalValidation.isValid) {
        return res.status(400).json({
          error: "Invalid conditional logic",
          details: "Circular dependencies detected",
          circularFields: conditionalValidation.circularFields,
        });
      }

      const form = await Form.create({
        ...req.body,
        attachments: attachmentUrl ? [attachmentUrl] : [], // store in array for multiple in future
        ownerId: req.session.userId,
      });

      res.json(form);
    } catch (error) {
      console.error("Form creation error:", error);
      if (error.code === 11000) {
        return res.status(400).json({
          error: "Form with this slug already exists",
          slug: req.body.slug,
        });
      }
      res.status(500).json({ error: "Failed to create form" });
    }
  },

  list: async (req, res) => {
    try {
      const forms = await Form.find({ ownerId: req.session.userId });
      res.json(forms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch forms" });
    }
  },

  get: async (req, res) => {
    try {
      const form = await Form.findById(req.params.id);
      res.json(form);
    } catch (error) {
      res.status(404).json({ error: "Form not found" });
    }
  },

  update: async (req, res) => {
    try {
      const form = await Form.findById(req.params.id);
      if (!form) return res.status(404).json({ error: "Form not found" });

      // Enforce unique slug if it changes
      if (req.body.slug && req.body.slug !== form.slug) {
        const slugOwner = await Form.findOne({ slug: req.body.slug });
        if (slugOwner && String(slugOwner._id) !== String(form._id)) {
          return res
            .status(400)
            .json({ error: "Form with this slug already exists" });
        }
      }

      // Validate conditional logic
      const conditionalValidation =
        conditionalLogicService.validateConditionalLogic(req.body.fields || []);
      if (!conditionalValidation.isValid) {
        return res.status(400).json({
          error: "Invalid conditional logic",
          details: "Circular dependencies detected",
          circularFields: conditionalValidation.circularFields,
        });
      }

      form.title = req.body.title ?? form.title;
      form.slug = req.body.slug ?? form.slug;
      form.baseId = req.body.baseId ?? form.baseId;
      form.tableId = req.body.tableId ?? form.tableId;
      form.fields = Array.isArray(req.body.fields)
        ? req.body.fields
        : form.fields;

      const saved = await form.save();
      res.json(saved);
    } catch (error) {
      console.error("Form update error:", error);
      res.status(500).json({ error: "Failed to update form" });
    }
  },

  remove: async (req, res) => {
    try {
      const deleted = await Form.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Form not found" });
      res.json({ ok: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete form" });
    }
  },

  publicForm: async (req, res) => {
    try {
      const form = await Form.findOne({ slug: req.params.slug });
      res.json(form);
    } catch (error) {
      res.status(404).json({ error: "Form not found" });
    }
  },

  // Get form schema for frontend
  getFormSchema: async (req, res) => {
    try {
      const form = await Form.findById(req.params.id);
      if (!form) {
        return res.status(404).json({ error: "Form not found" });
      }

      const schema = formRendererService.generateFormSchema(form, true);
      res.json(schema);
    } catch (error) {
      console.error("Schema generation error:", error);
      res.status(500).json({ error: "Failed to generate schema" });
    }
  },

  // New: Get visible fields for React frontend (for conditional logic)
  getVisibleFields: async (req, res) => {
    try {
      const form = await Form.findById(req.params.id);
      if (!form) {
        return res.status(404).json({ error: "Form not found" });
      }

      const { formData = {} } = req.body;
      console.log("Getting visible fields for form data:", formData);

      const visibleFields = formRendererService.getVisibleFields(
        form,
        formData
      );
      res.json({
        formId: form._id,
        visibleFields,
        totalFields: form.fields.length,
        dependencies: formRendererService.getFieldDependencies(form),
      });
    } catch (error) {
      console.error("Get visible fields error:", error);
      res.status(500).json({ error: "Failed to get visible fields" });
    }
  },

  // New: Validate form submission data
  validateSubmission: async (req, res) => {
    try {
      console.log("=== VALIDATION REQUEST START ===");
      console.log("Form ID:", req.params.id);
      console.log("Request body:", req.body);
      console.log("Request headers:", req.headers);
      console.log("Content-Type:", req.headers["content-type"]);

      // Check if request body exists
      if (!req.body || typeof req.body !== "object") {
        console.log("Request body is missing or invalid");
        return res.status(400).json({
          error: "Invalid request body",
          message: "Request body is missing or not a valid JSON object",
          received: req.body,
          contentType: req.headers["content-type"],
        });
      }

      const form = await Form.findById(req.params.id);
      if (!form) {
        console.log("Form not found");
        return res.status(404).json({ error: "Form not found" });
      }

      console.log("Form found:", {
        id: form._id,
        title: form.title,
        slug: form.slug,
        fieldCount: form.fields?.length || 0,
      });

      console.log("Form fields:", form.fields);

      const validation = formRendererService.validateSubmission(form, req.body);
      console.log("Validation result:", validation);

      console.log("=== VALIDATION REQUEST END ===");
      res.json(validation);
    } catch (error) {
      console.error("=== VALIDATION ERROR ===");
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      console.error("=== END VALIDATION ERROR ===");

      res.status(500).json({
        error: "Failed to validate submission",
        details: error.message,
        type: error.constructor.name,
      });
    }
  },

  // New: Form preview and validation
  previewForm: async (req, res) => {
    try {
      const { baseId, tableId, fields } = req.body;

      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!baseId || !tableId || !fields) {
        return res.status(400).json({
          error: "Missing required fields",
          required: ["baseId", "tableId", "fields"],
          received: { baseId, tableId, hasFields: !!fields },
        });
      }

      console.log("Previewing form with:", {
        baseId,
        tableId,
        fieldCount: fields.length,
      });

      const user = await User.findById(req.session.userId);
      if (!user || !user.accessToken) {
        return res
          .status(401)
          .json({ error: "No Airtable access token. Please re-authenticate." });
      }

      const api = airtableService(user.accessToken);
      const tableSchema = await api.getTableFields(baseId, tableId);

      const validationResults = fields.map((field) => {
        const airtableField = tableSchema.fields.find(
          (f) => f.id === field.airtableFieldId
        );
        return {
          fieldId: field.id,
          isValid: !!airtableField,
          airtableType: airtableField?.type,
          compatible: isFieldTypeCompatible(field.type, airtableField?.type),
          airtableField: airtableField,
        };
      });

      console.log("Field validation results:", validationResults);

      const conditionalValidation =
        conditionalLogicService.validateConditionalLogic(fields);
      console.log("Conditional logic validation:", conditionalValidation);

      const isValid =
        validationResults.every(
          (result) => result.isValid && result.compatible
        ) && conditionalValidation.isValid;

      res.json({
        validationResults,
        tableSchema,
        conditionalLogic: conditionalValidation,
        isValid,
        summary: {
          totalFields: fields.length,
          validFields: validationResults.filter(
            (r) => r.isValid && r.compatible
          ).length,
          invalidFields: validationResults.filter(
            (r) => !r.isValid || !r.compatible
          ).length,
          conditionalLogicValid: conditionalValidation.isValid,
        },
      });
    } catch (error) {
      console.error("Form preview validation error:", error);
      res
        .status(500)
        .json({ error: "Validation failed", details: error.message });
    }
  },

  // New: Get form submissions
  getSubmissions: async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const form = await Form.findById(req.params.id);
      if (!form || form.ownerId.toString() !== req.session.userId.toString()) {
        return res
          .status(404)
          .json({ error: "Form not found or access denied" });
      }

      const submissions = await Submission.find({ formId: req.params.id }).sort(
        { createdAt: -1 }
      );
      res.json(submissions);
    } catch (error) {
      console.error("Get submissions error:", error);
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  },

  submit: async (req, res) => {
    try {
      // Get the form details first
      const form = await Form.findOne({ slug: req.params.slug });
      if (!form) {
        return res.status(404).json({ error: "Form not found" });
      }

      // Get the form owner's Airtable access token
      const formOwner = await User.findById(form.ownerId);
      if (!formOwner || !formOwner.accessToken) {
        return res
          .status(500)
          .json({ error: "Form owner not found or no Airtable access" });
      }

      // handle file upload for submissions too
      let attachmentUrl = null;
      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: "form_submissions",
        });
        attachmentUrl = result.secure_url;
      }

      // Prepare data for Airtable using dynamic field mapping
      const fields = {};

      // Map form fields to Airtable fields dynamically
      form.fields.forEach((field) => {
        const value = req.body[field.id];
        if (value !== undefined && field.airtableFieldId) {
          // Handle different field types
          if (field.type === "multi_select" && typeof value === "string") {
            // Split comma-separated tags and clean them
            const tagsArray = value
              .replace(/[\[\]]/g, "") // Remove [ and ]
              .replace(/"/g, "") // Remove quotes
              .split(",") // Split by comma
              .map((tag) => tag.trim()) // Trim whitespace
              .filter((tag) => tag.length > 0); // Remove empty tags

            fields[field.airtableFieldId] = tagsArray;
          } else if (field.type === "attachment" && attachmentUrl) {
            fields[field.airtableFieldId] = [{ url: attachmentUrl }];
          } else {
            fields[field.airtableFieldId] = value;
          }
        }
      });

      console.log("Creating Airtable record with fields:", fields);
      console.log("Form details:", {
        baseId: form.baseId,
        tableId: form.tableId,
      });

      // Create record in Airtable using the form owner's access token
      try {
        const airtableApi = airtableService(formOwner.accessToken);
        const record = await airtableApi.createRecord(
          form.baseId,
          form.tableId,
          fields
        );

        console.log("Airtable record created:", record);

        // Also save submission locally
        const submissionData = {
          formId: form._id,
          answers: req.body,
          attachmentUrl: attachmentUrl,
          airtableRecordId: record.id || record.records?.[0]?.id,
        };

        const submission = await Submission.create(submissionData);

        res.json({
          message: "Submission stored successfully in Airtable and locally!",
          attachment: attachmentUrl,
          airtableRecord: record,
          localSubmission: submission,
          fields: fields,
        });
      } catch (airtableError) {
        console.error("Airtable error details:", {
          message: airtableError.message,
          response: airtableError.response?.data,
          status: airtableError.response?.status,
          fields: fields,
          baseId: form.baseId,
          tableId: form.tableId,
        });

        // Still save locally even if Airtable fails
        const submissionData = {
          formId: form._id,
          answers: req.body,
          attachmentUrl: attachmentUrl,
          airtableError: airtableError.message,
        };

        const submission = await Submission.create(submissionData);

        res.json({
          message:
            "File uploaded and saved locally, but failed to store in Airtable",
          attachment: attachmentUrl,
          localSubmission: submission,
          error: "Airtable storage failed",
          errorDetails: airtableError.message,
          fields: fields,
        });
      }
    } catch (error) {
      console.error("Form submission error:", error);
      res.status(500).json({ error: "Failed to submit form" });
    }
  },
};

module.exports = formController;
