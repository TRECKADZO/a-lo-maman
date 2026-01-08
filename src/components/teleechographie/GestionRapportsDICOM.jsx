import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Upload, Eye, Download, Trash2, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const MODALITIES = [
  { value: 'US', label: 'Échographie' },
  { value: 'CR', label: 'Compte rendu' },
  { value: 'CT', label: 'CT Scan' },
  { value: 'MR', label: 'IRM' },
];

const FHIR_SCOPES = [
  'read:observations',
  'write:observations',
  'read:documents',
  'write:documents',
  'read:appointments',
];

export default function GestionRapportsDICOM({ centreId, centre }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [selectedModalité, setSelectedModalité] = useState('US');
  const [selectedScopes, setSelectedScopes] = useState(centre?.api_scopes?.filter(s => FHIR_SCOPES.includes(s)) || []);
  const [fhirEndpoint, setFhirEndpoint] = useState(centre?.fhir_endpoint || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: rapports, isLoading } = useQuery({
    queryKey: ['rapports_dicom', centreId],
    queryFn: async () => {
      const images = await base44.entities.ImageDICOM.filter({ body_part_examined: { $regex: 'Fetus|Fœtus' } });
      return images.filter(img => img.study_date);
    },
  });

  const toggleScope = (scope) => {
    setSelectedScopes(prev =>
      prev.includes(scope)
        ? prev.filter(s => s !== scope)
        : [...prev, scope]
    );
  };

  const updateFHIRMutation = useMutation({
    mutationFn: async () => {
      // Fusionner les scopes existants avec les nouveaux
      const existingScopes = centre?.api_scopes || [];
      const mergedScopes = Array.from(new Set([...existingScopes, ...selectedScopes]));
      
      await base44.entities.Clinique.update(centreId, {
        api_fhir_enabled: true,
        fhir_endpoint: fhirEndpoint,
        api_scopes: mergedScopes,
      });
    },
    onSuccess: () => {
      setSaveSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['centre', centreId] });
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleUploadDICOM = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileUrl = (await base44.integrations.Core.UploadFile({ file })).file_url;
      
      // Créer un enregistrement ImageDICOM
      await base44.entities.ImageDICOM.create({
        patient_email: centre.email_contact,
        grossesse_id: 'unknown',
        study_instance_uid: `uid-${Date.now()}`,
        series_instance_uid: `series-${Date.now()}`,
        sop_instance_uid: `sop-${Date.now()}`,
        modality: selectedModalité,
        study_date: new Date().toISOString().split('T')[0],
        study_description: file.name,
        institution_name: centre.nom,
        dicom_file_uri: fileUrl,
        anonymized: false,
      });

      queryClient.invalidateQueries({ queryKey: ['rapports_dicom', centreId] });
      alert('✅ Rapport DICOM uploadé avec succès');
    } catch (error) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {saveSuccess && (
        <Alert className="bg-green-50 border-green-300">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <AlertDescription className="text-green-800">
            ✅ Configuration FHIR sauvegardée
          </AlertDescription>
        </Alert>
      )}

      {/* Upload DICOM */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Rapports DICOM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="modalite">Type d'examen</Label>
            <Select value={selectedModalité} onValueChange={setSelectedModalité}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODALITIES.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dicom-file">Fichier DICOM</Label>
            <input
              id="dicom-file"
              type="file"
              accept=".dcm,.DCM"
              onChange={handleUploadDICOM}
              disabled={uploading}
              className="block w-full text-sm border rounded-lg cursor-pointer"
            />
          </div>

          <Button
            disabled={uploading}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Upload en cours...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Uploader DICOM
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* FHIR Integration */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Configuration FHIR
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fhir-endpoint">Endpoint FHIR</Label>
            <Input
              id="fhir-endpoint"
              value={fhirEndpoint}
              onChange={(e) => setFhirEndpoint(e.target.value)}
              placeholder="https://votre-serveur-fhir.com/fhir"
            />
          </div>

          <div className="space-y-3">
            <Label>Scopes d'accès</Label>
            <div className="space-y-2">
              {FHIR_SCOPES.map(scope => (
                <div key={scope} className="flex items-center gap-3 p-2 border rounded-lg">
                  <Checkbox
                    id={scope}
                    checked={selectedScopes.includes(scope)}
                    onCheckedChange={() => toggleScope(scope)}
                  />
                  <Label htmlFor={scope} className="cursor-pointer flex-1">
                    {scope}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={() => updateFHIRMutation.mutate()}
            disabled={updateFHIRMutation.isPending || !fhirEndpoint.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {updateFHIRMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              'Sauvegarder configuration FHIR'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Rapports récents */}
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Rapports DICOM ({rapports?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : rapports?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">Aucun rapport uploadé</p>
          ) : (
            <div className="space-y-2">
              {rapports.map(rapport => (
                <div key={rapport.id} className="p-4 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{rapport.study_description}</p>
                    <p className="text-sm text-gray-500">{rapport.study_date}</p>
                  </div>
                  <Badge>{rapport.modality}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}