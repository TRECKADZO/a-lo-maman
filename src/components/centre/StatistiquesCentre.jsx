import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function StatistiquesCentre({ centre, rdvs, membres }) {
  // Stats générales
  const rdvParStatut = rdvs.reduce((acc, rdv) => {
    acc[rdv.statut] = (acc[rdv.statut] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(rdvParStatut).map(([statut, count]) => ({
    name: statut,
    value: count
  }));

  // RDV par mois (6 derniers mois)
  const rdvParMois = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    rdvParMois[key] = 0;
  }

  rdvs.forEach(rdv => {
    const date = new Date(rdv.date_rdv);
    const key = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    if (rdvParMois[key] !== undefined) {
      rdvParMois[key]++;
    }
  });

  const lineData = Object.entries(rdvParMois).map(([mois, count]) => ({
    mois,
    rdv: count
  }));

  // RDV par type de consultation
  const rdvParType = rdvs.reduce((acc, rdv) => {
    acc[rdv.type_consultation] = (acc[rdv.type_consultation] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.entries(rdvParType).map(([type, count]) => ({
    type: type.replace(/_/g, ' '),
    nombre: count
  }));

  // Membres par rôle
  const membresParRole = membres.reduce((acc, membre) => {
    acc[membre.role] = (acc[membre.role] || 0) + 1;
    return acc;
  }, {});

  const stats = {
    total_rdv: rdvs.length,
    rdv_confirmes: rdvParStatut['confirme'] || 0,
    rdv_termines: rdvParStatut['termine'] || 0,
    rdv_annules: rdvParStatut['annule'] || 0,
    taux_completion: rdvs.length > 0 ? Math.round(((rdvParStatut['termine'] || 0) / rdvs.length) * 100) : 0,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total RDV</p>
                <p className="text-3xl font-bold text-purple-600">{stats.total_rdv}</p>
              </div>
              <Calendar className="w-12 h-12 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">RDV Terminés</p>
                <p className="text-3xl font-bold text-green-600">{stats.rdv_termines}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">RDV Annulés</p>
                <p className="text-3xl font-bold text-red-600">{stats.rdv_annules}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taux Complétion</p>
                <p className="text-3xl font-bold text-blue-600">{stats.taux_completion}%</p>
              </div>
              <TrendingUp className="w-12 h-12 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Chart - Evolution */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Rendez-vous (6 derniers mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="rdv" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart - RDV par statut */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Statut</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bar Chart - RDV par type */}
      <Card>
        <CardHeader>
          <CardTitle>Rendez-vous par Type de Consultation</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="nombre" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Membres par rôle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Répartition des Employés par Rôle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(membresParRole).map(([role, count]) => (
              <div key={role} className="p-4 bg-purple-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-purple-600">{count}</p>
                <p className="text-sm text-gray-700 mt-1">{role.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}