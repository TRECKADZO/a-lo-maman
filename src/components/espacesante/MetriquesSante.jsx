import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Weight,
  Activity,
  Heart,
  Thermometer,
  Droplet,
  TrendingUp,
  TrendingDown,
  Plus,
  Loader2,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  ResponsiveContainer
} from 'recharts';

export default function MetriquesSante({ userEmail }) {
  const queryClient = useQueryClient();
  const [showAddMetrique, setShowAddMetrique] = useState(false);
  const [selectedType, setSelectedType] = useState('poids');
  const [formData, setFormData] = useState({
    valeur: '',
    valeur_systolique: '',
    valeur_diastolique: '',
    notes: '',
    contexte: 'repos'
  });

  const { data: metriques = [], isLoading } = useQuery({
    queryKey: ['metriques_sante', userEmail],
    queryFn: async () => {
      if (!userEmail) return [];
      return await base44.entities.MetriqueSante.filter(
        { created_by: userEmail },
        '-date_mesure',
        100
      );
    },
    enabled: !!userEmail,
  });

  const ajouterMetriqueMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.MetriqueSante.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metriques_sante'] });
      setShowAddMetrique(false);
      setFormData({ valeur: '', valeur_systolique: '', valeur_diastolique: '', notes: '', contexte: 'repos' });
    }
  });

  const typesMetriques = {
    'poids': { label: 'Poids', icon: Weight, unite: 'kg', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    'tension_arterielle': { label: 'Tension artérielle', icon: Activity, unite: 'mmHg', color: 'text-red-600', bgColor: 'bg-red-50' },
    'glycemie': { label: 'Glycémie', icon: Droplet, unite: 'mg/dL', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    'temperature': { label: 'Température', icon: Thermometer, unite: '°C', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
    'frequence_cardiaque': { label: 'Fréquence cardiaque', icon: Heart, unite: 'bpm', color: 'text-pink-600', bgColor: 'bg-pink-50' },
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const metriqueData = {
      type: selectedType,
      date_mesure: new Date().toISOString(),
      source: 'auto_mesure',
      contexte: formData.contexte,
      notes: formData.notes || null,
    };

    if (selectedType === 'tension_arterielle') {
      if (!formData.valeur_systolique || !formData.valeur_diastolique) {
        alert('Veuillez renseigner la tension systolique et diastolique');
        return;
      }
      metriqueData.valeur_systolique = parseFloat(formData.valeur_systolique);
      metriqueData.valeur_diastolique = parseFloat(formData.valeur_diastolique);
      metriqueData.unite = 'mmHg';
    } else {
      if (!formData.valeur) {
        alert('Veuillez renseigner une valeur');
        return;
      }
      metriqueData.valeur = parseFloat(formData.valeur);
      metriqueData.unite = typesMetriques[selectedType].unite;
    }

    ajouterMetriqueMutation.mutate(metriqueData);
  };

  const getMetriquesByType = (type) => {
    return metriques
      .filter(m => m.type === type)
      .slice(0, 10)
      .reverse();
  };

  const prepareChartData = (type) => {
    const metriquesByType = getMetriquesByType(type);
    
    if (type === 'tension_arterielle') {
      return metriquesByType.map(m => ({
        date: format(new Date(m.date_mesure), 'dd/MM'),
        Systolique: m.valeur_systolique,
        Diastolique: m.valeur_diastolique
      }));
    }
    
    return metriquesByType.map(m => ({
      date: format(new Date(m.date_mesure), 'dd/MM'),
      valeur: m.valeur
    }));
  };

  const calculerTendance = (type) => {
    const metriquesByType = getMetriquesByType(type).slice(-5);
    if (metriquesByType.length < 2) return null;
    
    const valeurs = metriquesByType.map(m => m.valeur || m.valeur_systolique);
    const premierValeur = valeurs[0];
    const derniereValeur = valeurs[valeurs.length - 1];
    
    return derniereValeur > premierValeur ? 'hausse' : 'baisse';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Mes métriques de santé</h2>
        <Button onClick={() => setShowAddMetrique(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Grille des métriques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(typesMetriques).map(([key, info]) => {
          const Icon = info.icon;
          const derniereMetrique = getMetriquesByType(key)[0];
          const tendance = calculerTendance(key);
          
          return (
            <Card key={key} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 ${info.bgColor} rounded-xl`}>
                      <Icon className={`w-6 h-6 ${info.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{info.label}</p>
                      {derniereMetrique && (
                        <p className="text-2xl font-bold text-gray-900">
                          {key === 'tension_arterielle' 
                            ? `${derniereMetrique.valeur_systolique}/${derniereMetrique.valeur_diastolique}`
                            : derniereMetrique.valeur
                          }
                          <span className="text-sm font-normal text-gray-600 ml-1">{info.unite}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {tendance && (
                    <div className={`flex items-center ${tendance === 'hausse' ? 'text-red-500' : 'text-green-500'}`}>
                      {tendance === 'hausse' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    </div>
                  )}
                </div>
                
                {derniereMetrique && (
                  <div className="text-xs text-gray-500">
                    Dernière mesure : {format(new Date(derniereMetrique.date_mesure), 'dd/MM/yyyy à HH:mm')}
                  </div>
                )}

                {/* Mini graphique */}
                {getMetriquesByType(key).length > 0 && (
                  <div className="mt-4 h-20">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={prepareChartData(key)}>
                        <Line 
                          type="monotone" 
                          dataKey={key === 'tension_arterielle' ? 'Systolique' : 'valeur'}
                          stroke={info.color.replace('text-', '#')} 
                          strokeWidth={2}
                          dot={false}
                        />
                        {key === 'tension_arterielle' && (
                          <Line 
                            type="monotone" 
                            dataKey="Diastolique"
                            stroke="#94a3b8"
                            strokeWidth={2}
                            dot={false}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Ajouter une métrique */}
      {showAddMetrique && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Ajouter une mesure</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowAddMetrique(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Type de métrique</Label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {Object.entries(typesMetriques).map(([key, info]) => (
                      <option key={key} value={key}>{info.label}</option>
                    ))}
                  </select>
                </div>

                {selectedType === 'tension_arterielle' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Systolique</Label>
                      <Input
                        type="number"
                        step="1"
                        placeholder="120"
                        value={formData.valeur_systolique}
                        onChange={(e) => setFormData({ ...formData, valeur_systolique: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Diastolique</Label>
                      <Input
                        type="number"
                        step="1"
                        placeholder="80"
                        value={formData.valeur_diastolique}
                        onChange={(e) => setFormData({ ...formData, valeur_diastolique: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Valeur ({typesMetriques[selectedType].unite})</Label>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder={selectedType === 'poids' ? '65.5' : ''}
                      value={formData.valeur}
                      onChange={(e) => setFormData({ ...formData, valeur: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Contexte</Label>
                  <select
                    value={formData.contexte}
                    onChange={(e) => setFormData({ ...formData, contexte: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    <option value="repos">Au repos</option>
                    <option value="effort">Après effort</option>
                    <option value="apres_repas">Après repas</option>
                    <option value="a_jeun">À jeun</option>
                    <option value="matin">Matin</option>
                    <option value="soir">Soir</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    placeholder="Observations..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAddMetrique(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={ajouterMetriqueMutation.isPending}
                  >
                    {ajouterMetriqueMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Ajout...
                      </>
                    ) : (
                      'Ajouter'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}