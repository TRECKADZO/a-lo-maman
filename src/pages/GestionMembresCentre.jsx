import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, UserPlus, Shield, Search, Settings, 
  MoreVertical, Trash2, Edit, Eye, Loader2 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import InviterMembreDialog from '../components/centre/InviterMembreDialog';
import EditerMembreDialog from '../components/centre/EditerMembreDialog';
import VoirPermissionsDialog from '../components/centre/VoirPermissionsDialog';
import { toast } from 'react-hot-toast';

const ROLE_COLORS = {
  administrateur: 'bg-purple-100 text-purple-800',
  medecin: 'bg-blue-100 text-blue-800',
  infirmier: 'bg-green-100 text-green-800',
  sage_femme: 'bg-pink-100 text-pink-800',
  secretaire: 'bg-amber-100 text-amber-800',
  technicien: 'bg-gray-100 text-gray-800',
  consultant: 'bg-indigo-100 text-indigo-800'
};

const ROLE_LABELS = {
  administrateur: 'Administrateur',
  medecin: 'Médecin',
  infirmier: 'Infirmier(ère)',
  sage_femme: 'Sage-femme',
  secretaire: 'Secrétaire',
  technicien: 'Technicien',
  consultant: 'Consultant'
};

const STATUT_COLORS = {
  actif: 'bg-green-100 text-green-800',
  inactif: 'bg-gray-100 text-gray-800',
  suspendu: 'bg-red-100 text-red-800',
  en_attente: 'bg-orange-100 text-orange-800'
};

export default function GestionMembresCentre() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [editingMembre, setEditingMembre] = useState(null);
  const [viewingPermissions, setViewingPermissions] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: centre } = useQuery({
    queryKey: ['centre', user?.email],
    queryFn: async () => {
      const centres = await base44.entities.Clinique.filter({
        $or: [
          { administrateurs: { $in: [user.email] } },
          { administrateur_email: user.email }
        ]
      });
      return centres[0];
    },
    enabled: !!user,
  });

  const { data: membres, isLoading } = useQuery({
    queryKey: ['membres_centre', centre?.id],
    queryFn: async () => {
      const members = await base44.entities.MembreCentre.filter({
        centre_id: centre.id
      });
      return members;
    },
    enabled: !!centre,
  });

  const { data: monMembership } = useQuery({
    queryKey: ['mon_membership', centre?.id, user?.email],
    queryFn: async () => {
      const membership = await base44.entities.MembreCentre.filter({
        centre_id: centre.id,
        user_email: user.email
      });
      return membership[0];
    },
    enabled: !!centre && !!user,
  });

  const supprimerMembreMutation = useMutation({
    mutationFn: (membreId) => base44.entities.MembreCentre.delete(membreId),
    onSuccess: () => {
      queryClient.invalidateQueries(['membres_centre']);
      toast.success('Membre retiré du centre');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    }
  });

  const changerStatutMutation = useMutation({
    mutationFn: ({ id, nouveauStatut }) => 
      base44.entities.MembreCentre.update(id, { statut: nouveauStatut }),
    onSuccess: () => {
      queryClient.invalidateQueries(['membres_centre']);
      toast.success('Statut mis à jour');
    },
    onError: () => {
      toast.error('Erreur lors du changement de statut');
    }
  });

  const filteredMembres = membres?.filter(m => 
    m.user_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ROLE_LABELS[m.role]?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const canManageMembers = monMembership?.role === 'administrateur' || 
                           monMembership?.permissions?.gerer_membres;

  if (!centre) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              Gestion des Membres
            </h1>
            <p className="text-gray-600 mt-1">{centre.nom}</p>
          </div>
          {canManageMembers && (
            <Button 
              onClick={() => setShowInviteDialog(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Inviter un membre
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total membres</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {membres?.length || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Médecins</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {membres?.filter(m => m.role === 'medecin').length || 0}
                  </p>
                </div>
                <Shield className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Personnel</p>
                  <p className="text-2xl font-bold text-green-600">
                    {membres?.filter(m => ['infirmier', 'sage_femme', 'secretaire'].includes(m.role)).length || 0}
                  </p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {membres?.filter(m => m.statut === 'en_attente').length || 0}
                  </p>
                </div>
                <Settings className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, email ou rôle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Liste des membres */}
        <Card>
          <CardHeader>
            <CardTitle>Membres actifs ({filteredMembres.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
              </div>
            ) : filteredMembres.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? 'Aucun résultat trouvé' : 'Aucun membre pour le moment'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredMembres.map((membre) => (
                  <div
                    key={membre.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {membre.user_nom?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {membre.user_nom || 'Sans nom'}
                          </h3>
                          <p className="text-sm text-gray-600 truncate">{membre.user_email}</p>
                          {membre.specialite && (
                            <p className="text-xs text-gray-500 mt-1">{membre.specialite}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge className={ROLE_COLORS[membre.role]}>
                            {ROLE_LABELS[membre.role]}
                          </Badge>
                          <Badge className={STATUT_COLORS[membre.statut]}>
                            {membre.statut}
                          </Badge>
                        </div>
                      </div>

                      {membre.departements && membre.departements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {membre.departements.map((dept, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {dept}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {membre.telephone && (
                        <p className="text-xs text-gray-500 mt-2">
                          📞 {membre.telephone}
                        </p>
                      )}
                    </div>

                    {canManageMembers && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingPermissions(membre)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Voir permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingMembre(membre)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          {membre.statut === 'actif' && (
                            <DropdownMenuItem 
                              onClick={() => changerStatutMutation.mutate({ 
                                id: membre.id, 
                                nouveauStatut: 'inactif' 
                              })}
                            >
                              Désactiver
                            </DropdownMenuItem>
                          )}
                          {membre.statut === 'inactif' && (
                            <DropdownMenuItem 
                              onClick={() => changerStatutMutation.mutate({ 
                                id: membre.id, 
                                nouveauStatut: 'actif' 
                              })}
                            >
                              Réactiver
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              if (confirm(`Retirer ${membre.user_nom} du centre ?`)) {
                                supprimerMembreMutation.mutate(membre.id);
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Retirer du centre
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showInviteDialog && (
        <InviterMembreDialog
          centre={centre}
          onClose={() => setShowInviteDialog(false)}
        />
      )}

      {editingMembre && (
        <EditerMembreDialog
          membre={editingMembre}
          centre={centre}
          onClose={() => setEditingMembre(null)}
        />
      )}

      {viewingPermissions && (
        <VoirPermissionsDialog
          membre={viewingPermissions}
          onClose={() => setViewingPermissions(null)}
        />
      )}
    </div>
  );
}