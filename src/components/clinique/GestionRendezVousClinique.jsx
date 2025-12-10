import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Plus,
  Download,
  RefreshCw,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import FHIRMapper from '../interop/FHIRMapper';

export default function GestionRendezVousClinique({ cliniqueId }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tous');
  const [editDialog, setEditDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    professionnel_id: '',
    patient_email: '',
    date_rdv: '',
    type_consultation: 'cabinet',
    motif: '',
    notes_professionnel: '',
    statut: 'planifie'
  });

  // Fetch RDV de la clinique
  const { data: rendezVous = [], isLoading } = useQuery({
    queryKey: ['rdv_clinique', cliniqueId],
    queryFn: async () => {
      const rdvs = await base44.entities.RendezVous.list();
      // Filtrer par professionnels de la clinique
      const pros = await base44.entities.Professionnel.list();
      const proClinique = pros.filter(p => p.structure_sante === cliniqueId);
      const proIds = proClinique.map(p => p.id);
      return rdvs.filter(r => proIds.includes(r.professionnel_id));
    },
    enabled: !!cliniqueId
  });

  // Fetch professionnels de la clinique
  const { data: professionnels = [] } = useQuery({
    queryKey: ['pros_clinique', cliniqueId],
    queryFn: async () => {
      const pros = await base44.entities.Professionnel.list();
      return pros.filter(p => p.structure_sante === cliniqueId);
    },
    enabled: !!cliniqueId
  });

  // Mutation créer RDV
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const rdv = await base44.entities.RendezVous.create(data);
      
      // Sync FHIR
      try {
        const fhirAppointment = FHIRMapper.toFHIRAppointment(rdv, data.professionnel_id, data.patient_email);
        await base44.entities.RessourceFHIR.create({
          resource_type: 'Appointment',
          fhir_id: rdv.id,
          version: 'R4',
          patient_email: data.patient_email,
          resource_json: fhirAppointment,
          source_system: 'AloMaman',
          sync_status: 'synced'
        });
      } catch (err) {
        console.error('FHIR sync error:', err);
      }
      
      return rdv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rdv_clinique']);
      setCreateDialog(false);
      resetForm();
    }
  });

  // Mutation modifier RDV
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const rdv = await base44.entities.RendezVous.update(id, data);
      
      // Sync FHIR
      try {
        const fhirResources = await base44.entities.RessourceFHIR.filter({
          resource_type: 'Appointment',
          fhir_id: id
        });
        
        if (fhirResources.length > 0) {
          const fhirAppointment = FHIRMapper.toFHIRAppointment(rdv, rdv.professionnel_id, rdv.created_by);
          await base44.entities.RessourceFHIR.update(fhirResources[0].id, {
            resource_json: fhirAppointment,
            last_updated: new Date().toISOString(),
            sync_status: 'synced'
          });
        }
      } catch (err) {
        console.error('FHIR sync error:', err);
      }
      
      return rdv;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rdv_clinique']);
      setEditDialog(false);
      setSelectedRdv(null);
    }
  });

  // Mutation annuler RDV
  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      return await base44.entities.RendezVous.update(id, {
        statut: 'annule',
        annule_par: 'professionnel',
        date_annulation: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rdv_clinique']);
    }
  });

  const resetForm = () => {
    setFormData({
      professionnel_id: '',
      patient_email: '',
      date_rdv: '',
      type_consultation: 'cabinet',
      motif: '',
      notes_professionnel: '',
      statut: 'planifie'
    });
  };

  const handleEdit = (rdv) => {
    setSelectedRdv(rdv);
    setFormData({
      professionnel_id: rdv.professionnel_id,
      patient_email: rdv.created_by,
      date_rdv: rdv.date_rdv,
      type_consultation: rdv.type_consultation,
      motif: rdv.motif,
      notes_professionnel: rdv.notes_professionnel || '',
      statut: rdv.statut
    });
    setEditDialog(true);
  };

  const filteredRdvs = rendezVous
    .filter(rdv => {
      if (activeTab === 'tous') return true;
      return rdv.statut === activeTab;
    })
    .filter(rdv => {
      if (!searchTerm) return true;
      const pro = professionnels.find(p => p.id === rdv.professionnel_id);
      return (
        rdv.created_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pro?.nom_complet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rdv.motif?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

  const stats = {
    total: rendezVous.length,
    planifie: rendezVous.filter(r => r.statut === 'planifie').length,
    confirme: rendezVous.filter(r => r.statut === 'confirme').length,
    termine: rendezVous.filter(r => r.statut === 'termine').length,
    annule: rendezVous.filter(r => r.statut === 'annule').length
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{stats.planifie}</p>
              <p className="text-sm text-gray-600">Planifiés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.confirme}</p>
              <p className="text-sm text-gray-600">Confirmés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.termine}</p>
              <p className="text-sm text-gray-600">Terminés</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.annule}</p>
              <p className="text-sm text-gray-600">Annulés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Gestion des Rendez-vous
            </CardTitle>
            <Button onClick={() => setCreateDialog(true)} className="bg-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau RDV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Rechercher par patient, médecin ou motif..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="tous">Tous</TabsTrigger>
              <TabsTrigger value="planifie">Planifiés</TabsTrigger>
              <TabsTrigger value="confirme">Confirmés</TabsTrigger>
              <TabsTrigger value="termine">Terminés</TabsTrigger>
              <TabsTrigger value="annule">Annulés</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-3 mt-4">
              {isLoading ? (
                <p className="text-center py-8 text-gray-500">Chargement...</p>
              ) : filteredRdvs.length === 0 ? (
                <p className="text-center py-8 text-gray-500">Aucun rendez-vous</p>
              ) : (
                filteredRdvs.map((rdv) => {
                  const pro = professionnels.find(p => p.id === rdv.professionnel_id);
                  return (
                    <div key={rdv.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge className={
                              rdv.statut === 'termine' ? 'bg-purple-100 text-purple-800' :
                              rdv.statut === 'confirme' ? 'bg-green-100 text-green-800' :
                              rdv.statut === 'annule' ? 'bg-red-100 text-red-800' :
                              'bg-orange-100 text-orange-800'
                            }>
                              {rdv.statut}
                            </Badge>
                            <Badge variant="outline">{rdv.type_consultation}</Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">Patient: {rdv.created_by}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Stethoscope className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">{pro?.nom_complet || 'Professionnel'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                {format(new Date(rdv.date_rdv), 'dd MMMM yyyy', { locale: fr })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm">
                                {format(new Date(rdv.date_rdv), 'HH:mm')}
                              </span>
                            </div>
                          </div>

                          {rdv.motif && (
                            <p className="text-sm text-gray-600">
                              <strong>Motif:</strong> {rdv.motif}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {rdv.statut !== 'termine' && rdv.statut !== 'annule' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(rdv)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => cancelMutation.mutate(rdv.id)}
                                className="text-red-600"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog Création */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un rendez-vous</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Professionnel</Label>
              <Select
                value={formData.professionnel_id}
                onValueChange={(v) => setFormData({...formData, professionnel_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un professionnel" />
                </SelectTrigger>
                <SelectContent>
                  {professionnels.map(pro => (
                    <SelectItem key={pro.id} value={pro.id}>
                      {pro.nom_complet} - {pro.specialite}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Email patient</Label>
              <Input
                value={formData.patient_email}
                onChange={(e) => setFormData({...formData, patient_email: e.target.value})}
                placeholder="patient@example.com"
              />
            </div>

            <div>
              <Label>Date et heure</Label>
              <Input
                type="datetime-local"
                value={formData.date_rdv}
                onChange={(e) => setFormData({...formData, date_rdv: e.target.value})}
              />
            </div>

            <div>
              <Label>Type de consultation</Label>
              <Select
                value={formData.type_consultation}
                onValueChange={(v) => setFormData({...formData, type_consultation: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cabinet">Cabinet</SelectItem>
                  <SelectItem value="clinique">Clinique</SelectItem>
                  <SelectItem value="hopital">Hôpital</SelectItem>
                  <SelectItem value="visio">Visioconférence</SelectItem>
                  <SelectItem value="telephone">Téléphone</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Motif</Label>
              <Textarea
                value={formData.motif}
                onChange={(e) => setFormData({...formData, motif: e.target.value})}
                placeholder="Motif de consultation..."
              />
            </div>

            <div>
              <Label>Notes professionnel</Label>
              <Textarea
                value={formData.notes_professionnel}
                onChange={(e) => setFormData({...formData, notes_professionnel: e.target.value})}
                placeholder="Notes internes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => createMutation.mutate(formData)}
              disabled={!formData.professionnel_id || !formData.patient_email || !formData.date_rdv}
            >
              Créer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modification */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le rendez-vous</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Date et heure</Label>
              <Input
                type="datetime-local"
                value={formData.date_rdv}
                onChange={(e) => setFormData({...formData, date_rdv: e.target.value})}
              />
            </div>

            <div>
              <Label>Statut</Label>
              <Select
                value={formData.statut}
                onValueChange={(v) => setFormData({...formData, statut: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planifie">Planifié</SelectItem>
                  <SelectItem value="confirme">Confirmé</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="termine">Terminé</SelectItem>
                  <SelectItem value="annule">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Motif</Label>
              <Textarea
                value={formData.motif}
                onChange={(e) => setFormData({...formData, motif: e.target.value})}
              />
            </div>

            <div>
              <Label>Notes professionnel</Label>
              <Textarea
                value={formData.notes_professionnel}
                onChange={(e) => setFormData({...formData, notes_professionnel: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={() => updateMutation.mutate({ id: selectedRdv.id, data: formData })}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}