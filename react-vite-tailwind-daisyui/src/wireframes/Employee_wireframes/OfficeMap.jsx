import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";

function RecenterMap({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.setView(position, 13);
    }
  }, [position, map]);

  return null;
}

export default function OfficeMap() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
      },
      (err) => {
        console.error(err);
        setError("Unable to retrieve your location");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return (
    <div className="w-full h-80 rounded-xl overflow-hidden border">
      <MapContainer
        center={position || [28.6139, 77.2090]} // fallback: Delhi
        zoom={13}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {position && (
          <>
            <Marker position={position}>
              <Popup>You are here 📍</Popup>
            </Marker>
            <RecenterMap position={position} />
          </>
        )}
      </MapContainer>

      {!position && !error && (
        <p className="text-sm text-gray-500 mt-2">Fetching your location...</p>
      )}
      {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
    </div>
  );
}
