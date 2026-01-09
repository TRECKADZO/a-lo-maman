import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, Bell, History, Plus, AlertCircle, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import AjouterNoteEvolution from './AjouterNoteEvolution';
import CreerRappelSuivi from './CreerRappelSuivi';

export default function SuiviPatientComplet({ patientEmail, patientNom }) {
  const queryClient = useQueryClient();
  const [showAjouterNote, setShowAjouterNote] = useState(false);
  const [showCreerRappel, setShowCreerRappel] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: profil } = useQuery({
    queryKey: ['profil_pro', user?.email],
    queryFn: async () => {
      const pros = await base44.entities.Professionnel.filter({ email: user.email });
      return pros[0];
    },
    enabled: !!user
  });

  // Notes d'évolution
  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['notes_evolution', patientEmail],
    queryFn: () => base44.entities.NoteEvolutionPatient.filter({ patient_email: patientEmail }, '-created_date'),
    enabled: !!patientEmail
  });

  // Rappels de suivi
  const { data: rappels = [], isLoading: rappelsLoading } = useQuery({
    queryKey: ['rappels_suivi', patientEmail],
    queryFn: () => base44.entities.RappelSuiviPersonnalise.filter({ patient_email: patientEmail }, 'date_prevue'),
    enabled: !!patientEmail
  });

  // Historique consultations (RDV)
  const { data: consultations = [], isLoading: consultationsLoading } = useQuery({
    queryKey: ['historique_consultations', patientEmail],
    queryFn: () => base44.entities.RendezVous.filter({ 
      created_by: patientEmail,
      statut: 'termine'
    }, '-date_rdv'),
    enabled: !!patientEmail
  });

  const marquerRappelEffectueMutation = useMutation({
    mutationFn: (rappelId) => base44.entities.RappelSuiviPersonnalise.update(rappelId, { statut: 'effectue' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rappels_suivi'] })
  });

  const getPrioriteColor = (priorite) => {
    const colors = {
      basse: 'bg-gray-100 text-gray-800',
      normale: 'bg-blue-100 text-blue-800',
      haute: 'bg-orange-100 text-orange-800',
      urgente: 'bg-red-100 text-red-800'
    };
    return colors[priorite] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-none bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">{patientNom}</h3>
                <p className="text-sm text-gray-600">{patientEmail}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowAjouterNote(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Note</span>
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowCreerRappel(true)}>
                <Bell className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Rappel</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notes">
            <FileText className="w-4 h-4 mr-2" />
            Notes ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="rappels">
            <Bell className="w-4 h-4 mr-2" />
            Rappels ({rappels.filter(r => r.statut === 'actif').length})
          </TabsTrigger>
          <TabsTrigger value="historique">
            <History className="w-4 h-4 mr-2" />
            Historique ({consultations.length})
          </TabsTrigger>
        </TabsList>

        {/* Notes d'évolution */}
        <TabsContent value="notes" className="space-y-3">
          {notesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : notes.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="py-12 text-center text-gray-600">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Aucune note d'évolution</p>
              </CardContent>
            </Card>
          ) : (
            notes.map(note => (
              <Card key={note.id} className="shadow-md border-none">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getPrioriteColor(note.priorite)}>{note.type_note}</Badge>
                        {note.priorite !== 'normale' && (
                          <Badge variant="outline" className="text-orange-700">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            {note.priorite}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{note.contenu}</p>
                    </div>
                  </div>
                  
                  {note.symptomes_observes?.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs font-medium text-blue-900 mb-1">Symptômes observés:</p>
                      <p className="text-xs text-blue-800">{note.symptomes_observes.join(', ')}</p>
                    </div>
                  )}
                  
                  {note.traitement_prescrit && (
                    <div className="mt-2 p-2 bg-green-50 rounded-lg">
                      <p className="text-xs font-medium text-green-900 mb-1">Traitement:</p>
                      <p className="text-xs text-green-800">{note.traitement_prescrit}</p>
                    </div>
                  )}
                  
                  {note.prochaine_etape && (
                    <div className="mt-2 p-2 bg-purple-50 rounded-lg">
                      <p className="text-xs font-medium text-purple-900 mb-1">Prochaine étape:</p>
                      <p className="text-xs text-purple-800">{note.prochaine_etape}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500">
                      Dr. {note.professionnel_nom} • {format(new Date(note.created_date), 'dd MMM yyyy à HH:mm', { locale: fr })}
                    </p>
                    {!note.visible_patient && (
                      <Badge variant="outline" className="text-xs">Privé</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Rappels de suivi */}
        <TabsContent value="rappels" className="space-y-3">
          {rappelsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : rappels.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="py-12 text-center text-gray-600">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Aucun rappel programmé</p>
              </CardContent>
            </Card>
          ) : (
            rappels.map(rappel => (
              <Card key={rappel.id} className={`shadow-md border-none ${rappel.statut !== 'actif' ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900">{rappel.titre}</h4>
                        <Badge className={getPrioriteColor(rappel.priorite)}>{rappel.priorite}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{rappel.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>{format(new Date(rappel.date_prevue), 'dd MMMM yyyy', { locale: fr })}</span>
                        <span>•</span>
                        <span className={`font-medium ${rappel.statut === 'actif' ? 'text-blue-600' : 'text-gray-500'}`}>
                          {rappel.statut}
                        </span>
                      </div>
                    </div>
                    {rappel.statut === 'actif' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => marquerRappelEffectueMutation.mutate(rappel.id)}
                        disabled={marquerRappelEffectueMutation.isPending}
                      >
                        Effectué
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Historique consultations */}
        <TabsContent value="historique" className="space-y-3">
          {consultationsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : consultations.length === 0 ? (
            <Card className="shadow-lg">
              <CardContent className="py-12 text-center text-gray-600">
                <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Aucune consultation terminée</p>
              </CardContent>
            </Card>
          ) : (
            consultations.map(consultation => (
              <Card key={consultation.id} className="shadow-md border-none">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-bold text-gray-900">{consultation.type_consultation?.replace(/_/g, ' ')}</h4>
                      <p className="text-sm text-gray-600">{format(new Date(consultation.date_rdv), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Terminée</Badge>
                  </div>
                  {consultation.notes_consultation && (
                    <p className="text-sm text-gray-700 mt-2 p-2 bg-gray-50 rounded-lg">{consultation.notes_consultation}</p>
                  )}
                  {consultation.professionnel_id && (
                    <p className="text-xs text-gray-500 mt-2">Dr. {consultation.professionnel_nom || 'N/A'}</p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {showAjouterNote && (
        <AjouterNoteEvolution
          patientEmail={patientEmail}
          patientNom={patientNom}
          professionnelId={profil?.id}
          professionnelNom={profil?.nom_complet}
          onClose={() => setShowAjouterNote(false)}
        />
      )}

      {showCreerRappel && (
        <CreerRappelSuivi
          patientEmail={patientEmail}
          patientNom={patientNom}
          professionnelId={profil?.id}
          professionnelNom={profil?.nom_complet}
          onClose={() => setShowCreerRappel(false)}
        />
      )}
    </div>
  );
}