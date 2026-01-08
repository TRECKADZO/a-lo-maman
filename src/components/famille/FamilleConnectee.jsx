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
  Heart, Baby, Calendar, FileText, Shield, Loader2, 
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
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
  const [showCodePartage, setShowCodePartage] = useState(false);
  const [showJoindre, setShowJoindre] = useState(false);
  const [showSettings, setShowSettings] = useState(null);
  const [showMessages, setShowMessages] = useState(false);
  const [codeJoindre, setCodeJoindre] = useState('');
  const [relationJoindre, setRelationJoindre] = useState('partenaire');

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

  // Générer code unique
  const generateCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Créer le groupe famille avec code
  const createFamilleMutation = useMutation({
    mutationFn: async () => {
      if (!user?.email) {
        throw new Error('Utilisateur non connecté');
      }
      
      const existingFamilles = await base44.entities.FamilleConnectee.filter({
        proprietaire_email: user.email
      });
      
      if (existingFamilles && existingFamilles.length > 0) {
        return existingFamilles[0];
      }
      
      const code = generateCode();
      
      const result = await base44.entities.FamilleConnectee.create({
        proprietaire_email: user.email,
        code_partage: code,
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

  // Rejoindre une famille avec code
  const joinFamilleMutation = useMutation({
    mutationFn: async () => {
      // Trouver la famille avec ce code
      const allFamilles = await base44.entities.FamilleConnectee.list();
      const familleAvecCode = allFamilles.find(f => f.code_partage === codeJoindre.toUpperCase());
      
      if (!familleAvecCode) {
        throw new Error('Code invalide ou famille introuvable');
      }

      // Vérifier si déjà membre
      const dejaMembre = familleAvecCode.membres?.some(m => m.email === user.email);
      if (dejaMembre) {
        throw new Error('Vous êtes déjà membre de cette famille');
      }

      const newMembre = {
        email: user.email,
        nom: user.full_name,
        relation: relationJoindre,
        statut: 'accepte',
        date_ajout: new Date().toISOString(),
        permissions: {
          grossesse: true,
          grossesse_details: false,
          enfants: true,
          enfants_details: false,
          rendez_vous: true,
          documents: false,
          messagerie: true
        }
      };

      const membres = [...(familleAvecCode.membres || []), newMembre];
      await base44.entities.FamilleConnectee.update(familleAvecCode.id, { membres });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['famille_connectee'] });
      queryClient.invalidateQueries({ queryKey: ['familles_membre'] });
      setShowJoindre(false);
      setCodeJoindre('');
      toast.success('Vous avez rejoint la famille !');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  // Copier le code
  const handleCopyCode = () => {
    if (famille?.code_partage) {
      navigator.clipboard.writeText(famille.code_partage);
      toast.success('Code copié !');
    }
  };

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
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
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
                Créer mon cercle
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowJoindre(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Rejoindre un cercle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header avec code de partage */}
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
                  {membresAcceptes.length + 1} membre(s) • Code: <span className="font-mono font-bold text-pink-600">{famille.code_partage}</span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCodePartage(true)}
              >
                <UserPlus className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Inviter</span>
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowMessages(true)}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

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

      {/* Modal code de partage */}
      <BottomSheet
        isOpen={showCodePartage}
        onClose={() => setShowCodePartage(false)}
        title="Code de partage familial"
      >
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Partagez ce code avec vos proches pour qu'ils rejoignent votre cercle familial
            </p>
            
            <div className="p-8 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl mb-4">
              <p className="text-xs text-gray-600 mb-2">Code de famille</p>
              <p className="text-4xl font-mono font-bold text-pink-600 tracking-wider">
                {famille?.code_partage}
              </p>
            </div>

            <Button
              onClick={handleCopyCode}
              variant="outline"
              className="w-full mb-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Copier le code
            </Button>

            <div className="p-4 bg-blue-50 rounded-lg text-left">
              <p className="text-sm text-blue-900 font-semibold mb-2">📱 Instructions :</p>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Partagez ce code à vos proches (SMS, WhatsApp, etc.)</li>
                <li>Ils doivent se connecter à A'lo Maman</li>
                <li>Dans "Famille", cliquer sur "Rejoindre un cercle"</li>
                <li>Entrer ce code pour rejoindre votre famille</li>
              </ol>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Modal rejoindre une famille */}
      <BottomSheet
        isOpen={showJoindre}
        onClose={() => setShowJoindre(false)}
        title="Rejoindre un cercle familial"
      >
        <div className="p-6 space-y-4">
          <div>
            <Label>Code de famille *</Label>
            <Input
              value={codeJoindre}
              onChange={(e) => setCodeJoindre(e.target.value.toUpperCase())}
              placeholder="Ex: ABC123"
              className="mt-1 font-mono text-lg text-center"
              maxLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Entrez le code partagé par un membre de la famille</p>
          </div>

          <div>
            <Label>Votre relation</Label>
            <Select
              value={relationJoindre}
              onValueChange={setRelationJoindre}
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

          <Button
            onClick={() => joinFamilleMutation.mutate()}
            disabled={!codeJoindre || codeJoindre.length < 6 || joinFamilleMutation.isPending}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
          >
            {joinFamilleMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Rejoindre la famille
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