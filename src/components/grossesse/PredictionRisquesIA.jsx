import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, Brain, TrendingDown, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'react-hot-toast';
import { useMutation } from '@tanstack/react-query';

/**
 * Analyse IA des risques de grossesse
 * - Pré-éclampsie
 * - Diabète gestationnel
 * - Accouchement prématuré
 * - Retard de croissance intra-utérin (RCIU)
 */

export default function PredictionRisquesIA({ grossesse, consultations, user }) {
  const [analysisResult, setAnalysisResult] = useState(null);

  const analyserRisques = useMutation({
    mutationFn: async () => {
      // Préparer les données pour l'IA
      const dataCliniques = {
        age: user.age || calculateAge(user.date_naissance),
        imc: calculateIMC(user.poids, user.taille),
        parite: grossesse.nombre_grossesses_anterieures || 0,
        antecedents: grossesse.antecedents_medicaux || [],
        consultations: consultations.slice(-5).map(c => ({
          semaine: c.semaine_amenorrhee,
          tension: c.tension_arterielle,
          poids: c.poids,
          proteinurie: c.proteinurie
        })),
        echographies: (grossesse.echographies || []).map(e => ({
          semaine: e.semaine,
          BPD: e.mesures?.BPD,
          FL: e.mesures?.FL,
          estimation_poids_foetal: e.mesures?.EPF
        })),
        examens_labo: (grossesse.examens || []).filter(e => e.type === 'biologie')
      };

      // Appel IA pour analyse prédictive
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un système d'aide à la décision médicale pour la grossesse. 
        
Analyse les données suivantes et évalue les risques de complications :

**Données patiente :**
- Âge : ${dataCliniques.age} ans
- IMC : ${dataCliniques.imc?.toFixed(1) || 'Non calculé'}
- Parité : ${dataCliniques.parite === 0 ? 'Primipare' : 'Multipare'}
- Antécédents : ${dataCliniques.antecedents.join(', ') || 'Aucun'}

**Consultations récentes :**
${dataCliniques.consultations.map(c => `- SA ${c.semaine} : TA ${c.tension}, Poids ${c.poids}kg${c.proteinurie ? ', Protéinurie +' : ''}`).join('\n')}

**Échographies :**
${dataCliniques.echographies.map(e => `- SA ${e.semaine} : BPD ${e.BPD}mm, FL ${e.FL}mm`).join('\n')}

Évalue les risques suivants avec un score de 0 à 100 :
1. Pré-éclampsie
2. Diabète gestationnel
3. Accouchement prématuré
4. Retard de croissance intra-utérin (RCIU)

Pour chaque risque, fournis :
- Un score de risque
- Les facteurs détectés
- Des recommandations de surveillance

Soit précis et evidence-based.`,
        response_json_schema: {
          type: 'object',
          properties: {
            risques: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nom: { type: 'string' },
                  score: { type: 'number' },
                  niveau: { type: 'string', enum: ['faible', 'modere', 'eleve', 'critique'] },
                  facteurs: { type: 'array', items: { type: 'string' } },
                  recommandations: { type: 'array', items: { type: 'string' } }
                }
              }
            },
            synthese: { type: 'string' },
            surveillance_renforcee: { type: 'boolean' }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      
      // Enregistrer l'analyse
      base44.entities.AnalyseRisque.create({
        patient_email: user.email,
        grossesse_id: grossesse.id,
        type_analyse: 'prediction_globale',
        date_analyse: new Date().toISOString(),
        modele_ia_version: 'gpt-4o',
        ...data
      });

      toast.success('Analyse des risques terminée');
    },
    onError: () => {
      toast.error('Erreur lors de l\'analyse IA');
    }
  });

  const calculateAge = (dateNaissance) => {
    if (!dateNaissance) return null;
    const diff = Date.now() - new Date(dateNaissance).getTime();
    return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
  };

  const calculateIMC = (poids, taille) => {
    if (!poids || !taille) return null;
    return poids / ((taille / 100) ** 2);
  };

  const getNiveauColor = (niveau) => {
    switch (niveau) {
      case 'faible': return 'bg-green-100 text-green-800';
      case 'modere': return 'bg-yellow-100 text-yellow-800';
      case 'eleve': return 'bg-orange-100 text-orange-800';
      case 'critique': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNiveauIcon = (niveau) => {
    switch (niveau) {
      case 'faible': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'modere': return <TrendingDown className="w-4 h-4 text-yellow-600" />;
      case 'eleve': return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case 'critique': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return null;
    }
  };

  return (
    <Card className="shadow-lg border-2 border-purple-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          Analyse prédictive des risques (IA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-purple-900 mb-2">
                Intelligence artificielle prédictive
              </p>
              <p className="text-sm text-purple-800">
                L'IA analyse vos données médicales (tension, poids, antécédents, échographies) 
                pour détecter précocement les risques de complications et adapter la surveillance.
              </p>
            </div>
          </div>
        </div>

        {!analysisResult ? (
          <Button
            onClick={() => analyserRisques.mutate()}
            disabled={analyserRisques.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {analyserRisques.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyse en cours...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Lancer l'analyse des risques
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            {/* Synthèse */}
            <div className={`p-4 rounded-lg ${
              analysisResult.surveillance_renforcee 
                ? 'bg-amber-50 border-2 border-amber-300' 
                : 'bg-green-50 border-2 border-green-300'
            }`}>
              <p className="text-sm font-semibold mb-2">
                {analysisResult.surveillance_renforcee ? '⚠️ Surveillance renforcée recommandée' : '✅ Grossesse à risque faible'}
              </p>
              <p className="text-xs">{analysisResult.synthese}</p>
            </div>

            {/* Risques détaillés */}
            {analysisResult.risques?.map((risque, index) => (
              <Card key={index} className="border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getNiveauIcon(risque.niveau)}
                      <h4 className="font-semibold text-sm">{risque.nom}</h4>
                    </div>
                    <Badge className={getNiveauColor(risque.niveau)}>
                      {risque.niveau.toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-600">Score de risque</span>
                      <span className="text-xs font-semibold">{risque.score}%</span>
                    </div>
                    <Progress value={risque.score} className="h-2" />
                  </div>

                  {risque.facteurs && risque.facteurs.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-semibold mb-1">Facteurs identifiés :</p>
                      <ul className="text-xs space-y-1">
                        {risque.facteurs.map((facteur, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-orange-500 mt-0.5">•</span>
                            <span>{facteur}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {risque.recommandations && risque.recommandations.length > 0 && (
                    <div className="p-2 bg-blue-50 rounded">
                      <p className="text-xs font-semibold mb-1">Recommandations :</p>
                      <ul className="text-xs space-y-1">
                        {risque.recommandations.map((reco, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-blue-600 mt-0.5">✓</span>
                            <span>{reco}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <Button
              variant="outline"
              onClick={() => setAnalysisResult(null)}
              className="w-full"
            >
              Relancer une analyse
            </Button>
          </div>
        )}

        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>Note importante :</strong> Cette analyse IA est un outil d'aide à la décision. 
            Elle ne remplace pas l'avis d'un professionnel de santé. En cas de doute, consultez votre médecin.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}