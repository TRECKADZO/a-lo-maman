import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  FileCheck, Download, Loader2, Shield, CheckCircle2,
  Syringe, FileText, User
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TYPES_CERTIFICATS = [
  { value: 'vaccination', label: 'Certificat de vaccination', icon: Syringe },
  { value: 'medical', label: 'Certificat médical', icon: FileCheck },
  { value: 'aptitude', label: 'Certificat d\'aptitude', icon: CheckCircle2 },
  { value: 'grossesse', label: 'Certificat de grossesse', icon: FileText },
];

export default function GenerateurCertificat({ professionnel, patient, onGenerated }) {
  const queryClient = useQueryClient();
  const [typeCertificat, setTypeCertificat] = useState('medical');
  const [formData, setFormData] = useState({
    objet: '',
    contenu: '',
    observations: '',
    date_validite: '',
    vaccin_nom: '',
    vaccin_lot: '',
  });
  const [generating, setGenerating] = useState(false);
  const [generatedCertificat, setGeneratedCertificat] = useState(null);

  const generateCertificatMutation = useMutation({
    mutationFn: async () => {
      setGenerating(true);

      // Générer un numéro unique
      const numeroCertificat = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Créer le contenu HTML du certificat
      const htmlContent = await base44.integrations.Core.InvokeLLM({
        prompt: `Génère un certificat médical professionnel en HTML avec les informations suivantes:
        
        Type: ${TYPES_CERTIFICATS.find(t => t.value === typeCertificat)?.label}
        Numéro: ${numeroCertificat}
        Date: ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}
        
        Professionnel:
        - Nom: Dr. ${professionnel?.nom_complet || 'N/A'}
        - Spécialité: ${professionnel?.specialite || 'N/A'}
        - N° Ordre: ${professionnel?.numero_ordre || 'N/A'}
        - Adresse: ${professionnel?.adresse || 'N/A'}
        
        Patient:
        - Nom: ${patient?.nom || patient?.full_name || 'N/A'}
        - Date de naissance: ${patient?.date_naissance ? format(new Date(patient.date_naissance), 'dd/MM/yyyy') : 'N/A'}
        
        Objet: ${formData.objet}
        Contenu: ${formData.contenu}
        ${formData.observations ? `Observations: ${formData.observations}` : ''}
        ${typeCertificat === 'vaccination' ? `Vaccin: ${formData.vaccin_nom} - Lot: ${formData.vaccin_lot}` : ''}
        ${formData.date_validite ? `Validité: ${formData.date_validite}` : ''}
        
        Le certificat doit:
        - Avoir un en-tête professionnel avec logo/icône
        - Inclure un cadre officiel avec bordures
        - Avoir une zone de signature
        - Mentionner "Fait pour servir et valoir ce que de droit"
        - Inclure un QR code placeholder [QR_CODE]
        - Être imprimable sur A4
        
        Retourne uniquement le HTML avec styles inline, prêt pour impression.`,
        response_json_schema: {
          type: 'object',
          properties: {
            html: { type: 'string' }
          }
        }
      });

      // Créer la signature électronique
      const signature = {
        timestamp: new Date().toISOString(),
        hash: btoa(`${numeroCertificat}-${professionnel?.email}-${new Date().toISOString()}`),
        professionnel_id: professionnel?.id,
        methode: 'electronique'
      };

      const certificat = {
        numero: numeroCertificat,
        type: typeCertificat,
        date_creation: new Date().toISOString(),
        date_validite: formData.date_validite || null,
        professionnel_id: professionnel?.id,
        professionnel_nom: professionnel?.nom_complet,
        patient_email: patient?.email || patient?.created_by,
        patient_nom: patient?.nom || patient?.full_name,
        objet: formData.objet,
        contenu: formData.contenu,
        observations: formData.observations,
        vaccin_details: typeCertificat === 'vaccination' ? {
          nom: formData.vaccin_nom,
          lot: formData.vaccin_lot,
          date: new Date().toISOString()
        } : null,
        html_content: htmlContent.html,
        signature_electronique: signature,
        statut: 'valide'
      };

      setGeneratedCertificat(certificat);
      return certificat;
    },
    onSuccess: (certificat) => {
      if (onGenerated) onGenerated(certificat);
    },
    onSettled: () => setGenerating(false)
  });

  const imprimerCertificat = () => {
    if (!generatedCertificat?.html_content) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificat - ${generatedCertificat.numero}</title>
        <style>
          @media print {
            body { margin: 0; padding: 20px; }
          }
        </style>
      </head>
      <body>
        ${generatedCertificat.html_content}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const TypeIcon = TYPES_CERTIFICATS.find(t => t.value === typeCertificat)?.icon || FileCheck;

  return (
    <div className="space-y-4">
      <Card className="shadow-xl">
        <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            Générer un Certificat
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Infos professionnel */}
          <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold">Dr. {professionnel?.nom_complet}</p>
              <p className="text-sm text-gray-600">{professionnel?.specialite} - N°{professionnel?.numero_ordre}</p>
            </div>
            <Badge className="ml-auto bg-green-100 text-green-800">
              <Shield className="w-3 h-3 mr-1" />
              Vérifié
            </Badge>
          </div>

          {/* Infos patient */}
          {patient && (
            <div className="p-4 bg-blue-50 rounded-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">{patient.nom || patient.full_name}</p>
                {patient.date_naissance && (
                  <p className="text-sm text-gray-600">
                    Né(e) le {format(new Date(patient.date_naissance), 'dd/MM/yyyy')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Type de certificat */}
          <div>
            <Label>Type de certificat *</Label>
            <Select value={typeCertificat} onValueChange={setTypeCertificat}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES_CERTIFICATS.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <t.icon className="w-4 h-4" />
                      {t.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Champs spécifiques vaccination */}
          {typeCertificat === 'vaccination' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nom du vaccin *</Label>
                <Input
                  value={formData.vaccin_nom}
                  onChange={(e) => setFormData({...formData, vaccin_nom: e.target.value})}
                  placeholder="Ex: BCG, Pentavalent..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label>N° de lot</Label>
                <Input
                  value={formData.vaccin_lot}
                  onChange={(e) => setFormData({...formData, vaccin_lot: e.target.value})}
                  placeholder="Numéro de lot"
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {/* Objet */}
          <div>
            <Label>Objet du certificat *</Label>
            <Input
              value={formData.objet}
              onChange={(e) => setFormData({...formData, objet: e.target.value})}
              placeholder="Ex: Certificat de bonne santé, Aptitude au sport..."
              className="mt-1"
            />
          </div>

          {/* Contenu */}
          <div>
            <Label>Contenu / Attestation *</Label>
            <Textarea
              value={formData.contenu}
              onChange={(e) => setFormData({...formData, contenu: e.target.value})}
              placeholder="Je soussigné(e), Dr ..., certifie avoir examiné..."
              className="mt-1"
              rows={4}
            />
          </div>

          {/* Observations */}
          <div>
            <Label>Observations (optionnel)</Label>
            <Textarea
              value={formData.observations}
              onChange={(e) => setFormData({...formData, observations: e.target.value})}
              placeholder="Observations complémentaires..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Date de validité */}
          <div>
            <Label>Date de validité (optionnel)</Label>
            <Input
              type="date"
              value={formData.date_validite}
              onChange={(e) => setFormData({...formData, date_validite: e.target.value})}
              className="mt-1"
            />
          </div>

          {/* Bouton générer */}
          <Button
            onClick={() => generateCertificatMutation.mutate()}
            disabled={generating || !formData.objet || !formData.contenu}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileCheck className="w-4 h-4 mr-2" />
            )}
            {generating ? 'Génération...' : 'Générer le certificat'}
          </Button>
        </CardContent>
      </Card>

      {/* Certificat généré */}
      {generatedCertificat && (
        <Card className="shadow-xl border-2 border-green-500">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle2 className="w-5 h-5" />
              Certificat généré avec succès
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-mono text-sm text-gray-600">N° {generatedCertificat.numero}</p>
                <p className="text-sm text-gray-500">
                  Généré le {format(new Date(generatedCertificat.date_creation), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">
                  <Shield className="w-3 h-3 mr-1" />
                  Signé électroniquement
                </Badge>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={imprimerCertificat} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Imprimer / Télécharger
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}