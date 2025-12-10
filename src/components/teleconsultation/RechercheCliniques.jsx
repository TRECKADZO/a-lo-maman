import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  Calendar,
  Star,
  Search,
  CheckCircle,
  Shield
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RechercheCliniques({ onSelectClinique }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  const { data: cliniques = [] } = useQuery({
    queryKey: ['cliniques_approuvees'],
    queryFn: async () => {
      const all = await base44.entities.Clinique.list();
      return all.filter(c => c.statut_validation === 'approuve');
    },
  });

  const { data: professionnels = [] } = useQuery({
    queryKey: ['professionnels'],
    queryFn: () => base44.entities.Professionnel.list(),
  });

  const regions = ['Abidjan', 'Bouaké', 'Daloa', 'Yamoussoukro', 'San-Pédro', 'Korhogo', 'Man'];
  
  const types = [
    { value: 'clinique_privee', label: 'Clinique privée' },
    { value: 'hopital_public', label: 'Hôpital public' },
    { value: 'centre_sante', label: 'Centre de santé' },
    { value: 'maternite', label: 'Maternité' }
  ];

  const filteredCliniques = cliniques.filter(clinique => {
    const matchSearch = searchTerm === '' || 
      clinique.nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clinique.ville?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchRegion = selectedRegion === 'all' || clinique.region === selectedRegion;
    const matchType = selectedType === 'all' || clinique.type_etablissement === selectedType;
    
    return matchSearch && matchRegion && matchType;
  });

  const getProfessionalsCount = (cliniqueId, professionnelIds) => {
    if (!professionnelIds) return 0;
    return professionnels.filter(p => professionnelIds.includes(p.id)).length;
  };

  const getServicesIcons = (services) => {
    const icons = {
      'consultation_prenatale': '🤰',
      'accouchement': '👶',
      'pediatrie': '🧒',
      'echographie': '🔬',
      'laboratoire': '🧪',
      'urgences': '🚑',
      'planification_familiale': '💊'
    };
    return services?.slice(0, 4).map(s => icons[s] || '🏥') || [];
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher une clinique par nom ou ville..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select value={selectedRegion} onValueChange={setSelectedRegion}>
              <SelectTrigger>
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les régions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Type d'établissement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {types.map(type => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <div className="text-sm text-gray-600 mb-4">
        {filteredCliniques.length} établissement{filteredCliniques.length > 1 ? 's' : ''} trouvé{filteredCliniques.length > 1 ? 's' : ''}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCliniques.map((clinique) => {
          const proCount = getProfessionalsCount(clinique.id, clinique.professionnels_ids);
          const serviceIcons = getServicesIcons(clinique.services_offerts);
          
          return (
            <Card key={clinique.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-2">{clinique.nom}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {types.find(t => t.value === clinique.type_etablissement)?.label}
                        </Badge>
                        {clinique.api_fhir_enabled && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            FHIR
                          </Badge>
                        )}
                        {clinique.compte_verifie && (
                          <Badge className="bg-blue-100 text-blue-800 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Vérifié
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-3">
                {/* Localisation */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-teal-500" />
                  <span>{clinique.ville}, {clinique.region}</span>
                </div>

                {/* Contact */}
                <div className="space-y-1">
                  {clinique.telephone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-teal-500" />
                      <span>{clinique.telephone}</span>
                    </div>
                  )}
                  {clinique.email_contact && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-teal-500" />
                      <span className="truncate">{clinique.email_contact}</span>
                    </div>
                  )}
                </div>

                {/* Professionnels */}
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <Users className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">{proCount} professionnel{proCount > 1 ? 's' : ''}</span>
                </div>

                {/* Services */}
                {serviceIcons.length > 0 && (
                  <div className="flex gap-1 text-2xl">
                    {serviceIcons.map((icon, idx) => (
                      <span key={idx}>{icon}</span>
                    ))}
                  </div>
                )}

                {/* Stats */}
                {clinique.statistiques_mois && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <p className="text-xs text-gray-600">Consultations</p>
                      <p className="text-lg font-bold text-blue-600">
                        {clinique.statistiques_mois.consultations || 0}
                      </p>
                    </div>
                    <div className="text-center p-2 bg-green-50 rounded">
                      <p className="text-xs text-gray-600">Satisfaction</p>
                      <p className="text-lg font-bold text-green-600 flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-current" />
                        {clinique.statistiques_mois.taux_satisfaction || 0}%
                      </p>
                    </div>
                  </div>
                )}

                {/* Action */}
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                  onClick={() => onSelectClinique(clinique)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Prendre rendez-vous
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredCliniques.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">Aucune clinique trouvée</p>
          <p className="text-gray-400 text-sm">Essayez de modifier vos filtres</p>
        </div>
      )}
    </div>
  );
}