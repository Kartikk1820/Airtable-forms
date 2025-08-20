import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
  const [forms, setForms] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Dashboard — Airtable Forms";
    fetchForms();
  }, []);

  const fetchForms = () => {
    api
      .get("/forms")
      .then((r) => setForms(r.data))
      .catch(() => {});
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this form? This cannot be undone.")) return;
    try {
      await api.delete(`/forms/${id}`);
      fetchForms();
    } catch (e) {
      alert(e.response?.data?.error || "Failed to delete form");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <button
            onClick={() => navigate("/builder")}
            className="px-3 py-2 bg-black text-white rounded-md"
          >
            Create Form
          </button>
        </div>

        <div className="bg-white rounded-lg shadow divide-y">
          <div className="p-4 font-medium">Saved Forms</div>
          {forms.length === 0 && (
            <div className="p-4 text-gray-500">No forms yet.</div>
          )}
          {forms.map((f) => (
            <div key={f._id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium">{f.title || f.slug}</div>
                <div className="text-sm text-gray-500">Slug: {f.slug}</div>
              </div>
              <div className="flex items-center gap-3">
                <Link className="text-blue-600" to={`/builder/${f._id}`}>
                  Edit
                </Link>
                <Link className="text-green-600" to={`/form/${f.slug}`}>
                  Open
                </Link>
                <button
                  className="text-red-600"
                  onClick={() => onDelete(f._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
