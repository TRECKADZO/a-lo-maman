import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, FileSearch, Copy, CheckCircle, AlertCircle, Sparkles } from "lucide-react";
import { BottomSheet } from "@/components/ui/safe-area-view";

export default function ExtracteurTexteOCR({ document, onClose }) {
  const [texteExtrait, setTexteExtrait] = useState('');
  const [copied, setCopied] = useState(false);

  const extractMutation = useMutation({
    mutationFn: async () => {
      // Utiliser l'IA pour extraire le texte du document
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Extrais tout le texte lisible de ce document médical. 
        Formate le texte de manière structurée et claire.
        Inclus toutes les informations importantes : dates, noms de médicaments, dosages, diagnostics, etc.
        Si c'est une ordonnance, liste les médicaments avec leurs posologies.
        Si c'est un résultat de laboratoire, liste les analyses avec leurs valeurs.`,
        file_urls: [document.file_uri],
        add_context_from_internet: false
      });
      
      setTexteExtrait(result);
    }
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(texteExtrait);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Extraction de texte (OCR)" fullHeight>
      <div className="p-6 overflow-y-auto pb-32">
        <div className="space-y-4">
          {/* Info document */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="font-semibold text-blue-900 mb-1">Document</p>
            <p className="text-sm text-blue-700">{document.titre}</p>
          </div>

          {!texteExtrait && !extractMutation.isPending && (
            <Card className="border-2 border-dashed">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileSearch className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Extraction de texte par IA</h3>
                <p className="text-gray-600 mb-4">
                  L'IA va analyser votre document et extraire tout le texte lisible (dates, médicaments, résultats, etc.)
                </p>
                <Button
                  onClick={() => extractMutation.mutate()}
                  disabled={extractMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Extraire le texte
                </Button>
              </CardContent>
            </Card>
          )}

          {extractMutation.isPending && (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
                <p className="text-gray-600">Analyse du document en cours...</p>
                <p className="text-sm text-gray-500 mt-2">Cela peut prendre quelques secondes</p>
              </CardContent>
            </Card>
          )}

          {extractMutation.isError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-900">Erreur d'extraction</p>
                    <p className="text-sm text-red-700 mt-1">
                      Impossible d'extraire le texte. Assurez-vous que le document est lisible.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {texteExtrait && (
            <>
              <div className="flex items-center justify-between">
                <Label>Texte extrait</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="gap-2"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copier
                    </>
                  )}
                </Button>
              </div>

              <Textarea
                value={texteExtrait}
                onChange={(e) => setTexteExtrait(e.target.value)}
                rows={15}
                className="font-mono text-sm"
              />

              <div className="flex items-start gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">
                  Texte extrait avec succès ! Vous pouvez le copier ou le modifier si nécessaire.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Fermer
            </Button>
            {texteExtrait && (
              <Button
                onClick={() => extractMutation.mutate()}
                variant="outline"
                className="flex-1"
              >
                Réextraire
              </Button>
            )}
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}