import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Plus, Settings, UserPlus, Check, X, MessageCircle,
  Heart, Baby, Calendar, FileText, Shield, Loader2, Mail, 
  Bell, Trash2
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/safe-area-view';
import MessagerieFilsDiscussion from './MessagerieFilsDiscussion';

const RELATIONS = [
  { value: 'partenaire', label: 'Partenaire / Conjoint(e)', icon: '💑' },
  { value: 'parent', label: 'Parent (mère, père)', icon: '👨‍👩‍👧' },
  { value: 'belle_famille', label: 'Belle-famille', icon: '👪' },
  { value: 'ami', label: 'Ami(e) proche', icon: '🤝' },
  { value: 'autre', label: 'Autre', icon: '👤' },
];

const PERMISSIONS = [
  { id: 'grossesse', label: 'Suivi de grossesse', icon: Heart, desc: 'Voir la progression de la grossesse' },
  { id: 'grossesse_details', label: 'Détails grossesse', icon: Heart, desc: 'Symptômes, rendez-vous, etc.' },
  { id: 'enfants', label: 'Carnets enfants', icon: Baby, desc: 'Voir les profils des enfants' },
  { id: 'enfants_details', label: 'Détails enfants', icon: Baby, desc: 'Vaccins, croissance, etc.' },
  { id: 'rendez_vous', label: 'Rendez-vous', icon: Calendar, desc: 'Voir les rendez-vous médicaux' },
  { id: 'documents', label: 'Documents', icon: FileText, desc: 'Accéder aux documents partagés' },
  { id: 'messagerie', label: 'Messagerie famille', icon: MessageCircle, desc: 'Participer aux discussions' },
];

