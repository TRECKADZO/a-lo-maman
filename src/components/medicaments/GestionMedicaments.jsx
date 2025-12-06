import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Pill,
  Plus,
  Clock,
  Calendar,
  XCircle,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function GestionMedicaments({ enfantId = null }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [formData, setFormData] = useState({
    nom_medicament: '',
    dosage: '',
    forme: 'comprime',
    frequence: 'quotidien',
    heures_prise: ['08:00'],
    date_debut: '',
    date_fin: '',
    duree_jours: '',
    instructions: '',
    prescrit_par: '',
    enfant_id: enfantId || null
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: medicaments, isLoading } = useQuery({
    queryKey: ['rappels_medicaments', enfantId],
    queryFn: async () => {
      if (!user) return [];
      const filters = { created_by: user.email };
      if (enfantId) filters.enfant_id = enfantId;
      const meds = await base44.entities.RappelMedicament.filter(filters, '-date_debut');
      return meds;
    },
    enabled: !!user,
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.RappelMedicament.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels_medicaments'] });
      setShowForm(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.RappelMedicament.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels_medicaments'] });
      setEditingMed(null);
      setShowForm(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.RappelMedicament.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels_medicaments'] });
    },
  });

  const toggleActifMutation = useMutation({
    mutationFn: ({ id, actif }) => base44.entities.RappelMedicament.update(id, { actif }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rappels_medicaments'] });
    },
  });

  const resetForm = () => {
    setFormData({
      nom_medicament: '',
      dosage: '',
      forme: 'comprime',
      frequence: 'quotidien',
      heures_prise: ['08:00'],
      date_debut: '',
      date_fin: '',
      duree_jours: '',
      instructions: '',
      prescrit_par: '',
      enfant_id: enfantId || null
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingMed) {
      updateMutation.mutate({ id: editingMed.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (med) => {
    setEditingMed(med);
    setFormData({
      nom_medicament: med.nom_medicament,
      dosage: med.dosage || '',
      forme: med.forme || 'comprime',
      frequence: med.frequence,
      heures_prise: med.heures_prise || ['08:00'],
      date_debut: med.date_debut,
      date_fin: med.date_fin || '',
      duree_jours: med.duree_jours || '',
      instructions: med.instructions || '',
      prescrit_par: med.prescrit_par || '',
      enfant_id: med.enfant_id || null
    });
    setShowForm(true);
  };

  const handleAddHeure = () => {
    setFormData({ ...formData, heures_prise: [...formData.heures_prise, '12:00'] });
  };

  const handleUpdateHeure = (index, value) => {
    const newHeures = [...formData.heures_prise];
    newHeures[index] = value;
    setFormData({ ...formData, heures_prise: newHeures });
  };

  const handleRemoveHeure = (index) => {
    setFormData({ ...formData, heures_prise: formData.heures_prise.filter((_, i) => i !== index) });
  };

  const medicamentsActifs = medicaments.filter(m => m.actif !== false);
  const medicamentsInactifs = medicaments.filter(m => m.actif === false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Pill className="w-6 h-6 text-indigo-600" />
          Gestion des Médicaments
        </h2>
        <Button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Ajouter un rappel
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-indigo-200">
          <CardHeader>
            <CardTitle>{editingMed ? 'Modifier' : 'Nouveau'} rappel de médicament</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom_medicament">Nom du médicament *</Label>
                  <Input
                    id="nom_medicament"
                    value={formData.nom_medicament}
                    onChange={(e) => setFormData({ ...formData, nom_medicament: e.target.value })}
                    placeholder="Ex: Paracétamol"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                    placeholder="Ex: 500mg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forme</Label>
                  <Select value={formData.forme} onValueChange={(v) => setFormData({ ...formData, forme: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="comprime">Comprimé</SelectItem>
                      <SelectItem value="sirop">Sirop</SelectItem>
                      <SelectItem value="gelule">Gélule</SelectItem>
                      <SelectItem value="injection">Injection</SelectItem>
                      <SelectItem value="creme">Crème</SelectItem>
                      <SelectItem value="suppositoire">Suppositoire</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Fréquence *</Label>
                  <Select value={formData.frequence} onValueChange={(v) => setFormData({ ...formData, frequence: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="une_fois">Une fois par jour</SelectItem>
                      <SelectItem value="deux_fois">Deux fois par jour</SelectItem>
                      <SelectItem value="trois_fois">Trois fois par jour</SelectItem>
                      <SelectItem value="quatre_fois">Quatre fois par jour</SelectItem>
                      <SelectItem value="quotidien">Quotidien</SelectItem>
                      <SelectItem value="personnalise">Personnalisé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Heures de prise</Label>
                {formData.heures_prise.map((heure, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      type="time"
                      value={heure}
                      onChange={(e) => handleUpdateHeure(index, e.target.value)}
                      className="flex-1"
                    />
                    {formData.heures_prise.length > 1 && (
                      <Button type="button" variant="outline" size="icon" onClick={() => handleRemoveHeure(index)}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={handleAddHeure}>
                  <Plus className="w-3 h-3 mr-1" />
                  Ajouter une heure
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_debut">Date de début *</Label>
                  <Input
                    id="date_debut"
                    type="date"
                    value={formData.date_debut}
                    onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_fin">Date de fin</Label>
                  <Input
                    id="date_fin"
                    type="date"
                    value={formData.date_fin}
                    onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duree_jours">Durée (jours)</Label>
                  <Input
                    id="duree_jours"
                    type="number"
                    value={formData.duree_jours}
                    onChange={(e) => setFormData({ ...formData, duree_jours: e.target.value })}
                    placeholder="Ex: 7"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Ex: À prendre après les repas"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescrit_par">Prescrit par</Label>
                <Input
                  id="prescrit_par"
                  value={formData.prescrit_par}
                  onChange={(e) => setFormData({ ...formData, prescrit_par: e.target.value })}
                  placeholder="Nom du médecin"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMed(null);
                    resetForm();
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                  {editingMed ? 'Mettre à jour' : 'Créer le rappel'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des médicaments actifs */}
      <div>
        <h3 className="font-semibold mb-3">Traitements en cours ({medicamentsActifs.length})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {medicamentsActifs.map((med) => (
            <Card key={med.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Pill className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{med.nom_medicament}</h4>
                      {med.dosage && <p className="text-sm text-gray-600">{med.dosage}</p>}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Actif</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">{med.heures_prise?.join(', ') || 'Non défini'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>Du {format(new Date(med.date_debut), 'dd MMM yyyy', { locale: fr })}</span>
                    {med.date_fin && <span>au {format(new Date(med.date_fin), 'dd MMM yyyy', { locale: fr })}</span>}
                  </div>
                  {med.instructions && (
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-600">{med.instructions}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(med)}>
                    <Edit className="w-3 h-3 mr-1" />
                    Modifier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActifMutation.mutate({ id: med.id, actif: false })}
                  >
                    <XCircle className="w-3 h-3 mr-1" />
                    Arrêter
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600"
                    onClick={() => {
                      if (confirm('Supprimer ce rappel ?')) deleteMutation.mutate(med.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {medicamentsActifs.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              Aucun traitement en cours
            </CardContent>
          </Card>
        )}
      </div>

      {/* Médicaments inactifs */}
      {medicamentsInactifs.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Traitements terminés ({medicamentsInactifs.length})</h3>
          <div className="space-y-2">
            {medicamentsInactifs.map((med) => (
              <Card key={med.id} className="bg-gray-50">
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-700">{med.nom_medicament}</p>
                    <p className="text-xs text-gray-500">
                      Terminé le {med.date_fin ? format(new Date(med.date_fin), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleActifMutation.mutate({ id: med.id, actif: true })}
                  >
                    Réactiver
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}