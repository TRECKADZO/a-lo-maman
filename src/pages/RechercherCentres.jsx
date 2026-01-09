import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, MapPin, Filter, X, Phone, Mail, Star, Navigation, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import CarteInteractiveCentres from '../components/centres/CarteInteractiveCentres';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const SERVICES_DISPONIBLES = [
  { value: 'consultation_prenatale', label: 'Consultation prénatale' },
  { value: 'accouchement', label: 'Accouchement' },
  { value: 'pediatrie', label: 'Pédiatrie' },
  { value: 'echographie', label: 'Échographie' },
  { value: 'laboratoire', label: 'Laboratoire' },
  { value: 'urgences', label: 'Urgences' },
  { value: 'planification_familiale', label: 'Planification familiale' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'suivi_post_partum', label: 'Suivi post-partum' }
];

const EQUIPEMENTS_DISPONIBLES = [
  'Échographe', 'Doppler', 'Monitoring fœtal', 'Table d\'accouchement',
  'Incubateur', 'Respirateur', 'Laboratoire d\'analyses', 'Bloc opératoire',
  'Ambulance', 'Pharmacie', 'Matériel de réanimation'
];

const ASSURANCES_COURANTES = [
  'CMU Universelle', 'MUGEF-CI', 'CGRAE', 'Allianz', 'AXA',
  'NSIA Assurances', 'Atlantique Assurances', 'SAHAM Assurance'
];

const regions = [
  "Abidjan", "Agnéby-Tiassa", "Bafing", "Bagoué", "Bélier", "Béré",
  "Bounkani", "Cavally", "Folon", "Gbêkê", "Gbôklé", "Gôh", "Gontougo",
  "Grands-Ponts", "Guémon", "Hambol", "Haut-Sassandra", "Iffou",
  "Indénié-Djuablin", "Kabadougou", "La Mé", "Lôh-Djiboua", "Marahoué",
  "Moronou", "N'Zi", "Nawa", "Poro", "San-Pédro", "Sud-Comoé",
  "Tchologo", "Tonkpi", "Worodougou", "Yamoussoukro"
].sort();