export default function FamilleConnectee() {
  const queryClient = useQueryClient();
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [inviteData, setInviteData] = useState({
    email: '',
    nom: '',
    relation: 'partenaire',
    permissions: {
      grossesse: true,
      grossesse_details: false,
      enfants: true,
      enfants_details: false,
      rendez_vous: true,
      documents: false,
      messagerie: true
    }
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: famille, isLoading } = useQuery({
    queryKey: ['famille_connectee', user?.email],
    queryFn: async () => {
      const familles = await base44.entities.FamilleConnectee.filter({ 
        proprietaire_email: user.email 
      });
      return familles[0] || null;
    },
    enabled: !!user,
  });

  // Vérifier si l'utilisateur est membre d'une famille
  const { data: famillesMembre } = useQuery({
    queryKey: ['familles_membre', user?.email],
    queryFn: async () => {
      const allFamilles = await base44.entities.FamilleConnectee.list();
      return allFamilles.filter(f => 
        f.membres?.some(m => m.email === user.email && m.statut === 'accepte')
      );
    },
    enabled: !!user,
  });

  // Créer le groupe famille
  const createFamilleMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) {
        throw new Error('Utilisateur non connecté');
      }
      
      // Vérifier d'abord si une famille existe déjà
      const existingFamilles = await base44.entities.FamilleConnectee.filter({
        proprietaire_email: user.email
      });
      
      if (existingFamilles && existingFamilles.length > 0) {
        return existingFamilles[0];
      }
      
      const result = await base44.entities.FamilleConnectee.create({
        proprietaire_email: user.email,
        membres: [],
        messages_famille: [],
        parametres: {
          nom_groupe: 'Ma Famille',
          notifications_nouvelles: true,
          partage_automatique_jalons: false
        }
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['famille_connectee', user?.email] });
      queryClient.invalidateQueries({ queryKey: ['familles_membre', user?.email] });
    },
    onError: (error) => {
      console.error('Erreur création famille:', error);
    }
  });

  // Inviter un membre
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const newMembre = {
        email: inviteData.email,
        nom: inviteData.nom,
        relation: inviteData.relation,
        statut: 'invite',
        date_invitation: new Date().toISOString(),
        permissions: inviteData.permissions
      };

      const membres = [...(famille?.membres || []), newMembre];
      
      await base44.entities.FamilleConnectee.update(famille.id, { membres });

      // Envoyer notification/email
      await base44.integrations.Core.SendEmail({
        to: inviteData.email,
        subject: `${user.full_name} vous invite à rejoindre sa famille sur A'lo Maman`,
        body: `Bonjour ${inviteData.nom},\n\n${user.full_name} souhaite vous ajouter à son cercle familial sur A'lo Maman pour partager le suivi de sa grossesse et de ses enfants.\n\nConnectez-vous à l'application pour accepter l'invitation.\n\nÀ bientôt !`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['famille_connectee'] });
      setShowInvite(false);
      setInviteData({
        email: '', nom: '', relation: 'partenaire',
        permissions: { grossesse: true, grossesse_details: false, enfants: true, enfants_details: false, rendez_vous: true, documents: false, messagerie: true }
      });
    }
  });

  // Accepter/refuser invitation
  const respondInvitationMutation = useMutation({
    mutationFn: async ({ familleId, accept }) => {
      const fam = await base44.entities.FamilleConnectee.filter({ id: familleId });
      if (!fam[0]) return;

      const membres = fam[0].membres.map(m => 
        m.email === user.email 
          ? { ...m, statut: accept ? 'accepte' : 'refuse', date_reponse: new Date().toISOString() }
          : m
      );

      await base44.entities.FamilleConnectee.update(familleId, { membres });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['famille_connectee'] });
      queryClient.invalidateQueries({ queryKey: ['familles_membre'] });
    }
  });

  // Mettre à jour permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ membreEmail, permissions }) => {
      const membres = famille.membres.map(m =>
        m.email === membreEmail ? { ...m, permissions } : m
      );
      await base44.entities.FamilleConnectee.update(famille.id, { membres });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['famille_connectee'] });
      setShowSettings(null);
    }
  });

  // Envoyer message
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      const message = {
        id: Date.now().toString(),
        auteur_email: user.email,
        auteur_nom: user.full_name,
        contenu: newMessage,
        date: new Date().toISOString(),
        type: 'message',
        lu_par: [user.email]
      };

      const messages = [...(famille?.messages_famille || []), message];
      await base44.entities.FamilleConnectee.update(famille.id, { messages_famille: messages });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['famille_connectee'] });
      setNewMessage('');
    }
  });

  // Supprimer membre
  const removeMemberMutation = useMutation({
    mutationFn: async (membreEmail) => {
      const membres = famille.membres.filter(m => m.email !== membreEmail);
      await base44.entities.FamilleConnectee.update(famille.id, { membres });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['famille_connectee'] });
    }
  });

  const membresAcceptes = famille?.membres?.filter(m => m.statut === 'accepte') || [];
  const membresEnAttente = famille?.membres?.filter(m => m.statut === 'invite') || [];

  // Invitations reçues
  const invitationsRecues = famillesMembre?.filter(f => 
    f.membres?.some(m => m.email === user?.email && m.statut === 'invite')
  ) || [];

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // Pas encore de groupe famille
  if (!famille) {
    return (
      <div className="space-y-4">
        {/* Invitations reçues */}
        {invitationsRecues.length > 0 && (
          <Card className="shadow-lg bg-amber-50 border-amber-200">
            <CardHeader>
              <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Invitations reçues
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {invitationsRecues.map(f => {
                const invitation = f.membres?.find(m => m.email === user?.email);
                return (
                  <div key={f.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <p className="font-medium">{f.proprietaire_email}</p>
                      <p className="text-xs text-gray-500">
                        Relation: {RELATIONS.find(r => r.value === invitation?.relation)?.label}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => respondInvitationMutation.mutate({ familleId: f.id, accept: false })}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => respondInvitationMutation.mutate({ familleId: f.id, accept: true })}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-xl font-bold mb-2">Famille Connectée</h2>
            <p className="text-gray-600 mb-6">
              Partagez votre suivi de grossesse et le carnet de santé de vos enfants 
              avec votre partenaire et vos proches.
            </p>
            <Button
              onClick={() => createFamilleMutation.mutate()}
              disabled={createFamilleMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-rose-500"
            >
              {createFamilleMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Créer mon cercle familial
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="shadow-xl bg-gradient-to-r from-pink-50 to-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold">{famille.parametres?.nom_groupe || 'Ma Famille'}</h3>
                <p className="text-sm text-gray-600">
                  {membresAcceptes.length} membre(s) connecté(s)
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowMessages(true)}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                onClick={() => setShowInvite(true)}
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Invitations en attente */}
      {membresEnAttente.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-800">
              ⏳ Invitations en attente ({membresEnAttente.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {membresEnAttente.map((m, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-white rounded-lg">
                <div className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-amber-200 text-amber-800 text-xs">
                      {m.nom?.[0]?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{m.nom}</p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">En attente</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Membres connectés */}
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Membres du cercle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Propriétaire */}
          <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-pink-500 text-white">
                  {user?.full_name?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.full_name}</p>
                <p className="text-xs text-gray-500">Vous (propriétaire)</p>
              </div>
            </div>
            <Badge className="bg-pink-100 text-pink-800">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          </div>

          {/* Autres membres */}
          {membresAcceptes.map((membre, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-purple-100 text-purple-800">
                    {membre.nom?.[0]?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{membre.nom}</p>
                  <p className="text-xs text-gray-500">
                    {RELATIONS.find(r => r.value === membre.relation)?.icon}{' '}
                    {RELATIONS.find(r => r.value === membre.relation)?.label}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(membre)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm('Retirer ce membre ?')) {
                      removeMemberMutation.mutate(membre.email);
                    }
                  }}
                  className="text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {membresAcceptes.length === 0 && membresEnAttente.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Invitez des membres à rejoindre votre cercle</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal invitation */}
      <BottomSheet
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        title="Inviter un membre"
        fullHeight
      >
        <div className="p-6 space-y-4">
          <div>
            <Label>Email *</Label>
            <Input
              type="email"
              value={inviteData.email}
              onChange={(e) => setInviteData({...inviteData, email: e.target.value})}
              placeholder="email@exemple.com"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Nom / Prénom *</Label>
            <Input
              value={inviteData.nom}
              onChange={(e) => setInviteData({...inviteData, nom: e.target.value})}
              placeholder="Jean Dupont"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Relation</Label>
            <Select
              value={inviteData.relation}
              onValueChange={(v) => setInviteData({...inviteData, relation: v})}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELATIONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.icon} {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="mb-3 block">Permissions d'accès</Label>
            <div className="space-y-3">
              {PERMISSIONS.map(p => {
                const Icon = p.icon;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{p.label}</p>
                        <p className="text-xs text-gray-500">{p.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={inviteData.permissions[p.id]}
                      onCheckedChange={(checked) => setInviteData({
                        ...inviteData,
                        permissions: { ...inviteData.permissions, [p.id]: checked }
                      })}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <Button
            onClick={() => inviteMutation.mutate()}
            disabled={!inviteData.email || !inviteData.nom || inviteMutation.isPending}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
          >
            {inviteMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Envoyer l'invitation
              </>
            )}
          </Button>
        </div>
      </BottomSheet>

      {/* Modal paramètres membre */}
      <BottomSheet
        isOpen={!!showSettings}
        onClose={() => setShowSettings(null)}
        title={`Permissions - ${showSettings?.nom}`}
        fullHeight
      >
        {showSettings && (
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              {PERMISSIONS.map(p => {
                const Icon = p.icon;
                return (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium">{p.label}</p>
                        <p className="text-xs text-gray-500">{p.desc}</p>
                      </div>
                    </div>
                    <Switch
                      checked={showSettings.permissions?.[p.id] || false}
                      onCheckedChange={(checked) => {
                        const newPerms = { ...showSettings.permissions, [p.id]: checked };
                        updatePermissionsMutation.mutate({
                          membreEmail: showSettings.email,
                          permissions: newPerms
                        });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Modal messagerie famille avec fils de discussion */}
      <BottomSheet
        isOpen={showMessages}
        onClose={() => setShowMessages(false)}
        title="Discussions familiales"
        fullHeight
      >
        <MessagerieFilsDiscussion 
          famille={famille}
          user={user}
          enfants={[]}
        />
      </BottomSheet>
    </div>
  );
}