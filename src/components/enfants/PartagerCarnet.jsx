import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  UserPlus,
  Users,
  Shield,
  Trash2,
  Loader2,
  Eye,
  Syringe,
  TrendingUp,
  Activity,
  FileText,
  Heart,
  Camera,
  Mail,
  X
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/safe-area-view';

const RELATIONS = [
  { value: 'partenaire', label: 'Partenaire / Conjoint(e)', icon: '💑' },
  { value: 'parent', label: 'Grand-parent', icon: '👴👵' },
  { value: 'oncle_tante', label: 'Oncle / Tante', icon: '👨‍👩‍👧' },
  { value: 'nounou', label: 'Nounou / Garde d\'enfant', icon: '👩‍🍼' },
  { value: 'autre', label: 'Autre', icon: '👤' },
];

const PERMISSIONS = [
  { id: 'voir_infos', label: 'Informations générales', icon: Eye, desc: 'Nom, âge, photo' },
  { id: 'voir_vaccins', label: 'Vaccinations', icon: Syringe, desc: 'Carnet de vaccins' },
  { id: 'voir_croissance', label: 'Courbes de croissance', icon: TrendingUp, desc: 'Poids, taille' },
  { id: 'voir_jalons', label: 'Jalons de développement', icon: Activity, desc: 'Étapes franchies' },
  { id: 'voir_medical', label: 'Historique médical', icon: Heart, desc: 'Maladies, consultations' },
  { id: 'voir_documents', label: 'Documents médicaux', icon: FileText, desc: 'Ordonnances, résultats' },
  { id: 'ajouter_photos', label: 'Ajouter des photos', icon: Camera, desc: 'Contribuer aux souvenirs' },
];

