import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, DollarSign, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function GestionFacturationCentre({ centreId }) {
  const queryClient = useQueryClient();
  const [filterStatut, setFilterStatut] = useState('tous');

  const { data: factures = [], isLoading } = useQuery({
    queryKey: ['factures_centre', centreId, filterStatut],
    queryFn: async () => {
      if (!centreId) return [];
      const query = { centre_id: centreId };
      if (filterStatut !== 'tous') query.statut = filterStatut;
      return await base44.entities.Facturation.filter(query, '-date_emission');
    },
    enabled: !!centreId
  });

  const { data: stats } = useQuery({
    queryKey: ['stats_facturation', centreId],
    queryFn: async () => {
      if (!centreId || factures.length === 0) return {};
      const montantTotal = factures.reduce((sum, f) => sum + (f.montant_ttc || 0), 0);
      const montantPaye = factures
        .filter(f => f.statut === 'payee' || f.statut === 'partiellement_payee')
        .reduce((sum, f) => {
          const paiementsTotal = f.paiements?.reduce((s, p) => s + (p.montant || 0), 0) || 0;
          return sum + paiementsTotal;
        }, 0);
      
      return {
        montantTotal,
        montantPaye,
        montantImpaye: montantTotal - montantPaye,
        tauxRecouvrement: montantTotal > 0 ? ((montantPaye / montantTotal) * 100).toFixed(1) : 0
      };
    },
    enabled: factures.length > 0
  });

  const marquerPayeeMutation = useMutation({
    mutationFn: (factureId) => base44.entities.Facturation.update(factureId, {
      statut: 'payee'
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['factures_centre'] })
  });

  const getStatutColor = (statut) => {
    const colors = {
      payee: 'bg-green-100 text-green-800',
      impayee: 'bg-red-100 text-red-800',
      partiellement_payee: 'bg-yellow-100 text-yellow-800',
      envoyee: 'bg-blue-100 text-blue-800',
      brouillon: 'bg-gray-100 text-gray-800',
      annulee: 'bg-red-200 text-red-900'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Facturation
        </h2>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-lg border-none">
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm">Total facturé</p>
            <p className="text-3xl font-bold text-indigo-600">{stats?.montantTotal?.toFixed(2) || '0'} F</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-none">
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm">Payé</p>
            <p className="text-3xl font-bold text-green-600">{stats?.montantPaye?.toFixed(2) || '0'} F</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-none">
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm">Impayé</p>
            <p className="text-3xl font-bold text-red-600">{stats?.montantImpaye?.toFixed(2) || '0'} F</p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-none">
          <CardContent className="pt-6">
            <p className="text-gray-600 text-sm">Recouvrement</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.tauxRecouvrement}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtre */}
      <div className="flex gap-2">
        <select
          value={filterStatut}
          onChange={(e) => setFilterStatut(e.target.value)}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="tous">Tous les statuts</option>
          <option value="payee">Payées</option>
          <option value="impayee">Impayées</option>
          <option value="partiellement_payee">Partiellement payées</option>
          <option value="envoyee">Envoyées</option>
        </select>
      </div>

      {/* Liste Factures */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : factures.length === 0 ? (
        <Card className="shadow-lg border-none">
          <CardContent className="py-12 text-center text-gray-600">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Aucune facture</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {factures.map(facture => (
            <Card key={facture.id} className="shadow-md border-none hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold text-gray-900">{facture.numero_facture}</p>
                      <Badge className={getStatutColor(facture.statut)}>{facture.statut}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{facture.patient_nom}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                      <div>Émis: {format(new Date(facture.date_emission), 'dd MMM yyyy', { locale: fr })}</div>
                      <div className="font-bold text-gray-900">{facture.montant_ttc.toFixed(2)} F</div>
                      <div>Type: {facture.type_service}</div>
                      <div>Échéance: {format(new Date(facture.date_echeance), 'dd MMM yyyy', { locale: fr })}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {facture.statut !== 'payee' && (
                      <Button
                        size="sm"
                        onClick={() => marquerPayeeMutation.mutate(facture.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={marquerPayeeMutation.isPending}
                      >
                        {marquerPayeeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      </Button>
                    )}
                    {facture.fichier_pdf_url && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(facture.fichier_pdf_url)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}