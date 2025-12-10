import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Scale,
  Activity,
  Heart,
  TrendingUp,
  Calendar as CalendarIcon,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const symptomesCommuns = [
  'Nausées',
  'Vomissements',
  'Fatigue',
  'Maux de tête',
  'Douleurs abdominales',
  'Contractions',
  'Saignements',
  'Œdème (gonflement)',
  'Brûlures d\'estomac',
  'Constipation',
  'Insomnie',
  'Douleurs lombaires',
  'Crampes',
  'Essoufflement'
];

export default function SuiviDetaille({ grossesse }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('poids');

  // États pour le suivi du poids
  const [nouvellePesee, setNouvellePesee] = useState({
    date: new Date(),
    poids: '',
    notes: ''
  });

  // États pour les symptômes
  const [nouveauSymptome, setNouveauSymptome] = useState({
    date: new Date(),
    symptomes: [],
    severite: 'leger',
    notes: ''
  });

  // États pour les mouvements du bébé
  const [nouveauMouvement, setNouveauMouvement] = useState({
    date: new Date(),
    heure: '',
    nombre_mouvements: '',
    duree_minutes: '',
    notes: ''
  });

  // Mutation pour ajouter une pesée
  const ajouterPeseeMutation = useMutation({
    mutationFn: async () => {
      const consultations = grossesse.consultations || [];
      consultations.push({
        date: format(nouvellePesee.date, 'yyyy-MM-dd'),
        poids: parseFloat(nouvellePesee.poids),
        notes: nouvellePesee.notes,
        type: 'pesee_personnelle'
      });
      
      return base44.entities.SuiviGrossesse.update(grossesse.id, { consultations });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      setNouvellePesee({ date: new Date(), poids: '', notes: '' });
    }
  });

  // Mutation pour ajouter des symptômes
  const ajouterSymptomesMutation = useMutation({
    mutationFn: async () => {
      const symptomes_journal = grossesse.symptomes_journal || [];
      symptomes_journal.push({
        date: format(nouveauSymptome.date, 'yyyy-MM-dd'),
        symptomes: nouveauSymptome.symptomes,
        severite: nouveauSymptome.severite,
        notes: nouveauSymptome.notes
      });
      
      return base44.entities.SuiviGrossesse.update(grossesse.id, { symptomes_journal });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      setNouveauSymptome({ date: new Date(), symptomes: [], severite: 'leger', notes: '' });
    }
  });

  // Mutation pour ajouter des mouvements
  const ajouterMouvementMutation = useMutation({
    mutationFn: async () => {
      const mouvements_bebe = grossesse.mouvements_bebe || [];
      mouvements_bebe.push({
        date: `${format(nouveauMouvement.date, 'yyyy-MM-dd')}T${nouveauMouvement.heure}:00`,
        nombre_mouvements: parseInt(nouveauMouvement.nombre_mouvements),
        duree_minutes: parseInt(nouveauMouvement.duree_minutes) || null,
        notes: nouveauMouvement.notes
      });
      
      return base44.entities.SuiviGrossesse.update(grossesse.id, { mouvements_bebe });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      setNouveauMouvement({ date: new Date(), heure: '', nombre_mouvements: '', duree_minutes: '', notes: '' });
    }
  });

  // Préparer les données pour le graphique de poids
  const dataPoids = (grossesse.consultations || [])
    .filter(c => c.poids)
    .map(c => ({
      date: format(new Date(c.date), 'dd/MM'),
      poids: c.poids
    }));

  // Calculer la moyenne des mouvements par jour (7 derniers jours)
  const mouvementsRecents = (grossesse.mouvements_bebe || [])
    .filter(m => {
      const dateM = new Date(m.date);
      const diff = Math.floor((new Date() - dateM) / (1000 * 60 * 60 * 24));
      return diff <= 7;
    });

  const moyenneMouvements = mouvementsRecents.length > 0
    ? Math.round(mouvementsRecents.reduce((sum, m) => sum + m.nombre_mouvements, 0) / mouvementsRecents.length)
    : 0;

  const handleSymptomeToggle = (symptome) => {
    setNouveauSymptome(prev => ({
      ...prev,
      symptomes: prev.symptomes.includes(symptome)
        ? prev.symptomes.filter(s => s !== symptome)
        : [...prev.symptomes, symptome]
    }));
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="poids">
            <Scale className="w-4 h-4 mr-2" />
            Poids
          </TabsTrigger>
          <TabsTrigger value="symptomes">
            <Activity className="w-4 h-4 mr-2" />
            Symptômes
          </TabsTrigger>
          <TabsTrigger value="mouvements">
            <Heart className="w-4 h-4 mr-2" />
            Mouvements bébé
          </TabsTrigger>
        </TabsList>

        {/* Onglet Poids */}
        <TabsContent value="poids" className="space-y-6">
          <IndicateursGrossesseEnhanced grossesse={grossesse} />
          
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-purple-600" />
                Suivi du poids
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Graphique */}
              {dataPoids.length > 1 && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold mb-4">Évolution du poids</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={dataPoids}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="poids" stroke="#9333ea" strokeWidth={2} name="Poids (kg)" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Formulaire d'ajout */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <h4 className="font-semibold">Ajouter une pesée</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {format(nouvellePesee.date, 'dd MMMM yyyy', { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={nouvellePesee.date}
                          onSelect={(date) => setNouvellePesee({ ...nouvellePesee, date })}
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Poids (kg)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={nouvellePesee.poids}
                      onChange={(e) => setNouvellePesee({ ...nouvellePesee, poids: e.target.value })}
                      placeholder="Ex: 65.5"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    value={nouvellePesee.notes}
                    onChange={(e) => setNouvellePesee({ ...nouvellePesee, notes: e.target.value })}
                    placeholder="Observations..."
                    rows={2}
                  />
                </div>
                <Button
                  onClick={() => ajouterPeseeMutation.mutate()}
                  disabled={!nouvellePesee.poids || ajouterPeseeMutation.isPending}
                  className="w-full"
                >
                  {ajouterPeseeMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" />Enregistrer la pesée</>
                  )}
                </Button>
              </div>

              {/* Historique */}
              <div>
                <h4 className="font-semibold mb-3">Historique des pesées</h4>
                <div className="space-y-2">
                  {(grossesse.consultations || [])
                    .filter(c => c.poids)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5)
                    .map((c, i) => (
                      <div key={i} className="p-3 bg-white border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{c.poids} kg</p>
                          <p className="text-sm text-gray-500">{format(new Date(c.date), 'dd MMMM yyyy', { locale: fr })}</p>
                        </div>
                        {c.notes && <p className="text-sm text-gray-600">{c.notes}</p>}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Symptômes */}
        <TabsContent value="symptomes" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" />
                Journal des symptômes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Résumé des symptômes sélectionnés */}
              {nouveauSymptome.symptomes.length > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm font-medium text-blue-800 mb-2">
                    {nouveauSymptome.symptomes.length} symptôme(s) sélectionné(s) :
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {nouveauSymptome.symptomes.map(s => (
                      <Badge key={s} className="bg-blue-100 text-blue-800 text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Bouton de validation - TOUJOURS VISIBLE EN HAUT */}
              <Button
                onClick={() => ajouterSymptomesMutation.mutate()}
                disabled={nouveauSymptome.symptomes.length === 0 || ajouterSymptomesMutation.isPending}
                className="w-full h-12 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold sticky top-0 z-10 shadow-lg"
              >
                {ajouterSymptomesMutation.isPending ? (
                  <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Enregistrement...</>
                ) : (
                  <><CheckCircle className="w-5 h-5 mr-2" />
                    {nouveauSymptome.symptomes.length > 0 
                      ? `Valider ${nouveauSymptome.symptomes.length} symptôme(s)` 
                      : 'Sélectionnez des symptômes'}
                  </>
                )}
              </Button>

              {/* Formulaire d'ajout */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Sélectionnez vos symptômes</h4>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <CalendarIcon className="w-3 h-3 mr-1" />
                        {format(nouveauSymptome.date, 'dd/MM', { locale: fr })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={nouveauSymptome.date}
                        onSelect={(date) => setNouveauSymptome({ ...nouveauSymptome, date })}
                        locale={fr}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Liste des symptômes en grille scrollable */}
                <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto p-1">
                  {symptomesCommuns.map(symptome => {
                    const isSelected = nouveauSymptome.symptomes.includes(symptome);
                    return (
                      <button
                        key={symptome}
                        type="button"
                        onClick={() => handleSymptomeToggle(symptome)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 text-blue-800' 
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                        }`}>
                          {isSelected && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <span className="font-medium">{symptome}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Sévérité */}
                <div className="pt-2 border-t">
                  <Label className="mb-2 block">Intensité des symptômes</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'leger', label: 'Léger', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
                      { value: 'modere', label: 'Modéré', color: 'bg-orange-100 text-orange-800 border-orange-300' },
                      { value: 'severe', label: 'Sévère', color: 'bg-red-100 text-red-800 border-red-300' }
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setNouveauSymptome({ ...nouveauSymptome, severite: option.value })}
                        className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          nouveauSymptome.severite === option.value 
                            ? option.color + ' border-current' 
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    value={nouveauSymptome.notes}
                    onChange={(e) => setNouveauSymptome({ ...nouveauSymptome, notes: e.target.value })}
                    placeholder="Détails supplémentaires..."
                    rows={2}
                  />
                </div>
              </div>

              {/* Historique */}
              <div>
                <h4 className="font-semibold mb-3">Derniers symptômes</h4>
                <div className="space-y-3">
                  {(grossesse.symptomes_journal || [])
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5)
                    .map((s, i) => (
                      <div key={i} className="p-3 bg-white border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm text-gray-500">
                            {format(new Date(s.date), 'dd MMMM yyyy', { locale: fr })}
                          </p>
                          <Badge className={
                            s.severite === 'severe' ? 'bg-red-100 text-red-800' :
                            s.severite === 'modere' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }>
                            {s.severite}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.symptomes.map((symptome, j) => (
                            <Badge key={j} variant="outline">{symptome}</Badge>
                          ))}
                        </div>
                        {s.notes && <p className="text-sm text-gray-600 mt-2">{s.notes}</p>}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet Mouvements */}
        <TabsContent value="mouvements" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-600" />
                Mouvements du bébé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Statistique */}
              <div className="p-4 bg-pink-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Moyenne (7 derniers jours)</p>
                    <p className="text-3xl font-bold text-pink-600">{moyenneMouvements}</p>
                    <p className="text-sm text-gray-500">mouvements par jour</p>
                  </div>
                  <Heart className="w-16 h-16 text-pink-200" />
                </div>
              </div>

              {/* Formulaire d'ajout */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                <h4 className="font-semibold">Enregistrer des mouvements</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          {format(nouveauMouvement.date, 'dd MMMM yyyy', { locale: fr })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={nouveauMouvement.date}
                          onSelect={(date) => setNouveauMouvement({ ...nouveauMouvement, date })}
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label>Heure</Label>
                    <Input
                      type="time"
                      value={nouveauMouvement.heure}
                      onChange={(e) => setNouveauMouvement({ ...nouveauMouvement, heure: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre de mouvements</Label>
                    <Input
                      type="number"
                      value={nouveauMouvement.nombre_mouvements}
                      onChange={(e) => setNouveauMouvement({ ...nouveauMouvement, nombre_mouvements: e.target.value })}
                      placeholder="Ex: 10"
                    />
                  </div>
                  <div>
                    <Label>Durée (minutes, optionnel)</Label>
                    <Input
                      type="number"
                      value={nouveauMouvement.duree_minutes}
                      onChange={(e) => setNouveauMouvement({ ...nouveauMouvement, duree_minutes: e.target.value })}
                      placeholder="Ex: 15"
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes (optionnel)</Label>
                  <Textarea
                    value={nouveauMouvement.notes}
                    onChange={(e) => setNouveauMouvement({ ...nouveauMouvement, notes: e.target.value })}
                    placeholder="Type de mouvements, observations..."
                    rows={2}
                  />
                </div>

                <Button
                  onClick={() => ajouterMouvementMutation.mutate()}
                  disabled={!nouveauMouvement.heure || !nouveauMouvement.nombre_mouvements || ajouterMouvementMutation.isPending}
                  className="w-full"
                >
                  {ajouterMouvementMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...</>
                  ) : (
                    <><Plus className="w-4 h-4 mr-2" />Enregistrer</>
                  )}
                </Button>
              </div>

              {/* Historique */}
              <div>
                <h4 className="font-semibold mb-3">Derniers enregistrements</h4>
                <div className="space-y-2">
                  {(grossesse.mouvements_bebe || [])
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5)
                    .map((m, i) => (
                      <div key={i} className="p-3 bg-white border rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium">{m.nombre_mouvements} mouvements</p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(m.date), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                          </p>
                          {m.duree_minutes && (
                            <p className="text-xs text-gray-500">Durée: {m.duree_minutes} min</p>
                          )}
                        </div>
                        {m.notes && <p className="text-sm text-gray-600 max-w-xs">{m.notes}</p>}
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}