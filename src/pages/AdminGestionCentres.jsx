import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, DollarSign, BarChart3, Settings } from 'lucide-react';
import GestionRDVCentre from '@/components/admin/GestionRDVCentre';
import GestionFacturationCentre from '@/components/admin/GestionFacturationCentre';
import WidgetRDVIntegrable from '@/components/admin/WidgetRDVIntegrable';

export default function AdminGestionCentres() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: centres = [], isLoading } = useQuery({
    queryKey: ['centres_admin'],
    queryFn: async () => {
      if (user?.role !== 'admin') return [];
      return await base44.entities.Clinique.list();
    },
    enabled: !!user
  });

  const [centreSelectionnee, setCentreSelectionnee] = useState(null);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="shadow-lg border-none w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-600 font-bold">Accès réservé aux administrateurs</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const centre = centreSelectionnee ? centres.find(c => c.id === centreSelectionnee) : centres[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion Administrative des Centres</h1>
          <p className="text-gray-600">RDV • Facturation • Rapports d'activité</p>
        </div>

        {/* Sélection du centre */}
        {centres.length > 1 && (
          <Card className="shadow-lg border-none">
            <CardContent className="pt-6">
              <p className="text-sm text-gray-600 mb-3">Sélectionner un centre</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {centres.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCentreSelectionnee(c.id)}
                    className={`p-3 rounded-lg border-2 transition-all text-left ${
                      centre?.id === c.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-400'
                    }`}
                  >
                    <p className="font-bold text-gray-900">{c.nom}</p>
                    <p className="text-xs text-gray-600">{c.type_etablissement}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Navigation par onglets */}
        {centre && (
          <Tabs defaultValue="rdv" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="rdv" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">RDV</span>
              </TabsTrigger>
              <TabsTrigger value="facturation" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Facturation</span>
              </TabsTrigger>
              <TabsTrigger value="rapports" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Rapports</span>
              </TabsTrigger>
              <TabsTrigger value="widget" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Widget</span>
              </TabsTrigger>
            </TabsList>

            {/* Contenu RDV */}
            <TabsContent value="rdv" className="space-y-6">
              <GestionRDVCentre centreId={centre.id} />
            </TabsContent>

            {/* Contenu Facturation */}
            <TabsContent value="facturation" className="space-y-6">
              <GestionFacturationCentre centreId={centre.id} />
            </TabsContent>

            {/* Contenu Rapports */}
            <TabsContent value="rapports" className="space-y-6">
              <RapportsActivite centreId={centre.id} centreName={centre.nom} />
            </TabsContent>

            {/* Contenu Widget */}
            <TabsContent value="widget" className="space-y-6">
              <WidgetRDVIntegrable centreId={centre.id} centreName={centre.nom} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function RapportsActivite({ centreId, centreName }) {
  const { data: rapports = [], isLoading } = useQuery({
    queryKey: ['rapports_centre', centreId],
    queryFn: async () => {
      if (!centreId) return [];
      return await base44.entities.RapportActiviteMensuel.filter({
        centre_id: centreId
      }, '-annee,-mois');
    },
    enabled: !!centreId
  });

  const [moisSelected, setMoisSelected] = useState(new Date().getMonth() + 1);
  const [anneeSelected, setAnneeSelected] = useState(new Date().getFullYear());

  const genererRapport = async () => {
    try {
      const response = await fetch('/api/functions/genererRapportActiviteMensuel', {
        method: 'POST',
        body: JSON.stringify({
          centreId,
          mois: moisSelected,
          annee: anneeSelected
        })
      });

      if (response.ok) {
        alert('Rapport généré avec succès!');
      }
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Génération */}
      <Card className="shadow-lg border-none bg-gradient-to-r from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle>Générer un rapport mensuel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mois</label>
              <select
                value={moisSelected}
                onChange={(e) => setMoisSelected(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(2024, i).toLocaleDateString('fr-FR', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Année</label>
              <select
                value={anneeSelected}
                onChange={(e) => setAnneeSelected(parseInt(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={genererRapport} className="w-full bg-indigo-600 hover:bg-indigo-700">
                Générer le rapport
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des rapports */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle>Rapports générés ({rapports.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          ) : rapports.length === 0 ? (
            <p className="text-gray-600 text-center py-4">Aucun rapport généré</p>
          ) : (
            <div className="space-y-3">
              {rapports.map(rapport => (
                <div key={rapport.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">
                        {new Date(2024, rapport.mois - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {rapport.statistiques.nombre_rdv_realises} RDV • {rapport.financier.montant_total_facture.toFixed(0)}F
                      </p>
                    </div>
                    {rapport.fichier_pdf_url && (
                      <Button size="sm" variant="outline">
                        Télécharger PDF
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}