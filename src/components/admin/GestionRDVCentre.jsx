import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Calendar, CheckCircle, Clock, X, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function GestionRDVCentre({ centreId }) {
  const queryClient = useQueryClient();
  const [filterStatut, setFilterStatut] = useState('planifie');
  const [searchPatient, setSearchPatient] = useState('');

  const { data: rdvs = [], isLoading } = useQuery({
    queryKey: ['rdvs_centre', centreId, filterStatut],
    queryFn: async () => {
      if (!centreId) return [];
      const query = { centre_id: centreId };
      if (filterStatut !== 'tous') query.statut = filterStatut;
      return await base44.entities.RendezVousAdministratif.filter(query, '-date_rdv');
    },
    enabled: !!centreId
  });

  const updateRDVMutation = useMutation({
    mutationFn: (data) => base44.entities.RendezVousAdministratif.update(data.id, {
      statut: data.statut,
      notes_professionnel: data.notes
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rdvs_centre'] })
  });

  const filteredRDVs = rdvs.filter(r =>
    r.patient_nom.toLowerCase().includes(searchPatient.toLowerCase()) ||
    r.patient_email.toLowerCase().includes(searchPatient.toLowerCase())
  );

  const getStatutColor = (statut) => {
    const colors = {
      planifie: 'bg-blue-100 text-blue-800',
      confirme: 'bg-green-100 text-green-800',
      en_cours: 'bg-purple-100 text-purple-800',
      termine: 'bg-gray-100 text-gray-800',
      annule: 'bg-red-100 text-red-800',
      no_show: 'bg-orange-100 text-orange-800'
    };
    return colors[statut] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6" />
          Gestion des Rendez-vous
        </h2>
        <Badge variant="outline">{filteredRDVs.length} RDV</Badge>
      </div>

      {/* Recherche */}
      <Card className="shadow-lg border-none">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              placeholder="Chercher patient par nom ou email..."
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              className="flex-1"
            />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="tous">Tous les statuts</option>
              <option value="planifie">Planifiés</option>
              <option value="confirme">Confirmés</option>
              <option value="termine">Terminés</option>
              <option value="annule">Annulés</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Liste RDV */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : filteredRDVs.length === 0 ? (
        <Card className="shadow-lg border-none">
          <CardContent className="py-12 text-center text-gray-600">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p>Aucun rendez-vous trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRDVs.map(rdv => (
            <Card key={rdv.id} className="shadow-md border-none hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{rdv.patient_nom}</p>
                        <p className="text-sm text-gray-600">{rdv.type_consultation.replace(/_/g, ' ')}</p>
                      </div>
                      <Badge className={getStatutColor(rdv.statut)}>{rdv.statut}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {format(new Date(rdv.date_rdv), 'dd MMM HH:mm', { locale: fr })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {rdv.patient_email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {rdv.patient_telephone || 'N/A'}
                      </div>
                      {rdv.professionnel_nom && (
                        <div className="text-gray-700 font-medium">Dr. {rdv.professionnel_nom}</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap md:flex-nowrap">
                    {rdv.statut !== 'termine' && rdv.statut !== 'annule' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => updateRDVMutation.mutate({ id: rdv.id, statut: 'confirme' })}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={updateRDVMutation.isPending}
                        >
                          {updateRDVMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => updateRDVMutation.mutate({ id: rdv.id, statut: 'annule' })}
                          variant="outline"
                          className="text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}