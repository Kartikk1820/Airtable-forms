const conditionalLogicService = {
  // Evaluate if a field should be visible based on conditional logic
  evaluateCondition: (condition, formData) => {
    if (
      !condition ||
      !condition.questionId ||
      !condition.operator ||
      condition.value === undefined
    ) {
      return true; // No condition means always visible
    }

    const { questionId, operator, value } = condition;
    const answerValue = formData[questionId];

    if (answerValue === undefined) {
      return false; // If the dependent question hasn't been answered, hide this field
    }

    switch (operator) {
      case "equals":
        return answerValue === value;

      case "not_equals":
        return answerValue !== value;

      case "contains":
        if (Array.isArray(answerValue)) {
          return answerValue.includes(value);
        }
        return String(answerValue).includes(String(value));

      case "not_contains":
        if (Array.isArray(answerValue)) {
          return !answerValue.includes(value);
        }
        return !String(answerValue).includes(String(value));

      case "in":
        if (Array.isArray(value)) {
          return value.includes(answerValue);
        }
        return false;

      case "not_in":
        if (Array.isArray(value)) {
          return !value.includes(answerValue);
        }
        return true;

      case "starts_with":
        return String(answerValue).startsWith(String(value));

      case "ends_with":
        return String(answerValue).endsWith(String(value));

      case "greater_than":
        return Number(answerValue) > Number(value);

      case "less_than":
        return Number(answerValue) < Number(value);

      case "greater_than_or_equal":
        return Number(answerValue) >= Number(value);

      case "less_than_or_equal":
        return Number(answerValue) <= Number(value);

      default:
        return true; // Unknown operator, show field
    }
  },

  // Get all visible fields based on current form data
  getVisibleFields: (formFields, formData) => {
    return formFields.filter((field) => {
      if (!field.visibleIf) {
        return true; // No condition, always visible
      }
      return conditionalLogicService.evaluateCondition(
        field.visibleIf,
        formData
      );
    });
  },

  // Get field dependencies (which fields this field depends on)
  getFieldDependencies: (formFields) => {
    const dependencies = {};

    formFields.forEach((field) => {
      if (field.visibleIf && field.visibleIf.questionId) {
        const dependentField = field.visibleIf.questionId;
        if (!dependencies[dependentField]) {
          dependencies[dependentField] = [];
        }
        dependencies[dependentField].push(field.id);
      }
    });

    return dependencies;
  },

  // Validate conditional logic (check for circular dependencies)
  validateConditionalLogic: (formFields) => {
    const dependencies =
      conditionalLogicService.getFieldDependencies(formFields);
    const visited = new Set();
    const recursionStack = new Set();

    const hasCircularDependency = (fieldId) => {
      if (recursionStack.has(fieldId)) {
        return true; // Circular dependency detected
      }

      if (visited.has(fieldId)) {
        return false; // Already checked
      }

      visited.add(fieldId);
      recursionStack.add(fieldId);

      if (dependencies[fieldId]) {
        for (const dependentField of dependencies[fieldId]) {
          if (hasCircularDependency(dependentField)) {
            return true;
          }
        }
      }

      recursionStack.delete(fieldId);
      return false;
    };

    const circularFields = [];
    for (const fieldId of Object.keys(dependencies)) {
      if (hasCircularDependency(fieldId)) {
        circularFields.push(fieldId);
      }
    }

    return {
      isValid: circularFields.length === 0,
      circularFields,
      dependencies,
    };
  },
};

module.exports = conditionalLogicService;
