import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Baby, TrendingUp, TrendingDown, Minus, Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PoidsNourrissonSuivi({ suivi }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date_mesure: new Date().toISOString().split('T')[0],
    poids_kg: '',
    taille_cm: '',
    notes: ''
  });

  const { data: enfant } = useQuery({
    queryKey: ['enfant_nouveau_ne', suivi.grossesse_id],
    queryFn: async () => {
      const enfants = await base44.entities.EnfantCarnet.filter({ 
        grossesse_id: suivi.grossesse_id 
      });
      return enfants[0];
    },
    enabled: !!suivi.grossesse_id
  });

  const mesuresPoids = enfant?.croissance || [];

  const ajouterMesureMutation = useMutation({
    mutationFn: async () => {
      if (!enfant) {
        throw new Error('Veuillez d\'abord créer le carnet de l\'enfant');
      }

      const nouvelleMesure = {
        date_mesure: formData.date_mesure,
        poids_kg: parseFloat(formData.poids_kg),
        taille_cm: formData.taille_cm ? parseFloat(formData.taille_cm) : undefined,
        notes: formData.notes
      };

      await base44.entities.EnfantCarnet.update(enfant.id, {
        croissance: [...mesuresPoids, nouvelleMesure]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['enfant_nouveau_ne']);
      toast.success('Mesure ajoutée');
      setShowForm(false);
      setFormData({
        date_mesure: new Date().toISOString().split('T')[0],
        poids_kg: '',
        taille_cm: '',
        notes: ''
      });
    }
  });

  const derniereMesure = mesuresPoids.slice(-1)[0];
  const avantDerniereMesure = mesuresPoids.slice(-2)[0];
  
  const evolution = derniereMesure && avantDerniereMesure 
    ? derniereMesure.poids_kg - avantDerniereMesure.poids_kg 
    : null;

  const dataGraphique = mesuresPoids
    .slice(-10)
    .map(m => ({
      date: format(new Date(m.date_mesure), 'dd/MM', { locale: fr }),
      poids: m.poids_kg
    }));

  return (
    <Card className="shadow-lg border-none overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Baby className="w-5 h-5 text-blue-600" />
            Poids du nourrisson
          </h3>
          <Button size="sm" onClick={() => setShowForm(!showForm)} variant={showForm ? "outline" : "default"}>
            {showForm ? 'Annuler' : <><Plus className="w-4 h-4" /></>}
          </Button>
        </div>

        {showForm ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.date_mesure}
                  onChange={(e) => setFormData({ ...formData, date_mesure: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Poids (kg) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.poids_kg}
                  onChange={(e) => setFormData({ ...formData, poids_kg: e.target.value })}
                  placeholder="3.5"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>Taille (cm)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.taille_cm}
                onChange={(e) => setFormData({ ...formData, taille_cm: e.target.value })}
                placeholder="50"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observations..."
                className="mt-1"
              />
            </div>

            <Button
              onClick={() => ajouterMesureMutation.mutate()}
              disabled={ajouterMesureMutation.isPending || !formData.poids_kg}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {ajouterMesureMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Enregistrer la mesure
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {derniereMesure ? (
              <>
                <div className="p-4 bg-blue-50 rounded-xl">
                  <p className="text-xs text-gray-500 mb-1">Dernière mesure</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold text-blue-900">{derniereMesure.poids_kg} kg</p>
                      <p className="text-xs text-gray-600">
                        {format(new Date(derniereMesure.date_mesure), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                    </div>
                    {evolution !== null && (
                      <Badge className={`${
                        evolution > 0 ? 'bg-green-100 text-green-800' :
                        evolution < 0 ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {evolution > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : 
                         evolution < 0 ? <TrendingDown className="w-3 h-3 mr-1" /> :
                         <Minus className="w-3 h-3 mr-1" />}
                        {evolution > 0 ? '+' : ''}{evolution.toFixed(2)} kg
                      </Badge>
                    )}
                  </div>
                </div>

                {dataGraphique.length > 1 && (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Évolution</p>
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={dataGraphique}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" style={{ fontSize: '10px' }} />
                        <YAxis style={{ fontSize: '10px' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="poids" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Historique</p>
                  {mesuresPoids.slice(-5).reverse().map((mesure, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{mesure.poids_kg} kg</p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(mesure.date_mesure), 'dd MMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      {mesure.taille_cm && (
                        <Badge variant="outline" className="text-xs">
                          {mesure.taille_cm} cm
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Baby className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500 mb-3">Aucune mesure enregistrée</p>
                <Button size="sm" onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter une mesure
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}