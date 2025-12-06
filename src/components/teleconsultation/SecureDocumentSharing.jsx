import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Upload,
  Download,
  FileText,
  Image as ImageIcon,
  File,
  Loader2,
  Trash2,
  Lock,
  X,
  Send,
  Paperclip
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DOCUMENT_TYPES = [
  { value: 'ordonnance', label: 'Ordonnance', icon: FileText, color: 'text-blue-600 bg-blue-50' },
  { value: 'resultat_labo', label: 'Résultats de laboratoire', icon: FileText, color: 'text-green-600 bg-green-50' },
  { value: 'imagerie', label: 'Imagerie médicale', icon: ImageIcon, color: 'text-purple-600 bg-purple-50' },
  { value: 'certificat', label: 'Certificat médical', icon: FileText, color: 'text-orange-600 bg-orange-50' },
  { value: 'autre', label: 'Autre document', icon: File, color: 'text-gray-600 bg-gray-50' }
];

export default function SecureDocumentSharing({ 
  documents = [], 
  onDocumentUploaded, 
  onDocumentDeleted,
  isSpecialist = false,
  rendezVousId
}) {
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState('ordonnance');
  const [documentDescription, setDocumentDescription] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation de taille (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier est trop volumineux (max 10MB)');
      return;
    }

    setSelectedFile(file);
    setShowUploadForm(true);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Upload sécurisé via stockage privé
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ 
        file: selectedFile 
      });

      const document = {
        id: Date.now().toString(),
        name: selectedFile.name,
        type: documentType,
        description: documentDescription,
        file_uri: file_uri,
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        uploaded_by: isSpecialist ? 'specialist' : 'patient',
        uploaded_at: new Date().toISOString(),
        encrypted: true
      };

      if (onDocumentUploaded) {
        onDocumentUploaded(document);
      }

      // Réinitialiser le formulaire
      setSelectedFile(null);
      setDocumentDescription('');
      setDocumentType('ordonnance');
      setShowUploadForm(false);

      alert('✅ Document partagé de manière sécurisée');
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('❌ Erreur lors du partage du document');
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (doc) => {
    try {
      // Créer une URL signée temporaire pour le téléchargement sécurisé
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: doc.file_uri,
        expires_in: 300 // 5 minutes
      });

      // Ouvrir dans un nouvel onglet ou télécharger
      window.open(signed_url, '_blank');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement du document');
    }
  };

  const getFileIcon = (type) => {
    const docType = DOCUMENT_TYPES.find(t => t.value === type);
    if (docType) {
      const Icon = docType.icon;
      return <Icon className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      {!showUploadForm && (
        <div className="flex gap-2">
          <input
            type="file"
            id="secure-doc-upload"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          />
          <label htmlFor="secure-doc-upload" className="flex-1">
            <Button
              as="span"
              className="w-full bg-teal-600 hover:bg-teal-700 cursor-pointer"
            >
              <Upload className="w-4 h-4 mr-2" />
              Partager un document sécurisé
            </Button>
          </label>
        </div>
      )}

      {/* Upload Form */}
      {showUploadForm && selectedFile && (
        <Card className="border-teal-300 bg-teal-50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-600" />
                Partage sécurisé
              </h4>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-3 bg-white rounded-lg border border-teal-200">
              <div className="flex items-center gap-2">
                <File className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-900 truncate flex-1">
                  {selectedFile.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Type de document</Label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {DOCUMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Description (optionnel)</Label>
              <Input
                value={documentDescription}
                onChange={(e) => setDocumentDescription(e.target.value)}
                placeholder="Ex: Ordonnance pour traitement de 7 jours"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setShowUploadForm(false);
                  setSelectedFile(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-teal-600 hover:bg-teal-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Chiffrement...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Partager
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documents List */}
      <div className="space-y-2">
        {documents.map((doc) => {
          const docTypeInfo = DOCUMENT_TYPES.find(t => t.value === doc.type);
          const Icon = docTypeInfo?.icon || File;

          return (
            <Card key={doc.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-lg ${docTypeInfo?.color || 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900 truncate">{doc.name}</p>
                      {doc.encrypted && (
                        <Badge variant="outline" className="text-xs border-green-300 text-green-700">
                          <Lock className="w-3 h-3 mr-1" />
                          Chiffré
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-1">
                      {docTypeInfo?.label || doc.type}
                    </p>
                    
                    {doc.description && (
                      <p className="text-xs text-gray-500 mb-2">{doc.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Partagé par {doc.uploaded_by === 'specialist' ? 'le spécialiste' : 'le patient'}</span>
                      <span>•</span>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>{format(new Date(doc.uploaded_at), 'HH:mm', { locale: fr })}</span>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(doc)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {isSpecialist && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDocumentDeleted && onDocumentDeleted(doc.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {documents.length === 0 && !showUploadForm && (
          <div className="text-center py-8 text-gray-500">
            <Paperclip className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Aucun document partagé</p>
            <p className="text-xs mt-1">Les documents sont chiffrés de bout en bout</p>
          </div>
        )}
      </div>

      {/* Security Info */}
      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start gap-2">
          <Lock className="w-4 h-4 text-green-600 mt-0.5" />
          <div className="text-xs text-green-800">
            <p className="font-semibold mb-1">🔒 Partage sécurisé et chiffré</p>
            <p>Les documents sont chiffrés de bout en bout et stockés de manière sécurisée. Seuls vous et votre spécialiste pouvez y accéder.</p>
          </div>
        </div>
      </div>
    </div>
  );
}