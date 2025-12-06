import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Users,
  Clock,
  Video,
  AlertCircle,
  Info,
  Loader2,
  UserCheck,
  Timer,
  Thermometer,
  Activity,
  MessageSquare
} from 'lucide-react';

/**
 * Salle d'attente virtuelle pour les patients
 * Affiche la position dans la file et le temps d'attente estimé
 */
export default function VirtualWaitingRoom({ rendezVous, onCallReady }) {
  const queryClient = useQueryClient();
  const [position, setPosition] = useState(null);
  const [tempsAttente, setTempsAttente] = useState(0);
  const [urgence, setUrgence] = useState('normale');
  const [symptomes, setSymptomes] = useState([]);
  const [nouveauSymptome, setNouveauSymptome] = useState('');
  const [temperature, setTemperature] = useState('');
  const [notesPatient, setNotesPatient] = useState('');
  const [isInQueue, setIsInQueue] = useState(false);
  const [callStatus, setCallStatus] = useState('waiting'); // waiting, ready, in_progress

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: fileEntry, isLoading } = useQuery({
    queryKey: ['file_attente_entry', rendezVous?.id, user?.email],
    queryFn: async () => {
      if (!rendezVous || !user) return null;
      
      const entries = await base44.entities.FileAttente.filter({
        rendez_vous_id: rendezVous.id,
        patient_email: user.email
      });
      
      return entries[0] || null;
    },
    enabled: !!rendezVous && !!user,
    refetchInterval: 5000 // Rafraîchir toutes les 5 secondes
  });

  const { data: fileAttente = [] } = useQuery({
    queryKey: ['file_attente_all', rendezVous?.professionnel_id],
    queryFn: async () => {
      if (!rendezVous) return [];
      
      const entries = await base44.entities.FileAttente.filter({
        professionnel_id: rendezVous.professionnel_id,
        statut: { $in: ['en_attente', 'en_consultation'] }
      }, 'heure_arrivee');
      
      return entries;
    },
    enabled: !!rendezVous,
    refetchInterval: 5000
  });

  // Calculer la position et le temps d'attente
  useEffect(() => {
    if (fileEntry && fileAttente.length > 0) {
      setIsInQueue(true);
      
      // Calculer position
      const enAttente = fileAttente.filter(e => e.statut === 'en_attente');
      const myPosition = enAttente.findIndex(e => e.id === fileEntry.id) + 1;
      setPosition(myPosition);
      
      // Calculer temps d'attente estimé (15 min par patient)
      const estimate = myPosition * 15;
      setTempsAttente(estimate);
      
      // Vérifier si c'est notre tour
      if (fileEntry.statut === 'en_consultation') {
        setCallStatus('ready');
      }
    }
  }, [fileEntry, fileAttente]);

  const rejoindreFileMutation = useMutation({
    mutationFn: async () => {
      if (!rendezVous || !user) return;
      
      await base44.entities.FileAttente.create({
        rendez_vous_id: rendezVous.id,
        professionnel_id: rendezVous.professionnel_id,
        patient_email: user.email,
        patient_nom: user.full_name,
        type_consultation: rendezVous.type_consultation,
        motif: rendezVous.motif,
        urgence,
        symptomes,
        temperature: temperature || null,
        notes_patient: notesPatient,
        statut: 'en_attente',
        heure_arrivee: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file_attente_entry'] });
      setIsInQueue(true);
    }
  });

  const quitterFileMutation = useMutation({
    mutationFn: async () => {
      if (!fileEntry) return;
      
      await base44.entities.FileAttente.update(fileEntry.id, {
        statut: 'annule'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file_attente_entry'] });
      setIsInQueue(false);
    }
  });

  const ajouterSymptome = () => {
    if (nouveauSymptome.trim() && !symptomes.includes(nouveauSymptome.trim())) {
      setSymptomes([...symptomes, nouveauSymptome.trim()]);
      setNouveauSymptome('');
    }
  };

  const supprimerSymptome = (symptome) => {
    setSymptomes(symptomes.filter(s => s !== symptome));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  // Afficher la salle d'attente si déjà en file
  if (isInQueue && fileEntry) {
    return (
      <div className="space-y-6">
        {callStatus === 'ready' ? (
          // C'est votre tour !
          <Card className="border-l-4 border-l-green-500 shadow-xl bg-gradient-to-r from-green-50 to-emerald-50">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <UserCheck className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                C'est votre tour !
              </h2>
              <p className="text-gray-600 mb-6">
                Le professionnel est prêt à vous recevoir en téléconsultation
              </p>
              <Button
                onClick={onCallReady}
                size="lg"
                className="bg-green-600 hover:bg-green-700 px-8"
              >
                <Video className="w-5 h-5 mr-2" />
                Démarrer la consultation
              </Button>
            </CardContent>
          </Card>
        ) : (
          // En attente
          <div className="space-y-4">
            <Card className="border-l-4 border-l-blue-500 shadow-xl bg-gradient-to-r from-blue-50 to-cyan-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-6 h-6 text-blue-600" />
                    Vous êtes en salle d'attente
                  </CardTitle>
                  <Badge className="bg-blue-600 text-white text-lg px-4 py-2">
                    Position: {position}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stats d'attente */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Votre position</p>
                        <p className="text-2xl font-bold text-blue-600">{position}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Timer className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Temps estimé</p>
                        <p className="text-2xl font-bold text-purple-600">~{tempsAttente} min</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Activity className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Statut</p>
                        <p className="text-lg font-bold text-green-600">En attente</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations soumises */}
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-3">Informations transmises au spécialiste</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600">Urgence</p>
                      <Badge className={
                        fileEntry.urgence === 'urgente' ? 'bg-red-100 text-red-800' :
                        fileEntry.urgence === 'moderee' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {fileEntry.urgence === 'urgente' ? 'Urgente' :
                         fileEntry.urgence === 'moderee' ? 'Modérée' :
                         'Normale'}
                      </Badge>
                    </div>

                    {fileEntry.symptomes && fileEntry.symptomes.length > 0 && (
                      <div>
                        <p className="text-gray-600 mb-1">Symptômes</p>
                        <div className="flex flex-wrap gap-2">
                          {fileEntry.symptomes.map((symptome, i) => (
                            <Badge key={i} variant="outline">{symptome}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {fileEntry.temperature && (
                      <div>
                        <p className="text-gray-600">Température</p>
                        <p className="font-semibold text-gray-900">{fileEntry.temperature}°C</p>
                      </div>
                    )}

                    {fileEntry.notes_patient && (
                      <div>
                        <p className="text-gray-600">Notes</p>
                        <p className="text-gray-900">{fileEntry.notes_patient}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Conseils */}
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="w-4 h-4 text-blue-600" />
                  <AlertDescription className="text-blue-900">
                    <strong>Préparez-vous pour la consultation :</strong>
                    <ul className="mt-2 space-y-1 text-sm">
                      <li>• Testez votre caméra et microphone</li>
                      <li>• Préparez vos questions et documents</li>
                      <li>• Assurez-vous d'être dans un endroit calme</li>
                      <li>• Vous recevrez une notification quand ce sera votre tour</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    onClick={() => quitterFileMutation.mutate()}
                    disabled={quitterFileMutation.isPending}
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                  >
                    {quitterFileMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Quitter la file d\'attente'
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

  // Formulaire pour rejoindre la file
  return (
    <Card className="shadow-xl border-none">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-6 h-6 text-teal-600" />
          Rejoindre la salle d'attente virtuelle
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Remplissez ces informations pour que le spécialiste puisse mieux vous prendre en charge
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Niveau d'urgence */}
        <div className="space-y-2">
          <Label>Niveau d'urgence *</Label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'normale', label: 'Normale', color: 'border-blue-300 bg-blue-50 text-blue-800' },
              { value: 'moderee', label: 'Modérée', color: 'border-orange-300 bg-orange-50 text-orange-800' },
              { value: 'urgente', label: 'Urgente', color: 'border-red-300 bg-red-50 text-red-800' }
            ].map(({ value, label, color }) => (
              <button
                key={value}
                type="button"
                onClick={() => setUrgence(value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  urgence === value ? color : 'border-gray-200 bg-white text-gray-700'
                }`}
              >
                <p className="font-semibold">{label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Température */}
        <div className="space-y-2">
          <Label htmlFor="temperature">
            <Thermometer className="w-4 h-4 inline mr-1" />
            Température (optionnel)
          </Label>
          <div className="flex gap-2 items-center">
            <Input
              id="temperature"
              type="number"
              step="0.1"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              placeholder="37.0"
              className="max-w-32"
            />
            <span className="text-gray-600">°C</span>
          </div>
        </div>

        {/* Symptômes */}
        <div className="space-y-2">
          <Label>Symptômes observés</Label>
          <div className="flex flex-wrap gap-2 min-h-[60px] p-3 border rounded-lg bg-gray-50">
            {symptomes.length === 0 ? (
              <p className="text-sm text-gray-500">Aucun symptôme ajouté</p>
            ) : (
              symptomes.map((symptome) => (
                <Badge key={symptome} className="bg-blue-100 text-blue-800 flex items-center gap-2">
                  {symptome}
                  <button
                    onClick={() => supprimerSymptome(symptome)}
                    className="hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              ))
            )}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Ex: Fièvre, toux, fatigue..."
              value={nouveauSymptome}
              onChange={(e) => setNouveauSymptome(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterSymptome())}
            />
            <Button type="button" onClick={ajouterSymptome} variant="outline">
              Ajouter
            </Button>
          </div>
        </div>

        {/* Notes patient */}
        <div className="space-y-2">
          <Label htmlFor="notes">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Informations complémentaires
          </Label>
          <Textarea
            id="notes"
            value={notesPatient}
            onChange={(e) => setNotesPatient(e.target.value)}
            placeholder="Décrivez vos symptômes, quand ont-ils commencé, ce que vous avez déjà essayé..."
            rows={4}
          />
        </div>

        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>Important :</strong> Ces informations seront partagées avec le spécialiste pour préparer la consultation.
          </AlertDescription>
        </Alert>

        <Button
          onClick={() => rejoindreFileMutation.mutate()}
          disabled={rejoindreFileMutation.isPending}
          className="w-full bg-teal-600 hover:bg-teal-700 h-12"
        >
          {rejoindreFileMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Connexion...
            </>
          ) : (
            <>
              <UserCheck className="w-5 h-5 mr-2" />
              Rejoindre la salle d'attente
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}