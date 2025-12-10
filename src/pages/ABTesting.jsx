import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FlaskConical, Play, Pause, CheckCircle, TrendingUp } from 'lucide-react';
import AuthGuard from '../components/auth/AuthGuard';

export default function ABTesting() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [testName, setTestName] = useState('');
  const [description, setDescription] = useState('');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tests = [] } = useQuery({
    queryKey: ['ab_tests'],
    queryFn: () => base44.entities.ABTest.list(),
    enabled: user?.role === 'admin',
  });

  const { data: analytics = [] } = useQuery({
    queryKey: ['analytics_events'],
    queryFn: () => base44.entities.AnalyticsEvent.list('-timestamp', 100),
    enabled: user?.role === 'admin',
  });

  const createTest = useMutation({
    mutationFn: (data) => base44.entities.ABTest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab_tests'] });
      setShowCreateDialog(false);
      setTestName('');
      setDescription('');
    }
  });

  const updateTestStatus = useMutation({
    mutationFn: ({ id, status }) => base44.entities.ABTest.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ab_tests'] });
    }
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  const stats = {
    active_tests: tests.filter(t => t.status === 'active').length,
    total_events: analytics.length,
    unique_sessions: new Set(analytics.map(e => e.session_id)).size
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FlaskConical className="w-8 h-8 text-purple-600" />
                Tests A/B & Analytics
              </h1>
              <p className="text-gray-600 mt-2">
                Expérimentation et analyse comportementale
              </p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Créer un Test A/B
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nouveau Test A/B</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Nom du test"
                    value={testName}
                    onChange={(e) => setTestName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                  <Button
                    onClick={() => createTest.mutate({
                      test_name: testName,
                      description,
                      status: 'draft',
                      variants: [
                        { id: 'A', name: 'Control', traffic_percentage: 50, config: {} },
                        { id: 'B', name: 'Variant', traffic_percentage: 50, config: {} }
                      ]
                    })}
                    disabled={!testName}
                    className="w-full"
                  >
                    Créer
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tests Actifs</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.active_tests}</p>
                  </div>
                  <Play className="w-10 h-10 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Événements Trackés</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.total_events}</p>
                  </div>
                  <TrendingUp className="w-10 h-10 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sessions Uniques</p>
                    <p className="text-3xl font-bold text-green-600">{stats.unique_sessions}</p>
                  </div>
                  <CheckCircle className="w-10 h-10 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des tests */}
          <Card>
            <CardHeader>
              <CardTitle>Tests A/B en cours</CardTitle>
            </CardHeader>
            <CardContent>
              {tests.length === 0 ? (
                <p className="text-center py-8 text-gray-500">Aucun test créé</p>
              ) : (
                <div className="space-y-3">
                  {tests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-semibold">{test.test_name}</p>
                        <p className="text-sm text-gray-600">{test.description}</p>
                        {test.variants && (
                          <div className="flex gap-2 mt-2">
                            {test.variants.map(v => (
                              <Badge key={v.id} variant="outline">
                                {v.name}: {v.traffic_percentage}%
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={
                          test.status === 'active' ? 'bg-green-100 text-green-800' :
                          test.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }>
                          {test.status}
                        </Badge>
                        {test.status === 'active' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTestStatus.mutate({ id: test.id, status: 'paused' })}
                          >
                            <Pause className="w-4 h-4" />
                          </Button>
                        ) : test.status === 'paused' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateTestStatus.mutate({ id: test.id, status: 'active' })}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                        ) : null}
                      </div>
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