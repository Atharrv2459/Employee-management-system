import { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const token = localStorage.getItem("token");

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

  const handleEditClick = (user) => {
    setSelectedUser({ ...user });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      await axios.put(
        `http://localhost:5001/api/admin/users/${selectedUser.user_id}`,
        selectedUser,
        { headers: { Authorization: token } }
      );
      toast.success("User updated successfully");
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update user");
    }
  };

  const getRoleLabel = (role_id) => {
    if (role_id === 1) return "Employee";
    if (role_id === 2) return "Manager";
    if (role_id === 3) return "Admin";
    return "Unknown";
  };

  const tableSection = (role_id, title) => (
    <div className="mb-10">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="overflow-x-auto rounded-lg shadow border border-gray-200">
        <table className="table w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Phone</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users
              .filter((u) => u.role_id === role_id)
              .map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50 border-b">
                  <td className="p-3">{user.first_name} {user.last_name}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3">{user.phone || "-"}</td>
                  <td className="p-3">{getRoleLabel(user.role_id)}</td>
                  <td className="p-3">
                    <button
                      onClick={() => handleEditClick(user)}
                      className="btn btn-sm btn-primary"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Admin User Management</h1>

      {tableSection(1, "Employees")}
      {tableSection(2, "Managers")}
      {tableSection(3, "Admins")}

      {/* Edit Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Edit User Details</h2>
            <div className="space-y-4">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="First Name"
                value={selectedUser.first_name || ""}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    first_name: e.target.value,
                  })
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Last Name"
                value={selectedUser.last_name || ""}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    last_name: e.target.value,
                  })
                }
              />
              <input
                type="text"
                className="input input-bordered w-full"
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
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
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
    </div>
  );
}
