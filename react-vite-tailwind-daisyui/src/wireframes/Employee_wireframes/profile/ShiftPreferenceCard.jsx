import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function ShiftPreferenceCard() {
  const [shiftTimes, setShiftTimes] = useState([]);
  const [maxHours, setMaxHours] = useState(40);
  const [unavailable, setUnavailable] = useState("");
  const [notes, setNotes] = useState("");
  const [exists, setExists] = useState(false);

  useEffect(() => {
    const fetchShift = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5001/api/shifts", {
          headers: { Authorization: token },
        });

        const data = res.data;
        setShiftTimes(data.shift_time || []);
        setMaxHours(data.maximum_hours || 40);
        setUnavailable(data.unavailable_days || "");
        setNotes(data.notes || "");
        setExists(true);
      } catch (err) {
        if (err.response?.status === 404) {
          setExists(false);
        } else {
          toast.error("Failed to load shift preferences");
        }
      }
    };

    fetchShift();
  }, []);

  const saveShiftPreferences = async () => {
    try {
      const token = localStorage.getItem("token");
      const payload = {
        shift_time: shiftTimes,
        maximum_hours: maxHours,
        unavailable_days: unavailable,
        notes,
      };

      if (exists) {
        await axios.put("http://localhost:5001/api/shifts", payload, {
          headers: { Authorization: token },
        });
        toast.success("Shift preferences updated");
      } else {
        await axios.post("http://localhost:5001/api/shifts", payload, {
          headers: { Authorization: token },
        });
        toast.success("Shift preferences created");
        setExists(true);
      }
    } catch (err) {
      toast.error("Failed to save shift preferences");
    }
  };

  return (
    <div className="card bg-base-100 shadow-md rounded-xl max-w-6xl mx-auto mt-16">
      <div className="bg-blue-600 text-white text-center py-3 rounded-t-xl font-semibold text-lg">
        Shift Preferences
      </div>
      <div className="p-6 space-y-3">
        <p className="font-bold">Preferred Shifts</p>
        {["Morning", "Day", "Evening", "Night"].map((label) => (
          <label key={label} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={shiftTimes.includes(label)}
              onChange={(e) => {
                setShiftTimes((prev) =>
                  e.target.checked ? [...prev, label] : prev.filter((s) => s !== label)
                );
              }}
            />
            {label}
          </label>
        ))}

        <input className="input input-bordered w-full" placeholder="Maximum Hours per Week" type="number" value={maxHours} onChange={(e) => setMaxHours(parseInt(e.target.value) || 0)} />
        <input className="input input-bordered w-full" placeholder="Unavailable Days" value={unavailable} onChange={(e) => setUnavailable(e.target.value)} />
        <textarea className="textarea textarea-bordered w-full" placeholder="Additional scheduling notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />

        <button className="btn bg-blue-500 text-white w-full mt-2" onClick={saveShiftPreferences}>
          {exists ? "Update Preferences" : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
