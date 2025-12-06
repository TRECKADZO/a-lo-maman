import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Heart,
  Thermometer,
  Droplet,
  Weight,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Watch,
  Smartphone,
  AlertCircle,
  Clock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, subDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const TYPES_DONNEES = {
  frequence_cardiaque: {
    nom: 'Fréquence cardiaque',
    unite: 'bpm',
    icon: Heart,
    color: 'text-red-500',
    seuils: { min: 60, max: 100 },
    gradient: 'from-red-400 to-pink-500'
  },
  pression_arterielle: {
    nom: 'Pression artérielle',
    unite: 'mmHg',
    icon: Activity,
    color: 'text-purple-500',
    seuils: { systolique_max: 140, diastolique_max: 90 },
    gradient: 'from-purple-400 to-indigo-500'
  },
  temperature: {
    nom: 'Température',
    unite: '°C',
    icon: Thermometer,
    color: 'text-orange-500',
    seuils: { min: 36.5, max: 37.5 },
    gradient: 'from-orange-400 to-red-500'
  },
  saturation_oxygene: {
    nom: 'Saturation O₂',
    unite: '%',
    icon: Droplet,
    color: 'text-blue-500',
    seuils: { min: 95 },
    gradient: 'from-blue-400 to-cyan-500'
  },
  poids: {
    nom: 'Poids',
    unite: 'kg',
    icon: Weight,
    color: 'text-green-500',
    gradient: 'from-green-400 to-emerald-500'
  }
};

