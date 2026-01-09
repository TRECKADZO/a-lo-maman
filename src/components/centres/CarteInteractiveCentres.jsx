import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Building2, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Icône personnalisée pour le centre de santé
const centreIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOGI1Y2Y2IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMiAyMGgyMCIvPjxwYXRoIGQ9Ik01IDIwdi02Ii8+PHBhdGggZD0ibTYgMTQgMS00Ii8+PHBhdGggZD0iTTkgMjB2LTloNmw0IDE1Ii8+PHBhdGggZD0iTTE1IDIwdi03Ii8+PHBhdGggZD0iTTE5IDIwdi0xMSIvPjxwYXRoIGQ9Im0yMCA5LTQtOCIvPjwvc3ZnPg==',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

// Icône pour la position de l'utilisateur
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjM2I4MmY2IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0Ii8+PHBhdGggZD0iTTEyIDJ2MiIvPjxwYXRoIGQ9Ik0xMiAyMHYyIi8+PHBhdGggZD0ibTQuOTMgNC45MyAxLjQxIDEuNDEiLz48cGF0aCBkPSJtMTcuNjYgMTcuNjYgMS40MSAxLjQxIi8+PHBhdGggZD0iTTIgMTJoMiIvPjxwYXRoIGQ9Ik0yMCAxMmgyIi8+PHBhdGggZD0ibTYuMzQgMTcuNjYtMS40MSAxLjQxIi8+PHBhdGggZD0ibTE5LjA3IDQuOTMtMS40MSAxLjQxIi8+PC9zdmc+',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

// Composant pour centrer la carte sur les marqueurs
function MapBounds({ centres, userLocation }) {
  const map = useMap();

  useEffect(() => {
    if (centres.length === 0 && !userLocation) return;

    const bounds = [];

    // Ajouter les centres avec coordonnées
    centres.forEach(c => {
      if (c.latitude && c.longitude) {
        bounds.push([c.latitude, c.longitude]);
      }
    });

    // Ajouter la position de l'utilisateur
    if (userLocation) {
      bounds.push([userLocation.lat, userLocation.lng]);
    }

    // Si on a des coordonnées, ajuster la vue
    if (bounds.length > 0) {
      if (bounds.length === 1) {
        map.setView(bounds[0], 13);
      } else {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else {
      // Vue par défaut sur la Côte d'Ivoire
      map.setView([7.539989, -5.54708], 7);
    }
  }, [centres, userLocation, map]);

  return null;
}

export default function CarteInteractiveCentres({ centres, userLocation, onSelectCentre }) {
  const mapRef = useRef(null);

  // Centres avec coordonnées valides
  const centresWithCoords = centres.filter(c => c.latitude && c.longitude);

  return (
    <div className="relative w-full h-[calc(100vh-280px)] rounded-xl overflow-hidden shadow-xl border">
      {centresWithCoords.length === 0 && !userLocation ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 p-8 text-center">
          <MapPin className="w-16 h-16 text-gray-300 mb-4" />
          <p className="text-gray-600 font-medium mb-2">Aucun centre avec géolocalisation</p>
          <p className="text-sm text-gray-500">
            Les centres affichés dans la liste n'ont pas encore renseigné leurs coordonnées GPS
          </p>
        </div>
      ) : null}

      <MapContainer
        ref={mapRef}
        center={[7.539989, -5.54708]} // Centre de la Côte d'Ivoire
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds centres={centresWithCoords} userLocation={userLocation} />

        {/* Marqueur de l'utilisateur */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <div className="p-2 text-center">
                <p className="font-semibold text-blue-600">📍 Vous êtes ici</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marqueurs des centres */}
        {centresWithCoords.map(centre => (
          <Marker
            key={centre.id}
            position={[centre.latitude, centre.longitude]}
            icon={centreIcon}
          >
            <Popup>
              <div className="p-2 min-w-[250px]">
                <h3 className="font-bold text-base mb-2">{centre.nom}</h3>
                <div className="space-y-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {centre.type_etablissement?.replace(/_/g, ' ')}
                  </Badge>
                  {centre.note_moyenne > 0 && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                      {centre.note_moyenne.toFixed(1)}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {centre.ville}, {centre.region}
                </p>
                {centre.distance && (
                  <p className="text-xs text-green-600 mb-2">
                    📍 À {centre.distance.toFixed(1)} km de vous
                  </p>
                )}
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onSelectCentre(centre)}
                >
                  Voir les détails
                </Button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Légende */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-[1000] text-xs">
        <p className="font-semibold mb-2">Légende</p>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-500" />
            <span>Centre de santé</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
              <span>Votre position</span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-gray-500 mt-2">
          {centresWithCoords.length} centre(s) sur la carte
        </p>
      </div>
    </div>
  );
}