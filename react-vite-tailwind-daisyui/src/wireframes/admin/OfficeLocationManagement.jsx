import { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiCheck, FiX } from "react-icons/fi";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { API_BASE } from "../../api";

// Fix for default marker icon in Leaflet
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Map click handler component
function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function OfficeLocationManagement() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    postal_code: "",
    latitude: "",
    longitude: "",
    radius_meters: 100,
    is_primary: false,
  });

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const res = await axios.get(`${API_BASE}/locations/offices?include_inactive=true`);
      setLocations(res.data);
    } catch (error) {
      toast.error("Failed to fetch office locations");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.latitude || !formData.longitude) {
      toast.error("Please select a location on the map or enter coordinates");
      return;
    }

    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radius_meters: parseInt(formData.radius_meters),
      };

      if (editMode) {
        await axios.put(
          `${API_BASE}/locations/offices/${selectedLocation.id}`,
          payload,
          { headers: { Authorization: token } }
        );
        toast.success("Office location updated successfully");
      } else {
        await axios.post(`${API_BASE}/locations/offices`, payload, {
          headers: { Authorization: token },
        });
        toast.success("Office location created successfully");
      }
      setShowModal(false);
      resetForm();
      fetchLocations();
    } catch (error) {
      toast.error(error.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (loc) => {
    setSelectedLocation(loc);
    setFormData({
      name: loc.name,
      address: loc.address || "",
      city: loc.city || "",
      state: loc.state || "",
      country: loc.country || "India",
      postal_code: loc.postal_code || "",
      latitude: loc.latitude,
      longitude: loc.longitude,
      radius_meters: loc.radius_meters || 100,
      is_primary: loc.is_primary || false,
    });
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this office location?")) return;
    try {
      await axios.delete(`${API_BASE}/locations/offices/${id}`, {
        headers: { Authorization: token },
      });
      toast.success("Office location deleted");
      fetchLocations();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete location");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      postal_code: "",
      latitude: "",
      longitude: "",
      radius_meters: 100,
      is_primary: false,
    });
    setEditMode(false);
    setSelectedLocation(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleMapClick = (lat, lng) => {
    setFormData({
      ...formData,
      latitude: lat.toFixed(8),
      longitude: lng.toFixed(8),
    });
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toFixed(8),
            longitude: position.coords.longitude.toFixed(8),
          });
          toast.success("Current location captured");
        },
        (error) => {
          toast.error("Failed to get current location");
        }
      );
    } else {
      toast.error("Geolocation not supported");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Office Locations & Geofencing</h1>
        <button className="btn btn-primary btn-sm gap-2" onClick={openCreateModal}>
          <FiPlus /> Add Office Location
        </button>
      </div>

      {/* Locations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white rounded-xl shadow">
            <FiMapPin className="mx-auto text-4xl text-gray-300 mb-4" />
            <p className="text-gray-400">No office locations configured</p>
            <button className="btn btn-primary btn-sm mt-4" onClick={openCreateModal}>
              Add Your First Office
            </button>
          </div>
        ) : (
          locations.map((loc) => (
            <div
              key={loc.id}
              className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${
                loc.is_primary ? "border-primary" : "border-gray-200"
              } ${!loc.is_active ? "opacity-60" : ""}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{loc.name}</h3>
                  {loc.is_primary && (
                    <span className="badge badge-primary badge-sm">Primary</span>
                  )}
                  {!loc.is_active && (
                    <span className="badge badge-ghost badge-sm ml-1">Inactive</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(loc)}>
                    <FiEdit2 />
                  </button>
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={() => handleDelete(loc.id)}
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-2">{loc.address || "No address"}</p>
              <p className="text-sm text-gray-500">
                {[loc.city, loc.state, loc.country].filter(Boolean).join(", ")}
              </p>

              <div className="divider my-2"></div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Geofence Radius</span>
                <span className="font-medium">{loc.radius_meters}m</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-500">Coordinates</span>
                <span className="font-mono text-xs">
                  {parseFloat(loc.latitude).toFixed(4)}, {parseFloat(loc.longitude).toFixed(4)}
                </span>
              </div>

              {/* Mini map preview */}
              <div className="mt-3 h-32 rounded-lg overflow-hidden">
                <MapContainer
                  center={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[parseFloat(loc.latitude), parseFloat(loc.longitude)]} />
                  <Circle
                    center={[parseFloat(loc.latitude), parseFloat(loc.longitude)]}
                    radius={loc.radius_meters}
                    pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.2 }}
                  />
                </MapContainer>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl">
            <h3 className="font-bold text-lg mb-4">
              {editMode ? "Edit Office Location" : "Add Office Location"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Office Name *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="Main Office"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Geofence Radius (meters) *</span>
                  </label>
                  <input
                    type="number"
                    className="input input-bordered"
                    min="10"
                    max="1000"
                    value={formData.radius_meters}
                    onChange={(e) =>
                      setFormData({ ...formData, radius_meters: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="form-control col-span-2">
                  <label className="label">
                    <span className="label-text">Address</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">City</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">State</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Latitude *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="12.9716"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Longitude *</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="77.5946"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    required
                  />
                </div>

                <div className="col-span-2 flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={getCurrentLocation}
                  >
                    <FiMapPin /> Use Current Location
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setShowMap(!showMap)}
                  >
                    {showMap ? "Hide Map" : "Pick on Map"}
                  </button>
                </div>

                {showMap && (
                  <div className="col-span-2 h-64 rounded-lg overflow-hidden border">
                    <MapContainer
                      center={[
                        formData.latitude || 20.5937,
                        formData.longitude || 78.9629,
                      ]}
                      zoom={formData.latitude ? 15 : 5}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <LocationPicker onLocationSelect={handleMapClick} />
                      {formData.latitude && formData.longitude && (
                        <>
                          <Marker
                            position={[
                              parseFloat(formData.latitude),
                              parseFloat(formData.longitude),
                            ]}
                          />
                          <Circle
                            center={[
                              parseFloat(formData.latitude),
                              parseFloat(formData.longitude),
                            ]}
                            radius={parseInt(formData.radius_meters) || 100}
                            pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.2 }}
                          />
                        </>
                      )}
                    </MapContainer>
                    <p className="text-xs text-gray-500 mt-1">
                      Click on the map to select location
                    </p>
                  </div>
                )}

                <div className="form-control col-span-2">
                  <label className="label cursor-pointer justify-start gap-3">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-primary"
                      checked={formData.is_primary}
                      onChange={(e) =>
                        setFormData({ ...formData, is_primary: e.target.checked })
                      }
                    />
                    <span className="label-text">Set as primary office location</span>
                  </label>
                </div>
              </div>

              <div className="modal-action">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editMode ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop" onClick={() => setShowModal(false)}></div>
        </div>
      )}
    </div>
  );
}
