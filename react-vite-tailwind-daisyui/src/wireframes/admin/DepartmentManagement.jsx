import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiUsers, FiChevronRight } from "react-icons/fi";

import { API_BASE } from "../../api";

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [hierarchy, setHierarchy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // list or tree

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    parent_id: "",
    head_user_id: "",
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchDepartments();
    fetchHierarchy();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE}/departments`);
      setDepartments(res.data);
    } catch (error) {
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  const fetchHierarchy = async () => {
    try {
      const res = await axios.get(`${API_BASE}/departments/hierarchy`);
      setHierarchy(res.data);
    } catch (error) {
      console.error("Failed to fetch hierarchy");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await axios.put(
          `${API_BASE}/departments/${selectedDept.id}`,
          formData,
          { headers: { Authorization: token } }
        );
        toast.success("Department updated successfully");
      } else {
        await axios.post(`${API_BASE}/departments`, formData, {
          headers: { Authorization: token },
        });
        toast.success("Department created successfully");
      }
      setShowModal(false);
      resetForm();
      fetchDepartments();
      fetchHierarchy();
    } catch (error) {
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (dept) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code || "",
      description: dept.description || "",
      parent_id: dept.parent_id || "",
      head_user_id: dept.head_user_id || "",
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this department?")) return;
    try {
      await axios.delete(`${API_BASE}/departments/${id}`, {
        headers: { Authorization: token },
      });
      toast.success("Department deleted");
      fetchDepartments();
      fetchHierarchy();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete department");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", code: "", description: "", parent_id: "", head_user_id: "" });
    setEditMode(false);
    setSelectedDept(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  // Recursive tree renderer
  const renderTree = (nodes, level = 0) => {
    return nodes.map((node) => (
      <div key={node.id} style={{ marginLeft: `${level * 24}px` }}>
        <div className="flex items-center gap-2 py-2 px-3 hover:bg-base-200 rounded-lg">
          {node.children?.length > 0 && <FiChevronRight className="text-gray-400" />}
          <span className="font-medium">{node.name}</span>
          {node.code && <span className="badge badge-ghost badge-sm">{node.code}</span>}
          <span className="text-sm text-gray-500 ml-2">
            ({node.employee_count || 0} employees)
          </span>
        </div>
        {node.children?.length > 0 && renderTree(node.children, level + 1)}
      </div>
    ));
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
        <h1 className="text-2xl font-bold text-gray-800">Department Management</h1>
        <div className="flex gap-2">
          <div className="btn-group">
            <button
              className={`btn btn-sm ${viewMode === "list" ? "btn-active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
            <button
              className={`btn btn-sm ${viewMode === "tree" ? "btn-active" : ""}`}
              onClick={() => setViewMode("tree")}
            >
              Org Chart
            </button>
          </div>
          <button className="btn btn-primary btn-sm gap-2" onClick={openCreateModal}>
            <FiPlus /> Add Department
          </button>
        </div>
      </div>

      {viewMode === "list" ? (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="table w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Name</th>
                <th>Code</th>
                <th>Parent</th>
                <th>Head</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {departments.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-400">
                    No departments found. Create your first department.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="hover">
                    <td className="font-medium">{dept.name}</td>
                    <td>
                      {dept.code && <span className="badge badge-outline">{dept.code}</span>}
                    </td>
                    <td>{dept.parent_name || "-"}</td>
                    <td>
                      {dept.head_first_name
                        ? `${dept.head_first_name} ${dept.head_last_name || ""}`
                        : "-"}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => handleEdit(dept)}
                        >
                          <FiEdit2 />
                        </button>
                        <button
                          className="btn btn-ghost btn-xs text-error"
                          onClick={() => handleDelete(dept.id)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FiUsers /> Organization Hierarchy
          </h2>
          {hierarchy.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No hierarchy data available</p>
          ) : (
            <div className="border rounded-lg p-4">{renderTree(hierarchy)}</div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {editMode ? "Edit Department" : "Create Department"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">Department Name *</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">Code</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="e.g., ENG, HR, FIN"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-control mb-3">
                <label className="label">
                  <span className="label-text">Parent Department</span>
                </label>
                <select
                  className="select select-bordered"
                  value={formData.parent_id}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                >
                  <option value="">None (Top Level)</option>
                  {departments
                    .filter((d) => d.id !== selectedDept?.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
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
