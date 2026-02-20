import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Save, Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export default function AjouterEnfant({ onClose, onSuccess }) {
  const queryClient = useQueryClient();
  
  const initialFormData = {
    prenom: "",
    nom: "",
    date_naissance: "",
    sexe: "",
    numero_cmu: "",
    identifiant_provisoire: "",
    groupe_sanguin: "",
    poids_naissance: "",
    taille_naissance: "",
    allergies: [],
    maladies_chroniques: []
  };

  const [formData, setFormData] = useState(initialFormData);
  const [hasCmu, setHasCmu] = useState("non");

  const [nouvelleAllergie, setNouvelleAllergie] = useState("");
  const [nouvelleMaladie, setNouvelleMaladie] = useState("");

  const resetForm = () => {
    setFormData(initialFormData);
    setHasCmu("non");
    setNouvelleAllergie("");
    setNouvelleMaladie("");
  };

  const ajouterAllergie = () => {
    if (nouvelleAllergie.trim()) {
      setFormData({
        ...formData,
        allergies: [...formData.allergies, nouvelleAllergie.trim()]
      });
      setNouvelleAllergie("");
    }
  };

  const retirerAllergie = (index) => {
    setFormData({
      ...formData,
      allergies: formData.allergies.filter((_, i) => i !== index)
    });
  };

  const ajouterMaladie = () => {
    if (nouvelleMaladie.trim()) {
      setFormData({
        ...formData,
        maladies_chroniques: [...formData.maladies_chroniques, nouvelleMaladie.trim()]
      });
      setNouvelleMaladie("");
    }
  };

  const retirerMaladie = (index) => {
    setFormData({
      ...formData,
      maladies_chroniques: formData.maladies_chroniques.filter((_, i) => i !== index)
    });
  };

  const createEnfantMutation = useMutation({
    mutationFn: async (data) => {
      // Validation des champs requis
      if (!data.prenom || !data.date_naissance || !data.sexe) {
        throw new Error("Veuillez renseigner tous les champs obligatoires");
      }

      const dataToSend = {
        prenom: data.prenom,
        date_naissance: data.date_naissance,
        sexe: data.sexe
      };

      // Champs optionnels
      if (data.nom) dataToSend.nom = data.nom;
      if (data.numero_cmu) dataToSend.numero_cmu = data.numero_cmu;
      if (data.identifiant_provisoire) dataToSend.identifiant_provisoire = data.identifiant_provisoire;
      if (data.groupe_sanguin) dataToSend.groupe_sanguin = data.groupe_sanguin;
      if (data.poids_naissance) dataToSend.poids_naissance = parseFloat(data.poids_naissance);
      if (data.taille_naissance) dataToSend.taille_naissance = parseFloat(data.taille_naissance);
      if (data.allergies && data.allergies.length > 0) dataToSend.allergies = data.allergies;
      if (data.maladies_chroniques && data.maladies_chroniques.length > 0) dataToSend.maladies_chroniques = data.maladies_chroniques;
      
      return await base44.entities.EnfantCarnet.create(dataToSend);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      resetForm();
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    },
    onError: (error) => {
      console.error("Erreur lors de la création de l'enfant:", error);
      alert(error.message || "Erreur lors de l'enregistrement");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSubmit = { ...formData };
    if (hasCmu === 'oui') {
      dataToSubmit.identifiant_provisoire = "";
    } else {
      dataToSubmit.numero_cmu = "";
    }
    createEnfantMutation.mutate(dataToSubmit);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 md:p-4 overflow-y-auto">
      <Card className="w-full md:max-w-3xl my-0 md:my-8 shadow-2xl h-full md:h-auto md:max-h-[90vh] overflow-y-auto rounded-none md:rounded-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl">Ajouter un enfant</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations générales */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold text-lg">Informations générales</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_naissance">Date de naissance *</Label>
                  <Input
                    id="date_naissance"
                    type="date"
                    value={formData.date_naissance}
                    onChange={(e) => setFormData({ ...formData, date_naissance: e.target.value })}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sexe">Sexe *</Label>
                  <Select
                    value={formData.sexe}
                    onValueChange={(value) => setFormData({ ...formData, sexe: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="masculin">Masculin</SelectItem>
                      <SelectItem value="feminin">Féminin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3">
                <Label>L'enfant a-t-il un numéro CMU ?</Label>
                <RadioGroup value={hasCmu} onValueChange={setHasCmu} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="oui" id="r-oui" />
                    <Label htmlFor="r-oui">Oui</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="non" id="r-non" />
                    <Label htmlFor="r-non">Non</Label>
                  </div>
                </RadioGroup>
              </div>

              {hasCmu === 'oui' ? (
                <div className="space-y-2">
                  <Label htmlFor="numero_cmu">Numéro CMU *</Label>
                  <Input
                    id="numero_cmu"
                    value={formData.numero_cmu}
                    onChange={(e) => setFormData({ ...formData, numero_cmu: e.target.value })}
                    placeholder="CMU123456789"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="identifiant_provisoire">N° Acte de Naissance / Identifiant Temporaire *</Label>
                  <Input
                    id="identifiant_provisoire"
                    value={formData.identifiant_provisoire}
                    onChange={(e) => setFormData({ ...formData, identifiant_provisoire: e.target.value })}
                    placeholder="Entrez un identifiant unique"
                    required
                  />
                   <p className="text-xs text-gray-500">Vous pourrez ajouter le N° CMU plus tard.</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="groupe_sanguin">Groupe sanguin</Label>
                  <Select
                    value={formData.groupe_sanguin}
                    onValueChange={(value) => setFormData({ ...formData, groupe_sanguin: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A+">A+</SelectItem>
                      <SelectItem value="A-">A-</SelectItem>
                      <SelectItem value="B+">B+</SelectItem>
                      <SelectItem value="B-">B-</SelectItem>
                      <SelectItem value="AB+">AB+</SelectItem>
                      <SelectItem value="AB-">AB-</SelectItem>
                      <SelectItem value="O+">O+</SelectItem>
                      <SelectItem value="O-">O-</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>

            {/* Naissance */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold text-lg">À la naissance</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="poids_naissance">Poids (kg)</Label>
                  <Input
                    id="poids_naissance"
                    type="number"
                    step="0.1"
                    value={formData.poids_naissance}
                    onChange={(e) => setFormData({ ...formData, poids_naissance: e.target.value })}
                    placeholder="3.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taille_naissance">Taille (cm)</Label>
                  <Input
                    id="taille_naissance"
                    type="number"
                    step="0.1"
                    value={formData.taille_naissance}
                    onChange={(e) => setFormData({ ...formData, taille_naissance: e.target.value })}
                    placeholder="50"
                  />
                </div>
              </div>
            </div>

            {/* Allergies */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold text-lg">Allergies</h3>
              
              <div className="flex gap-2">
                <Input
                  value={nouvelleAllergie}
                  onChange={(e) => setNouvelleAllergie(e.target.value)}
                  placeholder="Ajouter une allergie"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterAllergie())}
                />
                <Button type="button" onClick={ajouterAllergie}>
                  Ajouter
                </Button>
              </div>

              {formData.allergies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.allergies.map((allergie, i) => (
                    <Badge key={i} className="bg-red-100 text-red-800">
                      {allergie}
                      <button
                        type="button"
                        onClick={() => retirerAllergie(i)}
                        className="ml-2 hover:text-red-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Maladies chroniques */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h3 className="font-semibold text-lg">Maladies chroniques</h3>
              
              <div className="flex gap-2">
                <Input
                  value={nouvelleMaladie}
                  onChange={(e) => setNouvelleMaladie(e.target.value)}
                  placeholder="Ajouter une maladie chronique"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterMaladie())}
                />
                <Button type="button" onClick={ajouterMaladie}>
                  Ajouter
                </Button>
              </div>

              {formData.maladies_chroniques.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.maladies_chroniques.map((maladie, i) => (
                    <Badge key={i} variant="outline">
                      {maladie}
                      <button
                        type="button"
                        onClick={() => retirerMaladie(i)}
                        className="ml-2 hover:text-gray-900"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={createEnfantMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={createEnfantMutation.isPending}
              >
                {createEnfantMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}