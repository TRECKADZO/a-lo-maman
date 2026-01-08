import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Calendar, Edit2, Save, X, CheckCircle, AlertCircle, FileText, TrendingUp } from 'lucide-react';
import { differenceInWeeks, differenceInDays } from 'date-fns';

export default function SectionSuiviGrossesse({ grossesse, userEmail }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    date_derniere_regle: grossesse?.date_derniere_regle || '',
    type_grossesse: grossesse?.type_grossesse || 'unique',
    groupe_sanguin: grossesse?.groupe_sanguin || '',
    rhesus: grossesse?.rhesus || 'positif',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (grossesse.id) {
        await base44.entities.SuiviGrossesse.update(grossesse.id, data);
      } else {
        await base44.entities.SuiviGrossesse.create({
          ...data,
          date_accouchement_prevue: new Date(new Date(data.date_derniere_regle).getTime() + 280 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          grossesse_active: true,
        });
      }
    },
    onSuccess: () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  const { data: rapportsEcho = [], isLoading: rapportsLoading } = useQuery({
    queryKey: ['rapports_echo', grossesse?.id],
    queryFn: async () => {
      if (!grossesse?.id) return [];
      const rdvs = await base44.entities.RDVTeleEchographie.filter({
        grossesse_id: grossesse.id,
        statut: 'termine'
      });
      return rdvs.filter(rdv => rdv.rapport_echographie?.rapport_pdf_url);
    },
    enabled: !!grossesse?.id,
  });

  const semaineGrossesse = grossesse ? differenceInWeeks(new Date(), new Date(grossesse.date_derniere_regle)) : 0;
  const joursRestants = grossesse ? differenceInDays(new Date(grossesse.date_accouchement_prevue), new Date()) : 0;
  const progressionGrossesse = Math.min((semaineGrossesse / 40) * 100, 100);

  const handleSave = async () => {
    await updateMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!grossesse && !isEditing) {
    return (
      <Card className="shadow-lg border-none bg-gradient-to-br from-pink-50 to-rose-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Créer un suivi de grossesse</h3>
              <p className="text-sm text-gray-600">Enregistrez vos informations pour suivre votre grossesse</p>
            </div>
            <Button onClick={() => setIsEditing(true)} className="bg-pink-600 hover:bg-pink-700">
              Créer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {saveSuccess && (
        <Alert className="bg-green-50 border-green-300">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Suivi de grossesse mis à jour
          </AlertDescription>
        </Alert>
      )}

      {/* Vue principale */}
      {!isEditing && (
        <Card className="shadow-lg border-none bg-gradient-to-br from-pink-50 via-white to-rose-50">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-pink-600" />
                Suivi de Grossesse
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Semaine {semaineGrossesse}/40</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barre de progression */}
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-pink-500 to-rose-500 h-full transition-all duration-500"
                  style={{ width: `${progressionGrossesse}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>DDR: {new Date(grossesse.date_derniere_regle).toLocaleDateString('fr-FR')}</span>
                <span>{joursRestants > 0 ? `${joursRestants} jours restants` : 'Date dépassée'}</span>
                <span>DPA: {new Date(grossesse.date_accouchement_prevue).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>

            {/* Infos de base */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-600">Type de grossesse</p>
                <Badge className="mt-1 bg-pink-100 text-pink-800">
                  {grossesse.type_grossesse?.replace(/_/g, ' ')}
                </Badge>
              </div>
              {grossesse.groupe_sanguin && (
                <div>
                  <p className="text-xs text-gray-600">Groupe sanguin</p>
                  <Badge className="mt-1 bg-blue-100 text-blue-800">{grossesse.groupe_sanguin}</Badge>
                </div>
              )}
              {grossesse.rhesus && (
                <div>
                  <p className="text-xs text-gray-600">Rhésus</p>
                  <Badge className="mt-1 bg-blue-100 text-blue-800">{grossesse.rhesus}</Badge>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-600">Statut</p>
                <Badge className="mt-1 bg-green-100 text-green-800">Actif</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire édition */}
      {isEditing && (
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle>Éditer suivi de grossesse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ddr">Date des dernières règles (DDR) *</Label>
              <Input
                id="ddr"
                type="date"
                value={formData.date_derniere_regle}
                onChange={(e) => handleChange('date_derniere_regle', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type de grossesse</Label>
                <Select value={formData.type_grossesse} onValueChange={(value) => handleChange('type_grossesse', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unique">Unique</SelectItem>
                    <SelectItem value="gemellaire">Gémellaire</SelectItem>
                    <SelectItem value="multiple">Multiple</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupe">Groupe sanguin</Label>
                <Select value={formData.groupe_sanguin} onValueChange={(value) => handleChange('groupe_sanguin', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rhesus">Rhésus</Label>
              <Select value={formData.rhesus} onValueChange={(value) => handleChange('rhesus', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="positif">Positif</SelectItem>
                  <SelectItem value="negatif">Négatif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="flex-1 bg-pink-600 hover:bg-pink-700">
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </>
                )}
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rapports d'échographie */}
      {!isEditing && grossesse?.id && (
        <Card className="shadow-lg border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              Rapports d'échographie ({rapportsEcho.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {rapportsLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : rapportsEcho.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-4">Aucun rapport d'échographie disponible</p>
            ) : (
              <div className="space-y-2">
                {rapportsEcho.map((rdv, idx) => (
                  <div key={idx} className="p-3 bg-purple-50 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{rdv.type_echographie?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-600">{new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(rdv.rapport_echographie.rapport_pdf_url, '_blank')}
                    >
                      Télécharger
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}