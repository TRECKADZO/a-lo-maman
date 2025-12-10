import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, Calendar, FileText, Activity } from 'lucide-react';

/**
 * Graphiques interactifs pour dashboard professionnel
 * - Taux d'onboarding patients
 * - Taux de remplissage RDV
 * - Fréquence upload documents
 */

export default function MetricsCharts({ patients = [], appointments = [], documents = [] }) {
  // Calculer taux d'onboarding (nouveaux patients par mois)
  const getOnboardingData = () => {
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('fr-FR', { month: 'short' });
      
      const count = patients.filter(p => {
        const created = new Date(p.created_date);
        return created.getMonth() === month.getMonth() && 
               created.getFullYear() === month.getFullYear();
      }).length;
      
      last6Months.push({
        mois: monthName,
        patients: count
      });
    }
    
    return last6Months;
  };

  // Calculer taux de remplissage RDV
  const getAppointmentFillRate = () => {
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('fr-FR', { month: 'short' });
      
      const monthAppointments = appointments.filter(a => {
        const date = new Date(a.date_rdv);
        return date.getMonth() === month.getMonth() && 
               date.getFullYear() === month.getFullYear();
      });
      
      const total = monthAppointments.length;
      const completed = monthAppointments.filter(a => a.statut === 'termine').length;
      const cancelled = monthAppointments.filter(a => a.statut === 'annule').length;
      const fillRate = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      last6Months.push({
        mois: monthName,
        taux: fillRate,
        termine: completed,
        annule: cancelled,
        planifie: total - completed - cancelled
      });
    }
    
    return last6Months;
  };

  // Calculer fréquence upload documents
  const getDocumentUploadFrequency = () => {
    const last6Months = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('fr-FR', { month: 'short' });
      
      const count = documents.filter(d => {
        const uploaded = new Date(d.created_date);
        return uploaded.getMonth() === month.getMonth() && 
               uploaded.getFullYear() === month.getFullYear();
      }).length;
      
      last6Months.push({
        mois: monthName,
        documents: count
      });
    }
    
    return last6Months;
  };

  // Distribution des types de consultation
  const getConsultationTypes = () => {
    const types = {
      cabinet: 0,
      clinique: 0,
      hopital: 0,
      telephone: 0,
      visio: 0
    };

    appointments.forEach(a => {
      if (types[a.type_consultation] !== undefined) {
        types[a.type_consultation]++;
      }
    });

    return Object.entries(types).map(([type, value]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      value,
      percentage: appointments.length > 0 ? Math.round((value / appointments.length) * 100) : 0
    }));
  };

  const onboardingData = getOnboardingData();
  const fillRateData = getAppointmentFillRate();
  const documentData = getDocumentUploadFrequency();
  const consultationTypes = getConsultationTypes();

  const COLORS = ['#14B8A6', '#8B5CF6', '#F59E0B', '#EF4444', '#3B82F6'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-semibold text-sm mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-xs" style={{ color: entry.color }}>
              {entry.name}: {entry.value}{entry.unit || ''}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6">
      {/* Row 1: Onboarding + Fill Rate */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Taux d'onboarding */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-teal-600" />
              Nouveaux patients (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={onboardingData}>
                <defs>
                  <linearGradient id="colorPatients" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="patients" 
                  stroke="#14B8A6" 
                  fillOpacity={1} 
                  fill="url(#colorPatients)"
                  strokeWidth={2}
                  name="Patients"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-teal-50 rounded-lg">
              <p className="text-sm text-teal-900">
                <span className="font-bold">
                  {onboardingData[onboardingData.length - 1]?.patients || 0}
                </span> nouveaux patients ce mois
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Taux de remplissage RDV */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-5 h-5 text-blue-600" />
              Taux de remplissage RDV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={fillRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" label={{ value: '%', angle: -90, position: 'insideLeft' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="taux" fill="#3B82F6" name="Taux de remplissage" unit="%" />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="p-2 bg-green-50 rounded text-center">
                <p className="text-xs text-green-700">Terminés</p>
                <p className="text-lg font-bold text-green-900">
                  {fillRateData[fillRateData.length - 1]?.termine || 0}
                </p>
              </div>
              <div className="p-2 bg-yellow-50 rounded text-center">
                <p className="text-xs text-yellow-700">Planifiés</p>
                <p className="text-lg font-bold text-yellow-900">
                  {fillRateData[fillRateData.length - 1]?.planifie || 0}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded text-center">
                <p className="text-xs text-red-700">Annulés</p>
                <p className="text-lg font-bold text-red-900">
                  {fillRateData[fillRateData.length - 1]?.annule || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Documents + Types de consultation */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Fréquence upload documents */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-purple-600" />
              Documents uploadés (6 mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={documentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mois" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="documents" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Documents"
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-900">
                <span className="font-bold">
                  {documentData[documentData.length - 1]?.documents || 0}
                </span> documents ce mois
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Distribution types de consultation */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-5 h-5 text-orange-600" />
              Types de consultation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={consultationTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.type}: ${entry.percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {consultationTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {consultationTypes.map((type, index) => (
                <div key={type.type} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-gray-700">
                    {type.type}: {type.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}