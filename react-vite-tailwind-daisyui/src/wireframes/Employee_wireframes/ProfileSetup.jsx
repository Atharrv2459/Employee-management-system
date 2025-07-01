import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export default function ProfileSetup() {
  const [first_name, setFirst_name] = useState("");
  const [last_name, setLast_name] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [dob, setDob] = useState("");
  const [job_title, setJob_title] = useState("");
  const [profile_picture, setProfile_picture] = useState("");
  const [joining_date, setJoining_date] = useState("");
  const [manager_id, setManager_id] = useState("");
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  const [managers, setManagers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5001/api/employee/get", {
          headers: { Authorization: token },
        });

        const data = res.data.data;
        setIsExistingProfile(true);
        setFirst_name(data.first_name || "");
        setLast_name(data.last_name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setCity(data.city || "");
        setDob(data.dob?.substring(0, 10) || "");
        setJob_title(data.job_title || "");
        setProfile_picture(data.profile_picture || "");
        setJoining_date(data.joining_date?.substring(0, 10) || "");
        setManager_id(data.manager_id || "");
      } catch (error) {
        if (error.response?.status === 404) {
          setIsExistingProfile(false);
          alert("No profile found. You can create one.");
        } else {
          console.error("Error fetching profile:", error);
          toast.error("Failed to load profile");
        }
      }
    };

    fetchProfile();
  }, []);

  const profilePayload = {
    first_name,
    last_name,
    phone,
    address,
    city,
    dob : dob ? dob.substring(0, 10) : null,
    job_title,
    profile_picture,
    joining_date : joining_date ? joining_date.substring(0, 10) : null,
    manager_id,
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:5001/api/employee/create",profilePayload, {
        headers: { Authorization: token },
      });

      setIsExistingProfile(true);
      toast.success("Profile created successfully");
    } catch (error) {
      console.error("Creation failed:", error);
      toast.error(error.response?.data?.message || "Failed to create profile");
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put("http://localhost:5001/api/employee/update", profilePayload, {
        headers: { Authorization: token },
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to update profile");
    }
  };


 useEffect(()=>{
  const fetchManagers = async () => {
    try{
      const res = await axios.get("http://localhost:5001/api/manager/getAll");
      setManagers(res.data.data);
    }
    catch(error){
      console.error("Failed to fetch managers",error);
      toast.error("Failed to load manager list");
    }
  };
  fetchManagers();

 },[]) 


  return (
    <div className="p-6">
      <div className="flex w-full flex-col lg:flex-row gap-12">
        <div className="card bg-base-100 shadow-md rounded-xl w-full mx-12">
          <div className="bg-blue-600 text-white text-center py-3 rounded-t-xl font-semibold text-lg">
            Employee Dashboard - Profile Management
          </div>
          <div className="p-6 space-y-4">
            <h3 className="text-gray-700 font-bold mb-2">Profile {isExistingProfile ? "Details" : "Setup"}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input className="input input-bordered w-full" placeholder="First Name" value={first_name} onChange={(e) => setFirst_name(e.target.value)} />
              <input className="input input-bordered w-full" placeholder="Last Name" value={last_name} onChange={(e) => setLast_name(e.target.value)} />
              <input className="input input-bordered w-full" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              <input className="input input-bordered w-full" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
              <input className="input input-bordered w-full" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
              <input className="input input-bordered w-full" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              <input className="input input-bordered w-full" placeholder="Job Title" value={job_title} onChange={(e) => setJob_title(e.target.value)} />
              <input className="input input-bordered w-full" placeholder="Profile Picture URL" value={profile_picture} onChange={(e) => setProfile_picture(e.target.value)} />
              <input className="input input-bordered w-full" type="date" value={joining_date} onChange={(e) => setJoining_date(e.target.value)} />
              <select className="select select-bordered w-full"
              value={manager_id}
              onChange={(e)=> setManager_id(e.target.value)}>
                <option value="">Select Manager</option>
  {managers.map((mgr) => (
    <option key={mgr.manager_id} value={mgr.manager_id}>
      {mgr.first_name} {mgr.last_name}
    </option>
  ))}
              </select>
            </div>

            <div className="flex justify-between mt-4">
              {isExistingProfile ? (
                <button className="btn bg-blue-500 text-white" onClick={handleUpdate}>
                  Update Profile
                </button>
              ) : (
                <button className="btn bg-green-600 text-white" onClick={handleCreate}>
                  Create Profile
                </button>
              )}
              <button className="btn bg-gray-500 text-white" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>

    
        <div className="card bg-base-100 shadow-md rounded-xl w-full mr-12">
          <div className="bg-blue-600 text-white text-center py-3 rounded-t-xl font-semibold text-lg">
            Emergency Contacts
          </div>
          <div className="p-6 text-sm text-gray-500">No functionality implemented yet.</div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md rounded-xl max-w-6xl mx-auto mt-16">
        <div className="bg-blue-600 text-white text-center py-3 rounded-t-xl font-semibold text-lg">
          Shift Preferences
        </div>
        <div className="p-6 text-sm text-gray-500">Shift preferences will be added later.</div>
      </div>
    </div>
  );
}
