import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { TripPlan, Activity } from "@/types/trip";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const hotelIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  className: "hue-rotate-[200deg]",
});

interface Props {
  trip: TripPlan;
  selectedActivity?: Activity | null;
}

function FitBounds({ trip }: { trip: TripPlan }) {
  const map = useMap();
  useEffect(() => {
    const allCoords: [number, number][] = [];
    trip.itinerary.forEach((day) =>
      day.activities.forEach((a) => allCoords.push([a.location.lat, a.location.lng]))
    );
    trip.hotels.forEach((h) => allCoords.push([h.location.lat, h.location.lng]));
    if (allCoords.length > 0) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [30, 30] });
    }
  }, [trip, map]);
  return null;
}

function FlyToActivity({ activity }: { activity: Activity }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([activity.location.lat, activity.location.lng], 15, { duration: 0.8 });
  }, [activity, map]);
  return null;
}

export default function TripMap({ trip, selectedActivity }: Props) {
  const allActivities = trip.itinerary.flatMap((d) => d.activities);
  const center = allActivities.length > 0
    ? [allActivities[0].location.lat, allActivities[0].location.lng] as [number, number]
    : [28.6139, 77.209] as [number, number];

  const routeCoords: [number, number][] = allActivities.map((a) => [
    a.location.lat,
    a.location.lng,
  ]);

  return (
    <MapContainer center={center} zoom={13} className="w-full h-full min-h-[400px] rounded-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds trip={trip} />
      {selectedActivity && <FlyToActivity activity={selectedActivity} />}

      {allActivities.map((activity, i) => (
        <Marker key={`act-${i}`} position={[activity.location.lat, activity.location.lng]}>
          <Popup>
            <strong>{activity.title}</strong>
            <br />
            <span>{activity.time} — {activity.location.name}</span>
          </Popup>
        </Marker>
      ))}

      {trip.hotels.map((hotel, i) => (
        <Marker key={`hotel-${i}`} position={[hotel.location.lat, hotel.location.lng]} icon={hotelIcon}>
          <Popup>
            <strong>🏨 {hotel.name}</strong>
            <br />
            ${hotel.pricePerNight}/night — ⭐ {hotel.rating}
          </Popup>
        </Marker>
      ))}

      {routeCoords.length > 1 && (
        <Polyline positions={routeCoords} color="hsl(199, 89%, 48%)" weight={3} opacity={0.6} dashArray="8 4" />
      )}
    </MapContainer>
  );
}
