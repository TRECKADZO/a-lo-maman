import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, BellOff, Settings, ChevronDown, ChevronUp, Brain, Phone, Mail } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'react-hot-toast';

/**
 * Système d'alertes personnalisable pour grossesses à haut risque
 * Basé sur les analyses IA de risques
 */

export default function AlertesRisqueIA({ profesionnelEmail }) {
  const [showSettings, setShowSettings] = useState(false);
  const [expandedAlert, setExpandedAlert] = useState(null);
  const queryClient = useQueryClient();

  // Charger les alertes actives
  const { data: alertes = [], isLoading } = useQuery({
    queryKey: ['alertes_risque_ia'],
    queryFn: async () => {
      // Récupérer toutes les analyses de risque avec niveau élevé/critique
      const analyses = await base44.entities.AnalyseRisque.filter({
        niveau_risque: { $in: ['eleve', 'critique'] },
        valide_par_professionnel: false
      });

      // Enrichir avec infos patiente
      const alertesEnrichies = await Promise.all(
        analyses.map(async (analyse) => {
          const profil = await base44.entities.ProfilMaman.filter({
            created_by: analyse.patient_email
          });

          return {
            ...analyse,
            patient_nom: profil[0]?.nom_complet || 'Patient',
            patient_email: analyse.patient_email
          };
        })
      );

      // Trier par score de risque décroissant
      return alertesEnrichies.sort((a, b) => b.score_risque - a.score_risque);
    }
  });

  // Charger les préférences d'alertes du professionnel
  const { data: preferences } = useQuery({
    queryKey: ['alerte_preferences', profesionnelEmail],
    queryFn: async () => {
      const profs = await base44.entities.Professionnel.filter({
        email: profesionnelEmail
      });

      return profs[0]?.preferences_notifications || {
        alertes_risque_eleve: true,
        alertes_risque_critique: true,
        seuil_score: 70,
        canaux: ['app', 'email'],
        horaires_silencieux: false,
        debut_silence: '22:00',
        fin_silence: '07:00'
      };
    }
  });

  // Valider une alerte
  const validerAlerte = useMutation({
    mutationFn: async ({ alerteId, notes }) => {
      await base44.entities.AnalyseRisque.update(alerteId, {
        valide_par_professionnel: true,
        professionnel_id: profesionnelEmail,
        notes_professionnel: notes,
        date_validation: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alertes_risque_ia']);
      toast.success('Alerte validée');
    }
  });

  // Mettre à jour préférences
  const updatePreferences = useMutation({
    mutationFn: async (newPrefs) => {
      const profs = await base44.entities.Professionnel.filter({
        email: profesionnelEmail
      });

      if (profs.length > 0) {
        await base44.entities.Professionnel.update(profs[0].id, {
          preferences_notifications: {
            ...preferences,
            ...newPrefs
          }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerte_preferences']);
      toast.success('Préférences mises à jour');
    }
  });

  const getNiveauColor = (niveau) => {
    switch (niveau) {
      case 'eleve': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'critique': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNiveauIcon = (niveau) => {
    return niveau === 'critique' ? '🚨' : '⚠️';
  };

  const filteredAlertes = alertes.filter(a => {
    if (!preferences) return true;
    
    if (a.niveau_risque === 'critique' && !preferences.alertes_risque_critique) return false;
    if (a.niveau_risque === 'eleve' && !preferences.alertes_risque_eleve) return false;
    if (a.score_risque < preferences.seuil_score) return false;

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Header avec bouton settings */}
      <Card className="shadow-lg border-2 border-orange-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-orange-600" />
              Alertes IA - Grossesses à haut risque
              {filteredAlertes.length > 0 && (
                <Badge className="bg-red-500 text-white ml-2">
                  {filteredAlertes.length}
                </Badge>
              )}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        {/* Panneau de configuration */}
        {showSettings && preferences && (
          <CardContent className="border-t pt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="alerte-eleve">Alertes risque élevé</Label>
                <Switch
                  id="alerte-eleve"
                  checked={preferences.alertes_risque_eleve}
                  onCheckedChange={(checked) => 
                    updatePreferences.mutate({ alertes_risque_eleve: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="alerte-critique">Alertes risque critique</Label>
                <Switch
                  id="alerte-critique"
                  checked={preferences.alertes_risque_critique}
                  onCheckedChange={(checked) => 
                    updatePreferences.mutate({ alertes_risque_critique: checked })
                  }
                />
              </div>

              <div>
                <Label htmlFor="seuil">Seuil de score minimum</Label>
                <Select
                  value={preferences.seuil_score?.toString()}
                  onValueChange={(value) => 
                    updatePreferences.mutate({ seuil_score: parseInt(value) })
                  }
                >
                  <SelectTrigger id="seuil">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50 (Tous risques modérés+)</SelectItem>
                    <SelectItem value="70">70 (Risques élevés+)</SelectItem>
                    <SelectItem value="85">85 (Risques critiques uniquement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Canaux de notification</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={preferences.canaux?.includes('app')}
                      onCheckedChange={(checked) => {
                        const canaux = checked 
                          ? [...(preferences.canaux || []), 'app']
                          : preferences.canaux?.filter(c => c !== 'app');
                        updatePreferences.mutate({ canaux });
                      }}
                    />
                    <Bell className="w-4 h-4" />
                    <span className="text-sm">Notifications in-app</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={preferences.canaux?.includes('email')}
                      onCheckedChange={(checked) => {
                        const canaux = checked 
                          ? [...(preferences.canaux || []), 'email']
                          : preferences.canaux?.filter(c => c !== 'email');
                        updatePreferences.mutate({ canaux });
                      }}
                    />
                    <Mail className="w-4 h-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={preferences.canaux?.includes('sms')}
                      onCheckedChange={(checked) => {
                        const canaux = checked 
                          ? [...(preferences.canaux || []), 'sms']
                          : preferences.canaux?.filter(c => c !== 'sms');
                        updatePreferences.mutate({ canaux });
                      }}
                    />
                    <Phone className="w-4 h-4" />
                    <span className="text-sm">SMS (urgences)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Liste des alertes */}
      {isLoading ? (
        <Card className="p-6">
          <p className="text-center text-gray-500">Chargement des alertes...</p>
        </Card>
      ) : filteredAlertes.length === 0 ? (
        <Card className="p-6">
          <div className="text-center">
            <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Aucune alerte active</p>
            <p className="text-xs text-gray-400 mt-1">
              Les grossesses à haut risque détectées par l'IA apparaîtront ici
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredAlertes.map((alerte) => (
            <Card 
              key={alerte.id} 
              className={`border-2 ${getNiveauColor(alerte.niveau_risque)} cursor-pointer hover:shadow-lg transition-shadow`}
              onClick={() => setExpandedAlert(expandedAlert === alerte.id ? null : alerte.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getNiveauIcon(alerte.niveau_risque)}</span>
                    <div>
                      <p className="font-semibold text-sm">{alerte.patient_nom}</p>
                      <p className="text-xs text-gray-600">{alerte.patient_email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getNiveauColor(alerte.niveau_risque)}>
                      Score: {alerte.score_risque}%
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(alerte.date_analyse).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="font-semibold text-sm">
                    Risque: {alerte.type_analyse.replace(/_/g, ' ')}
                  </span>
                </div>

                {expandedAlert === alerte.id && (
                  <div className="mt-4 space-y-3 border-t pt-3">
                    {alerte.facteurs_identifie && alerte.facteurs_identifie.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1">Facteurs de risque:</p>
                        <ul className="text-xs space-y-1">
                          {alerte.facteurs_identifie.map((facteur, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-orange-500">•</span>
                              <span>{facteur.facteur || facteur}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {alerte.recommandations && alerte.recommandations.length > 0 && (
                      <div className="p-2 bg-blue-50 rounded">
                        <p className="text-xs font-semibold mb-1">Recommandations:</p>
                        <ul className="text-xs space-y-1">
                          {alerte.recommandations.map((reco, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-blue-600">✓</span>
                              <span>{reco.action || reco}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          validerAlerte.mutate({ 
                            alerteId: alerte.id,
                            notes: 'Prise en charge en cours'
                          });
                        }}
                        className="flex-1"
                      >
                        Valider et suivre
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: Ouvrir dossier patient
                        }}
                      >
                        Voir dossier
                      </Button>
                    </div>
                  </div>
                )}

                <button 
                  className="w-full mt-2 text-xs text-gray-500 flex items-center justify-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedAlert(expandedAlert === alerte.id ? null : alerte.id);
                  }}
                >
                  {expandedAlert === alerte.id ? (
                    <>Moins de détails <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Plus de détails <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}