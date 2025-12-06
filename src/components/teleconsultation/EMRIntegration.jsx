import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Heart,
  Baby,
  Pill,
  Syringe,
  ClipboardList,
  AlertTriangle,
  Calendar,
  User,
  Droplet,
  Eye,
  EyeOff,
  Lock,
  Shield,
  Loader2
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format, differenceInYears } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function EMRIntegration({ patientEmail, rendezVousId }) {
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Récupérer les données du patient
  const { data: patientProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ['patient_profile', patientEmail],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: patientEmail });
      return profiles[0] || null;
    },
    enabled: !!patientEmail
  });

  const { data: suiviGrossesse } = useQuery({
    queryKey: ['suivi_grossesse', patientEmail],
    queryFn: async () => {
      const suivis = await base44.entities.SuiviGrossesse.filter({ 
        created_by: patientEmail,
        grossesse_active: true 
      });
      return suivis[0] || null;
    },
    enabled: !!patientEmail
  });

  const { data: enfants = [] } = useQuery({
    queryKey: ['enfants', patientEmail],
    queryFn: async () => {
      return await base44.entities.EnfantCarnet.filter({ created_by: patientEmail });
    },
    enabled: !!patientEmail
  });

  const { data: rdvHistorique = [] } = useQuery({
    queryKey: ['rdv_historique', patientEmail],
    queryFn: async () => {
      const rdvs = await base44.entities.RendezVous.filter(
        { created_by: patientEmail, statut: 'termine' },
        '-date_rdv',
        10
      );
      return rdvs;
    },
    enabled: !!patientEmail
  });

  const { data: suiviContraception } = useQuery({
    queryKey: ['suivi_contraception', patientEmail],
    queryFn: async () => {
      const suivis = await base44.entities.SuiviContraception.filter({ 
        created_by: patientEmail,
        active: true 
      });
      return suivis[0] || null;
    },
    enabled: !!patientEmail
  });

  if (loadingProfile) {
    return (
      <Card className="border-teal-300">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-500 mx-auto mb-3" />
          <p className="text-gray-600">Chargement du dossier patient...</p>
        </CardContent>
      </Card>
    );
  }

  if (!patientProfile) {
    return (
      <Alert className="bg-gray-50 border-gray-300">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>
          Impossible de charger le dossier médical du patient.
        </AlertDescription>
      </Alert>
    );
  }

  const age = patientProfile.date_naissance 
    ? differenceInYears(new Date(), new Date(patientProfile.date_naissance))
    : null;

  return (
    <div className="space-y-4">
      {/* Header avec infos patient */}
      <Card className="border-teal-300 bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-teal-600" />
              Dossier Médical Électronique
            </CardTitle>
            <Badge className="bg-teal-600 text-white">
              <Lock className="w-3 h-3 mr-1" />
              Accès sécurisé
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <p className="text-xs text-gray-600">Patiente</p>
              <p className="font-semibold text-gray-900">{patientProfile.created_by}</p>
            </div>
            
            {age && (
              <div className="space-y-1">
                <p className="text-xs text-gray-600">Âge</p>
                <p className="font-semibold text-gray-900">{age} ans</p>
              </div>
            )}

            {patientProfile.groupe_sanguin && showSensitiveData && (
              <div className="space-y-1">
                <p className="text-xs text-gray-600">Groupe sanguin</p>
                <p className="font-semibold text-gray-900 flex items-center gap-1">
                  <Droplet className="w-4 h-4 text-red-600" />
                  {patientProfile.groupe_sanguin}
                </p>
              </div>
            )}

            {patientProfile.numero_cmu && showSensitiveData && (
              <div className="space-y-1">
                <p className="text-xs text-gray-600">N° CMU</p>
                <p className="font-semibold text-gray-900">{patientProfile.numero_cmu}</p>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSensitiveData(!showSensitiveData)}
            className="w-full"
          >
            {showSensitiveData ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Masquer les données sensibles
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Afficher les données sensibles
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Alertes médicales */}
      {showSensitiveData && (patientProfile.allergies?.length > 0 || patientProfile.maladies_chroniques?.length > 0) && (
        <Alert className="bg-red-50 border-red-300">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription>
            <p className="font-semibold text-red-900 mb-2">⚠️ Alertes médicales importantes</p>
            {patientProfile.allergies?.length > 0 && (
              <div className="mb-2">
                <p className="text-xs font-semibold text-red-800 mb-1">Allergies :</p>
                <div className="flex flex-wrap gap-1">
                  {patientProfile.allergies.map(allergie => (
                    <Badge key={allergie} className="bg-red-600 text-white text-xs">
                      {allergie}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {patientProfile.maladies_chroniques?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-800 mb-1">Maladies chroniques :</p>
                <div className="flex flex-wrap gap-1">
                  {patientProfile.maladies_chroniques.map(maladie => (
                    <Badge key={maladie} className="bg-orange-600 text-white text-xs">
                      {maladie}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Onglets du dossier */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <User className="w-4 h-4 mr-1" />
            Vue d'ensemble
          </TabsTrigger>
          <TabsTrigger value="grossesse">
            <Heart className="w-4 h-4 mr-1" />
            Grossesse
          </TabsTrigger>
          <TabsTrigger value="enfants">
            <Baby className="w-4 h-4 mr-1" />
            Enfants
          </TabsTrigger>
          <TabsTrigger value="historique">
            <ClipboardList className="w-4 h-4 mr-1" />
            Historique
          </TabsTrigger>
        </TabsList>

        {/* Vue d'ensemble */}
        <TabsContent value="overview" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Contraception */}
            {suiviContraception && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Pill className="w-4 h-4 text-rose-600" />
                    <p className="text-sm font-semibold text-gray-900">Contraception active</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    Depuis le {format(new Date(suiviContraception.date_debut), 'dd MMM yyyy', { locale: fr })}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Dernière consultation */}
            {rdvHistorique.length > 0 && (
              <Card className="border-none shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-semibold text-gray-900">Dernière consultation</p>
                  </div>
                  <p className="text-xs text-gray-600">
                    {format(new Date(rdvHistorique[0].date_rdv), 'dd MMM yyyy', { locale: fr })}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{rdvHistorique[0].motif}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Grossesse */}
        <TabsContent value="grossesse">
          {suiviGrossesse ? (
            <Card className="border-none shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">Suivi de grossesse actif</p>
                  <Badge className="bg-pink-100 text-pink-800">En cours</Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 text-xs">DDR</p>
                    <p className="font-medium">
                      {format(new Date(suiviGrossesse.date_derniere_regle), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">DPA</p>
                    <p className="font-medium">
                      {format(new Date(suiviGrossesse.date_accouchement_prevue), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Type</p>
                    <p className="font-medium">{suiviGrossesse.type_grossesse}</p>
                  </div>
                  {suiviGrossesse.groupe_sanguin && suiviGrossesse.rhesus && (
                    <div>
                      <p className="text-gray-600 text-xs">Groupe/Rhésus</p>
                      <p className="font-medium">{suiviGrossesse.groupe_sanguin} {suiviGrossesse.rhesus}</p>
                    </div>
                  )}
                </div>

                {suiviGrossesse.antecedents?.length > 0 && showSensitiveData && (
                  <div className="p-2 bg-orange-50 rounded border border-orange-200">
                    <p className="text-xs font-semibold text-orange-900 mb-1">Antécédents :</p>
                    <div className="flex flex-wrap gap-1">
                      {suiviGrossesse.antecedents.map(ant => (
                        <Badge key={ant} variant="outline" className="text-xs">
                          {ant}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Heart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun suivi de grossesse actif</p>
            </div>
          )}
        </TabsContent>

        {/* Enfants */}
        <TabsContent value="enfants">
          {enfants.length > 0 ? (
            <div className="space-y-3">
              {enfants.map(enfant => (
                <Card key={enfant.id} className="border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Baby className="w-4 h-4 text-blue-600" />
                        <p className="font-semibold text-gray-900">
                          {enfant.prenom} {enfant.nom}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {differenceInYears(new Date(), new Date(enfant.date_naissance))} ans
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-600">Né(e) le</p>
                        <p className="font-medium">
                          {format(new Date(enfant.date_naissance), 'dd/MM/yyyy', { locale: fr })}
                        </p>
                      </div>
                      {enfant.groupe_sanguin && showSensitiveData && (
                        <div>
                          <p className="text-gray-600">Groupe sanguin</p>
                          <p className="font-medium">{enfant.groupe_sanguin}</p>
                        </div>
                      )}
                    </div>

                    {enfant.allergies?.length > 0 && showSensitiveData && (
                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs font-semibold text-red-900 mb-1">⚠️ Allergies :</p>
                        <div className="flex flex-wrap gap-1">
                          {enfant.allergies.map(allergie => (
                            <Badge key={allergie} className="bg-red-600 text-white text-xs">
                              {allergie}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {enfant.vaccins && (
                      <div className="mt-2">
                        <p className="text-xs text-gray-600">
                          <Syringe className="w-3 h-3 inline mr-1" />
                          {enfant.vaccins.length} vaccin(s) enregistré(s)
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Baby className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun carnet d'enfant</p>
            </div>
          )}
        </TabsContent>

        {/* Historique */}
        <TabsContent value="historique">
          {rdvHistorique.length > 0 ? (
            <div className="space-y-2">
              {rdvHistorique.map(rdv => (
                <Card key={rdv.id} className="border-none shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900">{rdv.motif}</p>
                      <Badge variant="outline" className="text-xs">
                        {format(new Date(rdv.date_rdv), 'dd/MM/yy', { locale: fr })}
                      </Badge>
                    </div>
                    {rdv.notes_professionnel && showSensitiveData && (
                      <p className="text-xs text-gray-600 line-clamp-2 mt-2 p-2 bg-gray-50 rounded">
                        {rdv.notes_professionnel}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Aucun historique de consultation</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Footer info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-semibold mb-1">Accès conforme HIPAA/RGPD</p>
            <p>Les données sont chiffrées et l'accès est tracé pour la sécurité du patient.</p>
          </div>
        </div>
      </div>
    </div>
  );
}