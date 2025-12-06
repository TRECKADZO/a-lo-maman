import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Star,
  ThumbsUp,
  Send,
  X,
  CheckCircle,
  Heart,
  Loader2,
  MessageSquare,
  Smile,
  Frown,
  Meh
} from 'lucide-react';

const POINTS_EVALUATION = [
  { key: 'qualite_technique', label: 'Qualité audio/vidéo', icon: '📹' },
  { key: 'facilite_utilisation', label: 'Facilité d\'utilisation', icon: '👌' },
  { key: 'qualite_consultation', label: 'Qualité de la consultation', icon: '⚕️' },
  { key: 'professionnalisme', label: 'Professionnalisme', icon: '👔' },
  { key: 'ecoute', label: 'Qualité d\'écoute', icon: '👂' },
  { key: 'clarte_explications', label: 'Clarté des explications', icon: '💡' }
];

const POINTS_FORTS_CONSULTATION = [
  "Consultation complète et détaillée",
  "Bon suivi après la consultation",
  "Réponses à toutes mes questions",
  "Mise en confiance",
  "Recommandations claires",
  "Prise en compte de mon contexte",
  "Prescription adaptée",
  "Disponibilité et réactivité"
];

/**
 * Formulaire de feedback post-consultation
 * Permet au patient d'évaluer la qualité de la téléconsultation
 */
