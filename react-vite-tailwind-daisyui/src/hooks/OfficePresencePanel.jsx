import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiAlertCircle, FiCheckCircle, FiMapPin, FiRefreshCw, FiXCircle } from "react-icons/fi";
import { useGeolocation } from "../useGeolocation";
import OfficeMap from "../wireframes/Employee_wireframes/OfficeMap";
import { API_BASE } from "../api";

const STORAGE_KEY_DEFAULT = "preferredOfficeLocationId";

export default function OfficePresencePanel({ showMap = false, storageKey = STORAGE_KEY_DEFAULT }) {
  const token = localStorage.getItem("token");

  const { location, error: geoError, loading: geoLoading, getLocation, isSupported } = useGeolocation();

  const [offices, setOffices] = useState([]);
  const [officesLoading, setOfficesLoading] = useState(true);
  const [selectedOfficeId, setSelectedOfficeId] = useState("");

  const [geofenceLoading, setGeofenceLoading] = useState(false);
  const [geofenceResult, setGeofenceResult] = useState(null); // { is_within_geofence, nearest_office, all_offices }

  const selectedOffice = useMemo(
    () => offices.find((o) => String(o.id) === String(selectedOfficeId)) || null,
    [offices, selectedOfficeId]
  );

  const selectedOfficeGeofence = useMemo(() => {
    const all = geofenceResult?.all_offices;
    if (!Array.isArray(all) || !selectedOfficeId) return null;
    return all.find((o) => String(o.id) === String(selectedOfficeId)) || null;
  }, [geofenceResult, selectedOfficeId]);

  const withinSelectedOffice = selectedOfficeGeofence?.is_within;
  const distanceToSelectedOffice = selectedOfficeGeofence?.distance_meters;

  const fetchOffices = async () => {
    setOfficesLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/locations/offices`);
      const list = res.data || [];
      setOffices(list);

      const stored = localStorage.getItem(storageKey);
      const storedValid = stored && list.some((o) => String(o.id) === String(stored));

      if (storedValid) {
        setSelectedOfficeId(stored);
      } else {
        const primary = list.find((o) => o.is_primary) || null;
        const first = list[0] || null;
        const initial = primary?.id || first?.id || "";
        if (initial) setSelectedOfficeId(String(initial));
      }
    } catch (e) {
      console.error("Failed to fetch offices", e);
      toast.error("Failed to load office locations");
    } finally {
      setOfficesLoading(false);
    }
  };

  const checkGeofence = async (lat, lng) => {
    if (!token) return;
    setGeofenceLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE}/locations/check-geofence`,
        { latitude: lat, longitude: lng },
        { headers: { Authorization: token } }
      );
      setGeofenceResult(res.data);
    } catch (e) {
      console.error("Geofence check failed", e);
      setGeofenceResult(null);
    } finally {
      setGeofenceLoading(false);
    }
  };

  useEffect(() => {
    fetchOffices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedOfficeId) localStorage.setItem(storageKey, String(selectedOfficeId));
  }, [selectedOfficeId, storageKey]);

  useEffect(() => {
    if (isSupported) {
      getLocation().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported]);

  useEffect(() => {
    if (!location) return;
    checkGeofence(location.latitude, location.longitude);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const refreshLocation = async () => {
    try {
      const loc = await getLocation();
      if (loc) await checkGeofence(loc.latitude, loc.longitude);
      toast.success("Location refreshed");
    } catch (e) {
      toast.error(typeof e === "string" ? e : "Failed to get location");
    }
  };

  return (
    <div className="space-y-3">
      {!isSupported && (
        <div className="alert alert-warning">
          <FiAlertCircle className="text-xl" />
          <span>Your browser doesn’t support geolocation.</span>
        </div>
      )}

      {geoError && (
        <div className="alert alert-error">
          <FiAlertCircle className="text-xl" />
          <span>{geoError}</span>
          <button className="btn btn-sm" onClick={refreshLocation} type="button">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700">My Office Location</label>
          <select
            className="select select-bordered w-full"
            value={selectedOfficeId}
            onChange={(e) => setSelectedOfficeId(e.target.value)}
            disabled={officesLoading || offices.length === 0}
          >
            {officesLoading && <option value="">Loading offices…</option>}
            {!officesLoading && offices.length === 0 && <option value="">No offices configured</option>}
            {!officesLoading && offices.length > 0 &&
              offices.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            className="btn btn-outline w-full"
            onClick={refreshLocation}
            type="button"
            disabled={geoLoading}
          >
            {geoLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Checking…
              </>
            ) : (
              <>
                <FiRefreshCw /> Refresh Location
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-base-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiMapPin className="text-xl text-gray-600 mt-0.5" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold">
                {selectedOffice?.name ? `Selected: ${selectedOffice.name}` : "Select an office"}
              </p>
              {geofenceLoading && <span className="badge badge-ghost">Checking…</span>}
            </div>

            {!token && (
              <p className="text-sm text-gray-600 mt-1">Login token missing — cannot validate geofence.</p>
            )}

            {token && selectedOfficeId && !geofenceLoading && location && (
              <div className="mt-2">
                {withinSelectedOffice === true && (
                  <div className="flex items-center gap-2 text-green-700">
                    <FiCheckCircle />
                    <span className="text-sm font-medium">You are currently inside your office location.</span>
                    {typeof distanceToSelectedOffice === "number" && (
                      <span className="text-xs text-green-800">({distanceToSelectedOffice}m from center)</span>
                    )}
                  </div>
                )}

                {withinSelectedOffice === false && (
                  <div className="flex items-center gap-2 text-red-700">
                    <FiXCircle />
                    <span className="text-sm font-medium">You are NOT in your office location.</span>
                    {typeof distanceToSelectedOffice === "number" && (
                      <span className="text-xs text-red-800">({distanceToSelectedOffice}m away)</span>
                    )}
                  </div>
                )}

                {withinSelectedOffice == null && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <FiAlertCircle />
                    <span className="text-sm">Unable to verify against the selected office.</span>
                  </div>
                )}
              </div>
            )}

            {location && (
              <p className="text-xs text-gray-600 mt-2">
                Current: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                {location.accuracy ? ` (±${Math.round(location.accuracy)}m)` : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {showMap && (
        <div>
          <OfficeMap position={location ? [location.latitude, location.longitude] : null} />
        </div>
      )}
    </div>
  );
}
