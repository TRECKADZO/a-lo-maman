
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  Loader2,
  RefreshCw,
  Calendar
} from 'lucide-react';
import { differenceInWeeks, differenceInDays } from 'date-fns';

// Fonction helper locale pour envoyer notification d'alerte santé
const notifyAlerteSante = async (destinataire, titre, message, priorite = 'haute') => {
  try {
    await base44.entities.Notification.create({
      destinataire_email: destinataire,
      type: 'alerte_sante',
      titre,
      message,
      priorite,
      icone: 'AlertTriangle',
      action_page: 'Grossesse',
    });
  } catch (error) {
    console.error('Erreur notification alerte santé:', error);
  }
};

export default function AnalyseIA({ grossesse }) {
  const [insights, setInsights] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const analyserMutation = useMutation({
    mutationFn: async () => {
      // Calculer les données de contexte
      const ddr = new Date(grossesse.date_derniere_regle);
      const today = new Date();
      const semainesGrossesse = differenceInWeeks(today, ddr);
      const joursDepuisDDR = differenceInDays(today, ddr);
      const trimestre = semainesGrossesse < 14 ? 1 : semainesGrossesse < 28 ? 2 : 3;

      // Préparer les données pour l'IA
      const contexte = {
        semaines_grossesse: semainesGrossesse,
        trimestre: trimestre,
        type_grossesse: grossesse.type_grossesse,
        
        // Poids
        consultations_avec_poids: (grossesse.consultations || [])
          .filter(c => c.poids)
          .map(c => ({ date: c.date, poids: c.poids })),
        
        // Symptômes récents (30 derniers jours)
        symptomes_recents: (grossesse.symptomes_journal || [])
          .filter(s => {
            const diff = differenceInDays(today, new Date(s.date));
            return diff <= 30;
          })
          .map(s => ({ date: s.date, symptomes: s.symptomes, severite: s.severite })),
        
        // Mouvements bébé (7 derniers jours)
        mouvements_recents: (grossesse.mouvements_bebe || [])
          .filter(m => {
            const diff = differenceInDays(today, new Date(m.date));
            return diff <= 7;
          })
          .map(m => ({ date: m.date, nombre: m.nombre_mouvements })),
        
        // Consultations
        nombre_consultations: (grossesse.consultations || []).length,
        derniere_consultation: (grossesse.consultations || [])
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0],
        
        // Examens et échographies
        nombre_echographies: (grossesse.echographies || []).length,
        nombre_examens: (grossesse.examens || []).length,
        
        // Vaccins
        vaccins_recus: (grossesse.vaccins || []).map(v => v.nom_vaccin),
        
        // Antécédents
        antecedents: grossesse.antecedents,
        allergies: grossesse.allergies
      };

      const prompt = `Tu es un assistant médical IA spécialisé en suivi de grossesse. Analyse les données suivantes d'une femme enceinte et fournis des insights personnalisés.

DONNÉES:
${JSON.stringify(contexte, null, 2)}

INSTRUCTIONS:
1. Analyse la prise de poids (normale: 0.5-2kg par mois selon le trimestre)
2. Identifie les symptômes préoccupants nécessitant une consultation
3. Évalue la fréquence des mouvements du bébé (normal: 10+ mouvements en 2h après semaine 28)
4. Vérifie si le suivi médical est adéquat (nombre de consultations, échographies)
5. Suggère les examens ou vaccins à venir
6. Identifie les facteurs de risque potentiels

Fournis une réponse structurée en JSON avec:
- "niveau_alerte": "vert" (tout va bien), "orange" (surveillance), ou "rouge" (consultation urgente)
- "resume": texte court du bilan général
- "points_positifs": liste de ce qui va bien
- "points_attention": liste des éléments nécessitant attention
- "recommandations": liste d'actions concrètes
- "prochaine_etape": prochaine consultation ou examen recommandé
- "alertes_urgentes": liste des symptômes nécessitant consultation immédiate (si applicable)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            niveau_alerte: { type: "string", enum: ["vert", "orange", "rouge"] },
            resume: { type: "string" },
            points_positifs: { type: "array", items: { type: "string" } },
            points_attention: { type: "array", items: { type: "string" } },
            recommandations: { type: "array", items: { type: "string" } },
            prochaine_etape: { type: "string" },
            alertes_urgentes: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Si alertes urgentes, envoyer notification
      if (response.alertes_urgentes && response.alertes_urgentes.length > 0 && user) {
        await notifyAlerteSante(
          user.email,
          'Alerte santé grossesse',
          `Votre suivi de grossesse nécessite une attention: ${response.alertes_urgentes[0]}`,
          'urgente'
        );
      }

      return response;
    },
    onSuccess: (data) => {
      setInsights(data);
    }
  });

  const niveauAlerteBadge = {
    vert: { label: 'Tout va bien', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    orange: { label: 'Surveillance recommandée', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    rouge: { label: 'Consultation urgente', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            Analyse IA de votre grossesse
          </CardTitle>
          <Button
            onClick={() => analyserMutation.mutate()}
            disabled={analyserMutation.isPending}
            size="sm"
          >
            {analyserMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                {insights ? 'Actualiser' : 'Analyser'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!insights && !analyserMutation.isPending && (
          <div className="text-center py-8">
            <Sparkles className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Analyse intelligente de votre grossesse
            </h3>
            <p className="text-gray-600 mb-6">
              Notre IA va analyser vos données de suivi (poids, symptômes, mouvements du bébé) 
              pour vous donner des conseils personnalisés et identifier d'éventuels points d'attention.
            </p>
            <Button
              onClick={() => analyserMutation.mutate()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Lancer l'analyse
            </Button>
          </div>
        )}

        {analyserMutation.isPending && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Analyse de vos données en cours...</p>
            <p className="text-sm text-gray-500 mt-2">Cela peut prendre quelques secondes</p>
          </div>
        )}

        {insights && (
          <div className="space-y-6">
            {/* Niveau d'alerte */}
            <div className="flex items-center justify-center">
              {React.createElement(niveauAlerteBadge[insights.niveau_alerte].icon, {
                className: `w-6 h-6 mr-2 ${
                  insights.niveau_alerte === 'vert' ? 'text-green-600' :
                  insights.niveau_alerte === 'orange' ? 'text-orange-600' :
                  'text-red-600'
                }`
              })}
              <Badge className={`${niveauAlerteBadge[insights.niveau_alerte].color} text-lg px-4 py-2`}>
                {niveauAlerteBadge[insights.niveau_alerte].label}
              </Badge>
            </div>

            {/* Résumé */}
            <Alert className={
              insights.niveau_alerte === 'vert' ? 'border-green-300 bg-green-50' :
              insights.niveau_alerte === 'orange' ? 'border-orange-300 bg-orange-50' :
              'border-red-300 bg-red-50'
            }>
              <AlertDescription className="text-base">
                {insights.resume}
              </AlertDescription>
            </Alert>

            {/* Alertes urgentes */}
            {insights.alertes_urgentes && insights.alertes_urgentes.length > 0 && (
              <Alert className="border-red-500 bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertDescription>
                  <p className="font-semibold text-red-900 mb-2">⚠️ Consultez rapidement un professionnel:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {insights.alertes_urgentes.map((alerte, i) => (
                      <li key={i} className="text-red-800">{alerte}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Points positifs */}
            {insights.points_positifs && insights.points_positifs.length > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Points positifs
                </h4>
                <ul className="space-y-2">
                  {insights.points_positifs.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-green-800">
                      <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Points d'attention */}
            {insights.points_attention && insights.points_attention.length > 0 && (
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Points d'attention
                </h4>
                <ul className="space-y-2">
                  {insights.points_attention.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-orange-800">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommandations */}
            {insights.recommandations && insights.recommandations.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recommandations
                </h4>
                <ul className="space-y-2">
                  {insights.recommandations.map((reco, i) => (
                    <li key={i} className="flex items-start gap-2 text-blue-800">
                      <span className="font-semibold">{i + 1}.</span>
                      <span>{reco}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prochaine étape */}
            {insights.prochaine_etape && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Prochaine étape
                </h4>
                <p className="text-purple-800">{insights.prochaine_etape}</p>
              </div>
            )}

            <div className="text-xs text-gray-500 text-center pt-4 border-t">
              💡 Cette analyse est fournie à titre informatif. 
              Consultez toujours un professionnel de santé pour un avis médical.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
