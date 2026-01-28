import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Calendar, Activity, Clock, CheckCircle } from 'lucide-react';
import { format, subDays, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#14b8a6', '#06b6d4', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function StatistiquesAvancees({ appointments, patients }) {
  const stats = useMemo(() => {
    const now = new Date();
    const last7Days = subDays(now, 7);
    const last30Days = subDays(now, 30);
    const last12Months = subMonths(now, 12);

    // Tendances hebdomadaires
    const weekDays = eachDayOfInterval({ start: last7Days, end: now });
    const weeklyData = weekDays.map(day => {
      const dayAppointments = appointments.filter(apt => 
        format(new Date(apt.date_rdv), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
        apt.statut !== 'annule'
      );
      return {
        date: format(day, 'EEE', { locale: fr }),
        rdv: dayAppointments.length,
        confirmes: dayAppointments.filter(a => a.statut === 'confirme').length,
      };
    });

    // Tendances mensuelles (4 dernières semaines)
    const weeks = eachWeekOfInterval({ start: last30Days, end: now });
    const monthlyData = weeks.map((week, i) => {
      const weekEnd = endOfWeek(week);
      const weekAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date_rdv);
        return aptDate >= week && aptDate <= weekEnd && apt.statut !== 'annule';
      });
      return {
        semaine: `S${i + 1}`,
        rdv: weekAppointments.length,
      };
    });

    // Tendances annuelles (12 derniers mois)
    const months = eachMonthOfInterval({ start: last12Months, end: now });
    const yearlyData = months.map(month => {
      const monthEnd = endOfMonth(month);
      const monthStart = startOfMonth(month);
      const monthAppointments = appointments.filter(apt => {
        const aptDate = new Date(apt.date_rdv);
        return aptDate >= monthStart && aptDate <= monthEnd && apt.statut !== 'annule';
      });
      return {
        mois: format(month, 'MMM', { locale: fr }),
        rdv: monthAppointments.length,
      };
    });

    // Répartition par type de consultation
    const consultationTypes = appointments
      .filter(apt => apt.statut !== 'annule')
      .reduce((acc, apt) => {
        const type = apt.type_consultation || 'Autre';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

    const consultationData = Object.entries(consultationTypes).map(([name, value]) => ({
      name,
      value
    }));

    // Répartition par statut
    const statusData = appointments.reduce((acc, apt) => {
      const status = apt.statut || 'planifie';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusChartData = Object.entries(statusData).map(([name, value]) => ({
      name: name === 'planifie' ? 'Planifié' : name === 'confirme' ? 'Confirmé' : name === 'termine' ? 'Terminé' : name === 'annule' ? 'Annulé' : name,
      value
    }));

    // Engagement patients
    const patientsWithAppointments = new Set(appointments.map(a => a.patient_email || a.created_by));
    const engagementRate = patients.length > 0 ? (patientsWithAppointments.size / patients.length * 100).toFixed(1) : 0;

    // Taux de confirmation
    const totalAppointments = appointments.filter(a => a.statut !== 'annule').length;
    const confirmedAppointments = appointments.filter(a => a.statut === 'confirme' || a.statut === 'termine').length;
    const confirmationRate = totalAppointments > 0 ? (confirmedAppointments / totalAppointments * 100).toFixed(1) : 0;

    // Taux d'annulation
    const cancelledAppointments = appointments.filter(a => a.statut === 'annule').length;
    const cancellationRate = appointments.length > 0 ? (cancelledAppointments / appointments.length * 100).toFixed(1) : 0;

    return {
      weeklyData,
      monthlyData,
      yearlyData,
      consultationData,
      statusChartData,
      engagementRate,
      confirmationRate,
      cancellationRate,
      patientsWithAppointments: patientsWithAppointments.size,
    };
  }, [appointments, patients]);

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Taux d'engagement</p>
                <p className="text-2xl font-bold text-teal-600">{stats.engagementRate}%</p>
                <p className="text-xs text-gray-400">{stats.patientsWithAppointments}/{patients.length} patients</p>
              </div>
              <Activity className="w-8 h-8 text-teal-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Taux de confirmation</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmationRate}%</p>
                <p className="text-xs text-gray-400">RDV confirmés/terminés</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Taux d'annulation</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancellationRate}%</p>
                <p className="text-xs text-gray-400">RDV annulés</p>
              </div>
              <Clock className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total RDV</p>
                <p className="text-2xl font-bold text-blue-600">{appointments.length}</p>
                <p className="text-xs text-gray-400">Tous statuts</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques de tendances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" />
            Tendances des rendez-vous
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="week" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="week">7 derniers jours</TabsTrigger>
              <TabsTrigger value="month">4 dernières semaines</TabsTrigger>
              <TabsTrigger value="year">12 derniers mois</TabsTrigger>
            </TabsList>

            <TabsContent value="week" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="rdv" fill="#14b8a6" name="Total RDV" />
                  <Bar dataKey="confirmes" fill="#10b981" name="Confirmés" />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="month" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="semaine" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rdv" stroke="#14b8a6" strokeWidth={2} name="RDV par semaine" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>

            <TabsContent value="year" className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="rdv" stroke="#8b5cf6" strokeWidth={2} name="RDV par mois" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Répartitions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type de consultation</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.consultationData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.consultationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.statusChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}