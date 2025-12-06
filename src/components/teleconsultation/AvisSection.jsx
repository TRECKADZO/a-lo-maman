import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Star, 
  ThumbsUp, 
  MessageSquare, 
  CheckCircle,
  AlertCircle,
  User,
  Award,
  Plus,
  X,
  Send,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const POINTS_FORTS = [
  "Très à l'écoute",
  "Explications claires",
  "Professionnel compétent",
  "Ponctuel",
  "Bienveillant",
  "Pédagogue",
  "Rassurant",
  "Expérimenté",
  "Disponible",
  "Cadre agréable"
];

export default function AvisSection({ professionnelId, currentUserEmail }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    note_globale: 0,
    note_competence: 0,
    note_ecoute: 0,
    note_ponctualite: 0,
    note_qualite_soins: 0,
    commentaire: '',
    points_forts: [],
    recommande: true,
    anonyme: false,
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilPro } = useQuery({
    queryKey: ['profil_professionnel_avis', professionnelId],
    queryFn: () => base44.entities.Professionnel.get(professionnelId),
    enabled: !!professionnelId,
  });

  const { data: avis = [], isLoading: loadingAvis } = useQuery({
    queryKey: ['avis_professionnel', professionnelId],
    queryFn: async () => {
      const allAvis = await base44.entities.AvisProfessionnel.filter(
        { professionnel_id: professionnelId, modere: false },
        '-created_date'
      );
      return allAvis;
    },
    enabled: !!professionnelId,
  });

  // Vérifier si l'utilisateur a un RDV terminé avec ce professionnel
  const { data: peutCommenter } = useQuery({
    queryKey: ['peut_commenter', professionnelId, currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail || !professionnelId) return false;
      const rdvs = await base44.entities.RendezVous.filter({
        professionnel_id: professionnelId,
        created_by: currentUserEmail,
        statut: 'termine'
      });
      
      if (rdvs.length === 0) return false;

      // Vérifier si l'utilisateur a déjà laissé un avis pour un de ces RDV
      const avisExistants = await base44.entities.AvisProfessionnel.filter({
        professionnel_id: professionnelId,
        patient_email: currentUserEmail
      });

      const rdvAvecAvis = avisExistants.map(a => a.rendez_vous_id);
      const rdvSansAvis = rdvs.filter(r => !rdvAvecAvis.includes(r.id));

      return rdvSansAvis.length > 0 ? rdvSansAvis[0] : false;
    },
    enabled: !!currentUserEmail && !!professionnelId,
  });

  const ajouterAvisMutation = useMutation({
    mutationFn: async (data) => {
      if (!peutCommenter || !peutCommenter.id) {
        throw new Error("Vous devez avoir un rendez-vous terminé pour laisser un avis");
      }

      const avisData = {
        ...data,
        professionnel_id: professionnelId,
        patient_email: user.email,
        patient_nom: data.anonyme ? "Anonyme" : user.full_name,
        rendez_vous_id: peutCommenter.id,
        verifie: true,
      };

      await base44.entities.AvisProfessionnel.create(avisData);

      // Mettre à jour les statistiques du professionnel
      const nouvelleNote = calculateNewAverage(avis, data.note_globale);
      await base44.entities.Professionnel.update(professionnelId, {
        note_moyenne: nouvelleNote,
        nombre_avis: (profilPro?.nombre_avis || 0) + 1
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avis_professionnel'] });
      queryClient.invalidateQueries({ queryKey: ['profil_professionnel_avis'] });
      queryClient.invalidateQueries({ queryKey: ['peut_commenter'] });
      queryClient.invalidateQueries({ queryKey: ['professionnels'] });
      setShowForm(false);
      setFormData({
        note_globale: 0,
        note_competence: 0,
        note_ecoute: 0,
        note_ponctualite: 0,
        note_qualite_soins: 0,
        commentaire: '',
        points_forts: [],
        recommande: true,
        anonyme: false,
      });
      alert('✅ Votre avis a été publié avec succès !');
    },
    onError: (error) => {
      alert(`❌ ${error.message}`);
    }
  });

  const calculateNewAverage = (existingAvis, newNote) => {
    const totalNotes = existingAvis.reduce((sum, a) => sum + a.note_globale, 0) + newNote;
    return (totalNotes / (existingAvis.length + 1)).toFixed(1);
  };

  const togglePointFort = (point) => {
    if (formData.points_forts.includes(point)) {
      setFormData({
        ...formData,
        points_forts: formData.points_forts.filter(p => p !== point)
      });
    } else {
      setFormData({
        ...formData,
        points_forts: [...formData.points_forts, point]
      });
    }
  };

  const renderStars = (note, onSelect = null) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= note
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${onSelect ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => onSelect && onSelect(star)}
          />
        ))}
      </div>
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.note_globale === 0) {
      alert('Veuillez donner une note globale');
      return;
    }
    ajouterAvisMutation.mutate(formData);
  };

  // Statistiques des avis
  const stats = {
    moyenne: profilPro?.note_moyenne || 0,
    total: avis.length,
    recommandations: avis.filter(a => a.recommande).length,
    distribution: {
      5: avis.filter(a => a.note_globale === 5).length,
      4: avis.filter(a => a.note_globale === 4).length,
      3: avis.filter(a => a.note_globale === 3).length,
      2: avis.filter(a => a.note_globale === 2).length,
      1: avis.filter(a => a.note_globale === 1).length,
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <Card className="shadow-lg border-none bg-gradient-to-br from-yellow-50 to-amber-50">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Note moyenne */}
            <div className="text-center">
              <p className="text-5xl font-bold text-gray-900">{stats.moyenne}</p>
              <div className="flex justify-center my-2">
                {renderStars(Math.round(stats.moyenne))}
              </div>
              <p className="text-sm text-gray-600">
                {stats.total} avis vérifiés
              </p>
            </div>

            {/* Distribution des notes */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((note) => (
                <div key={note} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-6">{note}★</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{
                        width: `${stats.total > 0 ? (stats.distribution[note] / stats.total) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">
                    {stats.distribution[note]}
                  </span>
                </div>
              ))}
            </div>

            {/* Recommandations */}
            <div className="flex flex-col items-center justify-center">
              <ThumbsUp className="w-12 h-12 text-green-600 mb-2" />
              <p className="text-3xl font-bold text-gray-900">
                {stats.total > 0 ? Math.round((stats.recommandations / stats.total) * 100) : 0}%
              </p>
              <p className="text-sm text-gray-600">des patients recommandent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bouton pour ajouter un avis */}
      {peutCommenter && !showForm && (
        <Button
          onClick={() => setShowForm(true)}
          className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Laisser un avis
        </Button>
      )}

      {!peutCommenter && currentUserEmail && !showForm && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Vous pourrez laisser un avis après avoir eu un rendez-vous avec ce professionnel.
          </AlertDescription>
        </Alert>
      )}

      {/* Formulaire d'ajout d'avis */}
      {showForm && (
        <Card className="shadow-xl border-2 border-yellow-400">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-yellow-600" />
                Votre avis compte !
              </span>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Note globale */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold mb-2">Note globale *</p>
                {renderStars(formData.note_globale, (note) => setFormData({ ...formData, note_globale: note }))}
              </div>

              {/* Notes détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Compétence professionnelle</p>
                  {renderStars(formData.note_competence, (note) => setFormData({ ...formData, note_competence: note }))}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Qualité d'écoute</p>
                  {renderStars(formData.note_ecoute, (note) => setFormData({ ...formData, note_ecoute: note }))}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Ponctualité</p>
                  {renderStars(formData.note_ponctualite, (note) => setFormData({ ...formData, note_ponctualite: note }))}
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Qualité des soins</p>
                  {renderStars(formData.note_qualite_soins, (note) => setFormData({ ...formData, note_qualite_soins: note }))}
                </div>
              </div>

              {/* Points forts */}
              <div>
                <p className="font-semibold mb-3">Points forts (optionnel)</p>
                <div className="flex flex-wrap gap-2">
                  {POINTS_FORTS.map((point) => (
                    <Badge
                      key={point}
                      variant="outline"
                      className={`cursor-pointer transition-all ${
                        formData.points_forts.includes(point)
                          ? 'bg-yellow-100 border-yellow-400 text-yellow-800'
                          : 'hover:bg-gray-100'
                      }`}
                      onClick={() => togglePointFort(point)}
                    >
                      {formData.points_forts.includes(point) && (
                        <CheckCircle className="w-3 h-3 mr-1" />
                      )}
                      {point}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <p className="font-semibold mb-2">Votre commentaire (optionnel)</p>
                <Textarea
                  value={formData.commentaire}
                  onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
                  placeholder="Partagez votre expérience avec ce professionnel..."
                  rows={4}
                />
              </div>

              {/* Options */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="recommande"
                    checked={formData.recommande}
                    onChange={(e) => setFormData({ ...formData, recommande: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="recommande" className="text-sm font-medium cursor-pointer">
                    Je recommande ce professionnel
                  </label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="anonyme"
                    checked={formData.anonyme}
                    onChange={(e) => setFormData({ ...formData, anonyme: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="anonyme" className="text-sm font-medium cursor-pointer">
                    Publier en mode anonyme
                  </label>
                </div>
              </div>

              {/* Boutons */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={ajouterAvisMutation.isPending || formData.note_globale === 0}
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
                >
                  {ajouterAvisMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publication...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Publier mon avis
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des avis */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          Avis des patients ({avis.length})
        </h3>

        {loadingAvis ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : avis.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun avis pour le moment</p>
              <p className="text-sm mt-1">Soyez le premier à partager votre expérience !</p>
            </CardContent>
          </Card>
        ) : (
          avis.map((avis) => (
            <Card key={avis.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{avis.patient_nom}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(avis.created_date), 'dd MMMM yyyy', { locale: fr })}
                      </p>
                      {avis.verifie && (
                        <Badge className="mt-1 bg-green-100 text-green-800 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Avis vérifié
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStars(avis.note_globale)}
                    <p className="text-xs text-gray-500 mt-1">
                      Note: {avis.note_globale}/5
                    </p>
                  </div>
                </div>

                {/* Notes détaillées */}
                {(avis.note_competence || avis.note_ecoute || avis.note_ponctualite || avis.note_qualite_soins) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    {avis.note_competence > 0 && (
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Compétence</p>
                        <p className="font-bold text-sm">{avis.note_competence}/5</p>
                      </div>
                    )}
                    {avis.note_ecoute > 0 && (
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Écoute</p>
                        <p className="font-bold text-sm">{avis.note_ecoute}/5</p>
                      </div>
                    )}
                    {avis.note_ponctualite > 0 && (
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Ponctualité</p>
                        <p className="font-bold text-sm">{avis.note_ponctualite}/5</p>
                      </div>
                    )}
                    {avis.note_qualite_soins > 0 && (
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Qualité soins</p>
                        <p className="font-bold text-sm">{avis.note_qualite_soins}/5</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Points forts */}
                {avis.points_forts && avis.points_forts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {avis.points_forts.map((point, index) => (
                      <Badge key={index} className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Award className="w-3 h-3 mr-1" />
                        {point}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Commentaire */}
                {avis.commentaire && (
                  <p className="text-gray-700 leading-relaxed mb-3">
                    "{avis.commentaire}"
                  </p>
                )}

                {/* Recommandation */}
                {avis.recommande && (
                  <div className="flex items-center gap-2 text-green-700">
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm font-medium">Recommande ce professionnel</span>
                  </div>
                )}

                {/* Réponse du professionnel */}
                {avis.reponse_professionnel && (
                  <div className="mt-4 p-4 bg-teal-50 border-l-4 border-teal-500 rounded">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Award className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-teal-900 text-sm mb-1">
                          Réponse du professionnel
                        </p>
                        <p className="text-sm text-teal-800">{avis.reponse_professionnel}</p>
                        <p className="text-xs text-teal-600 mt-2">
                          {format(new Date(avis.date_reponse), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}