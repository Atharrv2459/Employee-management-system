import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function UserRegister() {
  const [email, setEmail] = useState("");
  const [roll_no, setRollNo] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee"); // default role
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    const role_id =
      role === "employee" ? 1 :
      role === "manager" ? 2 :
      role === "admin" ? 4 :
      1;

    try {
      const res = await axios.post("http://localhost:5001/api/users/register", {
        email,
        roll_no,
        password,
        role_id,
      });

      const { token } = res.data;
      localStorage.setItem("token", token);
      toast.success("Registration successful");

      if (role === "employee") {
        navigate("/employee/profile");
      } else if (role === "manager") {
        navigate("/manager/profile");
      } else if (role === "admin") {
        navigate("/admin"); // Update this route as needed
      }

    } catch (err) {
      toast.error(
        "Registration failed: " +
        (err.response?.data?.message || err.message)
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <form
        onSubmit={handleRegister}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-5"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800">Register</h2>

        <div>
          <label className="text-sm font-semibold text-gray-600">Email</label>
          <input
            type="email"
            className="input input-bordered w-full mt-1"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600">Roll Number</label>
          <input
            type="text"
            className="input input-bordered w-full mt-1"
            placeholder="Enter roll number"
            value={roll_no}
            onChange={(e) => setRollNo(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600">Password</label>
          <input
            type="password"
            className="input input-bordered w-full mt-1"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-gray-600">Role</label>
          <select
            className="select select-bordered w-full mt-1"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        <button
          type="submit"
          className="btn w-full bg-blue-500 text-white hover:bg-blue-600"
        >
          Register
        </button>
      </form>
    </div>
  );
}
