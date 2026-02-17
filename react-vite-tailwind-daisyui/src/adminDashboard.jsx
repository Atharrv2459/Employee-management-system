import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState("");

  const [newUser, setNewUser] = useState({
    email: "",
    password: "",
    role_id: 1,
    roll_no: "",
  });

  const token = localStorage.getItem("token");

  // =======================
  // Fetch Users (UNCHANGED FEATURE)
  // =======================
  const fetchUsers = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/admin/users", {
        headers: { Authorization: token },
      });
      setUsers(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // =======================
  // Helpers
  // =======================
  const getRoleLabel = (role_id) => {
    if (role_id === 1) return "Employee";
    if (role_id === 2) return "Manager";
    if (role_id === 3) return "Admin";
    return "Unknown";
  };

  const getRoleBadge = (role_id) => {
    if (role_id === 1) return <span className="badge badge-info">Employee</span>;
    if (role_id === 2) return <span className="badge badge-warning">Manager</span>;
    if (role_id === 3) return <span className="badge badge-success">Admin</span>;
    return <span className="badge">Unknown</span>;
  };

  // =======================
  // Edit User (UNCHANGED FEATURE)
  // =======================
  const handleEditClick = (user) => {
    setSelectedUser({ ...user });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `http://localhost:5001/api/admin/users/${selectedUser.user_id}`,
        selectedUser,
        { headers: { Authorization: token } }
      );
      toast.success("User updated successfully");
      setShowEditModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user");
    }
  };

  // =======================
  // Create User (NEW FEATURE)
  // =======================
  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      toast.error("Email and password are required");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5001/api/admin/users",
        newUser,
        {
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("User created and email sent!");
      setShowCreateModal(false);
      setNewUser({ email: "", password: "", role_id: 1, roll_no: "" });
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create user");
    }
  };

  // =======================
  // Search Filter
  // =======================
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.first_name || ""} ${u.last_name || ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  // =======================
  // UI
  // =======================
  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin User Management</h1>
          <p className="text-gray-500">Create, view and update users</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create User
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          className="input input-bordered w-full max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow border">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.user_id} className="hover">
                <td>
                  {user.first_name} {user.last_name}
                </td>
                <td>{user.email}</td>
                <td>{user.phone || "-"}</td>
                <td>{getRoleBadge(user.role_id)}</td>
                <td>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleEditClick(user)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}

            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-400">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* =======================
          Edit Modal (EXISTING FEATURE)
      ======================= */}
      {showEditModal && selectedUser && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Edit User</h3>

            <input
              className="input input-bordered w-full mb-3"
              placeholder="First Name"
              value={selectedUser.first_name || ""}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, first_name: e.target.value })
              }
            />
            <input
              className="input input-bordered w-full mb-3"
              placeholder="Last Name"
              value={selectedUser.last_name || ""}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, last_name: e.target.value })
              }
            />
            <input
              className="input input-bordered w-full mb-3"
              placeholder="Phone"
              value={selectedUser.phone || ""}
              onChange={(e) =>
                setSelectedUser({ ...selectedUser, phone: e.target.value })
              }
            />
            <select
              className="select select-bordered w-full"
              value={selectedUser.role_id}
              onChange={(e) =>
                setSelectedUser({
                  ...selectedUser,
                  role_id: parseInt(e.target.value),
                })
              }
            >
              <option value={1}>Employee</option>
              <option value={2}>Manager</option>
              <option value={3}>Admin</option>
            </select>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================
          Create Modal (NEW FEATURE)
      ======================= */}
      {showCreateModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create User</h3>

            <input
              className="input input-bordered w-full mb-3"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
            />
            <input
              className="input input-bordered w-full mb-3"
              placeholder="Password"
              type="password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
            />
            <input
              className="input input-bordered w-full mb-3"
              placeholder="Roll No (optional)"
              value={newUser.roll_no}
              onChange={(e) =>
                setNewUser({ ...newUser, roll_no: e.target.value })
              }
            />
            <select
              className="select select-bordered w-full"
              value={newUser.role_id}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  role_id: parseInt(e.target.value),
                })
              }
            >
              <option value={1}>Employee</option>
              <option value={2}>Manager</option>
              <option value={3}>Admin</option>
            </select>

            <div className="modal-action">
              <button
                className="btn"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCreateUser}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
