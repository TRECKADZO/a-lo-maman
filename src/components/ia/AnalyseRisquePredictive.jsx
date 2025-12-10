import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Brain, CheckCircle, TrendingUp, Activity } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AnalyseRisquePredictive({ grossesse, patient }) {
  const [analysing, setAnalysing] = useState(false);

  const { data: analyses = [] } = useQuery({
    queryKey: ['analyses_risque', grossesse?.id],
    queryFn: async () => {
      if (!grossesse) return [];
      return await base44.entities.AnalyseRisque.filter({
        grossesse_id: grossesse.id
      }, '-date_analyse');
    },
    enabled: !!grossesse,
  });

  const lancerAnalyse = useMutation({
    mutationFn: async (typeAnalyse) => {
      const prompt = `Analyser le risque de ${typeAnalyse} pour une patiente avec les données suivantes:
      
      - Âge: ${calculateAge(patient.date_naissance)} ans
      - Semaine grossesse: ${calculateSemaineGrossesse(grossesse.date_derniere_regle)}
      - Antécédents: ${grossesse.antecedents?.join(', ') || 'Aucun'}
      - Allergies: ${grossesse.allergies?.join(', ') || 'Aucune'}
      - Dernières consultations: ${grossesse.consultations?.slice(-3).map(c => 
        `Tension: ${c.tension_arterielle}, Poids: ${c.poids}kg`
      ).join(' | ') || 'Aucune'}
      
      Fournir:
      1. Score de risque (0-100)
      2. Niveau de risque (faible/modéré/élevé/critique)
      3. Facteurs de risque identifiés avec leur poids
      4. Recommandations cliniques prioritaires
      5. Plan de surveillance proposé`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            score_risque: { type: 'number' },
            niveau_risque: { type: 'string' },
            facteurs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  facteur: { type: 'string' },
                  poids: { type: 'number' },
                  description: { type: 'string' }
                }
              }
            },
            recommandations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  priorite: { type: 'string' },
                  action: { type: 'string' },
                  justification: { type: 'string' }
                }
              }
            },
            surveillance: {
              type: 'object',
              properties: {
                frequence_consultation: { type: 'string' },
                examens_complementaires: { 
                  type: 'array',
                  items: { type: 'string' }
                }
              }
            }
          }
        }
      });

      return await base44.entities.AnalyseRisque.create({
        patient_email: patient.email,
        grossesse_id: grossesse.id,
        type_analyse: typeAnalyse,
        score_risque: response.score_risque,
        niveau_risque: response.niveau_risque,
        facteurs_identifie: response.facteurs,
        recommandations: response.recommandations,
        surveillance_proposee: response.surveillance,
        date_analyse: new Date().toISOString(),
        modele_ia_version: 'gpt-4o',
        confiance_score: 0.85
      });
    },
    onSuccess: () => {
      toast.success('Analyse terminée');
      setAnalysing(false);
    },
    onError: () => {
      toast.error('Erreur lors de l\'analyse');
      setAnalysing(false);
    }
  });

  const calculateAge = (dateNaissance) => {
    return Math.floor((Date.now() - new Date(dateNaissance)) / 31557600000);
  };

  const calculateSemaineGrossesse = (ddr) => {
    return Math.floor((Date.now() - new Date(ddr)) / 604800000);
  };

  const risqueTypes = [
    { id: 'pre_eclampsie', label: 'Pré-éclampsie', icon: AlertTriangle, color: 'text-red-600' },
    { id: 'diabete_gestationnel', label: 'Diabète Gestationnel', icon: Activity, color: 'text-orange-600' },
    { id: 'accouchement_premature', label: 'Accouchement Prématuré', icon: TrendingUp, color: 'text-yellow-600' },
    { id: 'retard_croissance', label: 'Retard de Croissance', icon: CheckCircle, color: 'text-blue-600' }
  ];

  const getRisqueColor = (niveau) => {
    switch (niveau) {
      case 'critique': return 'bg-red-100 text-red-800';
      case 'eleve': return 'bg-orange-100 text-orange-800';
      case 'modere': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Analyse Prédictive des Risques (IA)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-600 mb-4">
            L'IA analyse les données patient pour prédire les risques de complications et suggérer des mesures préventives.
          </p>
          
          <div className="grid grid-cols-2 gap-3">
            {risqueTypes.map(type => {
              const Icon = type.icon;
              const derniereAnalyse = analyses.find(a => a.type_analyse === type.id);
              
              return (
                <Button
                  key={type.id}
                  onClick={() => {
                    setAnalysing(true);
                    lancerAnalyse.mutate(type.id);
                  }}
                  disabled={analysing}
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2"
                >
                  <div className="flex items-center gap-2 w-full">
                    <Icon className={`w-5 h-5 ${type.color}`} />
                    <span className="font-semibold text-sm">{type.label}</span>
                  </div>
                  {derniereAnalyse && (
                    <Badge className={getRisqueColor(derniereAnalyse.niveau_risque)}>
                      {derniereAnalyse.score_risque}% - {derniereAnalyse.niveau_risque}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Résultats des analyses */}
      {analyses.map(analyse => (
        <Card key={analyse.id} className="border-l-4" style={{
          borderLeftColor: analyse.niveau_risque === 'critique' ? '#DC2626' :
                          analyse.niveau_risque === 'eleve' ? '#F59E0B' :
                          analyse.niveau_risque === 'modere' ? '#EAB308' : '#10B981'
        }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {risqueTypes.find(t => t.id === analyse.type_analyse)?.label}
              </CardTitle>
              <Badge className={getRisqueColor(analyse.niveau_risque)}>
                Score: {analyse.score_risque}/100
              </Badge>
            </div>
            <p className="text-sm text-gray-500">
              Analysé le {new Date(analyse.date_analyse).toLocaleDateString('fr-FR')}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Facteurs de risque */}
            <div>
              <p className="font-semibold mb-2">Facteurs identifiés:</p>
              <div className="space-y-2">
                {analyse.facteurs_identifie?.map((facteur, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium text-sm">{facteur.facteur}</p>
                      <p className="text-xs text-gray-600">{facteur.description}</p>
                    </div>
                    <Badge variant="outline">{(facteur.poids * 100).toFixed(0)}%</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommandations */}
            <div>
              <p className="font-semibold mb-2">Recommandations:</p>
              <div className="space-y-2">
                {analyse.recommandations?.map((rec, idx) => (
                  <Alert key={idx}>
                    <AlertDescription>
                      <span className="font-semibold">{rec.action}</span>
                      <p className="text-sm text-gray-600 mt-1">{rec.justification}</p>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>

            {/* Surveillance */}
            {analyse.surveillance_proposee && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900 mb-2">Plan de surveillance:</p>
                <p className="text-sm text-blue-800">
                  Fréquence: {analyse.surveillance_proposee.frequence_consultation}
                </p>
                {analyse.surveillance_proposee.examens_complemetaires?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-blue-900">Examens à prévoir:</p>
                    <ul className="list-disc list-inside text-sm text-blue-800">
                      {analyse.surveillance_proposee.examens_complemetaires.map((exam, idx) => (
                        <li key={idx}>{exam}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}