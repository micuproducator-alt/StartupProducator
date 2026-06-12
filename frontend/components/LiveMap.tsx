import React, { useEffect, useState, useMemo } from "react";
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
  startCounty?: string;
  endCounty?: string;
  onMarkerClick?: (ad: Ad) => void;
  // Callback opțional ca să trimiți înapoi în aplicație detaliile rutei active (ex: distanță, timp sau puncte)
  onActiveRouteInfo?: (info: { distance: number; duration: number }) => void;
}

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

const MapAutoCenter: React.FC<{ points: [number, number][] }> = ({
  points,
}) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 9 });
    }
  }, [points, map]);
  return null;
};

export const LiveMap: React.FC<LiveMapProps> = ({
  ads = [],
  startCounty,
  endCounty,
  onMarkerClick,
  onActiveRouteInfo,
}) => {
  const romaniaCenter: [number, number] = [45.9432, 24.9668];

  // ⚡️ STATE-URI PENTRU RUTE AUTOMATE GENERATE DIN API
  const [fetchedRoutes, setFetchedRoutes] = useState<any[]>([]);
  const [activeRouteIndex, setActiveRouteIndex] = useState<number>(0);

  // Extrege coordonatele din COUNTY_COORDINATES pe baza numelui județului
  const startCoords = useMemo(
    () => (startCounty ? (COUNTY_COORDINATES as any)[startCounty] : null),
    [startCounty],
  );
  const endCoords = useMemo(
    () => (endCounty ? (COUNTY_COORDINATES as any)[endCounty] : null),
    [endCounty],
  );

  // ⚡️ EFECT CARE APLEAZĂ MOTORUL DE ROUTING ÎN MOD AUTOMAT PENTRU TOATĂ HARTA
  useEffect(() => {
    if (!startCoords || !endCoords) {
      setFetchedRoutes([]);
      return;
    }

    const fetchRealRoutes = async () => {
      try {
        // Apelăm API-ul public și gratuit OSRM pentru a cere rute alternative (alternatives=true) și geometrii complete (overview=full)
        const url = `https://router.project-osrm.org/route/v1/driving/${startCoords.lng},${startCoords.lat};${endCoords.lng},${endCoords.lat}?alternatives=true&overview=full&geometries=geojson`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code === "Ok" && data.routes) {
          // Mapăm coordonatele primite [lng, lat] în formatul cerut de Leaflet [lat, lng]
          const formattedRoutes = data.routes.map((route: any) => {
            const leafletCoords = route.geometry.coordinates.map(
              (coord: [number, number]) => [coord[1], coord[0]],
            );
            return {
              coordinates: leafletCoords,
              distance: route.distance, // în metri
              duration: route.duration, // în secunde
            };
          });

          setFetchedRoutes(formattedRoutes);
          setActiveRouteIndex(0); // Resetăm pe prima rută (cea mai rapidă) de fiecare dată când se schimbă destinațiile

          // Anunțăm părintele despre distanța și timpul traseului principal, dacă se dorește afișarea în UI
          if (formattedRoutes[0] && onActiveRouteInfo) {
            onActiveRouteInfo({
              distance: Math.round(formattedRoutes[0].distance / 1000),
              duration: Math.round(formattedRoutes[0].duration / 60),
            });
          }
        }
      } catch (error) {
        console.error(
          "Eroare la calcularea automată a rutelor alternative:",
          error,
        );
      }
    };

    fetchRealRoutes();
  }, [startCoords, endCoords]);

  // Punctele rutei active folosite pentru auto-centrare
  const activeRoutePoints = useMemo(() => {
    return fetchedRoutes[activeRouteIndex]?.coordinates || [];
  }, [fetchedRoutes, activeRouteIndex]);

  return (
    <div className="w-full h-full min-h-[400px] relative z-0">
      <MapContainer
        center={romaniaCenter}
        zoom={7}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* ⚡️ DESENĂM DINAMIC TOATE RUTELE ALTERNATIVE RETURNATE DE MOTORUL DE CĂUTARE */}
        {fetchedRoutes.map((route, index) => {
          const isActive = index === activeRouteIndex;

          return (
            <Polyline
              key={`osrm-route-${index}`}
              positions={route.coordinates}
              eventHandlers={{
                click: () => {
                  setActiveRouteIndex(index);
                  if (onActiveRouteInfo) {
                    onActiveRouteInfo({
                      distance: Math.round(route.distance / 1000),
                      duration: Math.round(route.duration / 60),
                    });
                  }
                },
              }}
              pathOptions={{
                color: isActive ? "#10b981" : "#94a3b8", // Verde pentru activă, gri pentru opțiuni alternative
                weight: isActive ? 6 : 4,
                opacity: isActive ? 0.9 : 0.4,
                dashArray: isActive ? "12, 12" : "6, 6",
                lineCap: "round",
              }}
            />
          );
        })}

        {/* Marker Plecare */}
        {startCoords && (
          <Marker
            position={[startCoords.lat, startCoords.lng]}
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
        {endCoords && (
          <Marker position={[endCoords.lat, endCoords.lng]} icon={endIcon}>
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

        <MapAutoCenter points={activeRoutePoints} />
        <MapInvalidator />
      </MapContainer>
    </div>
  );
};
