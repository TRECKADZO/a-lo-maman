import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Stethoscope, Search, BookOpen, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AideDiagnosticDifferentiel({ patient, context }) {
  const [symptomes, setSymptomes] = useState('');
  const [suggestions, setSuggestions] = useState(null);

  const analyserSymptomes = useMutation({
    mutationFn: async (symptomes) => {
      const prompt = `En tant qu'assistant médical spécialisé en santé maternelle et infantile en Côte d'Ivoire:

Patiente: ${patient?.nom_complet || 'N/A'}
Contexte: ${context || 'Consultation générale'}
Symptômes décrits: ${symptomes}

Fournir:
1. Liste des diagnostics différentiels possibles (3-5 plus probables)
2. Pour chaque diagnostic:
   - Nom médical
   - Code ICD-10 
   - Code SNOMED CT (si applicable)
   - Probabilité estimée (%)
   - Signes cliniques typiques
   - Examens complémentaires à envisager
   - Urgence (basse/modérée/haute/critique)
3. Red flags nécessitant action immédiate
4. Recommandations de prise en charge`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            diagnostics_differentiels: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nom: { type: 'string' },
                  code_icd10: { type: 'string' },
                  code_snomed: { type: 'string' },
                  probabilite: { type: 'number' },
                  signes_cliniques: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  examens_complemetaires: {
                    type: 'array',
                    items: { type: 'string' }
                  },
                  urgence: { type: 'string' }
                }
              }
            },
            red_flags: {
              type: 'array',
              items: { type: 'string' }
            },
            recommandations: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setSuggestions(data);
      toast.success('Analyse terminée');
    },
    onError: () => {
      toast.error('Erreur lors de l\'analyse');
    }
  });

  const getUrgenceColor = (urgence) => {
    switch (urgence?.toLowerCase()) {
      case 'critique': return 'bg-red-100 text-red-800';
      case 'haute': return 'bg-orange-100 text-orange-800';
      case 'modérée': case 'moderee': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardTitle className="flex items-center gap-2">
            <Stethoscope className="w-6 h-6 text-blue-600" />
            Aide au Diagnostic Différentiel (IA)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Décrire les symptômes et signes cliniques:
            </label>
            <Textarea
              value={symptomes}
              onChange={(e) => setSymptomes(e.target.value)}
              placeholder="Ex: Céphalées persistantes, œdèmes des membres inférieurs, tension artérielle 150/95..."
              rows={4}
              className="w-full"
            />
          </div>

          <Button
            onClick={() => analyserSymptomes.mutate(symptomes)}
            disabled={!symptomes || analyserSymptomes.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Search className="w-4 h-4 mr-2" />
            {analyserSymptomes.isPending ? 'Analyse en cours...' : 'Analyser avec IA'}
          </Button>
        </CardContent>
      </Card>

      {/* Résultats */}
      {suggestions && (
        <>
          {/* Red Flags */}
          {suggestions.red_flags?.length > 0 && (
            <Card className="border-2 border-red-300 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-800 flex items-center gap-2">
                  ⚠️ Signes d'Alerte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {suggestions.red_flags.map((flag, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <span className="text-red-800">{flag}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Diagnostics différentiels */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Diagnostics Différentiels Suggérés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestions.diagnostics_differentiels?.map((diagnostic, idx) => (
                <div key={idx} className="p-4 border-2 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{diagnostic.nom}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">ICD-10: {diagnostic.code_icd10}</Badge>
                        {diagnostic.code_snomed && (
                          <Badge variant="outline">SNOMED: {diagnostic.code_snomed}</Badge>
                        )}
                        <Badge className={getUrgenceColor(diagnostic.urgence)}>
                          {diagnostic.urgence}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-blue-600">
                        {diagnostic.probabilite}%
                      </div>
                      <div className="text-xs text-gray-500">Probabilité</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="font-semibold text-sm text-gray-700 mb-2">Signes cliniques:</p>
                      <ul className="space-y-1">
                        {diagnostic.signes_cliniques?.map((signe, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                            <span>{signe}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold text-sm text-gray-700 mb-2">Examens complémentaires:</p>
                      <ul className="space-y-1">
                        {diagnostic.examens_complemetaires?.map((examen, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-blue-600">→</span>
                            <span>{examen}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recommandations */}
          {suggestions.recommandations?.length > 0 && (
            <Card className="border-2 border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Recommandations de Prise en Charge</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {suggestions.recommandations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-green-900">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}