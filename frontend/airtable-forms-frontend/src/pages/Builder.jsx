import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import { useNavigate, useParams } from "react-router-dom";

const SUPPORTED = [
  "singleLineText",
  "multilineText",
  "singleSelect",
  "multipleSelects",
  "multipleAttachments",
  "email",
  "phoneNumber",
];

export default function Builder() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [bases, setBases] = useState([]);
  const [tables, setTables] = useState([]);
  const [fields, setFields] = useState([]);
  const [selected, setSelected] = useState({ baseId: "", tableId: "" });
  const [form, setForm] = useState({ title: "", slug: "", fields: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Form Builder";
  }, []);

  useEffect(() => {
    api
      .get("/airtable/bases")
      .then((r) => setBases(r.data?.bases || r.data || []))
      .catch(() => setBases([]));
  }, []);

  // Load existing form for editing
  useEffect(() => {
    if (!formId) return;
    api
      .get(`/forms/${formId}`)
      .then((r) => {
        const f = r.data;
        setForm({
          title: f.title || "",
          slug: f.slug || "",
          fields: f.fields || [],
        });
        setSelected({ baseId: f.baseId || "", tableId: f.tableId || "" });
      })
      .catch(() => {});
  }, [formId]);

  useEffect(() => {
    if (!selected.baseId) return;
    api
      .get("/airtable/tables", { params: { baseId: selected.baseId } })
      .then((r) => setTables(r.data?.tables || r.data || []))
      .catch(() => setTables([]));
  }, [selected.baseId]);
  useEffect(() => {
    if (!selected.baseId || !selected.tableId) return;
    api
      .get(`/airtable/${selected.baseId}/${selected.tableId}/fields`)
      .then((r) => setFields(r.data.fields || []))
      .catch(() => setFields([]));
  }, [selected.baseId, selected.tableId]);

  const compatibleFields = useMemo(
    () => fields.filter((f) => SUPPORTED.includes(f.type)),
    [fields]
  );

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selected.tableId),
    [tables, selected.tableId]
  );

  const toggleInclude = (airtableField) => {
    const exists = form.fields.find(
      (f) => f.airtableFieldId === airtableField.id
    );
    if (exists) {
      setForm((prev) => ({
        ...prev,
        fields: prev.fields.filter(
          (f) => f.airtableFieldId !== airtableField.id
        ),
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        fields: [
          ...prev.fields,
          {
            id: crypto.randomUUID(),
            label: airtableField.name,
            required: false,
            type: mapType(airtableField.type),
            airtableFieldId: airtableField.id,
            options: extractOptions(airtableField),
            visibleIf: null,
          },
        ],
      }));
    }
  };

  const updateField = (id, patch) => {
    setForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    }));
  };

  const setVisibleRule = (id, rule) => updateField(id, { visibleIf: rule });

  const save = async () => {
    if (!selected.baseId || !selected.tableId)
      return alert("Pick base and table");
    if (!form.slug) return alert("Enter a slug");
    setLoading(true);
    try {
      const payload = {
        ...form,
        baseId: selected.baseId,
        tableId: selected.tableId,
      };
      let r;
      if (formId) {
        r = await api.put(`/forms/${formId}`, payload);
      } else {
        r = await api.post("/forms", payload);
      }
      navigate(`/form/${r.data.slug}`);
    } catch (e) {
      alert(e.response?.data?.error || "Failed to save form");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="font-semibold mb-3">Pick Base → Table</h2>
          <div className="space-y-3">
            <select
              className="w-full border rounded p-2"
              value={selected.baseId}
              onChange={(e) =>
                setSelected({ baseId: e.target.value, tableId: "" })
              }
            >
              <option value="">Select base</option>
              {Array.isArray(bases) &&
                bases.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
            </select>
            <select
              className="w-full border rounded p-2"
              value={selected.tableId}
              onChange={(e) =>
                setSelected((s) => ({ ...s, tableId: e.target.value }))
              }
            >
              <option value="">Select table</option>
              {Array.isArray(tables) &&
                tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="mt-6">
            <label className="block text-sm text-gray-600">Title</label>
            <input
              className="w-full border rounded p-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="mt-3">
            <label className="block text-sm text-gray-600">Slug</label>
            <input
              className="w-full border rounded p-2"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              placeholder="my-form"
            />
          </div>
        </section>

        <section className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="font-semibold mb-1">
            Fields{selectedTable ? ` · ${selectedTable.name}` : ""}
          </h2>
          {selectedTable && (
            <div className="text-xs text-gray-500 mb-2">
              {compatibleFields.length} compatible of {fields.length} fields
            </div>
          )}
          <div className="space-y-2">
            {compatibleFields.map((f) => {
              const included = !!form.fields.find(
                (x) => x.airtableFieldId === f.id
              );
              return (
                <div key={f.id} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-gray-500">{f.type}</div>
                    </div>
                    <button
                      className={`px-2 py-1 rounded ${
                        included
                          ? "bg-red-500 text-white hover:bg-red-600"
                          : "bg-black text-white hover:bg-gray-800"
                      }`}
                      onClick={() => toggleInclude(f)}
                    >
                      {included ? "Remove" : "Add"}
                    </button>
                  </div>

                  {included && (
                    <div className="mt-3 grid gap-2">
                      <input
                        className="border rounded p-2"
                        value={getField(form.fields, f.id)?.label || ""}
                        onChange={(e) =>
                          updateField(getField(form.fields, f.id)?.id, {
                            label: e.target.value,
                          })
                        }
                      />
                      {(f.type === "singleSelect" ||
                        f.type === "multipleSelects") && (
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-gray-600 mb-1">Render as</div>
                            <select
                              className="border rounded p-2 w-full"
                              value={
                                getField(form.fields, f.id)?.renderAs ||
                                "dropdown"
                              }
                              onChange={(e) =>
                                updateField(getField(form.fields, f.id)?.id, {
                                  renderAs: e.target.value,
                                })
                              }
                            >
                              <option value="dropdown">Dropdown</option>
                              {f.type === "singleSelect" && (
                                <option value="radios">Radios</option>
                              )}
                              {f.type === "multipleSelects" && (
                                <option value="checkboxes">Checkboxes</option>
                              )}
                            </select>
                          </div>
                          <div>
                            <div className="text-gray-600 mb-1">Choices</div>
                            <div className="text-xs text-gray-500">
                              {(f.options?.choices || [])
                                .map((c) => c.name)
                                .join(", ") || "—"}
                            </div>
                          </div>
                        </div>
                      )}
                      <label className="inline-flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={!!getField(form.fields, f.id)?.required}
                          onChange={(e) =>
                            updateField(getField(form.fields, f.id)?.id, {
                              required: e.target.checked,
                            })
                          }
                        />{" "}
                        Required
                      </label>

                      <RuleEditor
                        fieldId={getField(form.fields, f.id)?.id}
                        allFields={form.fields}
                        value={getField(form.fields, f.id)?.visibleIf}
                        onChange={setVisibleRule}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <div className="md:col-span-2 flex justify-end">
          <button
            disabled={loading}
            onClick={save}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md disabled:opacity-50"
          >
            {loading
              ? formId
                ? "Updating..."
                : "Saving..."
              : formId
              ? "Update Form"
              : "Save Form"}
          </button>
        </div>
      </div>
    </div>
  );
}

function mapType(airtableType) {
  if (airtableType === "multilineText") return "long_text";
  if (airtableType === "singleSelect") return "single_select";
  if (airtableType === "multipleSelects") return "multi_select";
  if (airtableType === "multipleAttachments") return "attachment";
  return "short_text";
}

function getField(arr, airtableFieldId) {
  return arr.find((f) => f.airtableFieldId === airtableFieldId);
}

function extractOptions(airtableField) {
  if (
    airtableField?.type === "singleSelect" ||
    airtableField?.type === "multipleSelects"
  ) {
    const choices = airtableField?.options?.choices || [];
    return choices.map((c) => c.name);
  }
  return undefined;
}

function RuleEditor({ fieldId, allFields, value, onChange }) {
  const [rule, setRule] = useState(
    value || { questionId: "", operator: "equals", value: "" }
  );
  useEffect(
    () => setRule(value || { questionId: "", operator: "equals", value: "" }),
    [value]
  );
  const options = allFields.filter((f) => f.id !== fieldId);
  const selectedQuestion = options.find((f) => f.id === rule.questionId);

  const update = (patch) => {
    const next = { ...rule, ...patch };
    setRule(next);
    onChange(fieldId, next.questionId && next.operator ? next : null);
  };

  return (
    <div className="border rounded p-2">
      <div className="text-sm font-medium mb-1">Visibility rule</div>
      <div className="grid grid-cols-3 gap-2">
        <select
          className="border rounded p-2"
          value={rule.questionId}
          onChange={(e) => update({ questionId: e.target.value })}
        >
          <option value="">Always visible</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className="border rounded p-2"
          value={rule.operator}
          onChange={(e) => update({ operator: e.target.value })}
        >
          <option value="equals">equals</option>
          <option value="not_equals">not_equals</option>
          <option value="includes">includes</option>
        </select>
        {selectedQuestion &&
        (selectedQuestion.type === "single_select" ||
          selectedQuestion.type === "multi_select") ? (
          <select
            className="border rounded p-2"
            value={rule.value}
            onChange={(e) => update({ value: e.target.value })}
          >
            <option value="">Select value</option>
            {(selectedQuestion.options || []).map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            className="border rounded p-2"
            placeholder="Value"
            value={rule.value}
            onChange={(e) => update({ value: e.target.value })}
          />
        )}
      </div>
    </div>
  );
}
