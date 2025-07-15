import axios from 'axios';
import { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function UserLogin() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("http://localhost:5001/api/users/login", {
        identifier,
        password,
      });

      const { token, role } = res.data;
      
console.log("Logged in role:", role); 

      localStorage.clear();
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);

      toast.success("Login successful");

      if (role === "employee") {
        navigate("/employee/dashboard");
      } else if (role === "manager") {
        navigate("/manager/dashboard");
      } else if (role === "admin") {
        navigate("/admin"); // Update this route as needed
      } else {
        toast.error("Unknown role. Contact admin.");
      }
    } catch (error) {
      toast.error(
        "Login failed: " +
        (error.response?.data?.message || error.message)
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 to-purple-600 px-4">
      <div className="bg-white my-20 rounded-2xl shadow-xl w-full max-w-md p-8 flex flex-col space-y-6">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-blue-400 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
            SF
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800">Time Management</h1>
        <p className="text-center text-sm text-gray-500">SAP SuccessFactors Integration</p>

        <form onSubmit={handleLogin}>
          {/* Email / Employee ID */}
          <div className="text-left mb-3">
            <label className="font-semibold text-sm text-gray-700">Email / Employee ID</label>
            <input
              type="email"
              placeholder="Enter your email or employee ID"
              className="input input-bordered w-full mt-1"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="text-left mb-3">
            <label className="font-semibold text-sm text-gray-700">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              className="input input-bordered w-full mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Remember + Signup */}
          <div className="flex justify-between items-center text-sm text-gray-600 mb-6">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="checkbox checkbox-sm" />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => navigate("/register")}
              className="text-blue-500 hover:underline"
            >
              Sign up
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold border-0"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
