import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Sparkles, AlertCircle, CheckCircle, TrendingUp, Heart } from 'lucide-react';
import { differenceInWeeks } from 'date-fns';

export default function AnalyseIAGrossesse({ grossesse, profilMaman, userEmail }) {
  const queryClient = useQueryClient();
  const [showDetails, setShowDetails] = useState(false);

  const { data: donneesSuivi = {} } = useQuery({
    queryKey: ['donnees_suivi_grossesse', grossesse?.id],
    queryFn: async () => {
      if (!grossesse?.id) return {};
      
      const [consultations, symptomes, mouvements] = await Promise.all([
        base44.entities.SuiviGrossesse.filter({ id: grossesse.id }),
        base44.entities.SuiviGrossesse.filter({ id: grossesse.id }),
        base44.entities.SuiviGrossesse.filter({ id: grossesse.id })
      ]);

      return {
        consultations: consultations[0]?.consultations || [],
        symptomes: symptomes[0]?.symptomes_journal || [],
        mouvements: mouvements[0]?.mouvements_bebe || []
      };
    },
    enabled: !!grossesse?.id
  });

  const analyseIAMutation = useMutation({
    mutationFn: async () => {
      const semaine = differenceInWeeks(new Date(), new Date(grossesse.date_derniere_regle));
      
      const prompt = `Tu es une sage-femme IA expérimentée. Analyse ces données de grossesse et fournis un rapport concis avec insights et alertes.

DONNÉES DE GROSSESSE:
- Semaine: ${semaine}/40
- Type: ${grossesse.type_grossesse}
- DDR: ${grossesse.date_derniere_regle}
- DPA: ${grossesse.date_accouchement_prevue}

PROFIL MAMAN:
- Âge: ${profilMaman?.date_naissance ? new Date().getFullYear() - new Date(profilMaman.date_naissance).getFullYear() : 'N/A'}
- Groupe sanguin: ${profilMaman?.groupe_sanguin || 'N/A'}
- Allergies: ${profilMaman?.allergies?.join(', ') || 'Aucune'}
- Maladies chroniques: ${profilMaman?.maladies_chroniques?.join(', ') || 'Aucune'}

CONSULTATIONS RÉCENTES (${donneesSuivi.consultations?.slice(-3).length || 0}):
${donneesSuivi.consultations?.slice(-3).map(c => `- ${c.date}: Poids=${c.poids}kg, TA=${c.tension_arterielle}, FCB=${c.frequence_cardiaque_bebe}bpm`).join('\n') || 'Aucune'}

SYMPTÔMES (${donneesSuivi.symptomes?.length || 0} entrées):
${donneesSuivi.symptomes?.slice(-5).map(s => `- ${s.date}: ${s.symptomes?.join(', ')}`).join('\n') || 'Aucun symptôme signalé'}

MOUVEMENTS BÉBÉ (${donneesSuivi.mouvements?.length || 0} entrées):
${donneesSuivi.mouvements?.slice(-3).map(m => `- ${m.date}: ${m.nombre_mouvements} mouvements`).join('\n') || 'Pas de suivi'}

Fournis un JSON avec:
{
  "etat_general": "description courte de l'état global (1-2 lignes)",
  "points_positifs": ["point1", "point2", "point3"],
  "points_attention": ["risque1", "risque2"],
  "alertes": [{"severite": "basse|moyenne|haute", "message": "description", "action": "conseil"}],
  "conseils_ia": ["conseil1", "conseil2", "conseil3"],
  "recommandations_suivi": "recommandations pour le prochain suivi"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            etat_general: { type: 'string' },
            points_positifs: { type: 'array', items: { type: 'string' } },
            points_attention: { type: 'array', items: { type: 'string' } },
            alertes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  severite: { type: 'string' },
                  message: { type: 'string' },
                  action: { type: 'string' }
                }
              }
            },
            conseils_ia: { type: 'array', items: { type: 'string' } },
            recommandations_suivi: { type: 'string' }
          }
        }
      });

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyse_ia_grossesse'] });
    }
  });

  const { data: derniereAnalyse } = useQuery({
    queryKey: ['analyse_ia_grossesse', grossesse?.id],
    queryFn: async () => {
      if (!grossesse?.id) return null;
      const analyses = await base44.entities.AnalyseRisque.filter(
        { grossesse_id: grossesse.id },
        '-created_date',
        1
      );
      return analyses[0];
    },
    enabled: !!grossesse?.id
  });

  if (!grossesse) return null;

  const alertesActuelles = derniereAnalyse?.facteurs_identifie || [];
  const hasHighRisk = alertesActuelles.some(a => a.poids > 0.7);

  return (
    <div className="space-y-4">
      <Card className="shadow-lg border-none bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Analyse IA Grossesse</CardTitle>
              <p className="text-sm text-gray-600">Insights personnalisés avec l'IA</p>
            </div>
          </div>
          <Button
            onClick={() => analyseIAMutation.mutate()}
            disabled={analyseIAMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {analyseIAMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Analyser
              </>
            )}
          </Button>
        </CardHeader>

        {derniereAnalyse && (
          <CardContent className="space-y-4">
            {/* État général */}
            <div className="p-3 bg-white rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-purple-900 mb-2">État général</p>
              <p className="text-sm text-gray-700">{derniereAnalyse.facteurs_identifie?.[0]?.description || 'En cours d\'analyse'}</p>
            </div>

            {/* Alertes */}
            {derniereAnalyse.facteurs_identifie?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Facteurs à surveiller</p>
                {derniereAnalyse.facteurs_identifie.map((facteur, idx) => {
                  const severite = facteur.poids > 0.7 ? 'haute' : facteur.poids > 0.4 ? 'moyenne' : 'basse';
                  return (
                    <Alert
                      key={idx}
                      className={`${
                        severite === 'haute'
                          ? 'bg-red-50 border-red-300'
                          : severite === 'moyenne'
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-blue-50 border-blue-300'
                      }`}
                    >
                      <AlertCircle className={`w-4 h-4 ${
                        severite === 'haute'
                          ? 'text-red-600'
                          : severite === 'moyenne'
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                      }`} />
                      <AlertDescription className={`text-sm ${
                        severite === 'haute'
                          ? 'text-red-800'
                          : severite === 'moyenne'
                          ? 'text-yellow-800'
                          : 'text-blue-800'
                      }`}>
                        {facteur.facteur}
                      </AlertDescription>
                    </Alert>
                  );
                })}
              </div>
            )}

            {/* Recommandations */}
            {derniereAnalyse.recommandations?.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-900 mb-2">Recommandations</p>
                <ul className="text-sm text-green-800 space-y-1">
                  {derniereAnalyse.recommandations.slice(0, 3).map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{rec.action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full"
            >
              {showDetails ? 'Masquer détails' : 'Voir plus de détails'}
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}