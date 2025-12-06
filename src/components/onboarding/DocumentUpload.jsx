import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, FileText, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

export default function DocumentUpload({ onComplete, initialDocuments = [] }) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentLabel, setCurrentLabel] = useState('');

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validation taille
    if (file.size > MAX_FILE_SIZE) {
      setError('Le fichier est trop volumineux. Taille maximale: 5MB');
      return;
    }

    // Validation type
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setError('Type de fichier non accepté. Utilisez PDF, JPG ou PNG');
      return;
    }

    setCurrentFile(file);
  };

  const handleUpload = async () => {
    if (!currentFile || !currentLabel.trim()) {
      setError('Veuillez sélectionner un fichier et entrer une description');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Upload du fichier
      const { file_url } = await base44.integrations.Core.UploadFile({ file: currentFile });

      const newDocument = {
        label: currentLabel,
        file_url: file_url,
        file_name: currentFile.name,
        file_type: currentFile.type,
        uploaded_at: new Date().toISOString(),
      };

      setDocuments([...documents, newDocument]);
      setCurrentFile(null);
      setCurrentLabel('');
      
      // Reset le input file
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';

    } catch (err) {
      console.error('Erreur upload:', err);
      setError('Erreur lors de l\'upload. Veuillez réessayer.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleComplete = () => {
    if (documents.length === 0) {
      setError('Veuillez uploader au moins un document (diplôme, licence, etc.)');
      return;
    }
    onComplete(documents);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Documents Professionnels</h3>
        <p className="text-sm text-gray-600">
          Uploadez vos diplômes, licences professionnelles, certifications (PDF, JPG ou PNG - Max 5MB)
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Zone d'upload */}
      <Card className="p-6 bg-gray-50">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="doc-label">Description du document *</Label>
            <Input
              id="doc-label"
              placeholder="Ex: Diplôme de Médecine, Licence d'exercice..."
              value={currentLabel}
              onChange={(e) => setCurrentLabel(e.target.value)}
              disabled={uploading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Fichier *</Label>
            <div className="flex gap-3 items-center">
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileSelect}
                disabled={uploading}
                className="flex-1"
              />
              <Button
                onClick={handleUpload}
                disabled={!currentFile || !currentLabel.trim() || uploading}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter
                  </>
                )}
              </Button>
            </div>
            {currentFile && (
              <p className="text-sm text-gray-600">
                Fichier sélectionné: {currentFile.name} ({(currentFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Liste des documents uploadés */}
      {documents.length > 0 && (
        <div className="space-y-3">
          <Label>Documents uploadés ({documents.length})</Label>
          {documents.map((doc, index) => (
            <Card key={index} className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.label}</p>
                    <p className="text-sm text-gray-500 truncate">{doc.file_name}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  disabled={uploading}
                  className="ml-2"
                >
                  <X className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Boutons de navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={() => handleComplete()} disabled={uploading}>
          Passer cette étape
        </Button>
        <Button
          onClick={handleComplete}
          disabled={documents.length === 0 || uploading}
          className="bg-teal-600 hover:bg-teal-700"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}