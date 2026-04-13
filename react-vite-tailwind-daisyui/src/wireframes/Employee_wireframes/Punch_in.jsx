import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE } from "../../api";
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import { useGeolocation } from '../../useGeolocation';

export default function Punch_in() {
  const navigate = useNavigate();
  const { location, error: geoError, loading: geoLoading, getLocation, isSupported } = useGeolocation();

  // Location validation state
  const [locationStatus, setLocationStatus] = useState(null); // null, 'checking', 'valid', 'invalid'
  const [nearestOffice, setNearestOffice] = useState(null);


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

// ---------- Biometric Verification ----------





  const [time, setTime] = useState('');
  const [punch_in, setPunch_in] = useState('');
  const [punch_out, setPunch_out] = useState('');
  const [attendance_list, setAttendance_list] = useState([]);
  const [workedDuration, setWorkedDuration] = useState('');
  const [remainingHours, setRemainingHours] = useState('');

  const token = localStorage.getItem('token');

  // Check geofence when location changes
  useEffect(() => {
    if (location) {
      checkGeofence(location.latitude, location.longitude);
    }
  }, [location]);

  // Auto-fetch location on mount
  useEffect(() => {
    if (isSupported) {
      getLocation();
    }
  }, []);

  const checkGeofence = async (lat, lng) => {
    setLocationStatus('checking');
    try {
      const res = await axios.post(
        `${API_BASE}/locations/check-geofence`,
        { latitude: lat, longitude: lng },
        { headers: { Authorization: token } }
      );
      
      setNearestOffice(res.data.nearest_office);
      setLocationStatus(res.data.is_within_geofence ? 'valid' : 'invalid');
    } catch (error) {
      console.error('Geofence check failed:', error);
      setLocationStatus('invalid');
    }
  };

  const refreshLocation = async () => {
    try {
      await getLocation();
      toast.success('Location refreshed');
    } catch (err) {
      toast.error(err || 'Failed to get location');
    }
  };

  const formatDuration = (ms) => {
    if (!ms || isNaN(ms)) return '-';
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const expectedPunchOut = punch_in
    ? new Date(new Date(punch_in).getTime() + 8 * 60 * 60 * 1000)
    : null;

  const calculateRemainingHours = () => {
    if (expectedPunchOut) {
      const now = new Date();
      const remainingMs = expectedPunchOut - now;
      setRemainingHours(remainingMs <= 0 ? '0h 0m' : formatDuration(remainingMs));
    } else {
      setRemainingHours('-');
    }
  };

  useEffect(() => {
    calculateRemainingHours();
    const interval = setInterval(calculateRemainingHours, 60000);
    return () => clearInterval(interval);
  }, [expectedPunchOut]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const formatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTime(formatted);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get(`${API_BASE}/attendance/get`, {
        headers: { Authorization: token },
      });

      setAttendance_list(res.data.data);

      const today = new Date().toISOString().split('T')[0];
      const todayRecord = res.data.data.find(
        (item) => item.punch_in && item.punch_in.startsWith(today)
      );

      if (todayRecord) {
        if (todayRecord.punch_in) setPunch_in(new Date(todayRecord.punch_in));
        if (todayRecord.punch_out) setPunch_out(new Date(todayRecord.punch_out));
      }
    } catch (error) {
      toast.error('Failed to fetch your attendance');
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handlePunchIn = async () => {
    // Get fresh location before punching
    try {
      let currentLocation = location;
      if (!currentLocation) {
        currentLocation = await getLocation();
      }

      const res = await axios.post(
        `${API_BASE}/attendance/punch-in`,
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
        },
        { headers: { Authorization: token } }
      );

      setPunch_in(new Date(res.data.data.punch_in));
      
      // Show location info in success message
      if (res.data.location) {
        const locInfo = res.data.location.office || res.data.location.remote_location || 'Unknown';
        toast.success(`Punched in at ${locInfo}`);
      } else {
        toast.success("Punched in successfully");
      }
      
      fetchAttendance();
    } catch (error) {
      const errMsg = error.response?.data?.error || error.response?.data?.message || "Punch in failed";
      toast.error(errMsg);
      
      // If location error, show details
      if (error.response?.data?.code === 'LOCATION_NOT_APPROVED') {
        setLocationStatus('invalid');
      }
    }
  };


  const handlePunchOut = async () => {
    try {
      let currentLocation = location;
      if (!currentLocation) {
        currentLocation = await getLocation();
      }

      const res = await axios.post(
        `${API_BASE}/attendance/punch-out`,
        {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          accuracy: currentLocation.accuracy,
        },
        { headers: { Authorization: token } }
      );
      
      setPunch_out(new Date(res.data.data.punch_out));
      
      if (res.data.location) {
        const locInfo = res.data.location.office || res.data.location.remote_location || 'Unknown';
        toast.success(`Punched out at ${locInfo}`);
      } else {
        toast.success('Punched out successfully');
      }
      
      fetchAttendance();
    } catch (error) {
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Punch out failed';
      toast.error(errMsg);
    }
  };

  useEffect(() => {
    if (punch_in && punch_out) {
      setWorkedDuration(formatDuration(new Date(punch_out) - new Date(punch_in)));
    } else {
      setWorkedDuration('-');
    }
  }, [punch_in, punch_out]);

  return (
  <div className="flex flex-col p-6 space-y-10 bg-gray-50 min-h-screen">
    
    {/* Location Status Banner */}
    {!isSupported && (
      <div className="alert alert-warning">
        <FiAlertCircle className="text-xl" />
        <span>Your browser doesn't support geolocation. Some features may be limited.</span>
      </div>
    )}
    
    {geoError && (
      <div className="alert alert-error">
        <FiAlertCircle className="text-xl" />
        <span>{geoError}</span>
        <button className="btn btn-sm" onClick={refreshLocation}>Retry</button>
      </div>
    )}

    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left - Clock and Actions */}
      <div className="card bg-white w-full lg:w-1/2 rounded-xl shadow-md p-6 flex flex-col items-center border">
        <p className="text-gray-500 mb-6 text-lg font-semibold">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>

        <div className="text-5xl font-bold text-gray-800 mb-4">{time}</div>

        {/* Location Status Indicator */}
        <div className="mb-6 w-full max-w-xs">
          {geoLoading || locationStatus === 'checking' ? (
            <div className="flex items-center justify-center gap-2 text-gray-500 py-2">
              <span className="loading loading-spinner loading-sm"></span>
              <span className="text-sm">Checking location...</span>
            </div>
          ) : locationStatus === 'valid' ? (
            <div className="flex items-center justify-center gap-2 text-green-600 py-2 bg-green-50 rounded-lg">
              <FiCheckCircle />
              <span className="text-sm font-medium">
                {nearestOffice ? `At ${nearestOffice.name}` : 'Location verified'}
              </span>
            </div>
          ) : locationStatus === 'invalid' ? (
            <div className="flex flex-col items-center gap-1 text-orange-600 py-2 bg-orange-50 rounded-lg px-3">
              <div className="flex items-center gap-2">
                <FiAlertCircle />
                <span className="text-sm font-medium">Outside office area</span>
              </div>
              {nearestOffice && (
                <span className="text-xs text-gray-500">
                  Nearest: {nearestOffice.name} ({nearestOffice.distance}m away)
                </span>
              )}
            </div>
          ) : location ? (
            <div className="flex items-center justify-center gap-2 text-blue-600 py-2 bg-blue-50 rounded-lg">
              <FiMapPin />
              <span className="text-sm">Location captured</span>
            </div>
          ) : (
            <button 
              onClick={refreshLocation}
              className="btn btn-ghost btn-sm gap-2 text-gray-500"
            >
              <FiMapPin /> Enable Location
            </button>
          )}
        </div>

        <button 
          onClick={handlePunchIn} 
          disabled={geoLoading}
          className="btn w-48 bg-blue-600 text-white mt-2 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {geoLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Punch In'}
        </button>
        <button
          onClick={handlePunchOut}
          disabled={geoLoading}
          className="btn w-48 bg-blue-600 text-white mt-4 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {geoLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Punch Out'}
        </button>
        <button
          onClick={() => navigate('/employee/manual-entry')}
          className="btn btn-outline btn-info w-48 mt-4"
        >
          Manual Entry
        </button>
      </div>

      {/* Right - Work Summary */}
      <div className="card bg-white w-full lg:w-1/2 rounded-xl shadow-md p-6 border">
        <p className="text-xl font-semibold mb-6 text-gray-700">
          📊 Today's Work Summary
        </p>
        <div className="grid grid-cols-2 gap-y-5 gap-x-12 text-sm">
          <p className="text-gray-500 font-medium">Punch In Time</p>
          <p className="text-gray-800 font-bold">
            {punch_in
              ? new Date(punch_in).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'}
          </p>

          <p className="text-gray-500 font-medium">Hours Worked</p>
          <p className="text-gray-800 font-bold">{workedDuration}</p>

          <p className="text-gray-500 font-medium">Expected Punch Out</p>
          <p className="text-gray-800 font-bold">
            {expectedPunchOut
              ? expectedPunchOut.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'}
          </p>

          <p className="text-gray-500 font-medium">Punch Out Time</p>
          <p className="text-gray-800 font-bold">
            {punch_out
              ? new Date(punch_out).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '-'}
          </p>

          <p className="text-gray-500 font-medium">Remaining Hours</p>
          <p className="text-gray-800 font-bold">{remainingHours}</p>
        </div>
      </div>
    </div>

    {/* Recent Entries */}
    <div className="mt-10">
      <h3 className="text-xl font-semibold text-gray-700 mb-4 mx-2">
        ⏱️ Recent Time Entries
      </h3>
      <div className="overflow-x-auto bg-white rounded-xl shadow-md border">
        <table className="table text-sm">
          <thead className="bg-base-200 text-gray-600">
            <tr>
              <th className="px-6 py-3">Date</th>
              <th>Punch In</th>
              <th>Punch Out</th>
              <th>Total Time</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance_list.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-400">
                  No attendance records found.
                </td>
              </tr>
            ) : (
              attendance_list.map((entry, index) => (
                <tr key={index}>
                  <td>{new Date(entry.punch_in).toLocaleDateString()}</td>
                  <td>
                    {new Date(entry.punch_in).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>
                    {entry.punch_out
                      ? new Date(entry.punch_out).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </td>
                  <td>
                    {entry.punch_in && entry.punch_out
                      ? formatDuration(
                          new Date(entry.punch_out) -
                            new Date(entry.punch_in)
                        )
                      : '-'}
                  </td>
                  <td className="text-green-600 font-semibold">Present</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
}
