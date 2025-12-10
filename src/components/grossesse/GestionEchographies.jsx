import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileImage, Upload, Eye, Download, Plus, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Gestion des échographies avec visualisation
 * - Upload PDF/DICOM
 * - Saisie mesures biométriques
 * - Visualisation historique
 */

export default function GestionEchographies({ grossesse }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedEcho, setSelectedEcho] = useState(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    date: '',
    type: 'T1_datation',
    semaine_amenorrhee: '',
    lieu: '',
    professionnel: '',
    mesures: {
      BPD: '',
      FL: '',
      HC: '',
      AC: '',
      CRL: '',
      NT: '',
      EPF: ''
    },
    interpretation: '',
    document: null
  });

  const typesEchographie = {
    'T1_datation': 'T1 - Échographie de datation (11-13 SA)',
    'T2_morphologique': 'T2 - Échographie morphologique (22-24 SA)',
    'T3_croissance': 'T3 - Échographie de croissance (32-34 SA)',
    'autre': 'Échographie supplémentaire'
  };

  const uploadEchographie = useMutation({
    mutationFn: async () => {
      let fileUrl = null;

      // Upload du document si présent
      if (formData.document) {
        const { file_url } = await base44.integrations.Core.UploadFile({
          file: formData.document
        });
        fileUrl = file_url;
      }

      // Mettre à jour la grossesse avec nouvelle échographie
      const echographies = grossesse.echographies || [];
      echographies.push({
        id: crypto.randomUUID(),
        date: formData.date,
        type: formData.type,
        semaine_amenorrhee: parseInt(formData.semaine_amenorrhee),
        lieu: formData.lieu,
        professionnel: formData.professionnel,
        mesures: Object.fromEntries(
          Object.entries(formData.mesures).filter(([_, v]) => v !== '')
        ),
        interpretation: formData.interpretation,
        document_url: fileUrl,
        created_date: new Date().toISOString()
      });

      await base44.entities.SuiviGrossesse.update(grossesse.id, {
        echographies
      });

      return echographies;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['grossesse_active']);
      toast.success('Échographie enregistrée ✅');
      setShowForm(false);
      resetForm();
    },
    onError: () => {
      toast.error('Erreur lors de l\'enregistrement');
    }
  });

  const resetForm = () => {
    setFormData({
      date: '',
      type: 'T1_datation',
      semaine_amenorrhee: '',
      lieu: '',
      professionnel: '',
      mesures: {
        BPD: '', FL: '', HC: '', AC: '', CRL: '', NT: '', EPF: ''
      },
      interpretation: '',
      document: null
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier taille (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Fichier trop volumineux (max 10 MB)');
        return;
      }
      setFormData({ ...formData, document: file });
    }
  };

  const echographies = grossesse.echographies || [];
  echographies.sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-blue-600" />
              Échographies ({echographies.length})
            </CardTitle>
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Ajouter
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {echographies.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileImage className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-sm">Aucune échographie enregistrée</p>
              <Button onClick={() => setShowForm(true)} className="mt-4" variant="outline">
                Ajouter la première échographie
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {echographies.map((echo) => (
                <Card key={echo.id} className="border cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedEcho(echo)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileImage className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-sm">
                          {typesEchographie[echo.type] || echo.type}
                        </span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">
                        {echo.semaine_amenorrhee} SA
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">
                      {format(new Date(echo.date), 'dd MMMM yyyy', { locale: fr })}
                      {echo.lieu && ` • ${echo.lieu}`}
                    </p>
                    {Object.keys(echo.mesures || {}).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(echo.mesures).map(([key, value]) => (
                          <Badge key={key} variant="outline" className="text-xs">
                            {key}: {value}mm
                          </Badge>
                        ))}
                      </div>
                    )}
                    {echo.document_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(echo.document_url, '_blank');
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Voir le document
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Ajout */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Ajouter une échographie</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Date *</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Semaine d'aménorrhée *</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 12"
                    value={formData.semaine_amenorrhee}
                    onChange={(e) => setFormData({ ...formData, semaine_amenorrhee: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Type d'échographie *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(typesEchographie).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Lieu</Label>
                  <Input
                    placeholder="Ex: CHU Cocody"
                    value={formData.lieu}
                    onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Praticien</Label>
                  <Input
                    placeholder="Dr. Nom"
                    value={formData.professionnel}
                    onChange={(e) => setFormData({ ...formData, professionnel: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Mesures biométriques (mm)</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.keys(formData.mesures).map((key) => (
                    <div key={key}>
                      <Label className="text-xs">{key}</Label>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="--"
                        value={formData.mesures[key]}
                        onChange={(e) => setFormData({
                          ...formData,
                          mesures: { ...formData.mesures, [key]: e.target.value }
                        })}
                      />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  BPD: Bipariétal, FL: Fémur, HC: Crânien, AC: Abdominal, CRL: Crown-Rump, NT: Nuque, EPF: Poids fœtal
                </p>
              </div>

              <div>
                <Label>Interprétation</Label>
                <Textarea
                  placeholder="Compte-rendu du praticien..."
                  value={formData.interpretation}
                  onChange={(e) => setFormData({ ...formData, interpretation: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Document (PDF ou DICOM)</Label>
                <Input
                  type="file"
                  accept=".pdf,.dcm,image/*"
                  onChange={handleFileChange}
                />
                {formData.document && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ {formData.document.name} ({(formData.document.size / 1024).toFixed(0)} Ko)
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => uploadEchographie.mutate()}
                  disabled={!formData.date || !formData.semaine_amenorrhee || uploadEchographie.isPending}
                  className="flex-1"
                >
                  {uploadEchographie.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Détails */}
      {selectedEcho && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedEcho(null)}>
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{typesEchographie[selectedEcho.type]}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setSelectedEcho(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-semibold">
                    {format(new Date(selectedEcho.date), 'dd MMMM yyyy', { locale: fr })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Semaine</p>
                  <p className="font-semibold">{selectedEcho.semaine_amenorrhee} SA</p>
                </div>
                {selectedEcho.lieu && (
                  <div>
                    <p className="text-gray-600">Lieu</p>
                    <p className="font-semibold">{selectedEcho.lieu}</p>
                  </div>
                )}
                {selectedEcho.professionnel && (
                  <div>
                    <p className="text-gray-600">Praticien</p>
                    <p className="font-semibold">{selectedEcho.professionnel}</p>
                  </div>
                )}
              </div>

              {Object.keys(selectedEcho.mesures || {}).length > 0 && (
                <div>
                  <p className="font-semibold mb-2">Mesures biométriques</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(selectedEcho.mesures).map(([key, value]) => (
                      <div key={key} className="p-2 bg-blue-50 rounded">
                        <p className="text-xs text-gray-600">{key}</p>
                        <p className="font-semibold">{value} mm</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEcho.interpretation && (
                <div>
                  <p className="font-semibold mb-2">Interprétation</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                    {selectedEcho.interpretation}
                  </p>
                </div>
              )}

              {selectedEcho.document_url && (
                <Button
                  onClick={() => window.open(selectedEcho.document_url, '_blank')}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger le document
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}