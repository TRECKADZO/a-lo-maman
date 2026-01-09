import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, TrendingUp, Activity, Loader2 } from 'lucide-react';

export default function WidgetStats({ professional }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats_pro', professional?.email],
    queryFn: async () => {
      if (!professional) return null;

      const [appointments, patients] = await Promise.all([
        base44.entities.RendezVousAdministratif
          .filter({ professionnel_id: professional.id })
          .catch(() => []),
        base44.entities.RendezVousAdministratif
          .filter({ professionnel_id: professional.id })
          .catch(() => [])
      ]);

      const uniquePatients = new Set(appointments.map(a => a.patient_email)).size;
      
      // Grouper par type
      const parType = {};
      appointments.forEach(rdv => {
        parType[rdv.type_consultation] = (parType[rdv.type_consultation] || 0) + 1;
      });

      // Données pour graphique (7 derniers jours)
      const chartData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = appointments.filter(a => a.date_rdv.startsWith(dateStr)).length;
        chartData.push({ date: dateStr.split('-')[2], count });
      }

      return {
        totalAppointments: appointments.length,
        uniquePatients,
        parType,
        chartData
      };
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
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-6 h-6 text-teal-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats?.uniquePatients || 0}</p>
              <p className="text-xs text-gray-500">Patients uniques</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold">{stats?.totalAppointments || 0}</p>
              <p className="text-xs text-gray-500">Consultations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphique */}
      {stats?.chartData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              Consultations (7j)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#14b8a6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}