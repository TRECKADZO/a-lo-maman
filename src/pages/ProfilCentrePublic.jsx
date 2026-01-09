import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapPin, Phone, Mail, Clock, Building2, Bed, Shield, 
  CheckCircle, Star, Calendar, Loader2, Award, Heart,
  Stethoscope, Users
} from 'lucide-react';

const JOURS_SEMAINE = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const SERVICE_LABELS = {
  consultation_prenatale: 'Consultation prénatale',
  accouchement: 'Accouchement',
  pediatrie: 'Pédiatrie',
  echographie: 'Échographie',
  laboratoire: 'Laboratoire',
  urgences: 'Urgences',
  planification_familiale: 'Planification familiale',
  vaccination: 'Vaccination',
  suivi_post_partum: 'Suivi post-partum'
};

export default function ProfilCentrePublic() {
  const [searchParams] = useSearchParams();
  const centreId = searchParams.get('id');

  const { data: centre, isLoading } = useQuery({
    queryKey: ['centre_public', centreId],
    queryFn: async () => {
      const centres = await base44.entities.Clinique.list();
      return centres.find(c => c.id === centreId);
    },
    enabled: !!centreId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!centre) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Centre introuvable</h2>
            <p className="text-gray-600">Le centre de santé que vous recherchez n'existe pas.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header avec photo */}
      <div className="relative h-64 bg-gradient-to-r from-purple-600 to-pink-600">
        {centre.photo_centre ? (
          <img 
            src={centre.photo_centre} 
            alt={centre.nom}
            className="w-full h-full object-cover opacity-50"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Building2 className="w-24 h-24 text-white/50" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="container mx-auto px-4 pb-8">
            <h1 className="text-4xl font-bold text-white mb-2">{centre.nom}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="bg-white/20 text-white backdrop-blur-sm">
                {centre.type_etablissement?.replace('_', ' ')}
              </Badge>
              {centre.statut_validation === 'approuve' && (
                <Badge className="bg-green-500/80 text-white backdrop-blur-sm">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Vérifié
                </Badge>
              )}
              {centre.note_moyenne > 0 && (
                <div className="flex items-center gap-1 text-white">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">{centre.note_moyenne.toFixed(1)}</span>
                  <span className="text-sm opacity-80">({centre.nombre_avis} avis)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {centre.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-pink-500" />
                    À propos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{centre.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Services */}
            {centre.services_offerts?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-teal-500" />
                    Services offerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {centre.services_offerts.map(service => (
                      <Badge key={service} variant="secondary" className="text-sm py-1">
                        {SERVICE_LABELS[service] || service}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Équipements */}
            {centre.equipements?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-purple-500" />
                    Équipements disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-2">
                    {centre.equipements.map((equipement, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>{equipement}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {centre.certifications?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Certifications et accréditations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {centre.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-blue-500" />
                        <span className="text-sm">{cert}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Galerie photos */}
            {centre.photos_galerie?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Galerie photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {centre.photos_galerie.map((photo, index) => (
                      <img 
                        key={index}
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-40 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne latérale - Infos pratiques */}
          <div className="space-y-6">
            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informations de contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Adresse</p>
                    <p className="text-sm text-gray-600">
                      {centre.adresse || 'Non renseignée'}<br />
                      {centre.ville}, {centre.region}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Téléphone</p>
                    <a href={`tel:${centre.telephone}`} className="text-sm text-purple-600 hover:underline">
                      {centre.telephone}
                    </a>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <a href={`mailto:${centre.email_contact}`} className="text-sm text-purple-600 hover:underline break-all">
                      {centre.email_contact}
                    </a>
                  </div>
                </div>

                {centre.capacite_lits > 0 && (
                  <div className="flex items-start gap-3">
                    <Bed className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Capacité</p>
                      <p className="text-sm text-gray-600">{centre.capacite_lits} lits</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Horaires */}
            {centre.horaires_ouverture && Object.keys(centre.horaires_ouverture).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Horaires d'ouverture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {JOURS_SEMAINE.map(jour => (
                      centre.horaires_ouverture[jour] && (
                        <div key={jour} className="flex justify-between text-sm">
                          <span className="capitalize font-medium">{jour}</span>
                          <span className="text-gray-600">{centre.horaires_ouverture[jour]}</span>
                        </div>
                      )
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Assurances */}
            {centre.assurances_partenaires?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Assurances acceptées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {centre.assurances_partenaires.map((assurance, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {assurance}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CTA */}
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              <Calendar className="w-4 h-4 mr-2" />
              Prendre rendez-vous
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}