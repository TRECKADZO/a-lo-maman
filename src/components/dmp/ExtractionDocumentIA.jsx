import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Loader2, CheckCircle, Upload, Sparkles, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';

const CATEGORIES_MEDICALES = {
  ordonnance: { label: 'Ordonnance', color: 'bg-purple-100 text-purple-800' },
  resultat_labo: { label: 'Résultat de laboratoire', color: 'bg-blue-100 text-blue-800' },
  imagerie: { label: 'Imagerie médicale', color: 'bg-green-100 text-green-800' },
  compte_rendu: { label: 'Compte-rendu', color: 'bg-orange-100 text-orange-800' },
  certificat: { label: 'Certificat médical', color: 'bg-pink-100 text-pink-800' },
  vaccination: { label: 'Carnet de vaccination', color: 'bg-teal-100 text-teal-800' },
};

export default function ExtractionDocumentIA({ patientEmail, enfantId, grossesseId, onExtractionComplete }) {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    }
  });

  const extractionMutation = useMutation({
    mutationFn: async (fileUrl) => {
      const prompt = `Analyse ce document médical et extrais les informations suivantes au format JSON structuré:
      
1. Type de document (ordonnance, résultat_labo, imagerie, compte_rendu, certificat, vaccination)
2. Date du document (format ISO)
3. Professionnel émetteur (nom et spécialité si mentionné)
4. Contenu principal:
   - Pour ordonnance: liste des médicaments avec posologie et durée
   - Pour résultat labo: paramètres testés avec valeurs et unités
   - Pour imagerie: type d'examen et observations
   - Pour compte-rendu: diagnostic et recommandations
   - Pour certificat: motif et durée
   - Pour vaccination: vaccins administrés avec dates
5. Informations critiques ou alertes (allergies, contre-indications, valeurs anormales)
6. Titre court et descriptif du document

Retourne UNIQUEMENT du JSON valide sans texte additionnel.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        file_urls: [fileUrl],
        response_json_schema: {
          type: 'object',
          properties: {
            type_document: { type: 'string' },
            date_document: { type: 'string' },
            professionnel: {
              type: 'object',
              properties: {
                nom: { type: 'string' },
                specialite: { type: 'string' }
              }
            },
            titre: { type: 'string' },
            contenu_principal: { type: 'object' },
            alertes: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      return { fileUrl, extraction: response };
    },
    onSuccess: (data) => {
      setExtractedData(data.extraction);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const docData = {
        titre: extractedData.titre || 'Document médical',
        type_document: extractedData.type_document || 'autre',
        date_document: extractedData.date_document || new Date().toISOString().split('T')[0],
        file_url: uploadedFile.url,
        description: JSON.stringify(extractedData.contenu_principal),
        professionnel_emetteur: extractedData.professionnel?.nom || '',
        patient_email: patientEmail,
        enfant_id: enfantId,
        grossesse_id: grossesseId,
        partage_avec: []
      };

      return await base44.entities.DocumentMedical.create(docData);
    },
    onSuccess: () => {
      if (onExtractionComplete) onExtractionComplete();
      setUploadedFile(null);
      setExtractedData(null);
    }
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Fichier trop volumineux (max 10 MB)');
      return;
    }

    try {
      const fileUrl = await uploadMutation.mutateAsync(file);
      setUploadedFile({ name: file.name, url: fileUrl });
      await extractionMutation.mutateAsync(fileUrl);
    } catch (error) {
      alert('Erreur lors de l\'analyse: ' + error.message);
    }
  };

  const isProcessing = uploadMutation.isPending || extractionMutation.isPending;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Extraction Automatique par IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!extractedData ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-purple-400 transition-colors">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-4">
              {isProcessing ? 'Analyse en cours avec IA...' : 'Uploadez un document médical (PDF, image)'}
            </p>
            {isProcessing ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                <span className="text-sm text-purple-600">Extraction intelligente des données...</span>
              </div>
            ) : (
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="mx-auto max-w-xs"
              />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Document analysé avec succès par l'IA
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Type de document</p>
                <Badge className={CATEGORIES_MEDICALES[extractedData.type_document]?.color || 'bg-gray-100'}>
                  {CATEGORIES_MEDICALES[extractedData.type_document]?.label || extractedData.type_document}
                </Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-600">Titre</p>
                <p className="font-medium">{extractedData.titre}</p>
              </div>

              {extractedData.date_document && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Date</p>
                  <p>{new Date(extractedData.date_document).toLocaleDateString('fr-FR')}</p>
                </div>
              )}

              {extractedData.professionnel && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Émetteur</p>
                  <p>{extractedData.professionnel.nom}</p>
                  {extractedData.professionnel.specialite && (
                    <p className="text-sm text-gray-500">{extractedData.professionnel.specialite}</p>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Contenu extrait</p>
                <div className="bg-gray-50 p-3 rounded-lg text-sm">
                  <pre className="whitespace-pre-wrap font-mono text-xs">
                    {JSON.stringify(extractedData.contenu_principal, null, 2)}
                  </pre>
                </div>
              </div>

              {extractedData.alertes && extractedData.alertes.length > 0 && (
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">
                    <p className="font-medium mb-1">⚠️ Alertes détectées:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      {extractedData.alertes.map((alerte, idx) => (
                        <li key={idx}>{alerte}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadedFile(null);
                  setExtractedData(null);
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Enregistrer dans le DMP
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}