import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

// Importing modular cards
import EmergencyContactCard from "./profile/EmergencyContactCard";
import ShiftPreferenceCard from "./profile/ShiftPreferenceCard";

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

  const [registeringDevice, setRegisteringDevice] = useState(false);
  const [deviceRegistered, setDeviceRegistered] = useState(false);
  const [checkingDevice, setCheckingDevice] = useState(true);

  // ---------- Profile fetch ----------
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
        } else {
          toast.error("Failed to load profile");
        }
      }
    };

    const fetchManagers = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/manager/getAll");
        setManagers(res.data.data);
      } catch (error) {
        toast.error("Failed to load manager list");
      }
    };

    const checkDevice = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5001/api/webauthn/has-device", {
          headers: { Authorization: token },
        });
        setDeviceRegistered(res.data.hasDevice === true);
      } catch (err) {
        console.error("Failed to check device status", err);
      } finally {
        setCheckingDevice(false);
      }
    };

    fetchProfile();
    fetchManagers();
    checkDevice();
  }, []);

  const profilePayload = {
    first_name,
    last_name,
    phone,
    address,
    city,
    dob: dob ? dob.substring(0, 10) : null,
    job_title,
    profile_picture,
    joining_date: joining_date ? joining_date.substring(0, 10) : null,
    manager_id,
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5001/api/employee/create", profilePayload, {
        headers: { Authorization: token },
      });
      setIsExistingProfile(true);
      toast.success("Profile created successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create profile");
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put("http://localhost:5001/api/employee/update", profilePayload, {
        headers: { Authorization: token },
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  // ---------- WebAuthn Helpers ----------
  const bufferToBase64Url = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let str = "";
    bytes.forEach((b) => (str += String.fromCharCode(b)));
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  };

  const base64UrlToBuffer = (base64url) => {
    const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
    const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    const buffer = new ArrayBuffer(raw.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return buffer;
  };

  const handleRegisterDevice = async () => {
    try {
      setRegisteringDevice(true);
      const token = localStorage.getItem("token");

      const optionsRes = await axios.post(
        "http://localhost:5001/api/webauthn/register-options",
        {},
        { headers: { Authorization: token } }
      );

      const options = optionsRes.data;

      options.challenge = base64UrlToBuffer(options.challenge);
      options.user.id = base64UrlToBuffer(options.user.id);

      if (options.excludeCredentials) {
        options.excludeCredentials = options.excludeCredentials.map((cred) => ({
          ...cred,
          id: base64UrlToBuffer(cred.id),
        }));
      }

      const credential = await navigator.credentials.create({ publicKey: options });

      const attestationResponse = {
        id: credential.id,
        rawId: bufferToBase64Url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64Url(credential.response.clientDataJSON),
          attestationObject: bufferToBase64Url(credential.response.attestationObject),
        },
      };

      await axios.post(
        "http://localhost:5001/api/webauthn/register-verify",
        attestationResponse,
        { headers: { Authorization: token } }
      );

      toast.success("Device registered successfully!");
      setDeviceRegistered(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to register device");
    } finally {
      setRegisteringDevice(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Profile Card */}
      <div className="card bg-base-100 shadow-lg rounded-xl">
        <div className="bg-blue-600 text-white text-center py-3 rounded-t-xl font-semibold text-lg">
          Employee Profile
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="input input-bordered" placeholder="First Name" value={first_name} onChange={(e) => setFirst_name(e.target.value)} />
            <input className="input input-bordered" placeholder="Last Name" value={last_name} onChange={(e) => setLast_name(e.target.value)} />
            <input className="input input-bordered" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <input className="input input-bordered" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            <input className="input input-bordered" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
            
            <div className="form-control">
  <label className="label">
    <span className="label-text">Date of Birth</span>
  </label>
  <input
    type="date"
    className="input input-bordered"
    value={dob}
    onChange={(e) => setDob(e.target.value)}
  />
</div>
            <input className="input input-bordered" placeholder="Job Title" value={job_title} onChange={(e) => setJob_title(e.target.value)} />
            <input className="input input-bordered" placeholder="Profile Picture URL" value={profile_picture} onChange={(e) => setProfile_picture(e.target.value)} />
   <div className="form-control">
  <label className="label">
    <span className="label-text">Joining Date</span>
  </label>
  <input
    type="date"
    className="input input-bordered"
    value={joining_date}
    onChange={(e) => setJoining_date(e.target.value)}
  />
</div>
            <select className="select select-bordered" value={manager_id} onChange={(e) => setManager_id(e.target.value)}>
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
              <button className="btn btn-primary" onClick={handleUpdate}>Update Profile</button>
            ) : (
              <button className="btn btn-success" onClick={handleCreate}>Create Profile</button>
            )}
            <button className="btn btn-outline" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Device Section */}
      {!checkingDevice && (
        deviceRegistered ? (
          <div className="alert alert-success shadow">
            ✅ This device is already registered for secure attendance.
          </div>
        ) : (
          <div className="card bg-base-100 shadow-lg rounded-xl">
            <div className="bg-purple-600 text-white text-center py-3 rounded-t-xl font-semibold text-lg">
              Secure Device Registration
            </div>
            <div className="p-6 text-center space-y-4">
              <p className="text-gray-600">
                Register this device using system biometrics (Fingerprint / Face / PIN).
              </p>
              <button className="btn btn-success" onClick={handleRegisterDevice} disabled={registeringDevice}>
                {registeringDevice ? "Registering..." : "Register This Device"}
              </button>
            </div>
          </div>
        )
      )}

      <EmergencyContactCard />
      <ShiftPreferenceCard />
    </div>
  );
}
