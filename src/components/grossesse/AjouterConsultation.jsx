import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Upload, X, FileText, Stethoscope, Calendar } from "lucide-react";
import { BottomSheet } from "@/components/ui/safe-area-view";
import { toast } from "sonner";

export default function AjouterConsultation({ grossesse, semainesGrossesse, onClose }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    semaine_grossesse: semainesGrossesse || 0,
    poids: '',
    tension_arterielle: '',
    hauteur_uterine: '',
    frequence_cardiaque_bebe: '',
    notes_medecin: '',
    professionnel: '',
    lieu: '',
    documents_joints: [],
    prochaine_visite_prevue: '',
    recommandations: ''
  });

  const handleFileUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setFormData(prev => ({
        ...prev,
        documents_joints: [
          ...prev.documents_joints,
          {
            type,
            titre: file.name,
            url: file_url,
            date_ajout: new Date().toISOString()
          }
        ]
      }));
      
      toast.success('Document ajouté');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const removeDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documents_joints: prev.documents_joints.filter((_, i) => i !== index)
    }));
  };

  const ajouterMutation = useMutation({
    mutationFn: async () => {
      const consultationsActuelles = grossesse.consultations || [];
      const nouvelleConsultation = {
        id: `consult_${Date.now()}`,
        ...formData,
        poids: formData.poids ? parseFloat(formData.poids) : null,
        hauteur_uterine: formData.hauteur_uterine ? parseFloat(formData.hauteur_uterine) : null,
        frequence_cardiaque_bebe: formData.frequence_cardiaque_bebe ? parseInt(formData.frequence_cardiaque_bebe) : null,
      };

      await base44.entities.SuiviGrossesse.update(grossesse.id, {
        consultations: [...consultationsActuelles, nouvelleConsultation]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      toast.success('Consultation ajoutée');
      onClose();
    },
  });

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Nouvelle consultation prénatale" fullHeight>
      <div className="p-6 overflow-y-auto pb-32">
        <form onSubmit={(e) => { e.preventDefault(); ajouterMutation.mutate(); }} className="space-y-6">
          {/* Date et semaine */}
          <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date de la visite *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label>Semaine d'aménorrhée</Label>
                  <Input
                    type="number"
                    value={formData.semaine_grossesse}
                    onChange={(e) => setFormData({ ...formData, semaine_grossesse: parseInt(e.target.value) })}
                    placeholder="SA"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mesures vitales */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              Mesures vitales
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Poids (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.poids}
                  onChange={(e) => setFormData({ ...formData, poids: e.target.value })}
                  placeholder="Ex: 65.5"
                />
              </div>
              <div>
                <Label>Tension artérielle</Label>
                <Input
                  value={formData.tension_arterielle}
                  onChange={(e) => setFormData({ ...formData, tension_arterielle: e.target.value })}
                  placeholder="Ex: 120/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hauteur utérine (cm)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.hauteur_uterine}
                  onChange={(e) => setFormData({ ...formData, hauteur_uterine: e.target.value })}
                  placeholder="Ex: 24"
                />
              </div>
              <div>
                <Label>FC bébé (bpm)</Label>
                <Input
                  type="number"
                  value={formData.frequence_cardiaque_bebe}
                  onChange={(e) => setFormData({ ...formData, frequence_cardiaque_bebe: e.target.value })}
                  placeholder="Ex: 140"
                />
              </div>
            </div>
          </div>

          {/* Professionnel et lieu */}
          <div className="space-y-4">
            <div>
              <Label>Professionnel de santé</Label>
              <Input
                value={formData.professionnel}
                onChange={(e) => setFormData({ ...formData, professionnel: e.target.value })}
                placeholder="Nom du médecin/sage-femme"
              />
            </div>
            <div>
              <Label>Lieu</Label>
              <Input
                value={formData.lieu}
                onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                placeholder="Hôpital, clinique..."
              />
            </div>
          </div>

          {/* Notes du médecin */}
          <div>
            <Label>Notes et observations du médecin</Label>
            <Textarea
              value={formData.notes_medecin}
              onChange={(e) => setFormData({ ...formData, notes_medecin: e.target.value })}
              placeholder="Observations, diagnostics, prescriptions..."
              rows={4}
            />
          </div>

          {/* Documents joints */}
          <div className="space-y-3">
            <Label>Documents joints (échographies, résultats...)</Label>
            
            {formData.documents_joints.length > 0 && (
              <div className="space-y-2">
                {formData.documents_joints.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">{doc.titre}</p>
                        <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(index)}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {['echographie', 'resultat_labo', 'ordonnance', 'autre'].map((type) => (
                <label key={type} className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileUpload(e, type)}
                    className="hidden"
                    disabled={uploading}
                  />
                  <div className="flex items-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-400 transition-colors text-center justify-center">
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-600">{type.replace(/_/g, ' ')}</span>
                      </>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Prochaine visite et recommandations */}
          <div className="space-y-4">
            <div>
              <Label>Prochaine visite prévue</Label>
              <Input
                type="date"
                value={formData.prochaine_visite_prevue}
                onChange={(e) => setFormData({ ...formData, prochaine_visite_prevue: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <Label>Recommandations</Label>
              <Textarea
                value={formData.recommandations}
                onChange={(e) => setFormData({ ...formData, recommandations: e.target.value })}
                placeholder="Recommandations pour la suite..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={ajouterMutation.isPending || !formData.date}
              className="flex-1 bg-teal-600 hover:bg-teal-700"
            >
              {ajouterMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </BottomSheet>
  );
}