import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText, Upload, Download, Eye, Trash2, Plus, Search, CheckCircle2, Loader2,
  Syringe, Pill, FileCheck, Calendar, Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BottomSheet } from '@/components/ui/safe-area-view';
import { Touchable } from '@/components/ui/native-interactions';

const TYPES_DOCUMENTS = [
  { value: 'ordonnance', label: 'Ordonnance', icon: Pill, color: 'bg-blue-100 text-blue-800' },
  { value: 'certificat_vaccination', label: 'Certificat de vaccination', icon: Syringe, color: 'bg-green-100 text-green-800' },
  { value: 'certificat_medical', label: 'Certificat médical', icon: FileCheck, color: 'bg-purple-100 text-purple-800' },
  { value: 'resultat_analyse', label: 'Résultat d\'analyse', icon: FileText, color: 'bg-amber-100 text-amber-800' },
  { value: 'compte_rendu', label: 'Compte-rendu médical', icon: FileText, color: 'bg-pink-100 text-pink-800' },
  { value: 'autre', label: 'Autre document', icon: FileText, color: 'bg-gray-100 text-gray-800' },
];

export default function GestionCertificats({ enfantId = null }) {
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [showViewer, setShowViewer] = useState(null);
  const [showOCRResult, setShowOCRResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFiltre, setTypeFiltre] = useState('all');
  const [uploadData, setUploadData] = useState({
    type: 'ordonnance',
    nom: '',
    description: '',
    date_document: new Date().toISOString().split('T')[0],
    professionnel: '',
    file: null,
    fileName: ''
  });
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // Charger les documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents_medicaux', user?.email, enfantId],
    queryFn: async () => {
      if (enfantId) {
        const enfant = await base44.entities.EnfantCarnet.filter({ id: enfantId });
        return enfant[0]?.documents_medicaux || [];
      } else {
        // Documents personnels de la maman
        const profil = await base44.entities.ProfilMaman.filter({ created_by: user.email });
        // On utilise une entité dédiée ou on stocke dans le profil
        return profil[0]?.documents_medicaux || [];
      }
    },
    enabled: !!user,
  });

  // Upload de fichier
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadData({
      ...uploadData,
      file,
      fileName: file.name,
      nom: uploadData.nom || file.name.replace(/\.[^/.]+$/, '')
    });
  };

  // Analyser le document avec IA (OCR)
  const analyzeDocument = async () => {
    if (!uploadData.file) return;

    setAnalyzing(true);
    try {
      // Upload temporaire
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadData.file });

      // Extraction avec IA
      const result = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: {
          type: 'object',
          properties: {
            type_document: { type: 'string', description: 'Type de document (ordonnance, certificat, analyse, etc.)' },
            date_document: { type: 'string', description: 'Date du document au format YYYY-MM-DD' },
            professionnel: { type: 'string', description: 'Nom du professionnel de santé' },
            patient: { type: 'string', description: 'Nom du patient' },
            medicaments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nom: { type: 'string' },
                  dosage: { type: 'string' },
                  posologie: { type: 'string' },
                  duree: { type: 'string' }
                }
              }
            },
            diagnostic: { type: 'string' },
            observations: { type: 'string' },
            validite: { type: 'string', description: 'Date de validité si applicable' },
            resume: { type: 'string', description: 'Résumé du contenu du document' }
          }
        }
      });

      if (result.status === 'success') {
        setOcrResult(result.output);
        setShowOCRResult(true);
        
        // Pré-remplir les champs
        if (result.output.date_document) {
          setUploadData(prev => ({ ...prev, date_document: result.output.date_document }));
        }
        if (result.output.professionnel) {
          setUploadData(prev => ({ ...prev, professionnel: result.output.professionnel }));
        }
        if (result.output.type_document) {
          const typeMatch = TYPES_DOCUMENTS.find(t => 
            result.output.type_document.toLowerCase().includes(t.value.replace('_', ' '))
          );
          if (typeMatch) {
            setUploadData(prev => ({ ...prev, type: typeMatch.value }));
          }
        }
      }
    } catch (error) {
      console.error('Erreur analyse:', error);
      alert('Erreur lors de l\'analyse du document');
    } finally {
      setAnalyzing(false);
    }
  };

  // Sauvegarder le document
  const saveDocumentMutation = useMutation({
    mutationFn: async () => {
      setUploading(true);
      
      // Upload sécurisé
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ 
        file: uploadData.file 
      });

      const newDoc = {
        id: Date.now().toString(),
        type: uploadData.type,
        nom: uploadData.nom,
        description: uploadData.description,
        date_document: uploadData.date_document,
        professionnel: uploadData.professionnel,
        file_uri,
        file_name: uploadData.fileName,
        file_type: uploadData.file.type,
        date_upload: new Date().toISOString(),
        ocr_data: ocrResult || null,
        verifie: false
      };

      if (enfantId) {
        const enfant = await base44.entities.EnfantCarnet.filter({ id: enfantId });
        const docs = enfant[0]?.documents_medicaux || [];
        await base44.entities.EnfantCarnet.update(enfantId, {
          documents_medicaux: [...docs, newDoc]
        });
      }
      // Pour les docs personnels, on pourrait ajouter au ProfilMaman

      return newDoc;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents_medicaux'] });
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      setShowUpload(false);
      resetForm();
    },
    onSettled: () => setUploading(false)
  });

  const resetForm = () => {
    setUploadData({
      type: 'ordonnance',
      nom: '',
      description: '',
      date_document: new Date().toISOString().split('T')[0],
      professionnel: '',
      file: null,
      fileName: ''
    });
    setOcrResult(null);
  };

  // Télécharger un document
  const downloadDocument = async (doc) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: doc.file_uri,
        expires_in: 3600
      });
      window.open(signed_url, '_blank');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement');
    }
  };

  // Supprimer un document
  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId) => {
      if (enfantId) {
        const enfant = await base44.entities.EnfantCarnet.filter({ id: enfantId });
        const docs = (enfant[0]?.documents_medicaux || []).filter(d => d.id !== docId);
        await base44.entities.EnfantCarnet.update(enfantId, { documents_medicaux: docs });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents_medicaux'] });
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
    }
  });

  // Filtrer les documents
  const filteredDocs = (documents || []).filter(doc => {
    const matchSearch = !searchQuery || 
      doc.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.professionnel?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFiltre === 'all' || doc.type === typeFiltre;
    return matchSearch && matchType;
  });

  const getTypeInfo = (type) => TYPES_DOCUMENTS.find(t => t.value === type) || TYPES_DOCUMENTS[5];

  return (
    <div className="space-y-4">
      {/* Header avec actions */}
      <div className="flex flex-col md:flex-row gap-3 justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFiltre} onValueChange={setTypeFiltre}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {TYPES_DOCUMENTS.map(t => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Touchable onPress={() => setShowUpload(true)} haptic>
          <Button className="bg-gradient-to-r from-pink-500 to-rose-500">
            <Upload className="w-4 h-4 mr-2" />
            Ajouter un document
          </Button>
        </Touchable>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-blue-50 border-none">
          <CardContent className="p-3 text-center">
            <Pill className="w-6 h-6 text-blue-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-blue-600">
              {documents?.filter(d => d.type === 'ordonnance').length || 0}
            </p>
            <p className="text-xs text-blue-800">Ordonnances</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-none">
          <CardContent className="p-3 text-center">
            <Syringe className="w-6 h-6 text-green-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-green-600">
              {documents?.filter(d => d.type === 'certificat_vaccination').length || 0}
            </p>
            <p className="text-xs text-green-800">Vaccins</p>
          </CardContent>
        </Card>
        <Card className="bg-purple-50 border-none">
          <CardContent className="p-3 text-center">
            <FileCheck className="w-6 h-6 text-purple-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-purple-600">
              {documents?.filter(d => d.type === 'certificat_medical').length || 0}
            </p>
            <p className="text-xs text-purple-800">Certificats</p>
          </CardContent>
        </Card>
      </div>

      {/* Liste des documents */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucun document enregistré</p>
            <Button onClick={() => setShowUpload(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter votre premier document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredDocs.map((doc) => {
            const typeInfo = getTypeInfo(doc.type);
            const TypeIcon = typeInfo.icon;
            
            return (
              <Card key={doc.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${typeInfo.color}`}>
                      <TypeIcon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{doc.nom}</h3>
                        {doc.verifie && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Vérifié
                          </Badge>
                        )}
                        {doc.ocr_data && (
                          <Badge className="bg-purple-100 text-purple-800">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Analysé
                          </Badge>
                        )}
                      </div>
                      
                      <Badge className={typeInfo.color + ' mb-2'}>{typeInfo.label}</Badge>
                      
                      <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                        {doc.date_document && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(doc.date_document), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        )}
                        {doc.professionnel && (
                          <span>Dr. {doc.professionnel}</span>
                        )}
                      </div>
                      
                      {doc.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">{doc.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {doc.ocr_data && (
                        <Touchable onPress={() => setShowViewer(doc)}>
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Touchable>
                      )}
                      <Touchable onPress={() => downloadDocument(doc)}>
                        <Button size="sm" variant="outline">
                          <Download className="w-4 h-4" />
                        </Button>
                      </Touchable>
                      <Touchable onPress={() => {
                        if (confirm('Supprimer ce document ?')) {
                          deleteDocumentMutation.mutate(doc.id);
                        }
                      }}>
                        <Button size="sm" variant="outline" className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Touchable>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Bottom Sheet - Upload */}
      <BottomSheet
        isOpen={showUpload}
        onClose={() => { setShowUpload(false); resetForm(); }}
        title="Ajouter un document"
        fullHeight
      >
        <div className="p-6 space-y-4">
          {/* Zone d'upload */}
          <div>
            <Label>Document *</Label>
            <label className="mt-2 flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
              {uploadData.fileName ? (
                <div className="text-center">
                  <FileCheck className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-medium">{uploadData.fileName}</p>
                  <p className="text-xs text-gray-500">Cliquer pour changer</p>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">Cliquer ou glisser un fichier</p>
                  <p className="text-xs text-gray-400">PDF, Image (max 10MB)</p>
                </>
              )}
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Bouton analyse IA */}
          {uploadData.file && !ocrResult && (
            <Button
              onClick={analyzeDocument}
              disabled={analyzing}
              variant="outline"
              className="w-full"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {analyzing ? 'Analyse en cours...' : 'Analyser avec l\'IA'}
            </Button>
          )}

          {/* Résultat OCR */}
          {ocrResult && (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span className="font-semibold text-purple-800">Analyse IA</span>
                </div>
                {ocrResult.resume && (
                  <p className="text-sm text-gray-700 mb-2">{ocrResult.resume}</p>
                )}
                {ocrResult.medicaments?.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-purple-800 mb-1">Médicaments détectés:</p>
                    <div className="flex flex-wrap gap-1">
                      {ocrResult.medicaments.map((m, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {m.nom} {m.dosage && `- ${m.dosage}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Formulaire */}
          <div>
            <Label>Type de document *</Label>
            <Select value={uploadData.type} onValueChange={(v) => setUploadData({...uploadData, type: v})}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES_DOCUMENTS.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Nom du document *</Label>
            <Input
              value={uploadData.nom}
              onChange={(e) => setUploadData({...uploadData, nom: e.target.value})}
              placeholder="Ex: Ordonnance Dr. Martin"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Date du document</Label>
            <Input
              type="date"
              value={uploadData.date_document}
              onChange={(e) => setUploadData({...uploadData, date_document: e.target.value})}
              className="mt-1"
            />
          </div>

          <div>
            <Label>Professionnel de santé</Label>
            <Input
              value={uploadData.professionnel}
              onChange={(e) => setUploadData({...uploadData, professionnel: e.target.value})}
              placeholder="Nom du médecin"
              className="mt-1"
            />
          </div>

          <div>
            <Label>Description (optionnel)</Label>
            <Textarea
              value={uploadData.description}
              onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
              placeholder="Notes ou observations..."
              className="mt-1"
              rows={2}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => { setShowUpload(false); resetForm(); }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={() => saveDocumentMutation.mutate()}
              disabled={!uploadData.file || !uploadData.nom || uploading}
              className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </BottomSheet>

      {/* Bottom Sheet - Visualiseur détaillé */}
      <BottomSheet
        isOpen={!!showViewer}
        onClose={() => setShowViewer(null)}
        title="Détails du document"
        fullHeight
      >
        {showViewer && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              {(() => {
                const typeInfo = getTypeInfo(showViewer.type);
                const TypeIcon = typeInfo.icon;
                return (
                  <div className={`p-3 rounded-xl ${typeInfo.color}`}>
                    <TypeIcon className="w-6 h-6" />
                  </div>
                );
              })()}
              <div>
                <h2 className="font-bold text-lg">{showViewer.nom}</h2>
                <p className="text-sm text-gray-500">{getTypeInfo(showViewer.type).label}</p>
              </div>
            </div>

            {showViewer.ocr_data && (
              <Card className="bg-gray-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Contenu analysé par IA
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {showViewer.ocr_data.diagnostic && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Diagnostic</p>
                      <p className="text-sm">{showViewer.ocr_data.diagnostic}</p>
                    </div>
                  )}
                  
                  {showViewer.ocr_data.medicaments?.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-2">Médicaments prescrits</p>
                      <div className="space-y-2">
                        {showViewer.ocr_data.medicaments.map((med, i) => (
                          <div key={i} className="p-2 bg-white rounded-lg border">
                            <p className="font-medium text-sm">{med.nom}</p>
                            {med.dosage && <p className="text-xs text-gray-600">Dosage: {med.dosage}</p>}
                            {med.posologie && <p className="text-xs text-gray-600">Posologie: {med.posologie}</p>}
                            {med.duree && <p className="text-xs text-gray-600">Durée: {med.duree}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {showViewer.ocr_data.observations && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Observations</p>
                      <p className="text-sm">{showViewer.ocr_data.observations}</p>
                    </div>
                  )}

                  {showViewer.ocr_data.resume && (
                    <div>
                      <p className="text-xs font-medium text-gray-500">Résumé</p>
                      <p className="text-sm">{showViewer.ocr_data.resume}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-3">
              {showViewer.date_document && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Date</p>
                  <p className="font-medium">{format(new Date(showViewer.date_document), 'dd MMM yyyy', { locale: fr })}</p>
                </div>
              )}
              {showViewer.professionnel && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">Professionnel</p>
                  <p className="font-medium">Dr. {showViewer.professionnel}</p>
                </div>
              )}
            </div>

            <Button
              onClick={() => downloadDocument(showViewer)}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger le document
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}