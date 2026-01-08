import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MapPin, Navigation, Phone, Clock, 
  CheckCircle, Star, Stethoscope, Search,
  AlertCircle, Loader2
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeMapView({ center }) {
  const map = useMap();
  map.setView(center, 12);
  return null;
}

export default function RechercheCentreEcho({ onSelectCentre, typeEchographie }) {
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'map'

  const { data: centres = [], isLoading } = useQuery({
    queryKey: ['centres_teleecho'],
    queryFn: async () => {
      const centres = await base44.entities.CentreTeleEchographie.filter({ actif: true });
      return centres;
    },
  });

  useEffect(() => {
    // Tenter de géolocaliser l'utilisateur
    if (navigator.geolocation) {
      setLoadingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoadingLocation(false);
        },
        () => {
          setLoadingLocation(false);
        }
      );
    }
  }, []);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Rayon de la Terre en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const centresAvecDistance = centres
    .map(centre => ({
      ...centre,
      distance: userLocation && centre.latitude && centre.longitude
        ? calculateDistance(userLocation.lat, userLocation.lng, centre.latitude, centre.longitude)
        : null
    }))
    .filter(centre => {
      const matchRegion = selectedRegion === 'all' || centre.region === selectedRegion;
      const matchSearch = !searchQuery || 
        centre.nom_centre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        centre.ville.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = !typeEchographie || 
        (centre.types_echographie || []).includes(typeEchographie);
      
      return matchRegion && matchSearch && matchType;
    })
    .sort((a, b) => {
      if (a.distance && b.distance) return a.distance - b.distance;
      if (a.distance) return -1;
      if (b.distance) return 1;
      return 0;
    });

  const regions = [...new Set(centres.map(c => c.region))];
  const centreParDefaut = centresAvecDistance[0];
  const mapCenter = userLocation || 
    (centreParDefaut && centreParDefaut.latitude && centreParDefaut.longitude
      ? { lat: centreParDefaut.latitude, lng: centreParDefaut.longitude }
      : { lat: 5.3600, lng: -4.0083 }); // Abidjan par défaut

  return (
    <div className="space-y-4">
      {/* Recherche et filtres */}
      <Card className="shadow-lg">
        <CardContent className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher un centre près de chez vous..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
              className="px-4"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          </div>

          {loadingLocation && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Localisation en cours...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vue Carte */}
      {viewMode === 'map' && (
        <Card className="shadow-lg overflow-hidden">
          <div style={{ height: '400px', width: '100%' }}>
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={userLocation ? 12 : 8}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              
              {userLocation && (
                <Marker position={[userLocation.lat, userLocation.lng]}>
                  <Popup>Votre position</Popup>
                </Marker>
              )}

              {centresAvecDistance.map(centre => (
                centre.latitude && centre.longitude && (
                  <Marker 
                    key={centre.id} 
                    position={[centre.latitude, centre.longitude]}
                  >
                    <Popup>
                      <div className="p-2">
                        <p className="font-bold">{centre.nom_centre}</p>
                        <p className="text-xs">{centre.ville}</p>
                        {centre.distance && (
                          <p className="text-xs text-blue-600">{centre.distance.toFixed(1)} km</p>
                        )}
                        <Button
                          size="sm"
                          onClick={() => onSelectCentre(centre)}
                          className="mt-2 w-full bg-pink-500"
                        >
                          Choisir ce centre
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                )
              ))}
              
              <ChangeMapView center={[mapCenter.lat, mapCenter.lng]} />
            </MapContainer>
          </div>
        </Card>
      )}

      {/* Vue Liste */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            {centresAvecDistance.length} centre(s) disponible(s)
            {typeEchographie && ` pour échographie ${typeEchographie}`}
          </p>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
            </div>
          ) : centresAvecDistance.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">Aucun centre trouvé dans cette région</p>
              </CardContent>
            </Card>
          ) : (
            centresAvecDistance.map((centre, index) => (
              <Card 
                key={centre.id} 
                className={`shadow-md hover:shadow-lg transition-all cursor-pointer ${
                  index === 0 && centre.distance ? 'border-2 border-pink-300' : ''
                }`}
                onClick={() => onSelectCentre(centre)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-6 h-6 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{centre.nom_centre}</h3>
                          <p className="text-sm text-gray-600">{centre.ville}, {centre.region}</p>
                        </div>
                        {index === 0 && centre.distance && (
                          <Badge className="bg-pink-500 text-white flex-shrink-0 ml-2">
                            Le plus proche
                          </Badge>
                        )}
                      </div>

                      {/* Distance */}
                      {centre.distance && (
                        <div className="flex items-center gap-2 mb-2">
                          <Navigation className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-semibold text-blue-600">
                            {centre.distance.toFixed(1)} km
                          </span>
                        </div>
                      )}

                      {/* Équipements */}
                      <div className="flex flex-wrap gap-1 mb-2">
                        {(centre.materiel_disponible || []).map(mat => (
                          <Badge key={mat} variant="outline" className="text-xs">
                            {mat.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>

                      {/* Sage-femme */}
                      {centre.sage_femme_nom && (
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Stethoscope className="w-4 h-4 text-teal-600" />
                          <span>{centre.sage_femme_nom}</span>
                        </div>
                      )}

                      {/* Note */}
                      {centre.nombre_avis > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-sm font-semibold">
                            {centre.note_moyenne.toFixed(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({centre.nombre_avis} avis)
                          </span>
                        </div>
                      )}

                      {/* Contact */}
                      {centre.telephone && (
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${centre.telephone}`} className="hover:text-pink-600">
                            {centre.telephone}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCentre(centre);
                    }}
                    className="w-full mt-4 bg-gradient-to-r from-pink-500 to-rose-600"
                  >
                    Prendre rendez-vous ici
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}