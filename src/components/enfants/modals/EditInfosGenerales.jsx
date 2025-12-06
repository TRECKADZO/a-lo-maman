import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { X, Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function EditInfosGenerales({ enfant, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    prenom: enfant.prenom || '',
    nom: enfant.nom || '',
    date_naissance: enfant.date_naissance ? formatISODate(enfant.date_naissance) : '',
    sexe: enfant.sexe || '',
    numero_cmu: enfant.numero_cmu || '',
    identifiant_provisoire: enfant.identifiant_provisoire || '',
    groupe_sanguin: enfant.groupe_sanguin || '',
    poids_naissance: enfant.poids_naissance || '',
    taille_naissance: enfant.taille_naissance || '',
  });

  const [hasCmu, setHasCmu] = useState(enfant.numero_cmu ? "oui" : "non");

  function formatISODate(dateString) {
      if (!dateString) return '';
      try {
          return new Date(dateString).toISOString().split('T')[0];
      } catch (error) {
          return '';
      }
  }

  const mutation = useMutation({
    mutationFn: (updatedData) => base44.entities.EnfantCarnet.update(enfant.id, updatedData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      queryClient.invalidateQueries({ queryKey: ['mes_patients'] });
      queryClient.invalidateQueries({ queryKey: ['dossier_patient', enfant.id] });
      onClose();
    },
  });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    let dataToSubmit = { ...formData };
    if (hasCmu === 'oui') {
      dataToSubmit.identifiant_provisoire = "";
    } else {
      dataToSubmit.numero_cmu = "";
    }

    if (dataToSubmit.poids_naissance) dataToSubmit.poids_naissance = parseFloat(dataToSubmit.poids_naissance);
    if (dataToSubmit.taille_naissance) dataToSubmit.taille_naissance = parseFloat(dataToSubmit.taille_naissance);

    mutation.mutate(dataToSubmit);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Modifier les informations</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={mutation.isPending}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="prenom">Prénom *</Label><Input id="prenom" name="prenom" value={formData.prenom} onChange={handleChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="nom">Nom *</Label><Input id="nom" name="nom" value={formData.nom} onChange={handleChange} required /></div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="date_naissance">Date de naissance *</Label><Input id="date_naissance" name="date_naissance" type="date" value={formData.date_naissance} onChange={handleChange} required /></div>
                    <div className="space-y-2">
                        <Label htmlFor="sexe">Sexe *</Label>
                        <Select value={formData.sexe} onValueChange={(value) => setFormData(prev => ({...prev, sexe: value}))} required><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="masculin">Masculin</SelectItem><SelectItem value="feminin">Féminin</SelectItem></SelectContent></Select>
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Label>L'enfant a-t-il un numéro CMU ?</Label>
                  <RadioGroup value={hasCmu} onValueChange={setHasCmu} className="flex gap-4">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="oui" id="r-oui" /><Label htmlFor="r-oui">Oui</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="non" id="r-non" /><Label htmlFor="r-non">Non</Label></div>
                  </RadioGroup>
                </div>
                {hasCmu === 'oui' ? (
                  <div className="space-y-2"><Label htmlFor="numero_cmu">Numéro CMU *</Label><Input id="numero_cmu" name="numero_cmu" value={formData.numero_cmu} onChange={handleChange} placeholder="CMU123456789" required /></div>
                ) : (
                  <div className="space-y-2"><Label htmlFor="identifiant_provisoire">N° Acte de Naissance / Identifiant Temporaire *</Label><Input id="identifiant_provisoire" name="identifiant_provisoire" value={formData.identifiant_provisoire} onChange={handleChange} placeholder="Entrez un identifiant unique" required /><p className="text-xs text-gray-500">Vous pourrez ajouter le N° CMU plus tard.</p></div>
                )}
                
                <div className="space-y-2"><Label htmlFor="groupe_sanguin">Groupe sanguin</Label><Select value={formData.groupe_sanguin} onValueChange={(value) => setFormData(prev => ({...prev, groupe_sanguin: value}))}><SelectTrigger><SelectValue placeholder="Sélectionner"/></SelectTrigger><SelectContent><SelectItem value="A+">A+</SelectItem><SelectItem value="A-">A-</SelectItem><SelectItem value="B+">B+</SelectItem><SelectItem value="B-">B-</SelectItem><SelectItem value="AB+">AB+</SelectItem><SelectItem value="AB-">AB-</SelectItem><SelectItem value="O+">O+</SelectItem><SelectItem value="O-">O-</SelectItem></SelectContent></Select></div>
            
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-2"><Label htmlFor="poids_naissance">Poids à la naissance (kg)</Label><Input id="poids_naissance" name="poids_naissance" type="number" step="0.1" value={formData.poids_naissance} onChange={handleChange}/></div>
                    <div className="space-y-2"><Label htmlFor="taille_naissance">Taille à la naissance (cm)</Label><Input id="taille_naissance" name="taille_naissance" type="number" step="0.1" value={formData.taille_naissance} onChange={handleChange}/></div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose} disabled={mutation.isPending}>Annuler</Button>
                <Button type="submit" disabled={mutation.isPending}>
                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
                </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}