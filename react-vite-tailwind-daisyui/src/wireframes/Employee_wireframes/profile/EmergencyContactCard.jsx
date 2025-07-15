import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function EmergencyContactCard() {
  const [primaryName, setPrimaryName] = useState("");
  const [primaryRelation, setPrimaryRelation] = useState("");
  const [primaryPhone, setPrimaryPhone] = useState("");
  const [secondaryName, setSecondaryName] = useState("");
  const [secondaryRelation, setSecondaryRelation] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");
  const [medicalInfo, setMedicalInfo] = useState("");
  const [exists, setExists] = useState(false); // For deciding create/update

  useEffect(() => {
    const fetchEmergency = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5001/api/emergency/get", {
          headers: { Authorization: token },
        });

        const data = res.data;
        setPrimaryName(data.primary_contact_name || "");
        setPrimaryRelation(data.primary_contact_relationship || "");
        setPrimaryPhone(data.primary_contact_phone || "");
        setSecondaryName(data.secondary_contact_name || "");
        setSecondaryRelation(data.secondary_contact_relationship || "");
        setSecondaryPhone(data.secondary_contact_phone || "");
        setMedicalInfo(data.medical_info || "");
        setExists(true);
      } catch (err) {
        if (err.response?.status === 404) {
          setExists(false);
        } else {
          toast.error("Failed to load emergency contacts");
        }
      }
    };

    fetchEmergency();
  }, []);

  const saveEmergencyContact = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        primary_contact_name: primaryName,
        primary_contact_relationship: primaryRelation,
        primary_contact_phone: primaryPhone,
        secondary_contact_name: secondaryName,
        secondary_contact_relationship: secondaryRelation,
        secondary_contact_phone: secondaryPhone,
        medical_info: medicalInfo,
      };

      if (exists) {
        await axios.post("http://localhost:5001/api/emergency/create", payload, {
          headers: { Authorization: token },
        });
        toast.success("Emergency contact updated");
      } else {
        await axios.post("http://localhost:5001/api/emergency-contacts", payload, {
          headers: { Authorization: token },
        });
        toast.success("Emergency contact created");
        setExists(true);
      }
    } catch (err) {
      toast.error("Failed to save emergency contact");
    }
  };

  return (
    <div className="card bg-base-100 shadow-md rounded-xl w-full mr-12">
      <div className="bg-blue-600 text-white text-center py-3 rounded-t-xl font-semibold text-lg">
        Emergency Contacts
      </div>
      <div className="p-6 space-y-3">
        <p className="font-bold">Primary Contact</p>
        <input className="input input-bordered w-full" placeholder="Name" value={primaryName} onChange={(e) => setPrimaryName(e.target.value)} />
        <input className="input input-bordered w-full" placeholder="Relationship" value={primaryRelation} onChange={(e) => setPrimaryRelation(e.target.value)} />
        <input className="input input-bordered w-full" placeholder="Phone" value={primaryPhone} onChange={(e) => setPrimaryPhone(e.target.value)} />

        <p className="font-bold mt-4">Secondary Contact</p>
        <input className="input input-bordered w-full" placeholder="Name" value={secondaryName} onChange={(e) => setSecondaryName(e.target.value)} />
        <input className="input input-bordered w-full" placeholder="Relationship" value={secondaryRelation} onChange={(e) => setSecondaryRelation(e.target.value)} />
        <input className="input input-bordered w-full" placeholder="Phone" value={secondaryPhone} onChange={(e) => setSecondaryPhone(e.target.value)} />

        <textarea className="textarea textarea-bordered w-full" placeholder="Allergies, medications, conditions..." value={medicalInfo} onChange={(e) => setMedicalInfo(e.target.value)} />

        <button className="btn bg-blue-500 text-white w-full mt-2" onClick={saveEmergencyContact}>
          {exists ? "Update Contact" : "Save Contact"}
        </button>
      </div>
    </div>
  );
}
