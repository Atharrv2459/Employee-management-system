import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiSun, FiMoon, FiSunset } from "react-icons/fi";

import { API_BASE } from "../../api";

const SHIFT_TYPES = [
  { value: 'regular', label: 'Regular', icon: FiClock },
  { value: 'morning', label: 'Morning', icon: FiSun },
  { value: 'evening', label: 'Evening', icon: FiSunset },
  { value: 'night', label: 'Night', icon: FiMoon },
  { value: 'flexible', label: 'Flexible', icon: FiClock },
  { value: 'rotational', label: 'Rotational', icon: FiClock },
];

const COLORS = [
  '#3B82F6', '#22C55E', '#F59E0B', '#EF4444', '#8B5CF6', 
  '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
];

export default function ShiftTemplateManagement() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    start_time: "09:00",
    end_time: "17:00",
    break_duration_minutes: 60,
    shift_type: "regular",
    color: "#3B82F6",
    min_hours: 8,
    max_hours: 12,
    is_overnight: false,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await axios.get(`${API_BASE}/shift-schedule/templates?include_inactive=true`);
      setTemplates(res.data);
    } catch (error) {
      toast.error("Failed to fetch shift templates");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(
          `${API_BASE}/shift-schedule/templates/${selectedTemplate.id}`,
          formData,
          { headers: { Authorization: token } }
        );
        toast.success("Shift template updated");
      } else {
        await axios.post(`${API_BASE}/shift-schedule/templates`, formData, {
          headers: { Authorization: token },
        });
        toast.success("Shift template created");
      }
      setShowModal(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      code: template.code || "",
      description: template.description || "",
      start_time: template.start_time?.slice(0, 5) || "09:00",
      end_time: template.end_time?.slice(0, 5) || "17:00",
      break_duration_minutes: template.break_duration_minutes || 60,
      shift_type: template.shift_type || "regular",
      color: template.color || "#3B82F6",
      min_hours: template.min_hours || 8,
      max_hours: template.max_hours || 12,
      is_overnight: template.is_overnight || false,
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this shift template?")) return;
    try {
      await axios.delete(`${API_BASE}/shift-schedule/templates/${id}`, {
        headers: { Authorization: token },
      });
      toast.success("Shift template deleted");
      fetchTemplates();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      description: "",
      start_time: "09:00",
      end_time: "17:00",
      break_duration_minutes: 60,
      shift_type: "regular",
      color: "#3B82F6",
      min_hours: 8,
      max_hours: 12,
      is_overnight: false,
    });
    setEditMode(false);
    setSelectedTemplate(null);
  };

  const formatTime = (time) => {
    if (!time) return "-";
    return time.slice(0, 5);
  };

  const getShiftIcon = (type) => {
    const found = SHIFT_TYPES.find(t => t.value === type);
    const Icon = found?.icon || FiClock;
    return <Icon />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Shift Templates</h1>
          <p className="text-gray-500">Define reusable shift patterns</p>
        </div>
        <button
          className="btn btn-primary gap-2"
          onClick={() => { resetForm(); setShowModal(true); }}
        >
          <FiPlus /> Create Template
        </button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow">
            <FiClock className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-400">No shift templates found</p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-xl shadow-md overflow-hidden ${
                !template.is_active ? "opacity-60" : ""
              }`}
            >
              <div 
                className="h-2" 
                style={{ backgroundColor: template.color || '#3B82F6' }}
              />
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: template.color || '#3B82F6' }}
                    >
                      {getShiftIcon(template.shift_type)}
                    </span>
                    <div>
                      <h3 className="font-semibold">{template.name}</h3>
                      {template.code && (
                        <span className="badge badge-ghost badge-sm">{template.code}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(template)}>
                      <FiEdit2 />
                    </button>
                    <button
                      className="btn btn-ghost btn-xs text-error"
                      onClick={() => handleDelete(template.id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-3">
                  {template.description || "No description"}
                </p>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Start</span>
                    <p className="font-medium">{formatTime(template.start_time)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">End</span>
                    <p className="font-medium">{formatTime(template.end_time)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Break</span>
                    <p className="font-medium">{template.break_duration_minutes} min</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Type</span>
                    <p className="font-medium capitalize">{template.shift_type}</p>
                  </div>
                </div>

                {template.is_overnight && (
                  <div className="mt-2">
                    <span className="badge badge-warning badge-sm">Overnight</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              {editMode ? "Edit Shift Template" : "Create Shift Template"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label"><span className="label-text">Name *</span></label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Code</span></label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="e.g., MORNING"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  />
                </div>

                <div className="form-control col-span-2">
                  <label className="label"><span className="label-text">Description</span></label>
                  <textarea
                    className="textarea textarea-bordered"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Start Time *</span></label>
                  <input
                    type="time"
                    className="input input-bordered"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">End Time *</span></label>
                  <input
                    type="time"
                    className="input input-bordered"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Break Duration (minutes)</span></label>
                  <input
                    type="number"
                    className="input input-bordered"
                    value={formData.break_duration_minutes}
                    onChange={(e) => setFormData({ ...formData, break_duration_minutes: parseInt(e.target.value) })}
                  />
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Shift Type</span></label>
                  <select
                    className="select select-bordered"
                    value={formData.shift_type}
                    onChange={(e) => setFormData({ ...formData, shift_type: e.target.value })}
                  >
                    {SHIFT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label"><span className="label-text">Color</span></label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-800' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={formData.is_overnight}
                      onChange={(e) => setFormData({ ...formData, is_overnight: e.target.checked })}
                    />
                    <span className="label-text">Overnight Shift (spans midnight)</span>
                  </label>
                </div>
              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editMode ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
        </div>
      )}
    </div>
  );
}
