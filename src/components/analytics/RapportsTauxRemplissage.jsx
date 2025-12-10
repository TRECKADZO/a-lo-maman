import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp, Download, AlertCircle } from 'lucide-react';
import { format, subMonths, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function RapportsTauxRemplissage() {
  const [periode, setPeriode] = useState('1mois');
  const [specialite, setSpecialite] = useState('toutes');

  const { data: rdvs = [] } = useQuery({
    queryKey: ['tous_rdvs'],
    queryFn: () => base44.entities.RendezVous.list('-date_rdv', 5000),
  });

  const { data: professionnels = [] } = useQuery({
    queryKey: ['professionnels'],
    queryFn: () => base44.entities.Professionnel.list(),
  });

  const getDateDebut = () => {
    const now = new Date();
    switch (periode) {
      case '1semaine': return subMonths(now, 0.25);
      case '1mois': return subMonths(now, 1);
      case '3mois': return subMonths(now, 3);
      case '6mois': return subMonths(now, 6);
      default: return new Date(0);
    }
  };

  const dateDebut = getDateDebut();
  const rdvsFiltres = rdvs.filter(r => {
    const dateRdv = new Date(r.date_rdv);
    const pro = professionnels.find(p => p.id === r.professionnel_id);
    const specialiteMatch = specialite === 'toutes' || pro?.specialite === specialite;
    return dateRdv >= dateDebut && specialiteMatch;
  });

  // Taux de remplissage par professionnel
  const tauxParPro = professionnels.map(pro => {
    const rdvsPro = rdvsFiltres.filter(r => r.professionnel_id === pro.id);
    const termine = rdvsPro.filter(r => r.statut === 'termine').length;
    const annule = rdvsPro.filter(r => r.statut === 'annule').length;
    const total = rdvsPro.length;
    const taux = total > 0 ? ((termine / total) * 100).toFixed(1) : 0;
    const tauxAnnulation = total > 0 ? ((annule / total) * 100).toFixed(1) : 0;

    return {
      nom: pro.nom_complet,
      specialite: pro.specialite,
      total_rdv: total,
      termine,
      annule,
      taux_remplissage: parseFloat(taux),
      taux_annulation: parseFloat(tauxAnnulation)
    };
  }).filter(p => p.total_rdv > 0).sort((a, b) => b.taux_remplissage - a.taux_remplissage);

  // Taux par type de consultation
  const typesConsultation = ['cabinet', 'clinique', 'hopital', 'visio', 'telephone'];
  const tauxParType = typesConsultation.map(type => {
    const rdvsType = rdvsFiltres.filter(r => r.type_consultation === type);
    const termine = rdvsType.filter(r => r.statut === 'termine').length;
    const total = rdvsType.length;
    const taux = total > 0 ? ((termine / total) * 100).toFixed(1) : 0;

    return {
      type: type.charAt(0).toUpperCase() + type.slice(1),
      total_rdv: total,
      termine,
      taux_remplissage: parseFloat(taux)
    };
  }).filter(t => t.total_rdv > 0);

  // Évolution taux par semaine
  const rdvsGroupes = rdvsFiltres.reduce((acc, rdv) => {
    const semaine = format(new Date(rdv.date_rdv), 'w yyyy', { locale: fr });
    if (!acc[semaine]) acc[semaine] = { total: 0, termine: 0 };
    acc[semaine].total++;
    if (rdv.statut === 'termine') acc[semaine].termine++;
    return acc;
  }, {});

  const evolutionData = Object.entries(rdvsGroupes)
    .map(([semaine, data]) => ({
      semaine,
      taux: ((data.termine / data.total) * 100).toFixed(1)
    }))
    .slice(-12);

  // Heures de pointe
  const heuresPointe = rdvsFiltres.reduce((acc, rdv) => {
    const heure = new Date(rdv.date_rdv).getHours();
    if (!acc[heure]) acc[heure] = 0;
    acc[heure]++;
    return acc;
  }, {});

  const heuresData = Object.entries(heuresPointe)
    .map(([heure, count]) => ({
      heure: `${heure}h`,
      rdvs: count
    }))
    .sort((a, b) => parseInt(a.heure) - parseInt(b.heure));

  // Stats globales
  const totalRdvs = rdvsFiltres.length;
  const termine = rdvsFiltres.filter(r => r.statut === 'termine').length;
  const annule = rdvsFiltres.filter(r => r.statut === 'annule').length;
  const tauxGlobal = totalRdvs > 0 ? ((termine / totalRdvs) * 100).toFixed(1) : 0;
  const tauxAnnulationGlobal = totalRdvs > 0 ? ((annule / totalRdvs) * 100).toFixed(1) : 0;

  const exporterRapport = () => {
    const rapport = {
      periode,
      specialite,
      date_generation: new Date().toISOString(),
      statistiques_globales: {
        total_rdv: totalRdvs,
        termine,
        annule,
        taux_remplissage: tauxGlobal,
        taux_annulation: tauxAnnulationGlobal
      },
      par_professionnel: tauxParPro,
      par_type_consultation: tauxParType,
      heures_pointe: heuresData
    };

    const blob = new Blob([JSON.stringify(rapport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_taux_remplissage_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Taux de Remplissage RDV
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Période</label>
              <Select value={periode} onValueChange={setPeriode}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1semaine">1 semaine</SelectItem>
                  <SelectItem value="1mois">1 mois</SelectItem>
                  <SelectItem value="3mois">3 mois</SelectItem>
                  <SelectItem value="6mois">6 mois</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Spécialité</label>
              <Select value={specialite} onValueChange={setSpecialite}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes</SelectItem>
                  <SelectItem value="gynecologie">Gynécologie</SelectItem>
                  <SelectItem value="pediatrie">Pédiatrie</SelectItem>
                  <SelectItem value="sage_femme">Sage-femme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={exporterRapport} variant="outline" className="ml-auto">
              <Download className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Total RDV</p>
            <p className="text-3xl font-bold text-blue-600">{totalRdvs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Taux Remplissage</p>
            <p className="text-3xl font-bold text-green-600">{tauxGlobal}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">RDV Terminés</p>
            <p className="text-3xl font-bold text-purple-600">{termine}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-600">Taux Annulation</p>
            <p className="text-3xl font-bold text-red-600">{tauxAnnulationGlobal}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Taux par Type de Consultation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tauxParType}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="taux_remplissage" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Évolution Hebdomadaire</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={evolutionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="semaine" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="taux" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Heures de Pointe</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={heuresData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="heure" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="rdvs" fill="#34D399" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Classement professionnels */}
      <Card>
        <CardHeader>
          <CardTitle>Performance par Professionnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tauxParPro.slice(0, 10).map((pro, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={idx < 3 ? 'default' : 'outline'}>#{idx + 1}</Badge>
                  <div>
                    <p className="font-semibold">{pro.nom}</p>
                    <p className="text-sm text-gray-600">{pro.specialite?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{pro.taux_remplissage}%</p>
                  <p className="text-xs text-gray-500">{pro.termine}/{pro.total_rdv} RDV</p>
                  {pro.taux_annulation > 15 && (
                    <Badge variant="destructive" className="text-xs mt-1">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {pro.taux_annulation}% annulations
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}