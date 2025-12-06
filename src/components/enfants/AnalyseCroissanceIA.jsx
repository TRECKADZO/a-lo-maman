
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
  Baby
} from 'lucide-react';
import { differenceInMonths, differenceInYears } from 'date-fns';

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
      action_page: 'Enfants',
    });
  } catch (error) {
    console.error('Erreur notification alerte santé:', error);
  }
};

export default function AnalyseCroissanceIA({ enfant }) {
  const [insights, setInsights] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const analyserMutation = useMutation({
    mutationFn: async () => {
      // Calculer l'âge
      const moisAge = differenceInMonths(new Date(), new Date(enfant.date_naissance));
      const anneesAge = differenceInYears(new Date(), new Date(enfant.date_naissance));

      // Préparer les données pour l'IA
      const contexte = {
        prenom: enfant.prenom,
        age_mois: moisAge,
        age_annees: anneesAge,
        sexe: enfant.sexe,
        
        // Données de naissance
        poids_naissance: enfant.poids_naissance,
        taille_naissance: enfant.taille_naissance,
        
        // Croissance
        mesures_croissance: (enfant.mesures_croissance || [])
          .map(m => ({
            date: m.date,
            poids: m.poids,
            taille: m.taille,
            perimetre_cranien: m.perimetre_cranien
          })),
        
        // Développement
        jalons_atteints: (enfant.jalons_developpement || [])
          .map(j => ({
            categorie: j.categorie,
            jalon: j.jalon,
            date_atteint: j.date_atteint
          })),
        
        // Vaccinations
        vaccins: (enfant.vaccins || [])
          .map(v => ({
            nom: v.nom_vaccin,
            date: v.date_administration,
            prochain_rappel: v.prochain_rappel
          })),
        
        // Santé
        allergies: enfant.allergies,
        maladies_chroniques: enfant.maladies_chroniques,
        historique_medical: (enfant.historique_medical || [])
          .slice(-5)
          .map(h => ({
            date: h.date,
            type: h.type,
            description: h.description
          }))
      };

      const prompt = `Tu es un assistant médical IA spécialisé en pédiatrie et développement de l'enfant. Analyse les données suivantes d'un enfant et fournis des insights personnalisés.

DONNÉES:
${JSON.stringify(contexte, null, 2)}

STANDARDS DE RÉFÉRENCE (OMS):
- Courbes de croissance selon âge et sexe
- Jalons de développement par âge
- Calendrier vaccinal ivoirien

INSTRUCTIONS:
1. Évalue la croissance (poids, taille, périmètre crânien) par rapport aux courbes OMS
2. Analyse le développement psychomoteur (jalons atteints vs âge)
3. Vérifie le statut vaccinal (vaccins à jour, rappels nécessaires)
4. Identifie les retards de croissance ou développement potentiels
5. Suggère les consultations ou examens nécessaires
6. Détecte les facteurs de risque (allergies, antécédents)

Fournis une réponse structurée en JSON avec:
- "niveau_alerte": "vert" (développement normal), "orange" (surveillance), ou "rouge" (consultation recommandée)
- "resume": bilan général
- "croissance_statut": évaluation de la croissance (normal, ralentissement, accéléré)
- "developpement_statut": évaluation du développement psychomoteur
- "points_positifs": ce qui va bien
- "points_attention": ce qui nécessite attention
- "recommandations": actions concrètes
- "prochains_vaccins": vaccins à prévoir
- "alertes": alertes importantes (si applicable)`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            niveau_alerte: { type: "string", enum: ["vert", "orange", "rouge"] },
            resume: { type: "string" },
            croissance_statut: { type: "string" },
            developpement_statut: { type: "string" },
            points_positifs: { type: "array", items: { type: "string" } },
            points_attention: { type: "array", items: { type: "string" } },
            recommandations: { type: "array", items: { type: "string" } },
            prochains_vaccins: { type: "array", items: { type: "string" } },
            alertes: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Si alertes, envoyer notification
      if (response.alertes && response.alertes.length > 0 && user) {
        await notifyAlerteSante(
          user.email,
          `Alerte santé - ${enfant.prenom}`,
          `Le suivi de ${enfant.prenom} nécessite une attention: ${response.alertes[0]}`,
          response.niveau_alerte === 'rouge' ? 'urgente' : 'haute'
        );
      }

      return response;
    },
    onSuccess: (data) => {
      setInsights(data);
    }
  });

  const niveauAlerteBadge = {
    vert: { label: 'Développement normal', color: 'bg-green-100 text-green-800', icon: CheckCircle },
    orange: { label: 'Surveillance recommandée', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    rouge: { label: 'Consultation recommandée', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            Analyse IA du développement de {enfant.prenom}
          </CardTitle>
          <Button
            onClick={() => analyserMutation.mutate()}
            disabled={analyserMutation.isPending}
            size="sm"
          >
            {analyserMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse...
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
            <Baby className="w-16 h-16 text-blue-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Analyse intelligente du développement
            </h3>
            <p className="text-gray-600 mb-6">
              Notre IA va analyser la croissance, le développement psychomoteur et le statut vaccinal 
              de {enfant.prenom} pour vous donner des insights personnalisés.
            </p>
            <Button
              onClick={() => analyserMutation.mutate()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Lancer l'analyse
            </Button>
          </div>
        )}

        {analyserMutation.isPending && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <p className="text-gray-600">Analyse en cours...</p>
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

            {/* Statuts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Croissance
                </h4>
                <p className="text-blue-800">{insights.croissance_statut}</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Développement
                </h4>
                <p className="text-purple-800">{insights.developpement_statut}</p>
              </div>
            </div>

            {/* Alertes */}
            {insights.alertes && insights.alertes.length > 0 && (
              <Alert className="border-red-500 bg-red-50">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <AlertDescription>
                  <p className="font-semibold text-red-900 mb-2">⚠️ Points d'attention:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {insights.alertes.map((alerte, i) => (
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
                  <AlertTriangle className="w-5 h-5" />
                  Points à surveiller
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

            {/* Prochains vaccins */}
            {insights.prochains_vaccins && insights.prochains_vaccins.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Prochains vaccins
                </h4>
                <ul className="space-y-1">
                  {insights.prochains_vaccins.map((vaccin, i) => (
                    <li key={i} className="text-purple-800">• {vaccin}</li>
                  ))}
                </ul>
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
