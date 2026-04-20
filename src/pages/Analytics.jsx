import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Activity, Users, MousePointer, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import AuthGuard from '../components/auth/AuthGuard';

export default function Analytics() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['analytics_events'],
    queryFn: () => base44.entities.AnalyticsEvent.list('-timestamp', 1000),
    enabled: user?.role === 'admin',
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: () => base44.entities.UserFeedback.list('-created_date', 100),
    enabled: user?.role === 'admin',
  });

  const stats = useMemo(() => {
    const uniqueUsers = new Set(events.map(e => e.user_email)).size;
    const uniqueSessions = new Set(events.map(e => e.session_id)).size;
    const avgRating = feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + (f.rating || 0), 0) / feedbacks.filter(f => f.rating).length).toFixed(1)
      : 0;

    // Events by category
    const eventsByCategory = events.reduce((acc, e) => {
      acc[e.event_category] = (acc[e.event_category] || 0) + 1;
      return acc;
    }, {});

    // Events by page
    const eventsByPage = events.reduce((acc, e) => {
      const page = e.page?.split('/')?.pop() || 'Accueil';
      acc[page] = (acc[page] || 0) + 1;
      return acc;
    }, {});

    return {
      uniqueUsers,
      uniqueSessions,
      totalEvents: events.length,
      avgRating,
      eventsByCategory: Object.entries(eventsByCategory).map(([name, value]) => ({ name, value })),
      topPages: Object.entries(eventsByPage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }))
    };
  }, [events, feedbacks]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  const COLORS = ['#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6'];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Activity className="w-8 h-8 text-purple-600" />
            Analytics & Comportements
          </h1>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Utilisateurs</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.uniqueUsers}</p>
                  </div>
                  <Users className="w-10 h-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sessions</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.uniqueSessions}</p>
                  </div>
                  <Activity className="w-10 h-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Événements</p>
                    <p className="text-3xl font-bold text-green-600">{stats.totalEvents}</p>
                  </div>
                  <MousePointer className="w-10 h-10 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Note Moyenne</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.avgRating}/5</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Événements par Catégorie</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats.eventsByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats.eventsByCategory.map((entry, index) => (
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
                <CardTitle>Top Pages Visitées</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.topPages}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Feedbacks */}
          <Card>
            <CardHeader>
              <CardTitle>Feedbacks Récents</CardTitle>
            </CardHeader>
            <CardContent>
              {feedbacks.length === 0 ? (
                <p className="text-center py-8 text-gray-500">Aucun feedback</p>
              ) : (
                <div className="space-y-3">
                  {feedbacks.slice(0, 10).map((feedback) => (
                    <div key={feedback.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge>{feedback.feedback_type}</Badge>
                        {feedback.rating && (
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span key={i} className={i < feedback.rating ? 'text-yellow-400' : 'text-gray-300'}>
                                ★
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="font-semibold">{feedback.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{feedback.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(feedback.created_date).toLocaleString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}