export default function PartagerCarnet({ enfant, onClose }) {
  const queryClient = useQueryClient();
  const [showAjouter, setShowAjouter] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    nom: '',
    relation: 'partenaire',
    permissions: {
      voir_infos: true,
      voir_vaccins: true,
      voir_croissance: true,
      voir_jalons: true,
      voir_medical: false,
      voir_documents: false,
      ajouter_photos: false
    }
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: famille } = useQuery({
    queryKey: ['famille_connectee', user?.email],
    queryFn: async () => {
      const familles = await base44.entities.FamilleConnectee.filter({
        proprietaire_email: user.email
      });
      return familles[0] || null;
    },
    enabled: !!user,
  });

  const partages = enfant.partages_famille || [];

  // Ajouter un partage
  const ajouterPartageMutation = useMutation({
    mutationFn: async (data) => {
      const nouveauPartage = {
        email: data.email,
        nom: data.nom,
        relation: data.relation,
        date_partage: new Date().toISOString(),
        permissions: data.permissions
      };

      const partagesActuels = enfant.partages_famille || [];
      
      // Vérifier si déjà partagé
      if (partagesActuels.some(p => p.email === data.email)) {
        throw new Error('Ce carnet est déjà partagé avec cette personne');
      }

      await base44.entities.EnfantCarnet.update(enfant.id, {
        partages_famille: [...partagesActuels, nouveauPartage]
      });

      // Envoyer notification
      await base44.integrations.Core.SendEmail({
        to: data.email,
        subject: `${user.full_name} partage le carnet de ${enfant.prenom} avec vous`,
        body: `Bonjour ${data.nom},\n\n${user.full_name} vous a donné accès au carnet de santé de ${enfant.prenom} sur A'lo Maman.\n\nConnectez-vous à l'application pour consulter les informations partagées.\n\nÀ bientôt !`
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      setShowAjouter(false);
      setInviteData({
        email: '', nom: '', relation: 'partenaire',
        permissions: { voir_infos: true, voir_vaccins: true, voir_croissance: true, voir_jalons: true, voir_medical: false, voir_documents: false, ajouter_photos: false }
      });
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  // Supprimer un partage
  const supprimerPartageMutation = useMutation({
    mutationFn: async (email) => {
      const nouveauxPartages = partages.filter(p => p.email !== email);
      await base44.entities.EnfantCarnet.update(enfant.id, {
        partages_famille: nouveauxPartages
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
    }
  });

  // Mettre à jour permissions
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ email, permissions }) => {
      const nouveauxPartages = partages.map(p =>
        p.email === email ? { ...p, permissions } : p
      );
      await base44.entities.EnfantCarnet.update(enfant.id, {
        partages_famille: nouveauxPartages
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
    }
  });

  // Ajouter depuis la famille connectée
  const membresFamille = famille?.membres?.filter(m => 
    m.statut === 'accepte' && !partages.some(p => p.email === m.email)
  ) || [];

  return (
    <BottomSheet
      isOpen={true}
      onClose={onClose}
      title={`Partager le carnet de ${enfant.prenom}`}
      fullHeight
    >
      <div className="p-4 space-y-4 overflow-y-auto" style={{ maxHeight: '80vh' }}>
        {/* Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Partage sécurisé</p>
              <p>Les personnes avec qui vous partagez pourront voir uniquement les informations autorisées. Vous pouvez modifier les permissions à tout moment.</p>
            </div>
          </CardContent>
        </Card>

        {/* Personnes avec accès */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-500" />
              Accès partagé ({partages.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {partages.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                Aucun partage pour le moment
              </p>
            ) : (
              partages.map((partage, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-pink-100 text-pink-800">
                          {partage.nom?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{partage.nom}</p>
                        <p className="text-xs text-gray-500">{partage.email}</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {RELATIONS.find(r => r.value === partage.relation)?.icon}{' '}
                          {RELATIONS.find(r => r.value === partage.relation)?.label}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => {
                        if (confirm('Retirer l\'accès ?')) {
                          supprimerPartageMutation.mutate(partage.email);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Permissions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {Object.entries(partage.permissions || {}).map(([key, value]) => {
                      if (!value) return null;
                      const perm = PERMISSIONS.find(p => p.id === key);
                      if (!perm) return null;
                      return (
                        <Badge key={key} variant="secondary" className="text-xs">
                          <perm.icon className="w-3 h-3 mr-1" />
                          {perm.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Ajouter depuis famille connectée */}
        {membresFamille.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Famille connectée
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {membresFamille.map((membre, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-rose-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-rose-200 text-rose-800 text-xs">
                          {membre.nom?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{membre.nom}</p>
                        <p className="text-xs text-gray-500">{membre.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setInviteData({
                          ...inviteData,
                          email: membre.email,
                          nom: membre.nom,
                          relation: membre.relation
                        });
                        setShowAjouter(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bouton ajouter */}
        <Button
          onClick={() => setShowAjouter(true)}
          className="w-full bg-gradient-to-r from-pink-500 to-rose-500"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Partager avec une nouvelle personne
        </Button>
      </div>

      {/* Modal ajout */}
      {showAjouter && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end md:items-center justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl md:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Nouveau partage</h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAjouter(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>

              <div>
                <Label>Nom *</Label>
                <Input
                  value={inviteData.nom}
                  onChange={(e) => setInviteData({ ...inviteData, nom: e.target.value })}
                  placeholder="Prénom Nom"
                />
              </div>

              <div>
                <Label>Relation</Label>
                <Select
                  value={inviteData.relation}
                  onValueChange={(v) => setInviteData({ ...inviteData, relation: v })}
                >
                  <SelectTrigger>
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
                <Label className="mb-2 block">Permissions d'accès</Label>
                <div className="space-y-2">
                  {PERMISSIONS.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <p.icon className="w-4 h-4 text-gray-500" />
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
                  ))}
                </div>
              </div>

              <Button
                onClick={() => ajouterPartageMutation.mutate(inviteData)}
                disabled={!inviteData.email || !inviteData.nom || ajouterPartageMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-500 to-rose-500"
              >
                {ajouterPartageMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer l'invitation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}