export default function FeedbackConsultation({ rendezVous, onClose, onSubmitSuccess }) {
  const queryClient = useQueryClient();
  const [satisfaction, setSatisfaction] = useState(null); // 'satisfait', 'neutre', 'insatisfait'
  const [formData, setFormData] = useState({
    note_globale: 0,
    notes_detaillees: {
      qualite_technique: 0,
      facilite_utilisation: 0,
      qualite_consultation: 0,
      professionnalisme: 0,
      ecoute: 0,
      clarte_explications: 0
    },
    points_forts: [],
    commentaire: '',
    suggestions_amelioration: '',
    recommande: true
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: profilPro } = useQuery({
    queryKey: ['professionnel_feedback', rendezVous?.professionnel_id],
    queryFn: async () => {
      if (!rendezVous) return null;
      return base44.entities.Professionnel.get(rendezVous.professionnel_id);
    },
    enabled: !!rendezVous
  });

  const envoyerFeedbackMutation = useMutation({
    mutationFn: async () => {
      if (!rendezVous || !user) return;

      // Créer l'avis professionnel
      const avisData = {
        professionnel_id: rendezVous.professionnel_id,
        rendez_vous_id: rendezVous.id,
        patient_email: user.email,
        patient_nom: user.full_name,
        note_globale: formData.note_globale,
        note_competence: formData.notes_detaillees.qualite_consultation,
        note_ecoute: formData.notes_detaillees.ecoute,
        note_ponctualite: 5, // Toujours OK pour téléconsultation
        note_qualite_soins: formData.notes_detaillees.professionnalisme,
        commentaire: formData.commentaire,
        points_forts: formData.points_forts,
        recommande: formData.recommande,
        anonyme: false,
        verifie: true,
        metadata: {
          type_consultation: 'teleconsultation',
          satisfaction_generale: satisfaction,
          notes_techniques: formData.notes_detaillees,
          suggestions: formData.suggestions_amelioration
        }
      };

      await base44.entities.AvisProfessionnel.create(avisData);

      // Mettre à jour les stats du professionnel
      if (profilPro) {
        const avisExistants = await base44.entities.AvisProfessionnel.filter({
          professionnel_id: rendezVous.professionnel_id
        });
        
        const nouvelleNote = (
          avisExistants.reduce((sum, a) => sum + a.note_globale, 0) + formData.note_globale
        ) / (avisExistants.length + 1);

        await base44.entities.Professionnel.update(rendezVous.professionnel_id, {
          note_moyenne: parseFloat(nouvelleNote.toFixed(1)),
          nombre_avis: avisExistants.length + 1
        });
      }

      // Notifier le professionnel
      await base44.entities.Notification.create({
        destinataire_email: profilPro?.email,
        type: 'systeme',
        titre: 'Nouvel avis reçu',
        message: `${user.full_name} a laissé un avis ${formData.note_globale}/5 étoiles sur votre consultation`,
        priorite: 'normale',
        icone: 'Star'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['avis_professionnel'] });
      queryClient.invalidateQueries({ queryKey: ['professionnels'] });
      alert('✅ Merci pour votre retour ! Votre avis a été enregistré.');
      if (onSubmitSuccess) onSubmitSuccess();
      onClose();
    }
  });

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

  const setNoteDetaillee = (key, value) => {
    setFormData({
      ...formData,
      notes_detaillees: {
        ...formData.notes_detaillees,
        [key]: value
      }
    });
  };

  const renderStars = (note, onSelect = null) => {
    return (
      <div className="flex gap-1 justify-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-6 h-6 ${
              star <= note
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${onSelect ? 'cursor-pointer hover:scale-125 transition-transform' : ''}`}
            onClick={() => onSelect && onSelect(star)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-3xl my-8">
        <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-600" />
              Évaluez votre consultation
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Votre avis nous aide à améliorer la qualité de nos services
          </p>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Satisfaction globale */}
          <div className="text-center space-y-4">
            <Label className="text-lg font-semibold">Comment s'est passée votre consultation ?</Label>
            <div className="flex justify-center gap-4">
              {[
                { value: 'satisfait', label: 'Satisfait', icon: Smile, color: 'green' },
                { value: 'neutre', label: 'Neutre', icon: Meh, color: 'yellow' },
                { value: 'insatisfait', label: 'Insatisfait', icon: Frown, color: 'red' }
              ].map(({ value, label, icon: Icon, color }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSatisfaction(value)}
                  className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 transition-all ${
                    satisfaction === value
                      ? `bg-${color}-50 border-${color}-500 shadow-lg scale-105`
                      : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow'
                  }`}
                >
                  <Icon className={`w-12 h-12 ${
                    satisfaction === value ? `text-${color}-600` : 'text-gray-400'
                  }`} />
                  <span className="font-semibold text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Note globale */}
          <div className="p-6 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg">
            <Label className="text-center block mb-3 font-semibold">
              Note globale de la consultation *
            </Label>
            {renderStars(formData.note_globale, (note) => setFormData({ ...formData, note_globale: note }))}
            {formData.note_globale > 0 && (
              <p className="text-center text-sm text-gray-600 mt-2">
                {formData.note_globale}/5 étoiles
              </p>
            )}
          </div>

          {/* Notes détaillées */}
          <div className="space-y-4">
            <Label className="font-semibold">Évaluation détaillée</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {POINTS_EVALUATION.map((point) => (
                <div key={point.key} className="p-4 bg-white border rounded-lg">
                  <p className="text-sm font-medium mb-2 flex items-center gap-2">
                    <span>{point.icon}</span>
                    {point.label}
                  </p>
                  {renderStars(
                    formData.notes_detaillees[point.key],
                    (note) => setNoteDetaillee(point.key, note)
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Points forts */}
          <div className="space-y-3">
            <Label className="font-semibold">Points forts de la consultation</Label>
            <div className="flex flex-wrap gap-2">
              {POINTS_FORTS_CONSULTATION.map((point) => (
                <Badge
                  key={point}
                  variant="outline"
                  className={`cursor-pointer transition-all ${
                    formData.points_forts.includes(point)
                      ? 'bg-green-100 border-green-400 text-green-800'
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
          <div className="space-y-2">
            <Label htmlFor="commentaire">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Votre commentaire
            </Label>
            <Textarea
              id="commentaire"
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              placeholder="Partagez votre expérience avec ce professionnel..."
              rows={4}
            />
          </div>

          {/* Suggestions */}
          <div className="space-y-2">
            <Label htmlFor="suggestions">
              💡 Suggestions d'amélioration (optionnel)
            </Label>
            <Textarea
              id="suggestions"
              value={formData.suggestions_amelioration}
              onChange={(e) => setFormData({ ...formData, suggestions_amelioration: e.target.value })}
              placeholder="Comment pourrions-nous améliorer l'expérience de téléconsultation ?"
              rows={3}
            />
          </div>

          {/* Recommandation */}
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <input
              type="checkbox"
              id="recommande"
              checked={formData.recommande}
              onChange={(e) => setFormData({ ...formData, recommande: e.target.checked })}
              className="w-5 h-5"
            />
            <label htmlFor="recommande" className="font-medium cursor-pointer flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-green-600" />
              Je recommande ce professionnel à d'autres mamans
            </label>
          </div>

          {/* Info */}
          <Alert className="bg-blue-50 border-blue-200">
            <Heart className="w-4 h-4 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>Merci de votre retour !</strong>
              <p className="text-sm mt-1">
                Votre avis aide les autres mamans à choisir le bon professionnel et nous permet d'améliorer constamment nos services.
              </p>
            </AlertDescription>
          </Alert>

          {/* Boutons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Plus tard
            </Button>
            <Button
              onClick={() => envoyerFeedbackMutation.mutate()}
              disabled={formData.note_globale === 0 || envoyerFeedbackMutation.isPending}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700"
            >
              {envoyerFeedbackMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Envoyer mon avis
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}