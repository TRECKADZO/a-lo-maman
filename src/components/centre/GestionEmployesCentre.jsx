import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Edit, Trash2, Mail, Phone, Shield, User, Loader2, CheckCircle, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ROLES = [
  { value: 'administrateur', label: 'Administrateur' },
  { value: 'medecin', label: 'Médecin' },
  { value: 'infirmier', label: 'Infirmier(ère)' },
  { value: 'sage_femme', label: 'Sage-femme' },
  { value: 'secretaire', label: 'Secrétaire' },
  { value: 'technicien', label: 'Technicien' },
];

export default function GestionEmployesCentre({ centre }) {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedMembre, setSelectedMembre] = useState(null);
  const [formData, setFormData] = useState({
    user_nom: '',
    user_email: '',
    telephone: '',
    role: 'medecin',
    specialite: '',
  });

  const { data: membres = [] } = useQuery({
    queryKey: ['membres_centre', centre.id],
    queryFn: () => base44.entities.MembreCentre.filter({ centre_id: centre.id }),
  });

  const ajouterMembreMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.MembreCentre.create({
        centre_id: centre.id,
        centre_nom: centre.nom,
        user_email: data.user_email,
        user_nom: data.user_nom,
        role: data.role,
        specialite: data.specialite || '',
        telephone: data.telephone || '',
        statut: 'en_attente',
        date_invitation: new Date().toISOString(),
        inviteur_email: (await base44.auth.me()).email,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membres_centre', centre.id] });
      setShowAddForm(false);
      setFormData({ user_nom: '', user_email: '', telephone: '', role: 'medecin', specialite: '' });
      alert('✅ Membre ajouté avec succès');
    },
  });

  const modifierMembreMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.MembreCentre.update(selectedMembre.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membres_centre', centre.id] });
      setShowEditForm(false);
      setSelectedMembre(null);
      alert('✅ Membre modifié avec succès');
    },
  });

  const supprimerMembreMutation = useMutation({
    mutationFn: async (membreId) => {
      return await base44.entities.MembreCentre.delete(membreId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['membres_centre', centre.id] });
      alert('✅ Membre retiré du centre');
    },
  });

  const handleEdit = (membre) => {
    setSelectedMembre(membre);
    setFormData({
      user_nom: membre.user_nom,
      user_email: membre.user_email,
      telephone: membre.telephone || '',
      role: membre.role,
      specialite: membre.specialite || '',
    });
    setShowEditForm(true);
  };

  const membresActifs = membres.filter(m => m.statut === 'actif');
  const membresEnAttente = membres.filter(m => m.statut === 'en_attente');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-purple-600" />
              Employés du Centre ({membres.length})
            </div>
            <Button onClick={() => setShowAddForm(true)} className="bg-purple-600 hover:bg-purple-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Ajouter un employé
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Membres en attente */}
          {membresEnAttente.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3 text-orange-800">En attente d'acceptation ({membresEnAttente.length})</h3>
              <div className="space-y-2">
                {membresEnAttente.map((membre) => (
                  <div key={membre.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-orange-700" />
                      </div>
                      <div>
                        <p className="font-medium">{membre.user_nom}</p>
                        <p className="text-sm text-gray-600">{membre.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-200 text-orange-800">En attente</Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => supprimerMembreMutation.mutate(membre.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Membres actifs */}
          <div>
            <h3 className="font-semibold mb-3">Membres actifs ({membresActifs.length})</h3>
            <div className="grid gap-4">
              {membresActifs.map((membre) => (
                <div key={membre.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {membre.user_nom?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{membre.user_nom}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{membre.role}</Badge>
                        {membre.specialite && (
                          <Badge className="bg-blue-100 text-blue-800">{membre.specialite}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {membre.user_email}
                        </span>
                        {membre.telephone && (
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {membre.telephone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(membre)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Retirer ${membre.user_nom} du centre ?`)) {
                          supprimerMembreMutation.mutate(membre.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Ajouter */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Ajouter un employé
                <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nom complet *</Label>
                <Input
                  value={formData.user_nom}
                  onChange={(e) => setFormData({ ...formData, user_nom: e.target.value })}
                  placeholder="Dr. Kouassi Jean"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.user_email}
                  onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                  placeholder="+225 XX XX XX XX XX"
                />
              </div>
              <div>
                <Label>Rôle *</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {['medecin', 'infirmier', 'sage_femme'].includes(formData.role) && (
                <div>
                  <Label>Spécialité</Label>
                  <Input
                    value={formData.specialite}
                    onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                    placeholder="Ex: Gynécologie"
                  />
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  onClick={() => ajouterMembreMutation.mutate(formData)}
                  disabled={!formData.user_nom || !formData.user_email || ajouterMembreMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {ajouterMembreMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Ajouter'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Modifier */}
      {showEditForm && selectedMembre && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Modifier l'employé
                <Button variant="ghost" size="icon" onClick={() => setShowEditForm(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nom complet</Label>
                <Input
                  value={formData.user_nom}
                  onChange={(e) => setFormData({ ...formData, user_nom: e.target.value })}
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                />
              </div>
              <div>
                <Label>Rôle</Label>
                <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Spécialité</Label>
                <Input
                  value={formData.specialite}
                  onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowEditForm(false)} className="flex-1">
                  Annuler
                </Button>
                <Button
                  onClick={() => modifierMembreMutation.mutate({
                    user_nom: formData.user_nom,
                    telephone: formData.telephone,
                    role: formData.role,
                    specialite: formData.specialite,
                  })}
                  disabled={modifierMembreMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {modifierMembreMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Enregistrer'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}