import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Loader2 } from 'lucide-react';

export default function WidgetRevenu({ professional }) {
  const { data: revenuStats, isLoading } = useQuery({
    queryKey: ['revenue_stats', professional?.email],
    queryFn: async () => {
      if (!professional) return null;

      const factures = await base44.entities.Facturation.filter({
        centre_id: professional.id
      }).catch(() => []);

      const moisActuel = new Date();
      const revenusParJour = {};

      factures.forEach(facture => {
        if (facture.statut === 'payee') {
          const date = new Date(facture.date_emission);
          if (date.getMonth() === moisActuel.getMonth() && date.getFullYear() === moisActuel.getFullYear()) {
            const jour = date.getDate();
            revenusParJour[jour] = (revenusParJour[jour] || 0) + (facture.montant_ttc || 0);
          }
        }
      });

      const chartData = [];
      for (let i = 1; i <= moisActuel.getDate(); i++) {
        chartData.push({
          date: i,
          revenu: revenusParJour[i] || 0
        });
      }

      const totalMois = Object.values(revenusParJour).reduce((a, b) => a + b, 0);
      const facturesPayees = factures.filter(f => f.statut === 'payee').length;
      const montantPending = factures
        .filter(f => f.statut === 'envoyee' || f.statut === 'partiellement_payee')
        .reduce((sum, f) => sum + (f.montant_ttc || 0), 0);

      return {
        totalMois,
        facturesPayees,
        montantPending,
        chartData
      };
    },
    enabled: !!professional,
    refetchInterval: 600000
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-600" />
          Revenus (ce mois)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats principaux */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total encaissé</span>
            <span className="font-bold text-lg text-green-600">
              {revenuStats?.totalMois.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Factures payées</span>
            <span className="font-semibold text-teal-600">{revenuStats?.facturesPayees}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">En attente</span>
            <span className="font-semibold text-orange-600">
              {revenuStats?.montantPending.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>

        {/* Graphique */}
        {revenuStats?.chartData && (
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={revenuStats.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => value.toLocaleString('fr-FR')} />
              <Line type="monotone" dataKey="revenu" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}