import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Flag,
  Pin,
  Loader2,
  Trash2,
  MessageSquare,
  Filter,
  Ban,
  Brain,
  UserX,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function OutilsModeration({ onClose }) {
  const queryClient = useQueryClient();
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [noteModerateur, setNoteModerateur] = useState('');
  const [showBanUser, setShowBanUser] = useState(null);
  const [showWarning, setShowWarning] = useState(null);
  const [warningMessage, setWarningMessage] = useState('');
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages_moderation'],
    queryFn: async () => {
      const msgs = await base44.entities.MessageCommunaute.list('-created_date');
      return msgs;
    },
    initialData: [],
  });

  const { data: bannedUsers = [] } = useQuery({
    queryKey: ['banned_users'],
    queryFn: async () => {
      const users = await base44.entities.UserProfile.filter({
        banned: true
      });
      return users;
    },
    initialData: [],
  });

  const analyzeContentWithAI = useMutation({
    mutationFn: async ({ messageId }) => {
      setAiAnalysisLoading(true);
      const message = messages.find(m => m.id === messageId);
      
      try {
        const prompt = `Analyse ce message de forum santé maternelle et infantile et identifie:
1. Contenu inapproprié (violence, harcèlement, spam)
2. Désinformation médicale dangereuse
3. Contenu hors-sujet
4. Langage offensant

Message: "${message.sujet} - ${message.contenu}"

Retourne une analyse JSON avec: is_appropriate (boolean), concerns (array), severity (low/medium/high), recommendation (approve/flag/reject)`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: prompt,
          response_json_schema: {
            type: "object",
            properties: {
              is_appropriate: { type: "boolean" },
              concerns: { type: "array", items: { type: "string" } },
              severity: { type: "string", enum: ["low", "medium", "high"] },
              recommendation: { type: "string", enum: ["approve", "flag", "reject"] },
              explanation: { type: "string" }
            }
          }
        });

        // Mettre à jour le message avec l'analyse IA
        await base44.entities.MessageCommunaute.update(messageId, {
          ai_analysis: result,
          ai_analyzed_date: new Date().toISOString()
        });

        return result;
      } finally {
        setAiAnalysisLoading(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages_moderation'] });
    }
  });

  const updateStatutMutation = useMutation({
    mutationFn: async ({ messageId, statut }) => {
      await base44.entities.MessageCommunaute.update(messageId, {
        statut_moderation: statut,
        note_moderateur: noteModerateur,
        moderated_by: user.email,
        moderated_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages_moderation'] });
      queryClient.invalidateQueries({ queryKey: ['messages_communaute'] });
      setSelectedMessage(null);
      setNoteModerateur('');
    },
  });

  const toggleEpingleMutation = useMutation({
    mutationFn: async ({ messageId, epingle }) => {
      await base44.entities.MessageCommunaute.update(messageId, { epingle });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages_moderation'] });
      queryClient.invalidateQueries({ queryKey: ['messages_communaute'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (messageId) => {
      await base44.entities.MessageCommunaute.delete(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages_moderation'] });
      queryClient.invalidateQueries({ queryKey: ['messages_communaute'] });
    },
  });

  const sendWarningMutation = useMutation({
    mutationFn: async ({ userEmail, message }) => {
      // Créer une notification d'avertissement
      await base44.entities.Notification.create({
        destinataire_email: userEmail,
        type: 'systeme',
        titre: '⚠️ Avertissement de modération',
        message: message,
        priorite: 'haute',
        icone: 'AlertTriangle'
      });
    },
    onSuccess: () => {
      setShowWarning(null);
      setWarningMessage('');
      alert('Avertissement envoyé avec succès');
    }
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userEmail, reason }) => {
      // Bannir l'utilisateur
      const profiles = await base44.entities.UserProfile.filter({ created_by: userEmail });
      if (profiles.length > 0) {
        await base44.entities.UserProfile.update(profiles[0].id, {
          banned: true,
          ban_reason: reason,
          banned_date: new Date().toISOString(),
          banned_by: user.email
        });
      }

      // Envoyer notification
      await base44.entities.Notification.create({
        destinataire_email: userEmail,
        type: 'systeme',
        titre: '🚫 Compte suspendu',
        message: `Votre compte a été suspendu pour: ${reason}. Contactez les modérateurs pour plus d'informations.`,
        priorite: 'urgente',
        icone: 'Ban'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned_users'] });
      setShowBanUser(null);
      alert('Utilisateur banni avec succès');
    }
  });

  const unbanUserMutation = useMutation({
    mutationFn: async (userEmail) => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: userEmail });
      if (profiles.length > 0) {
        await base44.entities.UserProfile.update(profiles[0].id, {
          banned: false,
          ban_reason: null,
          unbanned_date: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banned_users'] });
    }
  });

  if (!user || user.role !== 'admin') {
    return null;
  }

  const messagesFiltres = messages.filter(msg => {
    if (filtreStatut === 'tous') return true;
    if (filtreStatut === 'signale') return msg.signalements?.length > 0;
    if (filtreStatut === 'ai_flagged') return msg.ai_analysis?.recommendation === 'flag' || msg.ai_analysis?.recommendation === 'reject';
    return msg.statut_moderation === filtreStatut;
  });

  const messagesSignales = messages.filter(m => m.signalements?.length > 0);
  const messagesEnAttente = messages.filter(m => m.statut_moderation === 'en_attente');
  const messagesAIFlagged = messages.filter(m => m.ai_analysis?.recommendation === 'flag' || m.ai_analysis?.recommendation === 'reject');

  const getStatutColor = (statut) => {
    switch(statut) {
      case 'approuve': return 'bg-green-100 text-green-800';
      case 'en_attente': return 'bg-yellow-100 text-yellow-800';
      case 'rejete': return 'bg-red-100 text-red-800';
      case 'signale': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'low': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-7xl max-h-[95vh] overflow-y-auto my-8">
        <CardHeader className="sticky top-0 bg-white dark:bg-gray-900 z-10 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-teal-600" />
              Outils de Modération Avancés
            </CardTitle>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">✕</button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          <Tabs defaultValue="messages">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="messages">Messages</TabsTrigger>
              <TabsTrigger value="users">Utilisateurs bannis ({bannedUsers.length})</TabsTrigger>
              <TabsTrigger value="analytics">Statistiques</TabsTrigger>
            </TabsList>

            {/* Onglet Messages */}
            <TabsContent value="messages" className="space-y-6">
              {/* Statistiques */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
                  <CardContent className="p-4 text-center">
                    <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-600">{messages.length}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
                  <CardContent className="p-4 text-center">
                    <Flag className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-600">{messagesSignales.length}</p>
                    <p className="text-xs text-gray-600">Signalés</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-yellow-50 to-amber-50">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-600">{messagesEnAttente.length}</p>
                    <p className="text-xs text-gray-600">En attente</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-indigo-50">
                  <CardContent className="p-4 text-center">
                    <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-600">{messagesAIFlagged.length}</p>
                    <p className="text-xs text-gray-600">IA alertes</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">
                      {messages.filter(m => m.statut_moderation === 'approuve').length}
                    </p>
                    <p className="text-xs text-gray-600">Approuvés</p>
                  </CardContent>
                </Card>
              </div>

              {/* Filtres */}
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-5 h-5 text-gray-500" />
                <Button
                  size="sm"
                  variant={filtreStatut === 'tous' ? 'default' : 'outline'}
                  onClick={() => setFiltreStatut('tous')}
                >
                  Tous
                </Button>
                <Button
                  size="sm"
                  variant={filtreStatut === 'signale' ? 'default' : 'outline'}
                  onClick={() => setFiltreStatut('signale')}
                  className="bg-orange-100 text-orange-800 hover:bg-orange-200"
                >
                  <Flag className="w-3 h-3 mr-1" />
                  Signalés ({messagesSignales.length})
                </Button>
                <Button
                  size="sm"
                  variant={filtreStatut === 'ai_flagged' ? 'default' : 'outline'}
                  onClick={() => setFiltreStatut('ai_flagged')}
                  className="bg-purple-100 text-purple-800 hover:bg-purple-200"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  IA Alertes ({messagesAIFlagged.length})
                </Button>
                <Button
                  size="sm"
                  variant={filtreStatut === 'en_attente' ? 'default' : 'outline'}
                  onClick={() => setFiltreStatut('en_attente')}
                >
                  En attente
                </Button>
                <Button
                  size="sm"
                  variant={filtreStatut === 'approuve' ? 'default' : 'outline'}
                  onClick={() => setFiltreStatut('approuve')}
                >
                  Approuvés
                </Button>
                <Button
                  size="sm"
                  variant={filtreStatut === 'rejete' ? 'default' : 'outline'}
                  onClick={() => setFiltreStatut('rejete')}
                >
                  Rejetés
                </Button>
              </div>

              {/* Liste des messages */}
              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
                  </div>
                ) : messagesFiltres.length > 0 ? (
                  messagesFiltres.map((msg) => (
                    <Card key={msg.id} className={`${msg.signalements?.length > 0 ? 'border-2 border-orange-500' : ''} ${msg.ai_analysis?.severity === 'high' ? 'border-2 border-red-500' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <h3 className="font-semibold">{msg.sujet}</h3>
                              <Badge className={getStatutColor(msg.statut_moderation)}>
                                {msg.statut_moderation}
                              </Badge>
                              {msg.epingle && <Pin className="w-4 h-4 text-teal-600" />}
                              {msg.signalements?.length > 0 && (
                                <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
                                  <Flag className="w-3 h-3" />
                                  {msg.signalements.length}
                                </Badge>
                              )}
                              {msg.ai_analysis && (
                                <Badge className={getSeverityColor(msg.ai_analysis.severity)}>
                                  <Brain className="w-3 h-3 mr-1" />
                                  IA: {msg.ai_analysis.severity}
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{msg.contenu.substring(0, 200)}...</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Par: {msg.auteur_nom}</span>
                              <span>•</span>
                              <span>{format(new Date(msg.created_date), 'dd MMM yyyy HH:mm', { locale: fr })}</span>
                              <span>•</span>
                              <span>{msg.reponses?.length || 0} réponses</span>
                            </div>
                          </div>
                        </div>

                        {/* Analyse IA */}
                        {msg.ai_analysis && (
                          <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded">
                            <p className="font-semibold text-sm text-purple-900 mb-2 flex items-center gap-2">
                              <Brain className="w-4 h-4" />
                              Analyse IA
                            </p>
                            <p className="text-xs text-purple-800 mb-2">{msg.ai_analysis.explanation}</p>
                            {msg.ai_analysis.concerns?.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-purple-900">Préoccupations:</p>
                                {msg.ai_analysis.concerns.map((concern, i) => (
                                  <p key={i} className="text-xs text-purple-800">• {concern}</p>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Signalements */}
                        {msg.signalements?.length > 0 && (
                          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded">
                            <p className="font-semibold text-sm text-orange-900 mb-2">Signalements:</p>
                            {msg.signalements.map((sig, index) => (
                              <div key={index} className="text-xs text-orange-800 mb-1">
                                • {sig.raison} - Par: {sig.email_signaleur} - {format(new Date(sig.date), 'dd/MM/yyyy', { locale: fr })}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3 border-t flex-wrap">
                          {!msg.ai_analysis && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => analyzeContentWithAI.mutate({ messageId: msg.id })}
                              disabled={aiAnalysisLoading}
                              className="bg-purple-50 border-purple-200"
                            >
                              {aiAnalysisLoading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Brain className="w-3 h-3 mr-1" />}
                              Analyser IA
                            </Button>
                          )}

                          {msg.statut_moderation !== 'approuve' && (
                            <Button
                              size="sm"
                              onClick={() => updateStatutMutation.mutate({ messageId: msg.id, statut: 'approuve' })}
                              disabled={updateStatutMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approuver
                            </Button>
                          )}
                          
                          {msg.statut_moderation !== 'rejete' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateStatutMutation.mutate({ messageId: msg.id, statut: 'rejete' })}
                              disabled={updateStatutMutation.isPending}
                              className="text-red-600 border-red-300"
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Rejeter
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleEpingleMutation.mutate({ messageId: msg.id, epingle: !msg.epingle })}
                            disabled={toggleEpingleMutation.isPending}
                          >
                            <Pin className="w-3 h-3 mr-1" />
                            {msg.epingle ? 'Désépingler' : 'Épingler'}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowWarning(msg.created_by)}
                            className="text-orange-600"
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Avertir
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowBanUser(msg.created_by)}
                            className="text-red-700"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Bannir
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) {
                                deleteMutation.mutate(msg.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="text-red-600"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Supprimer
                          </Button>
                        </div>

                        {/* Note modérateur */}
                        {selectedMessage === msg.id && (
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <Textarea
                              placeholder="Note privée pour les modérateurs..."
                              value={noteModerateur}
                              onChange={(e) => setNoteModerateur(e.target.value)}
                              rows={2}
                            />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-8">Aucun message à modérer</p>
                )}
              </div>
            </TabsContent>

            {/* Onglet Utilisateurs bannis */}
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserX className="w-5 h-5 text-red-600" />
                    Utilisateurs bannis ({bannedUsers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bannedUsers.length > 0 ? (
                    <div className="space-y-3">
                      {bannedUsers.map(profile => (
                        <div key={profile.id} className="border rounded-lg p-4 flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{profile.created_by}</p>
                            <p className="text-sm text-red-600">Raison: {profile.ban_reason}</p>
                            <p className="text-xs text-gray-500">
                              Banni le {format(new Date(profile.banned_date), 'dd/MM/yyyy', { locale: fr })}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unbanUserMutation.mutate(profile.created_by)}
                            disabled={unbanUserMutation.isPending}
                          >
                            Débannir
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucun utilisateur banni</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Onglet Statistiques */}
            <TabsContent value="analytics">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Activité de modération (30 derniers jours)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Messages approuvés:</span>
                        <span className="font-bold">{messages.filter(m => m.statut_moderation === 'approuve').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Messages rejetés:</span>
                        <span className="font-bold">{messages.filter(m => m.statut_moderation === 'rejete').length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Signalements traités:</span>
                        <span className="font-bold">{messagesSignales.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Analyses IA effectuées:</span>
                        <span className="font-bold">{messages.filter(m => m.ai_analysis).length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Tendances</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Messages épinglés:</span>
                        <span className="font-bold">{messages.filter(m => m.epingle).length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utilisateurs bannis:</span>
                        <span className="font-bold text-red-600">{bannedUsers.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>En attente modération:</span>
                        <span className="font-bold text-yellow-600">{messagesEnAttente.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal Avertissement */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Envoyer un avertissement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">Utilisateur: {showWarning}</p>
              <Textarea
                placeholder="Message d'avertissement..."
                value={warningMessage}
                onChange={(e) => setWarningMessage(e.target.value)}
                rows={4}
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowWarning(null)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  onClick={() => sendWarningMutation.mutate({ userEmail: showWarning, message: warningMessage })}
                  disabled={!warningMessage || sendWarningMutation.isPending}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  Envoyer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Bannissement */}
      {showBanUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-700">
                <Ban className="w-5 h-5" />
                Bannir l'utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">Utilisateur: {showBanUser}</p>
              <p className="text-sm text-red-600">⚠️ Cette action est sérieuse. L'utilisateur ne pourra plus accéder à la communauté.</p>
              <Textarea
                placeholder="Raison du bannissement..."
                rows={3}
                id="ban-reason"
              />
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowBanUser(null)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  onClick={() => {
                    const reason = document.getElementById('ban-reason').value;
                    if (!reason) {
                      alert('Veuillez indiquer une raison');
                      return;
                    }
                    banUserMutation.mutate({ userEmail: showBanUser, reason });
                  }}
                  disabled={banUserMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Confirmer le bannissement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}