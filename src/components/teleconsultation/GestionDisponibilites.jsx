import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Clock, Calendar, Save, X, Briefcase, Building2, Phone, Video, AlertCircle, CalendarIcon, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function GestionDisponibilites({ professionnel, onClose }) {
  const queryClient = useQueryClient();
  const [disponibilites, setDisponibilites] = useState(professionnel?.disponibilites || []);
  const [nouvelleDisponibilite, setNouvelleDisponibilite] = useState({
    jour: '',
    heure_debut: '',
    heure_fin: '',
    types_consultation: [],
  });

  // Rafraîchir le professionnel actuel
  const { data: profilActuel } = useQuery({
    queryKey: ['profil_professionnel_refresh', professionnel?.id],
    queryFn: async () => {
      if (!professionnel?.id) return null;
      const profils = await base44.entities.Professionnel.filter({ id: professionnel.id });
      return profils[0] || null;
    },
    enabled: !!professionnel?.id,
  });

  const typesConsultation = ['cabinet', 'clinique', 'hopital', 'telephone', 'visio'];

  const addDisponibilite = () => {
    if (!nouvelleDisponibilite.jour || !nouvelleDisponibilite.heure_debut || !nouvelleDisponibilite.heure_fin) {
      alert('⚠️ Veuillez remplir tous les champs (jour, heure début, heure fin)');
      return;
    }

    if (nouvelleDisponibilite.heure_debut >= nouvelleDisponibilite.heure_fin) {
      alert("⚠️ L'heure de fin doit être après l'heure de début");
      return;
    }

    setDisponibilites([...disponibilites, { ...nouvelleDisponibilite }]);
    setNouvelleDisponibilite({
      jour: '',
      heure_debut: '',
      heure_fin: '',
      types_consultation: [],
    });
  };

  const removeDisponibilite = (index) => {
    setDisponibilites(disponibilites.filter((_, i) => i !== index));
  };

  const toggleTypeConsultation = (type) => {
    const types = nouvelleDisponibilite.types_consultation || [];
    if (types.includes(type)) {
      setNouvelleDisponibilite({
        ...nouvelleDisponibilite,
        types_consultation: types.filter(t => t !== type)
      });
    } else {
      setNouvelleDisponibilite({
        ...nouvelleDisponibilite,
        types_consultation: [...types, type]
      });
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const proToUpdate = profilActuel || professionnel;
      
      if (!proToUpdate || !proToUpdate.id) {
        throw new Error('Profil professionnel introuvable. Veuillez rafraîchir la page.');
      }

      // Extraire tous les types de consultation utilisés
      const allTypesUsed = disponibilites.flatMap(d => d.types_consultation || []);
      const uniqueTypes = [...new Set(allTypesUsed)];
      
      // Garder les types existants si aucun nouveau type
      const finalTypes = uniqueTypes.length > 0 
        ? uniqueTypes 
        : (proToUpdate.types_consultation_offerts || []);

      console.log('Sauvegarde disponibilités:', {
        id: proToUpdate.id,
        disponibilites: disponibilites,
        types: finalTypes
      });
      
      const result = await base44.entities.Professionnel.update(proToUpdate.id, {
        disponibilites: disponibilites,
        types_consultation_offerts: finalTypes
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profil_professionnel'] });
      queryClient.invalidateQueries({ queryKey: ['profil_professionnel_refresh'] });
      queryClient.invalidateQueries({ queryKey: ['professionnels'] });
      alert('✅ Disponibilités enregistrées avec succès !');
      if (onClose) onClose();
    },
    onError: (error) => {
      console.error("Erreur sauvegarde disponibilités:", error);
      alert(`❌ Erreur: ${error.message || 'Impossible de sauvegarder. Veuillez réessayer.'}`);
    }
  });

  const getIconType = (type) => {
    switch(type) {
      case 'cabinet': return <Briefcase className="w-3 h-3" />;
      case 'clinique': return <Briefcase className="w-3 h-3" />;
      case 'hopital': return <Building2 className="w-3 h-3" />;
      case 'telephone': return <Phone className="w-3 h-3" />;
      case 'visio': return <Video className="w-3 h-3" />;
      default: return <Calendar className="w-3 h-3" />;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'cabinet': 'Cabinet',
      'clinique': 'Clinique',
      'hopital': 'Hôpital',
      'telephone': 'Téléphone',
      'visio': 'Vidéo'
    };
    return labels[type] || type;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
      <div className="w-full max-w-4xl my-8">
        <Card className="shadow-2xl border-none">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base md:text-xl">
                <div className="p-2 bg-teal-100 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 md:w-6 md:h-6 text-teal-600" />
                </div>
                <span className="truncate">Gérer mes disponibilités</span>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onClose}
                className="hover:bg-white/50 flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-4 md:p-6 max-h-[70vh] overflow-y-auto">
            <Alert className="bg-teal-50 border-teal-200">
              <AlertCircle className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <AlertDescription className="text-teal-800">
                <strong>💡 Conseil:</strong> Définissez vos créneaux de disponibilité. Les patients pourront réserver uniquement sur ces horaires.
              </AlertDescription>
            </Alert>

            {/* Liste des disponibilités */}
            <div>
              <h3 className="font-semibold text-base md:text-lg mb-3 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="truncate">Mes disponibilités ({disponibilites.length})</span>
              </h3>
              {disponibilites.length > 0 ? (
                <div className="space-y-2">
                  {disponibilites.map((dispo, index) => (
                    <Card key={index} className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200 hover:shadow-md transition-shadow overflow-hidden">
                      <CardContent className="p-3 md:p-4 flex items-center justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="p-2 bg-white rounded-lg flex-shrink-0">
                            <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm md:text-base text-gray-900 truncate">{dispo.jour}</p>
                            <div className="flex items-center gap-2 text-xs md:text-sm text-gray-600">
                              <Clock className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{dispo.heure_debut} - {dispo.heure_fin}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {dispo.types_consultation && dispo.types_consultation.length > 0 ? (
                                dispo.types_consultation.map((type, i) => (
                                  <Badge key={i} variant="outline" className="text-xs flex items-center gap-1 bg-white truncate">
                                    {getIconType(type)}
                                    <span className="truncate">{getTypeLabel(type)}</span>
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="text-xs bg-white">Tous types</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDisponibilite(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-shrink-0 active:scale-95 transition-transform"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <Clock className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm md:text-base text-gray-600 font-medium mb-1">Aucune disponibilité</p>
                  <p className="text-xs md:text-sm text-gray-500 break-words">Ajoutez vos créneaux horaires</p>
                </div>
              )}
            </div>

            {/* Ajouter une disponibilité */}
            <div className="space-y-4">
              <h3 className="font-semibold text-base md:text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-600 flex-shrink-0" />
                <span className="truncate">Ajouter une disponibilité</span>
              </h3>
              <Card className="bg-gray-50 border-gray-200 shadow-sm">
                <CardContent className="p-3 md:p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="font-semibold text-xs md:text-sm">Jour *</Label>
                      <Select
                        value={nouvelleDisponibilite.jour}
                        onValueChange={(value) => setNouvelleDisponibilite({ ...nouvelleDisponibilite, jour: value })}
                      >
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent>
                          {JOURS_SEMAINE.map(jour => (
                            <SelectItem key={jour} value={jour}>{jour}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="font-semibold text-xs md:text-sm">Heure début *</Label>
                      <Input
                        type="time"
                        value={nouvelleDisponibilite.heure_debut}
                        onChange={(e) => setNouvelleDisponibilite({ ...nouvelleDisponibilite, heure_debut: e.target.value })}
                        className="bg-white"
                      />
                    </div>

                    <div>
                      <Label className="font-semibold text-xs md:text-sm">Heure fin *</Label>
                      <Input
                        type="time"
                        value={nouvelleDisponibilite.heure_fin}
                        onChange={(e) => setNouvelleDisponibilite({ ...nouvelleDisponibilite, heure_fin: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="font-semibold text-xs md:text-sm">Types de consultation disponibles</Label>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                      {typesConsultation.map(type => (
                        <div
                          key={type}
                          onClick={() => toggleTypeConsultation(type)}
                          className={`p-2 md:p-3 border-2 rounded-lg cursor-pointer transition-all active:scale-95 ${
                            (nouvelleDisponibilite.types_consultation || []).includes(type)
                              ? 'border-teal-500 bg-teal-100 shadow-md'
                              : 'border-gray-300 bg-white hover:border-teal-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1 md:gap-2 text-center">
                            {getIconType(type)}
                            <span className="text-[10px] md:text-xs font-medium truncate max-w-full">{getTypeLabel(type)}</span>
                            {(nouvelleDisponibilite.types_consultation || []).includes(type) && (
                              <div className="w-3 h-3 md:w-4 md:h-4 bg-teal-600 rounded-full flex items-center justify-center">
                                <svg className="w-2 h-2 md:w-3 md:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic break-words">
                      💡 Si aucun type sélectionné, tous seront disponibles
                    </p>
                  </div>

                  <Button 
                    onClick={addDisponibilite} 
                    className="w-full bg-teal-600 hover:bg-teal-700 shadow-md active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Ajouter</span>
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={onClose} 
                className="flex-1 border-gray-300 active:scale-95 transition-transform"
              >
                Annuler
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || disponibilites.length === 0}
                className="flex-1 bg-teal-600 hover:bg-teal-700 shadow-md active:scale-95 transition-transform"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin flex-shrink-0" />
                    <span className="truncate">Sauvegarde...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Enregistrer ({disponibilites.length})</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}