export default function RechercherCentres() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedEquipements, setSelectedEquipements] = useState([]);
  const [selectedAssurances, setSelectedAssurances] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' ou 'map'
  const [selectedCentre, setSelectedCentre] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const { data: centres = [], isLoading } = useQuery({
    queryKey: ['centres_recherche'],
    queryFn: async () => {
      const data = await base44.entities.Clinique.filter({ 
        statut_validation: 'approuve',
        onboarding_completed: true
      });
      return data;
    }
  });

  // Obtenir la géolocalisation de l'utilisateur
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => console.log('Géolocalisation désactivée')
      );
    }
  }, []);

  // Fonction de calcul de distance approximative (en km)
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

  // Filtrage intelligent des centres
  const filteredCentres = useMemo(() => {
    let results = centres;

    // Recherche textuelle
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(c => 
        c.nom?.toLowerCase().includes(query) ||
        c.ville?.toLowerCase().includes(query) ||
        c.region?.toLowerCase().includes(query) ||
        c.type_etablissement?.toLowerCase().includes(query)
      );
    }

    // Filtre par région
    if (selectedRegion) {
      results = results.filter(c => c.region === selectedRegion);
    }

    // Filtre par services
    if (selectedServices.length > 0) {
      results = results.filter(c => 
        selectedServices.every(s => c.services_offerts?.includes(s))
      );
    }

    // Filtre par équipements
    if (selectedEquipements.length > 0) {
      results = results.filter(c => 
        selectedEquipements.some(e => c.equipements?.includes(e))
      );
    }

    // Filtre par assurances
    if (selectedAssurances.length > 0) {
      results = results.filter(c => 
        selectedAssurances.some(a => c.assurances_partenaires?.includes(a))
      );
    }

    // Calcul de la distance si géolocalisation disponible
    if (userLocation) {
      results = results.map(c => ({
        ...c,
        distance: c.latitude && c.longitude 
          ? calculateDistance(userLocation.lat, userLocation.lng, c.latitude, c.longitude)
          : null
      })).sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    }

    return results;
  }, [centres, searchQuery, selectedRegion, selectedServices, selectedEquipements, selectedAssurances, userLocation]);

  // Suggestions intelligentes
  const suggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    
    const query = searchQuery.toLowerCase();
    const results = new Set();
    
    centres.forEach(c => {
      if (c.nom?.toLowerCase().includes(query)) results.add(c.nom);
      if (c.ville?.toLowerCase().includes(query)) results.add(c.ville);
      if (c.region?.toLowerCase().includes(query)) results.add(c.region);
    });
    
    return Array.from(results).slice(0, 5);
  }, [searchQuery, centres]);

  const toggleService = (service) => {
    setSelectedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const toggleEquipement = (equipement) => {
    setSelectedEquipements(prev => 
      prev.includes(equipement) 
        ? prev.filter(e => e !== equipement)
        : [...prev, equipement]
    );
  };

  const toggleAssurance = (assurance) => {
    setSelectedAssurances(prev => 
      prev.includes(assurance) 
        ? prev.filter(a => a !== assurance)
        : [...prev, assurance]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('');
    setSelectedServices([]);
    setSelectedEquipements([]);
    setSelectedAssurances([]);
  };

  const activeFiltersCount = 
    (selectedRegion ? 1 : 0) + 
    selectedServices.length + 
    selectedEquipements.length + 
    selectedAssurances.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 pb-24">
      {/* Header fixe */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-4">
          {/* Barre de recherche principale */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, ville, région..."
              className="pl-10 pr-4 py-6 text-base rounded-full shadow-md"
            />
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border z-50">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setSearchQuery(suggestion)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <Search className="w-4 h-4 inline-block mr-2 text-gray-400" />
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contrôles */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={showFilters ? "default" : "outline"}
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
              size="sm"
            >
              <Filter className="w-4 h-4" />
              Filtres
              {activeFiltersCount > 0 && (
                <Badge className="ml-1 bg-purple-600">{activeFiltersCount}</Badge>
              )}
            </Button>

            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Toutes</SelectItem>
                {regions.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 ml-auto">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
                size="sm"
              >
                Liste
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                onClick={() => setViewMode('map')}
                size="sm"
              >
                <MapPin className="w-4 h-4 mr-1" />
                Carte
              </Button>
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                onClick={clearFilters}
                size="sm"
                className="text-red-600"
              >
                <X className="w-4 h-4 mr-1" />
                Effacer
              </Button>
            )}
          </div>

          {/* Panneau de filtres avancés */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border space-y-4">
              {/* Services */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Services recherchés</h4>
                <div className="flex flex-wrap gap-2">
                  {SERVICES_DISPONIBLES.map(service => (
                    <Badge
                      key={service.value}
                      variant={selectedServices.includes(service.value) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleService(service.value)}
                    >
                      {service.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Équipements */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Équipements disponibles</h4>
                <div className="flex flex-wrap gap-2">
                  {EQUIPEMENTS_DISPONIBLES.map(eq => (
                    <Badge
                      key={eq}
                      variant={selectedEquipements.includes(eq) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleEquipement(eq)}
                    >
                      {eq}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Assurances */}
              <div>
                <h4 className="font-semibold mb-2 text-sm">Assurances acceptées</h4>
                <div className="flex flex-wrap gap-2">
                  {ASSURANCES_COURANTES.map(ass => (
                    <Badge
                      key={ass}
                      variant={selectedAssurances.includes(ass) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleAssurance(ass)}
                    >
                      {ass}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Résumé des résultats */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-600">
            <span className="font-bold text-purple-600">{filteredCentres.length}</span> centre(s) trouvé(s)
          </p>
        </div>

        {/* Vue Liste */}
        {viewMode === 'list' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto" />
                <p className="text-gray-600 mt-3">Chargement...</p>
              </div>
            ) : filteredCentres.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun centre ne correspond à vos critères</p>
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Effacer les filtres
                  </Button>
                </CardContent>
              </Card>
            ) : (
              filteredCentres.map(centre => (
                <Card key={centre.id} className="hover:shadow-xl transition-shadow cursor-pointer" onClick={() => setSelectedCentre(centre)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{centre.nom}</CardTitle>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline" className="bg-purple-50">
                            {centre.type_etablissement?.replace(/_/g, ' ')}
                          </Badge>
                          {centre.note_moyenne > 0 && (
                            <Badge variant="outline" className="bg-yellow-50">
                              <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                              {centre.note_moyenne.toFixed(1)} ({centre.nombre_avis})
                            </Badge>
                          )}
                          {centre.distance && (
                            <Badge variant="outline" className="bg-green-50">
                              <Navigation className="w-3 h-3 mr-1" />
                              {centre.distance.toFixed(1)} km
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {centre.ville}, {centre.region}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {centre.description && (
                      <p className="text-sm text-gray-700 line-clamp-2">{centre.description}</p>
                    )}

                    {centre.services_offerts?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Services</p>
                        <div className="flex flex-wrap gap-1">
                          {centre.services_offerts.slice(0, 4).map(s => (
                            <Badge key={s} variant="outline" className="text-xs">
                              {SERVICES_DISPONIBLES.find(sd => sd.value === s)?.label || s}
                            </Badge>
                          ))}
                          {centre.services_offerts.length > 4 && (
                            <Badge variant="outline" className="text-xs">+{centre.services_offerts.length - 4}</Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="flex-1" asChild>
                        <Link to={`${createPageUrl('ProfilCentrePublic')}?centreId=${centre.id}`}>
                          Voir le profil
                        </Link>
                      </Button>
                      {centre.telephone && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={`tel:${centre.telephone}`}>
                            <Phone className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Vue Carte */}
        {viewMode === 'map' && (
          <CarteInteractiveCentres 
            centres={filteredCentres}
            userLocation={userLocation}
            onSelectCentre={setSelectedCentre}
          />
        )}
      </div>

      {/* Modal Détails Centre */}
      {selectedCentre && (
        <Dialog open={!!selectedCentre} onOpenChange={() => setSelectedCentre(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedCentre.nom}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-4 pr-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{selectedCentre.type_etablissement?.replace(/_/g, ' ')}</Badge>
                  {selectedCentre.note_moyenne > 0 && (
                    <Badge variant="outline">
                      <Star className="w-3 h-3 mr-1 fill-yellow-500 text-yellow-500" />
                      {selectedCentre.note_moyenne.toFixed(1)}
                    </Badge>
                  )}
                </div>

                {selectedCentre.description && (
                  <p className="text-gray-700">{selectedCentre.description}</p>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold mb-1">📍 Adresse</p>
                    <p className="text-sm text-gray-600">
                      {selectedCentre.adresse}<br />
                      {selectedCentre.ville}, {selectedCentre.region}
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">📞 Contact</p>
                    <p className="text-sm text-gray-600">
                      {selectedCentre.telephone}<br />
                      {selectedCentre.email_contact}
                    </p>
                  </div>
                </div>

                {selectedCentre.services_offerts?.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">🏥 Services offerts</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCentre.services_offerts.map(s => (
                        <Badge key={s} variant="outline">
                          {SERVICES_DISPONIBLES.find(sd => sd.value === s)?.label || s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCentre.equipements?.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">🔬 Équipements</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCentre.equipements.map(e => (
                        <Badge key={e} variant="outline">{e}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCentre.assurances_partenaires?.length > 0 && (
                  <div>
                    <p className="font-semibold mb-2">💳 Assurances acceptées</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCentre.assurances_partenaires.map(a => (
                        <Badge key={a} variant="outline">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t">
                  <Button className="flex-1" asChild>
                    <Link to={`${createPageUrl('ProfilCentrePublic')}?centreId=${selectedCentre.id}`}>
                      Voir le profil complet
                    </Link>
                  </Button>
                  {selectedCentre.telephone && (
                    <Button variant="outline" asChild>
                      <a href={`tel:${selectedCentre.telephone}`}>
                        <Phone className="w-4 h-4 mr-2" />
                        Appeler
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}