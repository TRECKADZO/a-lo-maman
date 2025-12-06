import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Camera, Loader2, AlertTriangle, CheckCircle2,
  Eye, Sparkles, X, AlertCircle, Info
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/safe-area-view';
import { Touchable } from '@/components/ui/native-interactions';

export default function AnalyseImageSante({ onAnalysisComplete }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setAnalyzing(true);
    try {
      // Upload de l'image
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: selectedImage 
      });

      // Analyse avec IA
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un assistant médical spécialisé en dermatologie pédiatrique et maternelle. Analyse cette image et fournis une évaluation préliminaire.

IMPORTANT: Ceci n'est PAS un diagnostic médical. Tu donnes uniquement des pistes informatives.

Analyse l'image et identifie:
1. Ce que tu observes visuellement (description objective)
2. Des pistes possibles de ce que cela pourrait être (max 3 hypothèses)
3. Le niveau d'urgence (faible, moyen, élevé)
4. Des conseils généraux de premiers soins si applicable
5. Quand consulter un professionnel de santé

Sois rassurant mais prudent. Recommande TOUJOURS de consulter un médecin pour confirmation.`,
        file_urls: file_url,
        response_json_schema: {
          type: 'object',
          properties: {
            description_visuelle: { type: 'string' },
            hypotheses: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nom: { type: 'string' },
                  probabilite: { type: 'string', enum: ['possible', 'probable', 'peu_probable'] },
                  description: { type: 'string' }
                }
              }
            },
            niveau_urgence: { type: 'string', enum: ['faible', 'moyen', 'eleve'] },
            conseils_premiers_soins: { type: 'array', items: { type: 'string' } },
            quand_consulter: { type: 'string' },
            message_rassurant: { type: 'string' }
          }
        }
      });

      setResult(analysis);
      if (onAnalysisComplete) {
        onAnalysisComplete(analysis);
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
      alert('Erreur lors de l\'analyse. Veuillez réessayer.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
  };

  const getUrgenceColor = (niveau) => {
    switch (niveau) {
      case 'faible': return 'bg-green-100 text-green-800';
      case 'moyen': return 'bg-amber-100 text-amber-800';
      case 'eleve': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgenceIcon = (niveau) => {
    switch (niveau) {
      case 'faible': return <CheckCircle2 className="w-4 h-4" />;
      case 'moyen': return <AlertCircle className="w-4 h-4" />;
      case 'eleve': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  return (
    <>
      <Touchable onPress={() => setIsOpen(true)} haptic>
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Analyse d'image</h3>
            <p className="text-sm text-gray-600">
              Prenez une photo d'une éruption cutanée ou symptôme visible pour une analyse préliminaire
            </p>
          </CardContent>
        </Card>
      </Touchable>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => { setIsOpen(false); resetAnalysis(); }}
        title="Analyse d'image santé"
        fullHeight
      >
        <div className="p-6 space-y-4">
          {/* Avertissement */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Information importante</p>
                <p className="text-xs text-amber-700 mt-1">
                  Cette analyse IA est uniquement informative et ne remplace en aucun cas un avis médical. 
                  Consultez toujours un professionnel de santé pour un diagnostic.
                </p>
              </div>
            </div>
          </div>

          {/* Zone d'upload */}
          {!previewUrl ? (
            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-purple-300 rounded-2xl cursor-pointer hover:bg-purple-50 transition-colors">
              <Camera className="w-12 h-12 text-purple-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">Prendre une photo ou choisir une image</p>
              <p className="text-xs text-gray-500 mt-1">Éruption cutanée, rougeur, boutons, etc.</p>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          ) : (
            <div className="relative">
              <img 
                src={previewUrl} 
                alt="Image à analyser" 
                className="w-full rounded-2xl shadow-lg max-h-64 object-cover"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={resetAnalysis}
                className="absolute top-2 right-2 bg-white/90 shadow-lg"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Bouton d'analyse */}
          {previewUrl && !result && (
            <Button
              onClick={analyzeImage}
              disabled={analyzing}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyser l'image
                </>
              )}
            </Button>
          )}

          {/* Résultats */}
          {result && (
            <div className="space-y-4">
              {/* Message rassurant */}
              {result.message_rassurant && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-blue-800">{result.message_rassurant}</p>
                  </CardContent>
                </Card>
              )}

              {/* Niveau d'urgence */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Niveau d'urgence:</span>
                <Badge className={getUrgenceColor(result.niveau_urgence)}>
                  {getUrgenceIcon(result.niveau_urgence)}
                  <span className="ml-1 capitalize">{result.niveau_urgence}</span>
                </Badge>
              </div>

              {/* Description */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4 text-purple-500" />
                    Ce que l'IA observe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{result.description_visuelle}</p>
                </CardContent>
              </Card>

              {/* Hypothèses */}
              {result.hypotheses?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Pistes possibles</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {result.hypotheses.map((h, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{h.nom}</span>
                          <Badge variant="outline" className="text-xs">
                            {h.probabilite === 'probable' ? 'Probable' : 
                             h.probabilite === 'possible' ? 'Possible' : 'Peu probable'}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{h.description}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Conseils */}
              {result.conseils_premiers_soins?.length > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-green-800">Conseils de premiers soins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.conseils_premiers_soins.map((conseil, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          {conseil}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Quand consulter */}
              {result.quand_consulter && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-amber-800 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Quand consulter
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-amber-700">{result.quand_consulter}</p>
                  </CardContent>
                </Card>
              )}

              {/* Nouvelle analyse */}
              <Button
                variant="outline"
                onClick={resetAnalysis}
                className="w-full"
              >
                Nouvelle analyse
              </Button>
            </div>
          )}
        </div>
      </BottomSheet>
    </>
  );
}