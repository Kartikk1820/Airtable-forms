const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema({
  id: String,
  airtableFieldId: String,
  label: String,
  type: {
    type: String,
    enum: [
      "short_text",
      "long_text",
      "single_select",
      "multi_select",
      "attachment",
    ],
  },
  required: Boolean,
  options: [String],
  renderAs: {
    type: String,
    enum: ["dropdown", "radios", "checkboxes"],
    default: "dropdown",
  },
  visibleIf: {
    questionId: String,
    operator: String,
    value: mongoose.Schema.Types.Mixed,
  },
});

const formSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    baseId: String, //Airtable base(database) id
    tableId: String,
    title: String,
    fields: [fieldSchema],
    slug: { type: String, unique: true }, //URL-friendly identifier
  },
  { timestamps: true }
);

module.exports = mongoose.model("Form", formSchema);
