import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Mail,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function GestionUtilisateursCentre({ centre }) {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [emailInvite, setEmailInvite] = useState('');

  const { data: utilisateurs = [], isLoading } = useQuery({
    queryKey: ['utilisateurs_centre', centre.id],
    queryFn: async () => {
      const admins = centre.administrateurs || [centre.administrateur_email];
      return admins.map(email => ({
        email,
        role: 'admin',
        isPrincipal: email === centre.administrateur_email
      }));
    }
  });

  const inviterUtilisateur = useMutation({
    mutationFn: async (email) => {
      // Inviter l'utilisateur sur la plateforme
      await base44.users.inviteUser(email, 'admin');
      
      // Ajouter aux administrateurs du centre
      const admins = centre.administrateurs || [centre.administrateur_email];
      if (!admins.includes(email)) {
        await base44.entities.Clinique.update(centre.id, {
          administrateurs: [...admins, email]
        });
      }
    },
    onSuccess: () => {
      toast.success('Invitation envoyée avec succès');
      queryClient.invalidateQueries({ queryKey: ['utilisateurs_centre'] });
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
      setShowInviteModal(false);
      setEmailInvite('');
    },
    onError: (error) => {
      toast.error('Erreur lors de l\'invitation');
      console.error(error);
    }
  });

  const retirerUtilisateur = useMutation({
    mutationFn: async (email) => {
      const admins = centre.administrateurs || [centre.administrateur_email];
      await base44.entities.Clinique.update(centre.id, {
        administrateurs: admins.filter(a => a !== email)
      });
    },
    onSuccess: () => {
      toast.success('Utilisateur retiré');
      queryClient.invalidateQueries({ queryKey: ['utilisateurs_centre'] });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const handleInvite = (e) => {
    e.preventDefault();
    if (!emailInvite.trim()) {
      toast.error('Email requis');
      return;
    }
    inviterUtilisateur.mutate(emailInvite.trim());
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            Utilisateurs du Centre ({utilisateurs.length})
          </CardTitle>
          <Button
            onClick={() => setShowInviteModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Inviter
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
          </div>
        ) : utilisateurs.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600">Aucun utilisateur</p>
          </div>
        ) : (
          <div className="space-y-3">
            {utilisateurs.map((user) => (
              <div
                key={user.email}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{user.email}</p>
                      {user.isPrincipal && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Principal
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">Administrateur</p>
                  </div>
                </div>

                {!user.isPrincipal && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => retirerUtilisateur.mutate(user.email)}
                    disabled={retirerUtilisateur.isPending}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal Invitation */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inviter un administrateur</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleInvite} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                value={emailInvite}
                onChange={(e) => setEmailInvite(e.target.value)}
                placeholder="email@exemple.com"
                required
                disabled={inviterUtilisateur.isPending}
              />
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-900">
              L'utilisateur recevra un email pour créer son compte et accéder au centre.
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowInviteModal(false)}
                disabled={inviterUtilisateur.isPending}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={inviterUtilisateur.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {inviterUtilisateur.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Envoyer l'invitation
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}