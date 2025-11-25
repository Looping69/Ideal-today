
import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Property } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import L from "leaflet";

// Fix for default marker icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PropertyMapProps {
  properties: Property[];
  onPropertyClick: (property: Property) => void;
  apiKey?: string;
}

const defaultCenter = {
  lat: -29.8587,
  lng: 31.0218, // Durban
};

function MapController({ properties }: { properties: Property[] }) {
  const map = useMap();

  useEffect(() => {
    if (properties.length > 0) {
      const bounds = L.latLngBounds(properties.map(p => [p.coordinates.lat, p.coordinates.lng]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [properties, map]);

  return null;
}

export default function PropertyMap({ properties = [], onPropertyClick }: PropertyMapProps) {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden z-0 relative">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={6}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController properties={properties} />

        {(properties || []).map((property) => (
          <Marker
            key={property.id}
            position={[property.coordinates.lat, property.coordinates.lng]}
            eventHandlers={{
              click: () => setSelectedProperty(property),
            }}
          >
            <Popup>
              <div className="w-64 p-1">
                <div className="relative h-32 w-full mb-2 rounded-lg overflow-hidden">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="font-semibold text-sm mb-1">{property.title}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <Star className="w-3 h-3 fill-black text-black" />
                  <span>{property.rating}</span>
                  <span>({property.reviews})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm">R{property.price} <span className="font-normal text-gray-500">/ night</span></span>
                  <Button 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={() => onPropertyClick(property)}
                  >
                    View
                  </Button>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
