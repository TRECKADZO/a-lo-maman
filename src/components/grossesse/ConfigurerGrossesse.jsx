import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Save, Loader2, Calendar, Heart } from "lucide-react";
import { addDays } from "date-fns";

export default function ConfigurerGrossesse({ grossesseExistante, onClose }) {
  const queryClient = useQueryClient();
  const [methodeCalcul, setMethodeCalcul] = useState("ddr"); // "ddr" ou "conception"
  
  const [formData, setFormData] = useState({
    date_derniere_regle: grossesseExistante?.date_derniere_regle || "",
    date_conception: grossesseExistante?.date_conception || "",
    date_accouchement_prevue: grossesseExistante?.date_accouchement_prevue || "",
    type_grossesse: grossesseExistante?.type_grossesse || "unique",
    groupe_sanguin: grossesseExistante?.groupe_sanguin || "",
    rhesus: grossesseExistante?.rhesus || "",
    antecedents: grossesseExistante?.antecedents || [],
    allergies: grossesseExistante?.allergies || []
  });

  // Calcul de la DPA selon la règle de Naegele
  const calculerDPA = (date, methode) => {
    if (!date) return "";
    
    const dateDebut = new Date(date);
    let dpa;
    
    if (methode === "ddr") {
      // Règle de Naegele: DDR + 280 jours (40 semaines)
      dpa = addDays(dateDebut, 280);
    } else {
      // À partir de la conception: + 266 jours (38 semaines)
      dpa = addDays(dateDebut, 266);
    }
    
    return dpa.toISOString().split('T')[0];
  };

  const handleDateChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    
    if (field === "date_derniere_regle" && methodeCalcul === "ddr") {
      newData.date_accouchement_prevue = calculerDPA(value, "ddr");
    } else if (field === "date_conception" && methodeCalcul === "conception") {
      newData.date_accouchement_prevue = calculerDPA(value, "conception");
      // Calculer DDR approximative (conception - 14 jours)
      if (value) {
        const dateConception = new Date(value);
        const ddrEstimee = addDays(dateConception, -14);
        newData.date_derniere_regle = ddrEstimee.toISOString().split('T')[0];
      }
    }
    
    setFormData(newData);
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (grossesseExistante) {
        return base44.entities.SuiviGrossesse.update(grossesseExistante.id, data);
      } else {
        return base44.entities.SuiviGrossesse.create({
          ...data,
          grossesse_active: true,
          issue_grossesse: "en_cours"
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-pink-50 to-rose-50">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl flex items-center gap-2">
              <Heart className="w-6 h-6 text-pink-600" />
              {grossesseExistante ? 'Modifier ma grossesse' : 'Configurer ma grossesse'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Méthode de calcul */}
            <div className="space-y-4">
              <Label>Comment souhaitez-vous calculer votre date d'accouchement ?</Label>
              <Tabs value={methodeCalcul} onValueChange={setMethodeCalcul}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="ddr">
                    <Calendar className="w-4 h-4 mr-2" />
                    Date des dernières règles
                  </TabsTrigger>
                  <TabsTrigger value="conception">
                    <Heart className="w-4 h-4 mr-2" />
                    Date de conception
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="ddr" className="space-y-4 mt-4">
                  <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                    <p className="text-sm text-pink-900">
                      💡 <strong>Méthode recommandée:</strong> La date des dernières règles 
                      est la méthode la plus courante pour calculer la date d'accouchement.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ddr">Date des dernières règles (DDR) *</Label>
                    <Input
                      id="ddr"
                      type="date"
                      value={formData.date_derniere_regle}
                      onChange={(e) => handleDateChange("date_derniere_regle", e.target.value)}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500">
                      Le premier jour de vos dernières règles
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="conception" className="space-y-4 mt-4">
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-sm text-purple-900">
                      💡 Utilisez cette méthode si vous connaissez la date exacte de conception 
                      (par exemple après FIV ou date de rapport unique).
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="conception">Date de conception *</Label>
                    <Input
                      id="conception"
                      type="date"
                      value={formData.date_conception}
                      onChange={(e) => handleDateChange("date_conception", e.target.value)}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Date d'accouchement calculée */}
            {formData.date_accouchement_prevue && (
              <div className="p-6 bg-gradient-to-r from-pink-100 to-rose-100 rounded-xl border-2 border-pink-300">
                <h3 className="font-semibold text-pink-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Date Probable d'Accouchement (DPA)
                </h3>
                <p className="text-3xl font-bold text-pink-700">
                  {new Date(formData.date_accouchement_prevue).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-sm text-pink-800 mt-2">
                  Cette date est une estimation. Seuls 5% des bébés naissent exactement à la DPA.
                </p>
              </div>
            )}

            {/* Informations complémentaires */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informations complémentaires</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type_grossesse">Type de grossesse</Label>
                  <Select
                    value={formData.type_grossesse}
                    onValueChange={(value) => setFormData({ ...formData, type_grossesse: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unique">Unique</SelectItem>
                      <SelectItem value="gemellaire">Gémellaire (jumeaux)</SelectItem>
                      <SelectItem value="multiple">Multiple (3+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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
                      <SelectItem value="A">A</SelectItem>
                      <SelectItem value="B">B</SelectItem>
                      <SelectItem value="AB">AB</SelectItem>
                      <SelectItem value="O">O</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rhesus">Rhésus</Label>
                  <Select
                    value={formData.rhesus}
                    onValueChange={(value) => setFormData({ ...formData, rhesus: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positif">Positif (+)</SelectItem>
                      <SelectItem value="negatif">Négatif (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={saveMutation.isPending}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700"
                disabled={saveMutation.isPending}
              >
                {saveMutation.isPending ? (
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