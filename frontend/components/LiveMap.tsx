import React, { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { Ad } from "../types";
import { COUNTY_COORDINATES } from "../data/countyCoordinates";
import "leaflet/dist/leaflet.css";

// Fix pentru iconițele implicite Leaflet în React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Helper pentru creare iconițe personalizate cu Tailwind
const createDivIcon = (colorClass: string, iconSvg: string) => {
  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-9 h-9 ${colorClass} rounded-full border-2 border-white shadow-xl flex items-center justify-center transform transition-transform hover:scale-110">
          ${iconSvg}
        </div>
        <div class="absolute -bottom-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${colorClass.replace("bg-", "border-t-")}"></div>
      </div>
    `,
    iconSize: [36, 45],
    iconAnchor: [18, 45],
    popupAnchor: [0, -45],
  });
};

const producerIcon = createDivIcon(
  "bg-emerald-600",
  `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>`,
);

const startIcon = createDivIcon(
  "bg-blue-600",
  `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
);

const endIcon = createDivIcon(
  "bg-rose-600",
  `<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>`,
);

interface LiveMapProps {
  ads: Ad[];
  routeCounties: string[];
  startCounty?: string;
  endCounty?: string;
  onMarkerClick?: (ad: Ad) => void;
}

// Componentă pentru a forța redimensionarea hărții când se schimbă containerul
const MapInvalidator: React.FC = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Componentă pentru auto-centrare pe punctele de pe rută
const MapAutoCenter: React.FC<{ points: [number, number][] }> = ({
  points,
}) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [70, 70], maxZoom: 9 });
    }
  }, [points, map]);
  return null;
};

export const LiveMap: React.FC<LiveMapProps> = ({
  ads = [],
  routeCounties = [],
  startCounty,
  endCounty,
  onMarkerClick,
}) => {
  const romaniaCenter: [number, number] = [45.9432, 24.9668];

  // Calculăm punctele pentru polilinie și bounds
  const polylinePoints = useMemo(() => {
    return routeCounties
      .map((c) => (COUNTY_COORDINATES as any)[c])
      .filter(Boolean)
      .map((coords) => [coords.lat, coords.lng] as [number, number]);
  }, [routeCounties]);

  return (
    <div className="w-full h-full min-h-[400px] relative z-0">
      <MapContainer
        center={romaniaCenter}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        {/* ⚡️ VARIANTA 100% GRATUITĂ ȘI PREMIUM: Stilul CartoDB Voyager */}
        {/* Are străzi bine definite, culori soft și arată exact ca o aplicație modernă de ridesharing/livrări */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Ruta desenată */}
        {polylinePoints.length > 1 && (
          <Polyline
            positions={polylinePoints}
            pathOptions={{
              color: "#10b981",
              weight: 6,
              opacity: 0.8,
              dashArray: "12, 12",
              lineCap: "round",
            }}
          />
        )}

        {/* Marker Plecare */}
        {startCounty && (COUNTY_COORDINATES as any)[startCounty] && (
          <Marker
            position={[
              (COUNTY_COORDINATES as any)[startCounty].lat,
              (COUNTY_COORDINATES as any)[startCounty].lng,
            ]}
            icon={startIcon}
          >
            <Popup className="custom-popup">
              <div className="font-black text-[10px] uppercase tracking-widest text-blue-600">
                Plecare
              </div>
              <div className="font-bold text-stone-900">{startCounty}</div>
            </Popup>
          </Marker>
        )}

        {/* Marker Sosire */}
        {endCounty && (COUNTY_COORDINATES as any)[endCounty] && (
          <Marker
            position={[
              (COUNTY_COORDINATES as any)[endCounty].lat,
              (COUNTY_COORDINATES as any)[endCounty].lng,
            ]}
            icon={endIcon}
          >
            <Popup>
              <div className="font-black text-[10px] uppercase tracking-widest text-rose-600">
                Destinație
              </div>
              <div className="font-bold text-stone-900">{endCounty}</div>
            </Popup>
          </Marker>
        )}

        {/* Markeri Produse */}
        {ads.map((ad) => {
          const baseCoords = (COUNTY_COORDINATES as any)[ad.county];
          if (!baseCoords) return null;

          // Folosim ID-ul pentru un offset determinist
          const seed = ad.id
            .split("")
            .reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const offsetLat = ((seed % 100) / 100 - 0.5) * 0.15;
          const offsetLng = (((seed * 1.5) % 100) / 100 - 0.5) * 0.15;

          const imageUrl =
            ad.ads_images?.[0]?.url ||
            "https://via.placeholder.com/150?text=Fara+Foto";

          return (
            <Marker
              key={ad.id}
              position={[
                baseCoords.lat + offsetLat,
                baseCoords.lng + offsetLng,
              ]}
              icon={producerIcon}
            >
              <Popup minWidth={160}>
                <div className="flex flex-col gap-2">
                  <div className="w-full h-24 rounded-lg overflow-hidden border border-stone-100">
                    <img
                      src={imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="font-black text-stone-900 text-sm leading-tight">
                      {ad.title}
                    </h4>
                    <p className="text-emerald-600 font-bold text-xs mt-1">
                      {ad.price} RON
                    </p>
                    <p className="text-[10px] text-stone-400 font-medium">
                      {ad.city}, {ad.county}
                    </p>
                  </div>
                  <button
                    onClick={() => onMarkerClick?.(ad)}
                    className="w-full bg-stone-900 text-white text-[10px] font-black py-2 rounded-lg uppercase tracking-tighter hover:bg-emerald-600 transition-colors"
                  >
                    Vezi Anunț
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}

        <MapAutoCenter points={polylinePoints} />
        <MapInvalidator />
      </MapContainer>
    </div>
  );
};