export default function MoniteuringSante() {
  const queryClient = useQueryClient();
  const [typeDonnee, setTypeDonnee] = useState('frequence_cardiaque');
  const [valeur, setValeur] = useState('');
  const [valeurSystolique, setValeurSystolique] = useState('');
  const [valeurDiastolique, setValeurDiastolique] = useState('');
  const [source, setSource] = useState('saisie_manuelle');
  const [notes, setNotes] = useState('');
  const [periode, setPeriode] = useState('7jours');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: donneesVitales = [], isLoading } = useQuery({
    queryKey: ['donnees_vitales', user?.email, periode],
    queryFn: async () => {
      if (!user) return [];
      
      const jours = periode === '7jours' ? 7 : periode === '30jours' ? 30 : 90;
      const dateDebut = subDays(new Date(), jours).toISOString();
      
      const donnees = await base44.entities.DonneesVitales.filter({
        patient_email: user.email,
        created_date: { $gte: dateDebut }
      }, '-created_date');
      
      return donnees;
    },
    enabled: !!user
  });

  const { data: alertes = [] } = useQuery({
    queryKey: ['alertes_vitales', user?.email],
    queryFn: async () => {
      if (!user) return [];
      
      const dateDebut = subDays(new Date(), 1).toISOString();
      return await base44.entities.DonneesVitales.filter({
        patient_email: user.email,
        alerte_declenchee: true,
        created_date: { $gte: dateDebut }
      }, '-created_date');
    },
    enabled: !!user
  });

  const ajouterDonneeMutation = useMutation({
    mutationFn: async (data) => {
      // Calculer si alerte selon seuils
      const config = TYPES_DONNEES[data.type_donnee];
      let alerteNiveau = 'normal';
      let alerteDeclenchee = false;

      if (config.seuils) {
        if (data.type_donnee === 'pression_arterielle') {
          if (data.valeur_systolique > config.seuils.systolique_max || data.valeur_diastolique > config.seuils.diastolique_max) {
            alerteNiveau = 'urgent';
            alerteDeclenchee = true;
          }
        } else {
          if (config.seuils.min && data.valeur < config.seuils.min) {
            alerteNiveau = data.valeur < config.seuils.min * 0.9 ? 'urgent' : 'attention';
            alerteDeclenchee = true;
          }
          if (config.seuils.max && data.valeur > config.seuils.max) {
            alerteNiveau = data.valeur > config.seuils.max * 1.1 ? 'urgent' : 'attention';
            alerteDeclenchee = true;
          }
        }
      }

      // Calculer tendance
      const donneesRecentes = donneesVitales
        .filter(d => d.type_donnee === data.type_donnee)
        .slice(0, 3);
      
      let tendance = 'stable';
      if (donneesRecentes.length >= 2) {
        const moyenneRecente = donneesRecentes.reduce((sum, d) => sum + d.valeur, 0) / donneesRecentes.length;
        if (data.valeur > moyenneRecente * 1.05) tendance = 'croissante';
        if (data.valeur < moyenneRecente * 0.95) tendance = 'decroissante';
      }

      const donneeComplete = {
        ...data,
        alerte_declenchee: alerteDeclenchee,
        alerte_niveau: alerteNiveau,
        tendance: tendance
      };

      await base44.entities.DonneesVitales.create(donneeComplete);

      // Si alerte urgente, créer une notification
      if (alerteNiveau === 'urgent') {
        await base44.entities.Notification.create({
          destinataire_email: user.email,
          type: 'alerte_sante',
          titre: `⚠️ Alerte santé : ${config.nom}`,
          message: `Valeur anormale détectée : ${data.valeur} ${data.unite}. Consultez rapidement un professionnel de santé.`,
          priorite: 'urgente',
          icone: 'AlertTriangle'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donnees_vitales'] });
      queryClient.invalidateQueries({ queryKey: ['alertes_vitales'] });
      resetForm();
    }
  });

  const resetForm = () => {
    setValeur('');
    setValeurSystolique('');
    setValeurDiastolique('');
    setNotes('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = {
      patient_email: user.email,
      type_donnee: typeDonnee,
      source: source,
      notes: notes || null
    };

    if (typeDonnee === 'pression_arterielle') {
      data.valeur_systolique = parseFloat(valeurSystolique);
      data.valeur_diastolique = parseFloat(valeurDiastolique);
      data.valeur = parseFloat(valeurSystolique); // Pour tri/recherche
      data.unite = 'mmHg';
    } else {
      data.valeur = parseFloat(valeur);
      data.unite = TYPES_DONNEES[typeDonnee].unite;
    }

    ajouterDonneeMutation.mutate(data);
  };

  // Préparer données pour graphique
  const donneesParType = donneesVitales.filter(d => d.type_donnee === typeDonnee);
  const graphData = donneesParType.map(d => ({
    date: format(new Date(d.created_date), 'dd/MM HH:mm'),
    valeur: d.valeur,
    systolique: d.valeur_systolique,
    diastolique: d.valeur_diastolique
  })).reverse();

  // Stats moyennes
  const moyenneValeurs = donneesParType.length > 0
    ? (donneesParType.reduce((sum, d) => sum + d.valeur, 0) / donneesParType.length).toFixed(1)
    : 0;

  const config = TYPES_DONNEES[typeDonnee];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
            </div>
            Monitoring Santé en Temps Réel
          </h1>
          <p className="text-gray-600 mt-1">
            Suivez vos données vitales et recevez des alertes personnalisées
          </p>
        </div>

        {/* Alertes actives */}
        {alertes.length > 0 && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <AlertDescription>
              <strong className="text-red-900">Alertes actives :</strong>
              <ul className="mt-2 space-y-1">
                {alertes.map(alerte => {
                  const configAlerte = TYPES_DONNEES[alerte.type_donnee];
                  return (
                    <li key={alerte.id} className="text-red-800 text-sm">
                      • {configAlerte.nom} : {alerte.valeur} {alerte.unite} - {format(new Date(alerte.created_date), 'HH:mm', { locale: fr })}
                    </li>
                  );
                })}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire d'ajout */}
          <Card className="lg:col-span-1 shadow-xl border-none">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Ajouter une mesure
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Type de donnée</Label>
                  <Select value={typeDonnee} onValueChange={setTypeDonnee}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TYPES_DONNEES).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {typeDonnee === 'pression_arterielle' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Systolique</Label>
                      <Input
                        type="number"
                        value={valeurSystolique}
                        onChange={(e) => setValeurSystolique(e.target.value)}
                        placeholder="120"
                        required
                      />
                    </div>
                    <div>
                      <Label>Diastolique</Label>
                      <Input
                        type="number"
                        value={valeurDiastolique}
                        onChange={(e) => setValeurDiastolique(e.target.value)}
                        placeholder="80"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label>Valeur ({config.unite})</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={valeur}
                      onChange={(e) => setValeur(e.target.value)}
                      placeholder={`Ex: ${config.seuils?.min || 70}`}
                      required
                    />
                  </div>
                )}

                <div>
                  <Label>Source de la mesure</Label>
                  <Select value={source} onValueChange={setSource}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="saisie_manuelle">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4" />
                          Saisie manuelle
                        </div>
                      </SelectItem>
                      <SelectItem value="wearable">
                        <div className="flex items-center gap-2">
                          <Watch className="w-4 h-4" />
                          Montre connectée
                        </div>
                      </SelectItem>
                      <SelectItem value="appareil_medical">Appareil médical</SelectItem>
                      <SelectItem value="application_tierce">Application tierce</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes (optionnel)</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contexte, symptômes..."
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600"
                  disabled={ajouterDonneeMutation.isPending}
                >
                  {ajouterDonneeMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Enregistrer
                </Button>
              </form>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-xs">
                  <strong>Valeurs normales :</strong><br />
                  {config.seuils && (
                    <>
                      {config.seuils.min && `Min: ${config.seuils.min} ${config.unite}`}
                      {config.seuils.max && ` - Max: ${config.seuils.max} ${config.unite}`}
                      {config.seuils.systolique_max && `Sys: <${config.seuils.systolique_max} / Dia: <${config.seuils.diastolique_max} ${config.unite}`}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Graphique et historique */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card className={`border-none shadow-lg bg-gradient-to-br ${config.gradient}`}>
                <CardContent className="p-4 text-white">
                  <p className="text-sm opacity-90">Moyenne</p>
                  <p className="text-3xl font-bold">{moyenneValeurs}</p>
                  <p className="text-xs opacity-75">{config.unite}</p>
                </CardContent>
              </Card>
              
              <Card className="border-none shadow-lg bg-gradient-to-br from-green-400 to-emerald-500">
                <CardContent className="p-4 text-white">
                  <p className="text-sm opacity-90">Mesures</p>
                  <p className="text-3xl font-bold">{donneesParType.length}</p>
                  <p className="text-xs opacity-75">Total</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-gradient-to-br from-orange-400 to-red-500">
                <CardContent className="p-4 text-white">
                  <p className="text-sm opacity-90">Alertes</p>
                  <p className="text-3xl font-bold">{alertes.length}</p>
                  <p className="text-xs opacity-75">Actives</p>
                </CardContent>
              </Card>
            </div>

            {/* Graphique */}
            <Card className="shadow-xl border-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Évolution - {config.nom}
                  </CardTitle>
                  <Select value={periode} onValueChange={setPeriode}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7jours">7 jours</SelectItem>
                      <SelectItem value="30jours">30 jours</SelectItem>
                      <SelectItem value="90jours">90 jours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {graphData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={graphData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      {config.seuils?.max && (
                        <ReferenceLine y={config.seuils.max} stroke="red" strokeDasharray="3 3" />
                      )}
                      {config.seuils?.min && (
                        <ReferenceLine y={config.seuils.min} stroke="orange" strokeDasharray="3 3" />
                      )}
                      <Line type="monotone" dataKey="valeur" stroke="#8b5cf6" strokeWidth={2} />
                      {typeDonnee === 'pression_arterielle' && (
                        <>
                          <Line type="monotone" dataKey="systolique" stroke="#ef4444" strokeWidth={2} />
                          <Line type="monotone" dataKey="diastolique" stroke="#3b82f6" strokeWidth={2} />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Activity className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Aucune donnée enregistrée pour cette période</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historique récent */}
            <Card className="shadow-xl border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Historique récent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {donneesParType.slice(0, 10).map(donnee => (
                    <div key={donnee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${donnee.alerte_declenchee ? 'bg-red-100' : 'bg-green-100'}`}>
                          {donnee.alerte_declenchee ? (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {typeDonnee === 'pression_arterielle'
                              ? `${donnee.valeur_systolique}/${donnee.valeur_diastolique}`
                              : donnee.valeur
                            } {donnee.unite}
                          </p>
                          <p className="text-xs text-gray-600">
                            {format(new Date(donnee.created_date), 'dd MMM yyyy - HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {donnee.tendance === 'croissante' && <TrendingUp className="w-4 h-4 text-orange-500" />}
                        {donnee.tendance === 'decroissante' && <TrendingDown className="w-4 h-4 text-blue-500" />}
                        {donnee.tendance === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
                        <Badge variant="outline" className="text-xs">
                          {donnee.source === 'wearable' ? '⌚ Montre' : '📱 Manuel'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}