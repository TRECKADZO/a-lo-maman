import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Users, FileText, TrendingUp, Activity, Zap } from 'lucide-react';

export default function DashboardCentres({ cliniques = [], centresTeleEcho = [] }) {
  const allCentres = [...cliniques, ...centresTeleEcho];
  
  const stats = {
    total: allCentres.length,
    approves: cliniques.filter(c => c.statut_validation === 'approuve').length,
    enAttente: cliniques.filter(c => c.statut_validation === 'en_attente').length,
    fhirActives: cliniques.filter(c => c.api_fhir_enabled).length,
    avgSatisfaction: (cliniques.reduce((sum, c) => sum + (c.statistiques?.taux_satisfaction || 0), 0) / cliniques.length || 0).toFixed(1),
    totalConsultations: cliniques.reduce((sum, c) => sum + (c.statistiques?.consultations || 0), 0)
  };

  const kpiCards = [
    {
      title: 'Centres totaux',
      value: stats.total,
      icon: Activity,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Approuvés',
      value: stats.approves,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    {
      title: 'En attente',
      value: stats.enAttente,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    {
      title: 'FHIR actives',
      value: stats.fhirActives,
      icon: Zap,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    {
      title: 'Satisfaction',
      value: `${stats.avgSatisfaction}`,
      icon: TrendingUp,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      suffix: '/5'
    },
    {
      title: 'Consultations',
      value: stats.totalConsultations,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {kpiCards.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <Card key={idx} className="shadow-lg border-none hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{kpi.title}</p>
                  <p className={`text-3xl font-bold ${kpi.color} mt-1`}>
                    {kpi.value}
                    {kpi.suffix && <span className="text-lg ml-1">{kpi.suffix}</span>}
                  </p>
                </div>
                <div className={`${kpi.bg} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}