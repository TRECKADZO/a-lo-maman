import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Heart, Activity, AlertCircle, X, Loader2, Pill, Hospital, Stethoscope, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CardTransition, ListTransition } from '@/components/ui/page-transition';
import { Touchable } from '@/components/ui/native-interactions';
import { BottomSheet } from '@/components/ui/safe-area-view';

export default function HistoriqueMedical({ enfant, isEditable = false }) {
  const queryClient = useQueryClient();
  const [showAjouter, setShowAjouter] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'maladie',
    nom_maladie: '',
    symptomes: [],
    diagnostic: '',
    severite: 'leger',
    traitement: '',
    medicaments: [],
    professionnel: '',
    date_guerison: '',
    notes: ''
  });

  const [nouveauSymptome, setNouveauSymptome] = useState('');
  const [nouveauMedicament, setNouveauMedicament] = useState({ nom: '', posologie: '', duree: '' });

  const ajouterEventMutation = useMutation({
    mutationFn: async (data) => {
      const historique = enfant.historique_medical || [];
      await base44.entities.EnfantCarnet.update(enfant.id, {
        historique_medical: [...historique, data]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier_enfant', enfant.id] });
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      setShowAjouter(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'maladie',
        nom_maladie: '',
        symptomes: [],
        diagnostic: '',
        severite: 'leger',
        traitement: '',
        medicaments: [],
        professionnel: '',
        date_guerison: '',
        notes: ''
      });
    }
  });

  const { data: profilPro } = useQuery({
    queryKey: ['profil_professionnel_current'],
    queryFn: async () => {
      const user = await base44.auth.me();
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    }
  });

  const ajouterSymptome = () => {
    if (nouveauSymptome.trim()) {
      setFormData({
        ...formData,
        symptomes: [...formData.symptomes, nouveauSymptome.trim()]
      });
      setNouveauSymptome('');
    }
  };

  const supprimerSymptome = (index) => {
    setFormData({
      ...formData,
      symptomes: formData.symptomes.filter((_, i) => i !== index)
    });
  };

  const ajouterMedicament = () => {
    if (nouveauMedicament.nom.trim()) {
      setFormData({
        ...formData,
        medicaments: [...formData.medicaments, nouveauMedicament]
      });
      setNouveauMedicament({ nom: '', posologie: '', duree: '' });
    }
  };

  const supprimerMedicament = (index) => {
    setFormData({
      ...formData,
      medicaments: formData.medicaments.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      professionnel: profilPro?.nom_complet || formData.professionnel
    };
    ajouterEventMutation.mutate(data);
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'maladie': return <Activity className="w-4 h-4 text-red-600" />;
      case 'accident': return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'hospitalisation': return <Heart className="w-4 h-4 text-blue-600" />;
      case 'chirurgie': return <Heart className="w-4 h-4 text-purple-600" />;
      case 'consultation': return <Activity className="w-4 h-4 text-green-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSeveriteColor = (severite) => {
    switch(severite) {
      case 'severe': return 'bg-red-100 text-red-800 border-red-300';
      case 'modere': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'leger': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const eventStats = {
    total: enfant.historique_medical?.length || 0,
    maladies: enfant.historique_medical?.filter(e => e.type === 'maladie').length || 0,
    hospitalisations: enfant.historique_medical?.filter(e => e.type === 'hospitalisation').length || 0,
    chirurgies: enfant.historique_medical?.filter(e => e.type === 'chirurgie').length || 0,
  };

  return (
    <div className="space-y-4">
      {/* Statistiques médicales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CardTransition delay={0.05}>
          <Card className="shadow-lg bg-gradient-to-br from-red-50 to-rose-100 border-none rounded-2xl">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-red-600">{eventStats.total}</p>
              <p className="text-xs text-red-900">Événements</p>
            </CardContent>
          </Card>
        </CardTransition>
        
        <CardTransition delay={0.1}>
          <Card className="shadow-lg bg-gradient-to-br from-orange-50 to-amber-100 border-none rounded-2xl">
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 text-orange-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-orange-600">{eventStats.maladies}</p>
              <p className="text-xs text-orange-900">Maladies</p>
            </CardContent>
          </Card>
        </CardTransition>

        <CardTransition delay={0.15}>
          <Card className="shadow-lg bg-gradient-to-br from-blue-50 to-cyan-100 border-none rounded-2xl">
            <CardContent className="p-4 text-center">
              <Hospital className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{eventStats.hospitalisations}</p>
              <p className="text-xs text-blue-900">Hospitalisations</p>
            </CardContent>
          </Card>
        </CardTransition>

        <CardTransition delay={0.2}>
          <Card className="shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 border-none rounded-2xl">
            <CardContent className="p-4 text-center">
              <Stethoscope className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{eventStats.chirurgies}</p>
              <p className="text-xs text-purple-900">Chirurgies</p>
            </CardContent>
          </Card>
        </CardTransition>
      </div>

      <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              Historique Médical Détaillé
            </CardTitle>
            {isEditable && (
              <Touchable onPress={() => setShowAjouter(true)} haptic>
                <Button className="bg-red-600 hover:bg-red-700 rounded-xl shadow-lg">
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvel événement
                </Button>
              </Touchable>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {enfant.historique_medical && enfant.historique_medical.length > 0 ? (
            <ListTransition staggerDelay={0.05}>
              {enfant.historique_medical.map((event, index) => (
                <div key={index} className="border-l-4 border-l-red-400 pl-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-r-2xl shadow-sm">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(event.type)}
                      <div>
                        <p className="font-semibold text-lg">{event.nom_maladie || event.diagnostic || event.type}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(event.date), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{event.type}</Badge>
                      {event.severite && (
                        <Badge className={getSeveriteColor(event.severite)}>
                          {event.severite}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {event.symptomes && event.symptomes.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-semibold text-gray-700 mb-1">Symptômes:</p>
                      <div className="flex flex-wrap gap-1">
                        {event.symptomes.map((symptome, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {symptome}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.diagnostic && (
                    <p className="text-sm mt-2">
                      <strong>Diagnostic:</strong> {event.diagnostic}
                    </p>
                  )}

                  {event.traitement && (
                    <p className="text-sm mt-1">
                      <strong>Traitement:</strong> {event.traitement}
                    </p>
                  )}

                  {event.medicaments && event.medicaments.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 rounded">
                      <p className="text-xs font-semibold text-blue-900 mb-1 flex items-center gap-1">
                        <Pill className="w-3 h-3" />
                        Médicaments:
                      </p>
                      {event.medicaments.map((med, i) => (
                        <div key={i} className="text-xs text-blue-800 ml-4">
                          • <strong>{med.nom}</strong>
                          {med.posologie && ` - ${med.posologie}`}
                          {med.duree && ` (${med.duree})`}
                        </div>
                      ))}
                    </div>
                  )}

                  {event.professionnel && (
                    <p className="text-xs text-gray-500 mt-2">
                      Suivi par: <strong>{event.professionnel}</strong>
                    </p>
                  )}

                  {event.date_guerison && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Guérison: {format(new Date(event.date_guerison), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  )}

                  {event.notes && (
                    <p className="text-sm text-gray-600 mt-2 italic bg-white p-2 rounded">
                      {event.notes}
                    </p>
                  )}
                </div>
              ))}
            </ListTransition>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">Aucun historique médical enregistré</p>
              {isEditable && (
                <Touchable onPress={() => setShowAjouter(true)} haptic>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter le premier événement
                  </Button>
                </Touchable>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bottom Sheet Mobile pour ajouter */}
      <BottomSheet 
        isOpen={showAjouter} 
        onClose={() => setShowAjouter(false)}
        title="Ajouter un événement médical"
        fullHeight
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Date *</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label>Type d'événement *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="maladie">Maladie</SelectItem>
                        <SelectItem value="accident">Accident</SelectItem>
                        <SelectItem value="hospitalisation">Hospitalisation</SelectItem>
                        <SelectItem value="chirurgie">Chirurgie</SelectItem>
                        <SelectItem value="consultation">Consultation</SelectItem>
                        <SelectItem value="autre">Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Nom de la maladie/condition *</Label>
                  <Input
                    value={formData.nom_maladie}
                    onChange={(e) => setFormData({ ...formData, nom_maladie: e.target.value })}
                    placeholder="Ex: Bronchite aiguë"
                    required
                  />
                </div>

                <div>
                  <Label>Symptômes</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={nouveauSymptome}
                      onChange={(e) => setNouveauSymptome(e.target.value)}
                      placeholder="Ajouter un symptôme"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterSymptome())}
                    />
                    <Button type="button" onClick={ajouterSymptome} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.symptomes.map((symptome, i) => (
                      <Badge key={i} variant="outline" className="flex items-center gap-1">
                        {symptome}
                        <X
                          className="w-3 h-3 cursor-pointer"
                          onClick={() => supprimerSymptome(i)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Diagnostic</Label>
                    <Input
                      value={formData.diagnostic}
                      onChange={(e) => setFormData({ ...formData, diagnostic: e.target.value })}
                      placeholder="Diagnostic médical"
                    />
                  </div>

                  <div>
                    <Label>Sévérité</Label>
                    <Select
                      value={formData.severite}
                      onValueChange={(value) => setFormData({ ...formData, severite: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leger">Léger</SelectItem>
                        <SelectItem value="modere">Modéré</SelectItem>
                        <SelectItem value="severe">Sévère</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Traitement</Label>
                  <Textarea
                    value={formData.traitement}
                    onChange={(e) => setFormData({ ...formData, traitement: e.target.value })}
                    placeholder="Description du traitement..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Médicaments prescrits</Label>
                  <div className="space-y-2 mb-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        value={nouveauMedicament.nom}
                        onChange={(e) => setNouveauMedicament({ ...nouveauMedicament, nom: e.target.value })}
                        placeholder="Nom"
                      />
                      <Input
                        value={nouveauMedicament.posologie}
                        onChange={(e) => setNouveauMedicament({ ...nouveauMedicament, posologie: e.target.value })}
                        placeholder="Posologie"
                      />
                      <div className="flex gap-2">
                        <Input
                          value={nouveauMedicament.duree}
                          onChange={(e) => setNouveauMedicament({ ...nouveauMedicament, duree: e.target.value })}
                          placeholder="Durée"
                        />
                        <Button type="button" onClick={ajouterMedicament} variant="outline">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {formData.medicaments.map((med, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">
                          <strong>{med.nom}</strong> {med.posologie && `- ${med.posologie}`} {med.duree && `(${med.duree})`}
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={() => supprimerMedicament(i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Date de guérison (si applicable)</Label>
                  <Input
                    type="date"
                    value={formData.date_guerison}
                    onChange={(e) => setFormData({ ...formData, date_guerison: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Notes complémentaires</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowAjouter(false)} className="flex-1">
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    disabled={ajouterEventMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {ajouterEventMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      'Enregistrer'
                    )}
                  </Button>
                </div>
              </form>
        </div>
      </BottomSheet>
    </div>
  );
}