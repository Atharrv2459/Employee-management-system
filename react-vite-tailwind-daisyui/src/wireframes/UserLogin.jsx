import axios from 'axios';
import { useState } from 'react';
import {Link,useNavigate} from "react-router-dom";
import { toast } from "react-hot-toast";

export default function UserLogin() {
  const[identifier,setIdentifier]=useState("");
        const[password,setPassword]= useState("");
        const navigate = useNavigate();
  

    const handleLogin=async(e)=>{
        e.preventDefault();
        try{
          const res = await axios.post('http://localhost:5001/api/users/login',{identifier,password});
          const {jwtToken}= res.data;
          localStorage.setItem('token', jwtToken);
          navigate('/punch');
          toast.success('Login successfull')


        }
        catch(error){
           toast.error(
        "Login failed: " +
          (error.response?.data?.message || error.message)
      );

        }
        


    }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-600 to-purple-600 px-4">
      <div className="bg-white my-20 rounded-2xl shadow-xl w-full max-w-md p-8 flex flex-col space-y-6">

     
        <div className="flex justify-center">
          <div className="bg-gradient-to-br from-blue-400 to-purple-600 w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md">
            SF
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800">Time Management</h1>
        <p className="text-center text-sm text-gray-500">SAP SuccessFactors Integration</p>

        <form onSubmit={handleLogin}>
        <div className="text-left">
          <label className="font-semibold text-sm text-gray-700">Username / Employee ID</label>
          <input
            type="email"
            placeholder="Enter your username"
            className="input input-bordered w-full mt-1"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
          />
        </div>

     
        <div className="text-left">
          <label className="font-semibold text-sm text-gray-700">Password</label>
          <input
            type="password"
            placeholder="Enter your password"
            className="input w-full mt-1"
            value={password}
            onChange={(e)=> setPassword(e.target.value)}
          />
        </div>

        
        <div className="flex justify-between items-center text-sm text-gray-600">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="checkbox checkbox-sm" />
            Remember me
          </label>
          <a href="#" className="text-blue-500 hover:underline">Forgot Password?</a>
        </div>

   
        <button type="submit" className="btn w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-semibold border-0">
          Sign In
        </button>


        <div className="divider text-gray-400">OR</div>

        
        <div className="flex gap-4 justify-center">
          <div className="card bg-white shadow-sm border rounded-xl w-1/2 py-4 text-center hover:shadow-md transition">
            <div className="text-3xl">🖱️</div>
            <p className="mt-2 font-medium">Fingerprint</p>
          </div>
          <div className="card bg-white shadow-sm border rounded-xl w-1/2 py-4 text-center hover:shadow-md transition">
            <div className="text-3xl">😊</div>
            <p className="mt-2 font-medium">Face ID</p>
          </div>
          
        </div>
        </form>
      </div>
    </div>
  );
}
