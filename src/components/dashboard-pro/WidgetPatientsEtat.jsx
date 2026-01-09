import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function WidgetPatientsEtat({ professional }) {
  const { data: patientsAtRisk, isLoading } = useQuery({
    queryKey: ['patients_at_risk', professional?.email],
    queryFn: async () => {
      if (!professional) return [];

      // Récupérer les alertes actives
      const enfants = await base44.entities.EnfantCarnet.filter({
        professionnels_suivi: { $in: [professional.email] }
      }).catch(() => []);

      const atRisk = enfants
        .filter(enfant => enfant.alertes_developpement?.some(a => a.lu === false))
        .map(enfant => ({
          id: enfant.id,
          nom: `${enfant.prenom} ${enfant.nom || ''}`,
          alertes: enfant.alertes_developpement.filter(a => !a.lu),
          priorite: enfant.alertes_developpement.some(a => a.niveau_urgence === 'urgent') ? 'urgent' : 'normal'
        }))
        .sort((a, b) => {
          if (a.priorite === 'urgent' && b.priorite !== 'urgent') return -1;
          return b.alertes.length - a.alertes.length;
        })
        .slice(0, 5);

      return atRisk;
    },
    enabled: !!professional,
    refetchInterval: 300000
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
          <AlertTriangle className="w-5 h-5 text-red-600" />
          Patients à surveiller
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!patientsAtRisk || patientsAtRisk.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">Aucun patient à risque</p>
        ) : (
          <div className="space-y-3">
            {patientsAtRisk.map(patient => (
              <div key={patient.id} className="p-3 border rounded-lg hover:bg-red-50 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-semibold text-sm">{patient.nom}</p>
                  {patient.priorite === 'urgent' && (
                    <Badge className="bg-red-600">URGENT</Badge>
                  )}
                </div>
                <p className="text-xs text-gray-600">
                  {patient.alertes.length} alerte{patient.alertes.length > 1 ? 's' : ''} non lue{patient.alertes.length > 1 ? 's' : ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}