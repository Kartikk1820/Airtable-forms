const conditionalLogicService = require("./conditionalLogicService");

const formRendererService = {
  // Generate form schema for React frontend consumption
  generateFormSchema: (form, includeConditionalLogic = true) => {
    const schema = {
      id: form._id,
      title: form.title,
      slug: form.slug,
      fields: form.fields.map((field) => ({
        id: field.id,
        label: field.label,
        type: field.type,
        required: field.required,
        options: field.options,
        airtableFieldId: field.airtableFieldId,
        ...(includeConditionalLogic &&
          field.visibleIf && { visibleIf: field.visibleIf }),
      })),
      dependencies: includeConditionalLogic
        ? conditionalLogicService.getFieldDependencies(form.fields)
        : {},
    };

    return schema;
  },

  // Get visible fields for React frontend (for conditional logic)
  getVisibleFields: (form, formData = {}) => {
    return conditionalLogicService.getVisibleFields(form.fields, formData);
  },

  // Validate form submission data
  validateSubmission: (form, submissionData) => {
    try {
      console.log("validateSubmission called with:", {
        formId: form._id,
        formFields: form.fields?.length || 0,
        submissionDataKeys: Object.keys(submissionData || {}),
      });

      if (!form.fields || !Array.isArray(form.fields)) {
        console.error("Form fields is not an array:", form.fields);
        return {
          isValid: false,
          errors: ["Form structure is invalid - no fields found"],
        };
      }

      const errors = [];
      const visibleFields = conditionalLogicService.getVisibleFields(
        form.fields,
        submissionData
      );

      console.log(
        "Visible fields:",
        visibleFields.map((f) => ({
          id: f.id,
          label: f.label,
          required: f.required,
        }))
      );

      visibleFields.forEach((field) => {
        console.log(`Validating field: ${field.id} (${field.label})`);

        if (field.required) {
          const value = submissionData[field.id];
          console.log(`Field ${field.id} is required, value:`, value);

          if (value === undefined || value === null || value === "") {
            const errorMsg = `${field.label || field.id} is required`;
            console.log(`Adding error: ${errorMsg}`);
            errors.push(errorMsg);
          }
        }

        // Type-specific validation
        if (submissionData[field.id] !== undefined) {
          const value = submissionData[field.id];
          console.log(
            `Validating field ${field.id} with value:`,
            value,
            "type:",
            field.type
          );

          switch (field.type) {
            case "single_select":
              if (field.options && Array.isArray(field.options)) {
                if (!field.options.includes(value)) {
                  const errorMsg = `${
                    field.label || field.id
                  } has an invalid option: ${value}`;
                  console.log(`Adding error: ${errorMsg}`);
                  errors.push(errorMsg);
                }
              }
              break;

            case "multi_select":
              if (field.options && Array.isArray(field.options)) {
                // Handle both array and string inputs for multi_select
                let valuesToCheck = [];
                if (Array.isArray(value)) {
                  valuesToCheck = value;
                } else if (typeof value === "string") {
                  // Split comma-separated string and clean it
                  valuesToCheck = value
                    .replace(/[\[\]]/g, "") // Remove [ and ]
                    .replace(/"/g, "") // Remove quotes
                    .split(",") // Split by comma
                    .map((tag) => tag.trim()) // Trim whitespace
                    .filter((tag) => tag.length > 0); // Remove empty tags
                }

                // Check if all values are valid options
                const invalidValues = valuesToCheck.filter(
                  (val) => !field.options.includes(val)
                );
                if (invalidValues.length > 0) {
                  const errorMsg = `${
                    field.label || field.id
                  } has invalid options: ${invalidValues.join(
                    ", "
                  )}. Valid options are: ${field.options.join(", ")}`;
                  console.log(`Adding error: ${errorMsg}`);
                  errors.push(errorMsg);
                }
              }
              break;
          }
        }
      });

      console.log("Validation complete. Errors:", errors);

      return {
        isValid: errors.length === 0,
        errors,
        fieldCount: form.fields.length,
        visibleFieldCount: visibleFields.length,
        submissionFieldCount: Object.keys(submissionData || {}).length,
      };
    } catch (error) {
      console.error("Error in validateSubmission:", error);
      return {
        isValid: false,
        errors: [`Validation error: ${error.message}`],
        error: error.message,
      };
    }
  },

  // Get field dependencies for React frontend
  getFieldDependencies: (form) => {
    return conditionalLogicService.getFieldDependencies(form.fields);
  },

  // Evaluate single condition for React frontend
  evaluateCondition: (condition, formData) => {
    return conditionalLogicService.evaluateCondition(condition, formData);
  },
};

module.exports = formRendererService;
