import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Share2, UserCheck, X, Calendar, AlertCircle } from "lucide-react";
import { BottomSheet } from "@/components/ui/safe-area-view";

export default function PartagerDocument({ document, onClose, onSuccess }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    professionnel_email: '',
    message_accompagnement: '',
    type_acces: 'lecture',
    date_expiration: ''
  });

  const { data: professionnels = [] } = useQuery({
    queryKey: ['professionnels_disponibles'],
    queryFn: () => base44.entities.Professionnel.list(),
  });

  const { data: partagesExistants = [] } = useQuery({
    queryKey: ['partages_document', document.id],
    queryFn: () => base44.entities.PartageDocument.filter({ document_id: document.id }),
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const pro = professionnels.find(p => p.email === data.professionnel_email);
      
      await base44.entities.PartageDocument.create({
        document_id: document.id,
        document_titre: document.titre,
        proprietaire_email: document.created_by,
        partage_avec_email: data.professionnel_email,
        partage_avec_nom: pro?.nom_complet || data.professionnel_email,
        type_acces: data.type_acces,
        date_partage: new Date().toISOString(),
        date_expiration: data.date_expiration || null,
        statut: 'actif',
        message_accompagnement: data.message_accompagnement,
        consultation_par_pro: false
      });

      // Notification au professionnel
      await base44.entities.Notification.create({
        destinataire_email: data.professionnel_email,
        type: 'dmp_nouveau_document',
        titre: 'Nouveau document partagé',
        message: `Un document médical "${document.titre}" a été partagé avec vous`,
        action_page: 'MesDocuments',
        priorite: 'normale',
        icone: 'FileText'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents_famille'] });
      queryClient.invalidateQueries({ queryKey: ['partages_document'] });
      onSuccess?.();
    }
  });

  const revoqueMutation = useMutation({
    mutationFn: async (partageId) => {
      await base44.entities.PartageDocument.update(partageId, { statut: 'revoque' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['partages_document'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const partagesActifs = partagesExistants.filter(p => p.statut === 'actif');

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Partager le document" fullHeight>
      <div className="p-6 overflow-y-auto pb-32">
        <div className="space-y-6">
          {/* Info document */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="font-semibold text-blue-900 mb-1">Document à partager</p>
            <p className="text-sm text-blue-700">{document.titre}</p>
            <Badge variant="outline" className="mt-2">{document.type_document}</Badge>
          </div>

          {/* Partages existants */}
          {partagesActifs.length > 0 && (
            <div className="space-y-2">
              <Label>Partagé avec ({partagesActifs.length})</Label>
              {partagesActifs.map(partage => (
                <div key={partage.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">{partage.partage_avec_nom}</p>
                      <p className="text-xs text-gray-600">{partage.partage_avec_email}</p>
                      {partage.date_expiration && (
                        <p className="text-xs text-gray-500">
                          Expire le {new Date(partage.date_expiration).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => revoqueMutation.mutate(partage.id)}
                    disabled={revoqueMutation.isPending}
                    className="text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Formulaire nouveau partage */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Professionnel de santé *</Label>
              <Select
                value={formData.professionnel_email}
                onValueChange={(value) => setFormData({ ...formData, professionnel_email: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un professionnel" />
                </SelectTrigger>
                <SelectContent>
                  {professionnels
                    .filter(p => !partagesActifs.some(pa => pa.partage_avec_email === p.email))
                    .map(pro => (
                      <SelectItem key={pro.id} value={pro.email}>
                        {pro.nom_complet} - {pro.specialite?.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Type d'accès</Label>
              <Select
                value={formData.type_acces}
                onValueChange={(value) => setFormData({ ...formData, type_acces: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lecture">Lecture seule</SelectItem>
                  <SelectItem value="lecture_ecriture">Lecture et commentaires</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Date d'expiration (optionnel)</Label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Input
                  type="date"
                  value={formData.date_expiration}
                  onChange={(e) => setFormData({ ...formData, date_expiration: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div>
              <Label>Message pour le professionnel (optionnel)</Label>
              <Textarea
                value={formData.message_accompagnement}
                onChange={(e) => setFormData({ ...formData, message_accompagnement: e.target.value })}
                placeholder="Ex: Merci de consulter ce document avant notre prochain RDV..."
                rows={3}
              />
            </div>

            <div className="flex items-start gap-2 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-purple-800">
                Le professionnel aura accès uniquement à ce document. 
                Vous pouvez révoquer l'accès à tout moment.
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || !formData.professionnel_email}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Partage...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Partager
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </BottomSheet>
  );
}