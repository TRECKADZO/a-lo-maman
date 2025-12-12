import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Bug,
  Lightbulb,
  Star,
  Heart,
  MessageSquare,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';

export default function AdminFeedback() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // Déterminer les permissions basées sur le rôle admin
  const adminRole = user?.admin_role || 'feedback_viewer';
  const canEdit = adminRole === 'feedback_manager' || adminRole === 'super_admin';
  const canDelete = adminRole === 'super_admin';

  const { data: feedbacks = [], isLoading } = useQuery({
    queryKey: ['admin_feedbacks'],
    queryFn: () => base44.entities.UserFeedback.list('-created_date'),
    enabled: user?.role === 'admin',
  });

  const updateFeedback = useMutation({
    mutationFn: async ({ id, data, previousFeedback }) => {
      await base44.entities.UserFeedback.update(id, data);
      
      // Notifier l'utilisateur si le statut change
      if (data.status && previousFeedback && data.status !== previousFeedback.status) {
        const statusLabels = {
          new: 'nouveau',
          in_review: 'en révision',
          planned: 'planifié',
          in_progress: 'en cours',
          completed: 'complété',
          wont_fix: 'ne sera pas corrigé'
        };

        await base44.entities.Notification.create({
          destinataire_email: previousFeedback.user_email,
          type: 'systeme',
          titre: '📝 Mise à jour de votre feedback',
          message: `Le statut de votre feedback "${previousFeedback.title}" est passé à : ${statusLabels[data.status]}`,
          action_page: 'Support',
          action_params: { tab: 'history' },
          priorite: 'normale',
          icone: 'Bell'
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin_feedbacks']);
      toast.success('Feedback mis à jour');
      setSelectedFeedback(null);
    },
  });

  const deleteFeedback = useMutation({
    mutationFn: (id) => base44.entities.UserFeedback.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin_feedbacks']);
      toast.success('Feedback supprimé');
      setSelectedFeedback(null);
    },
  });

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Accès refusé</h2>
            <p className="text-gray-600">Vous devez être administrateur pour accéder à cette page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredFeedbacks = feedbacks.filter(f => {
    const matchSearch = 
      f.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchType = filterType === 'all' || f.feedback_type === filterType;
    const matchStatus = filterStatus === 'all' || f.status === filterStatus;
    const matchPriority = filterPriority === 'all' || f.priority === filterPriority;

    return matchSearch && matchType && matchStatus && matchPriority;
  });

  const stats = {
    total: feedbacks.length,
    new: feedbacks.filter(f => f.status === 'new').length,
    bugs: feedbacks.filter(f => f.feedback_type === 'bug').length,
    features: feedbacks.filter(f => f.feedback_type === 'feature_request').length,
  };

  const typeIcons = {
    bug: { icon: Bug, label: 'Bug', color: 'bg-red-100 text-red-800' },
    improvement: { icon: Lightbulb, label: 'Amélioration', color: 'bg-yellow-100 text-yellow-800' },
    feature_request: { icon: Star, label: 'Nouvelle fonctionnalité', color: 'bg-blue-100 text-blue-800' },
    compliment: { icon: Heart, label: 'Compliment', color: 'bg-pink-100 text-pink-800' },
    other: { icon: MessageSquare, label: 'Autre', color: 'bg-gray-100 text-gray-800' },
  };

  const statusColors = {
    new: 'bg-blue-100 text-blue-800',
    in_review: 'bg-yellow-100 text-yellow-800',
    planned: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    wont_fix: 'bg-gray-100 text-gray-800',
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-blue-100 text-blue-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Feedbacks</h1>
              <p className="text-gray-600">Consultez et gérez les retours utilisateurs</p>
            </div>
            <Badge className="h-fit">
              {adminRole === 'super_admin' && '🔑 Super Admin'}
              {adminRole === 'feedback_manager' && '✏️ Gestionnaire'}
              {adminRole === 'feedback_viewer' && '👁️ Lecteur'}
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Nouveaux</p>
                  <p className="text-2xl font-bold">{stats.new}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Bugs</p>
                  <p className="text-2xl font-bold">{stats.bugs}</p>
                </div>
                <Bug className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Fonctionnalités</p>
                  <p className="text-2xl font-bold">{stats.features}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="improvement">Amélioration</SelectItem>
                  <SelectItem value="feature_request">Fonctionnalité</SelectItem>
                  <SelectItem value="compliment">Compliment</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="new">Nouveau</SelectItem>
                  <SelectItem value="in_review">En révision</SelectItem>
                  <SelectItem value="planned">Planifié</SelectItem>
                  <SelectItem value="in_progress">En cours</SelectItem>
                  <SelectItem value="completed">Terminé</SelectItem>
                  <SelectItem value="wont_fix">Ne sera pas corrigé</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="critical">Critique</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun feedback trouvé</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredFeedbacks.map((feedback) => {
              const typeInfo = typeIcons[feedback.feedback_type] || typeIcons.other;
              const TypeIcon = typeInfo.icon;

              return (
                <Card
                  key={feedback.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedFeedback(feedback)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`p-3 rounded-lg ${typeInfo.color}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">{feedback.title}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{feedback.description}</p>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Badge className={typeInfo.color}>
                              {typeInfo.label}
                            </Badge>
                            <Badge className={statusColors[feedback.status]}>
                              {feedback.status}
                            </Badge>
                            <Badge className={priorityColors[feedback.priority]}>
                              {feedback.priority}
                            </Badge>
                            {feedback.rating && (
                              <div className="flex items-center gap-1">
                                {[...Array(feedback.rating)].map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right text-sm text-gray-500 ml-4">
                        <p>{feedback.user_email}</p>
                        <p>{moment(feedback.created_date).format('DD/MM/YYYY HH:mm')}</p>
                        <p className="text-xs text-gray-400">{feedback.page}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail Modal */}
        {selectedFeedback && (
          <Dialog open={!!selectedFeedback} onOpenChange={() => setSelectedFeedback(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Détails du feedback</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Titre</label>
                  <p className="text-lg font-semibold">{selectedFeedback.title}</p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedFeedback.description}</p>
                </div>

                {canEdit ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Statut</label>
                        <Select
                          value={selectedFeedback.status}
                          onValueChange={(value) =>
                            updateFeedback.mutate({
                              id: selectedFeedback.id,
                              data: { status: value },
                              previousFeedback: selectedFeedback,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">Nouveau</SelectItem>
                            <SelectItem value="in_review">En révision</SelectItem>
                            <SelectItem value="planned">Planifié</SelectItem>
                            <SelectItem value="in_progress">En cours</SelectItem>
                            <SelectItem value="completed">Terminé</SelectItem>
                            <SelectItem value="wont_fix">Ne sera pas corrigé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Priorité</label>
                        <Select
                          value={selectedFeedback.priority}
                          onValueChange={(value) =>
                            updateFeedback.mutate({
                              id: selectedFeedback.id,
                              data: { priority: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Faible</SelectItem>
                            <SelectItem value="medium">Moyenne</SelectItem>
                            <SelectItem value="high">Haute</SelectItem>
                            <SelectItem value="critical">Critique</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Notes admin</label>
                      <Textarea
                        defaultValue={selectedFeedback.admin_notes}
                        placeholder="Ajoutez des notes internes..."
                        onBlur={(e) =>
                          updateFeedback.mutate({
                            id: selectedFeedback.id,
                            data: { admin_notes: e.target.value },
                          })
                        }
                        rows={4}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Statut</label>
                        <Badge className={statusColors[selectedFeedback.status]}>
                          {selectedFeedback.status}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Priorité</label>
                        <Badge className={priorityColors[selectedFeedback.priority]}>
                          {selectedFeedback.priority}
                        </Badge>
                      </div>
                    </div>

                    {selectedFeedback.admin_notes && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">Notes admin</label>
                        <p className="text-gray-700 whitespace-pre-wrap p-3 bg-gray-50 rounded-lg">
                          {selectedFeedback.admin_notes}
                        </p>
                      </div>
                    )}

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Permissions limitées</p>
                        <p className="text-xs text-yellow-700">Vous avez un accès en lecture seule. Contactez un super admin pour modifier ce feedback.</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Informations utilisateur</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Email:</span>
                      <p className="font-medium">{selectedFeedback.user_email}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Page:</span>
                      <p className="font-medium">{selectedFeedback.page}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Date:</span>
                      <p className="font-medium">
                        {moment(selectedFeedback.created_date).format('DD/MM/YYYY HH:mm')}
                      </p>
                    </div>
                    {selectedFeedback.device_info && (
                      <div>
                        <span className="text-gray-600">Appareil:</span>
                        <p className="font-medium text-xs">
                          {selectedFeedback.device_info.platform}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setSelectedFeedback(null)}
                  >
                    Fermer
                  </Button>
                  {canDelete && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Êtes-vous sûr de vouloir supprimer ce feedback ?')) {
                          deleteFeedback.mutate(selectedFeedback.id);
                        }
                      }}
                    >
                      Supprimer
                    </Button>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}