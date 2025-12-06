import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Camera, Barcode, Loader2, CheckCircle, AlertTriangle,
  XCircle, Search, Plus, Info, Apple
} from 'lucide-react';
import { BottomSheet } from '@/components/ui/safe-area-view';

export default function ScannerCodeBarre({ onProductScanned, trimestre, allergies = [] }) {
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const fileInputRef = useRef(null);

  const scanMutation = useMutation({
    mutationFn: async (codeOrImage) => {
      let codeToAnalyze = codeOrImage;
      
      // Si c'est une image, on utilise l'IA pour extraire le code-barre
      if (codeOrImage instanceof File) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: codeOrImage });
        
        const extraction = await base44.integrations.Core.InvokeLLM({
          prompt: `Analyse cette image et extrait le code-barre s'il y en a un visible. 
                   Retourne uniquement le numéro du code-barre, ou "NON_TROUVE" si aucun code n'est visible.`,
          file_urls: file_url,
          response_json_schema: {
            type: 'object',
            properties: {
              code_barre: { type: 'string' },
              trouve: { type: 'boolean' }
            }
          }
        });
        
        if (!extraction.trouve) {
          throw new Error("Aucun code-barre détecté sur l'image");
        }
        codeToAnalyze = extraction.code_barre;
      }

      // Analyser le produit avec l'IA en contexte grossesse
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es nutritionniste spécialisée en grossesse. Analyse ce produit alimentaire.

CODE-BARRE: ${codeToAnalyze}

CONTEXTE:
- Trimestre de grossesse: ${trimestre}
- Allergies connues: ${allergies.length > 0 ? allergies.join(', ') : 'Aucune'}

Recherche ce produit dans les bases de données (Open Food Facts, etc.) et donne:
1. Les informations nutritionnelles
2. Si le produit est adapté à la grossesse
3. Les alertes éventuelles (listeria, toxoplasmose, mercure, etc.)
4. Des alternatives si non recommandé

Si tu ne trouves pas le produit exact, propose une estimation basée sur des produits similaires.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            trouve: { type: 'boolean' },
            nom_produit: { type: 'string' },
            marque: { type: 'string' },
            categorie: { type: 'string' },
            portion_standard: { type: 'string' },
            nutrition_100g: {
              type: 'object',
              properties: {
                calories: { type: 'number' },
                proteines: { type: 'number' },
                glucides: { type: 'number' },
                lipides: { type: 'number' },
                fibres: { type: 'number' },
                sel: { type: 'number' },
                sucres: { type: 'number' },
                fer: { type: 'number' },
                calcium: { type: 'number' },
                acide_folique: { type: 'number' }
              }
            },
            nutriscore: { type: 'string', enum: ['A', 'B', 'C', 'D', 'E', 'inconnu'] },
            adapte_grossesse: { type: 'boolean' },
            niveau_risque: { type: 'string', enum: ['safe', 'attention', 'eviter'] },
            alertes: { 
              type: 'array',
              items: { type: 'string' }
            },
            raisons: { type: 'string' },
            alternatives_recommandees: {
              type: 'array',
              items: { type: 'string' }
            },
            conseils_consommation: { type: 'string' },
            ingredients_problematiques: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        }
      });

      return { ...analysis, code_barre: codeToAnalyze };
    },
    onSuccess: (data) => {
      setScannedProduct(data);
      setShowScanner(true);
    }
  });

  const handleImageCapture = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      scanMutation.mutate(file);
    }
  };

  const handleManualSearch = () => {
    if (manualCode.trim()) {
      scanMutation.mutate(manualCode.trim());
    }
  };

  const addProductToMeal = () => {
    if (scannedProduct && onProductScanned) {
      onProductScanned({
        nom: scannedProduct.nom_produit,
        code_barre: scannedProduct.code_barre,
        calories: scannedProduct.nutrition_100g?.calories || 0,
        proteines: scannedProduct.nutrition_100g?.proteines || 0,
        glucides: scannedProduct.nutrition_100g?.glucides || 0,
        lipides: scannedProduct.nutrition_100g?.lipides || 0,
        fer: scannedProduct.nutrition_100g?.fer || 0,
        calcium: scannedProduct.nutrition_100g?.calcium || 0,
        acide_folique: scannedProduct.nutrition_100g?.acide_folique || 0,
        adapte_grossesse: scannedProduct.adapte_grossesse,
        alertes: scannedProduct.alertes || []
      });
      setShowScanner(false);
      setScannedProduct(null);
    }
  };

  const getRiskColor = (niveau) => {
    switch (niveau) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-300';
      case 'attention': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'eviter': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskIcon = (niveau) => {
    switch (niveau) {
      case 'safe': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'attention': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'eviter': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNutriscoreColor = (score) => {
    const colors = {
      'A': 'bg-green-500',
      'B': 'bg-lime-500',
      'C': 'bg-yellow-500',
      'D': 'bg-orange-500',
      'E': 'bg-red-500'
    };
    return colors[score] || 'bg-gray-400';
  };

  return (
    <>
      <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50">
        <CardContent className="p-4">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center">
              <Barcode className="w-7 h-7 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Scanner un produit</h3>
              <p className="text-xs text-gray-500 mt-1">
                Vérifiez si un aliment est adapté à la grossesse
              </p>
            </div>
            <div className="flex gap-2 w-full">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleImageCapture}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={scanMutation.isPending}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
              >
                {scanMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                Scanner
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowManualEntry(true)}
                disabled={scanMutation.isPending}
              >
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal saisie manuelle */}
      <BottomSheet
        isOpen={showManualEntry}
        onClose={() => setShowManualEntry(false)}
        title="Rechercher un produit"
      >
        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Code-barre ou nom du produit</label>
            <div className="flex gap-2 mt-2">
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Ex: 3017620422003 ou Nutella"
                className="flex-1"
              />
              <Button
                onClick={() => {
                  handleManualSearch();
                  setShowManualEntry(false);
                }}
                disabled={!manualCode.trim() || scanMutation.isPending}
              >
                {scanMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Entrez le code-barre du produit ou son nom pour obtenir une analyse nutritionnelle adaptée à la grossesse.
          </p>
        </div>
      </BottomSheet>

      {/* Modal résultat du scan */}
      <BottomSheet
        isOpen={showScanner && scannedProduct}
        onClose={() => {
          setShowScanner(false);
          setScannedProduct(null);
        }}
        title="Analyse du produit"
        fullHeight
      >
        {scannedProduct && (
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* En-tête produit */}
            <div className={`p-4 rounded-xl border-2 ${getRiskColor(scannedProduct.niveau_risque)}`}>
              <div className="flex items-start gap-3">
                {getRiskIcon(scannedProduct.niveau_risque)}
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{scannedProduct.nom_produit}</h3>
                  {scannedProduct.marque && (
                    <p className="text-sm opacity-80">{scannedProduct.marque}</p>
                  )}
                  <Badge className="mt-2" variant="outline">
                    {scannedProduct.categorie}
                  </Badge>
                </div>
                {scannedProduct.nutriscore && scannedProduct.nutriscore !== 'inconnu' && (
                  <div className={`w-10 h-10 ${getNutriscoreColor(scannedProduct.nutriscore)} rounded-lg flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">{scannedProduct.nutriscore}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Verdict grossesse */}
            <Card className={scannedProduct.adapte_grossesse ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {scannedProduct.adapte_grossesse ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={`font-semibold ${scannedProduct.adapte_grossesse ? 'text-green-800' : 'text-red-800'}`}>
                    {scannedProduct.adapte_grossesse ? 'Adapté à la grossesse' : 'Non recommandé pendant la grossesse'}
                  </span>
                </div>
                <p className={`text-sm ${scannedProduct.adapte_grossesse ? 'text-green-700' : 'text-red-700'}`}>
                  {scannedProduct.raisons}
                </p>
              </CardContent>
            </Card>

            {/* Alertes */}
            {scannedProduct.alertes?.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Alertes
                </h4>
                {scannedProduct.alertes.map((alerte, i) => (
                  <Alert key={i} className="bg-amber-50 border-amber-200">
                    <AlertDescription className="text-amber-800 text-sm">
                      {alerte}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Valeurs nutritionnelles */}
            {scannedProduct.nutrition_100g && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Valeurs nutritionnelles (100g)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <p className="text-lg font-bold text-blue-600">{scannedProduct.nutrition_100g.calories}</p>
                      <p className="text-xs text-gray-600">kcal</p>
                    </div>
                    <div className="p-2 bg-red-50 rounded-lg">
                      <p className="text-lg font-bold text-red-600">{scannedProduct.nutrition_100g.proteines}g</p>
                      <p className="text-xs text-gray-600">Protéines</p>
                    </div>
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <p className="text-lg font-bold text-amber-600">{scannedProduct.nutrition_100g.glucides}g</p>
                      <p className="text-xs text-gray-600">Glucides</p>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <p className="text-lg font-bold text-purple-600">{scannedProduct.nutrition_100g.lipides}g</p>
                      <p className="text-xs text-gray-600">Lipides</p>
                    </div>
                    {scannedProduct.nutrition_100g.fer > 0 && (
                      <div className="p-2 bg-green-50 rounded-lg">
                        <p className="text-lg font-bold text-green-600">{scannedProduct.nutrition_100g.fer}mg</p>
                        <p className="text-xs text-gray-600">Fer</p>
                      </div>
                    )}
                    {scannedProduct.nutrition_100g.calcium > 0 && (
                      <div className="p-2 bg-cyan-50 rounded-lg">
                        <p className="text-lg font-bold text-cyan-600">{scannedProduct.nutrition_100g.calcium}mg</p>
                        <p className="text-xs text-gray-600">Calcium</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Conseils */}
            {scannedProduct.conseils_consommation && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800">{scannedProduct.conseils_consommation}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Alternatives */}
            {scannedProduct.alternatives_recommandees?.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Apple className="w-4 h-4 text-green-500" />
                  Alternatives recommandées
                </h4>
                <div className="flex flex-wrap gap-2">
                  {scannedProduct.alternatives_recommandees.map((alt, i) => (
                    <Badge key={i} className="bg-green-100 text-green-800">{alt}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Bouton ajouter */}
            {scannedProduct.adapte_grossesse && (
              <Button
                onClick={addProductToMeal}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter à mon repas
              </Button>
            )}
          </div>
        )}
      </BottomSheet>
    </>
  );
}