import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, User, Clock, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function RecommandationsPatientsIA({ professionnelId, specialite, contextConsultation }) {
  const { data: mesPatients = [] } = useQuery({
    queryKey: ['mes_patients', professionnelId],
    queryFn: async () => {
      const suivis = await base44.entities.SuiviGrossesse.filter({
        professionnels_suivi: { $in: [professionnelId] }
      });
      const suivisPP = await base44.entities.SuiviPostPartum.filter({
        professionnels_suivi: { $in: [professionnelId] }
      });
      return [...suivis, ...suivisPP];
    },
    enabled: !!professionnelId
  });

  const { data: recommandations, isLoading } = useQuery({
    queryKey: ['recommandations_patients_ia', professionnelId, specialite, contextConsultation],
    queryFn: async () => {
      if (!professionnelId) return [];

      const contexte = {
        specialite,
        nombre_patients: mesPatients.length,
        context_consultation: contextConsultation || 'suivi_general',
        patients: mesPatients.slice(0, 20).map(p => ({
          email: p.created_by,
          type_suivi: p.date_accouchement ? 'post_partum' : 'grossesse',
          semaine: p.semaine_actuelle,
          date_debut: p.date_debut_grossesse || p.date_accouchement,
          statut: p.statut
        }))
      };

      const prompt = `En tant qu'assistant médical IA, analyse ces patients et recommande les 5 dossiers les plus pertinents à consulter maintenant:

Spécialité: ${specialite}
Contexte: ${contextConsultation || 'consultation générale'}
Patients: ${mesPatients.length}

Critères de recommandation:
- Urgence médicale ou suivi critique
- Patients nécessitant une attention immédiate (ex: approche du terme, complications potentielles)
- Patients avec rendez-vous récents ou à venir
- Continuité du suivi pour patients à risque
- Pertinence par rapport à la spécialité et au contexte

Fournis un array JSON de 5 recommandations avec:
- patient_email: email du patient
- raison: explication courte de pourquoi ce patient (max 50 mots)
- priorite: "haute", "moyenne", ou "normale"
- action_suggeree: action recommandée (ex: "Planifier consultation", "Vérifier examens")

Sois précis et orienté vers l'action clinique.`;

      return await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: false,
        response_json_schema: {
          type: 'object',
          properties: {
            recommandations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  patient_email: { type: 'string' },
                  raison: { type: 'string' },
                  priorite: { type: 'string' },
                  action_suggeree: { type: 'string' }
                }
              }
            }
          }
        }
      });
    },
    enabled: mesPatients.length > 0,
    staleTime: 10 * 60 * 1000
  });

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-gray-600">Analyse intelligente des dossiers patients...</p>
        </CardContent>
      </Card>
    );
  }

  if (!recommandations?.recommandations || recommandations.recommandations.length === 0) {
    return null;
  }

  const prioriteColors = {
    haute: 'bg-red-100 text-red-800 border-red-200',
    moyenne: 'bg-orange-100 text-orange-800 border-orange-200',
    normale: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const prioriteIcons = {
    haute: AlertCircle,
    moyenne: Clock,
    normale: TrendingUp
  };

  return (
    <Card className="shadow-lg border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Patients Recommandés par IA
          <Badge className="ml-auto bg-purple-600 text-white">
            {recommandations.recommandations.length} suggestions
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        {recommandations.recommandations.map((reco, idx) => {
          const PrioriteIcon = prioriteIcons[reco.priorite] || User;
          
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border-2 ${prioriteColors[reco.priorite] || 'bg-gray-50 border-gray-200'} hover:shadow-md transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  reco.priorite === 'haute' ? 'bg-red-200' : 
                  reco.priorite === 'moyenne' ? 'bg-orange-200' : 'bg-blue-200'
                }`}>
                  <PrioriteIcon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="font-semibold text-gray-900 truncate">{reco.patient_email}</p>
                    <Badge variant="outline" className="text-xs">
                      Priorité {reco.priorite}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{reco.raison}</p>
                  
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-purple-600" />
                    <p className="text-xs font-medium text-purple-900">
                      Action suggérée: {reco.action_suggeree}
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
                >
                  <Link to={createPageUrl('DossierPatient') + '?email=' + reco.patient_email}>
                    Voir dossier
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}