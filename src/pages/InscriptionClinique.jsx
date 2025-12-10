import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Building2, Upload, CheckCircle, Loader2, FileText, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function InscriptionClinique() {
  const navigate = useNavigate();
  const [etape, setEtape] = useState(1);
  const [formData, setFormData] = useState({
    nom: '',
    type_etablissement: 'clinique_privee',
    numero_agrement: '',
    region: '',
    ville: '',
    adresse: '',
    telephone: '',
    email_contact: '',
    administrateur_nom: '',
    administrateur_email: '',
    administrateur_telephone: '',
    services_offerts: [],
    capacite_lits: '',
    certifications: [],
    assurances_partenaires: [],
    document_agrement: null,
    document_registre_commerce: null,
    scopes_demandes: ['read:patients', 'read:appointments']
  });

  const servicesDisponibles = [
    'consultation_prenatale',
    'accouchement',
    'pediatrie',
    'echographie',
    'laboratoire',
    'urgences',
    'planification_familiale'
  ];

  const scopesDisponibles = [
    { value: 'read:patients', label: 'Lire profils patients', type: 'lecture' },
    { value: 'write:patients', label: 'Créer/modifier patients', type: 'ecriture' },
    { value: 'read:appointments', label: 'Lire rendez-vous', type: 'lecture' },
    { value: 'write:appointments', label: 'Gérer rendez-vous', type: 'ecriture' },
    { value: 'read:observations', label: 'Lire observations médicales', type: 'lecture' },
    { value: 'write:observations', label: 'Créer observations', type: 'ecriture' },
    { value: 'read:documents', label: 'Télécharger documents', type: 'lecture' },
    { value: 'write:documents', label: 'Uploader documents', type: 'ecriture' },
    { value: 'admin:webhooks', label: 'Gérer webhooks', type: 'admin' },
    { value: 'fhir:*', label: 'Accès FHIR complet', type: 'admin' }
  ];

  const handleFileUpload = async (e, fieldName) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 5 MB)');
      return;
    }

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, [fieldName]: file_url });
      toast.success('Document uploadé ✅');
    } catch (error) {
      toast.error('Erreur upload document');
    }
  };

  const soumettreDemande = useMutation({
    mutationFn: async () => {
      const demande = {
        ...formData,
        statut_validation: 'en_attente',
        date_demande: new Date().toISOString(),
        api_key: 'PENDING_VALIDATION', // Sera générée après validation
        api_fhir_enabled: formData.scopes_demandes.includes('fhir:*'),
        api_scopes: formData.scopes_demandes
      };

      // Créer la demande (nécessite validation admin)
      return await base44.entities.Clinique.create(demande);
    },
    onSuccess: () => {
      toast.success('Demande envoyée ! Vous recevrez un email sous 48h.');
      setEtape(4);
    },
    onError: () => {
      toast.error('Erreur lors de l\'envoi');
    }
  });

  const toggleService = (service) => {
    const services = formData.services_offerts.includes(service)
      ? formData.services_offerts.filter(s => s !== service)
      : [...formData.services_offerts, service];
    setFormData({ ...formData, services_offerts: services });
  };

  const toggleScope = (scope) => {
    const scopes = formData.scopes_demandes.includes(scope)
      ? formData.scopes_demandes.filter(s => s !== scope)
      : [...formData.scopes_demandes, scope];
    setFormData({ ...formData, scopes_demandes: scopes });
  };

  if (etape === 4) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Demande envoyée !</h2>
            <p className="text-gray-600 mb-6">
              Votre demande d'inscription est en cours de validation. 
              Notre équipe vous contactera sous 48h à l'adresse {formData.email_contact}.
            </p>
            <Button onClick={() => navigate(createPageUrl('0_Accueil'))}>
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Inscription Établissement de Santé</h1>
          <p className="text-gray-600">Rejoignez le réseau A'lo Maman</p>
        </div>

        {/* Progress */}
        <div className="flex justify-center mb-8">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                etape >= num ? 'bg-teal-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {num}
              </div>
              {num < 3 && <div className={`w-16 h-1 ${etape > num ? 'bg-teal-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle>
              {etape === 1 && "Informations de l'établissement"}
              {etape === 2 && "Services et API"}
              {etape === 3 && "Documents officiels"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Étape 1: Infos établissement */}
            {etape === 1 && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nom de l'établissement *</Label>
                    <Input
                      placeholder="CHU Cocody"
                      value={formData.nom}
                      onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Type d'établissement *</Label>
                    <Select value={formData.type_etablissement} onValueChange={(v) => setFormData({ ...formData, type_etablissement: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clinique_privee">Clinique privée</SelectItem>
                        <SelectItem value="hopital_public">Hôpital public</SelectItem>
                        <SelectItem value="centre_sante">Centre de santé</SelectItem>
                        <SelectItem value="maternite">Maternité</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Numéro d'agrément MSP *</Label>
                    <Input
                      placeholder="AGR/MSP/2024/..."
                      value={formData.numero_agrement}
                      onChange={(e) => setFormData({ ...formData, numero_agrement: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Capacité (lits)</Label>
                    <Input
                      type="number"
                      placeholder="50"
                      value={formData.capacite_lits}
                      onChange={(e) => setFormData({ ...formData, capacite_lits: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Région *</Label>
                    <Input
                      placeholder="Abidjan"
                      value={formData.region}
                      onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Ville *</Label>
                    <Input
                      placeholder="Cocody"
                      value={formData.ville}
                      onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Adresse complète *</Label>
                  <Textarea
                    placeholder="II Plateaux, Boulevard Latrille..."
                    value={formData.adresse}
                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Téléphone *</Label>
                    <Input
                      type="tel"
                      placeholder="+225 XX XX XX XX XX"
                      value={formData.telephone}
                      onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Email de contact *</Label>
                    <Input
                      type="email"
                      placeholder="contact@clinique.ci"
                      value={formData.email_contact}
                      onChange={(e) => setFormData({ ...formData, email_contact: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold mb-3">Administrateur principal</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Nom complet *</Label>
                      <Input
                        placeholder="Dr. Koffi Kouassi"
                        value={formData.administrateur_nom}
                        onChange={(e) => setFormData({ ...formData, administrateur_nom: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Email *</Label>
                      <Input
                        type="email"
                        placeholder="admin@clinique.ci"
                        value={formData.administrateur_email}
                        onChange={(e) => setFormData({ ...formData, administrateur_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Téléphone *</Label>
                      <Input
                        type="tel"
                        placeholder="+225..."
                        value={formData.administrateur_telephone}
                        onChange={(e) => setFormData({ ...formData, administrateur_telephone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => setEtape(2)}
                  disabled={!formData.nom || !formData.email_contact || !formData.numero_agrement}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  Continuer →
                </Button>
              </>
            )}

            {/* Étape 2: Services et API */}
            {etape === 2 && (
              <>
                <div>
                  <Label className="mb-3 block">Services offerts *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {servicesDisponibles.map((service) => (
                      <div key={service} className="flex items-center gap-2">
                        <Checkbox
                          id={service}
                          checked={formData.services_offerts.includes(service)}
                          onCheckedChange={() => toggleService(service)}
                        />
                        <Label htmlFor={service} className="text-sm cursor-pointer">
                          {service.replace(/_/g, ' ')}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Scopes API demandés
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Sélectionnez les permissions dont votre établissement a besoin pour l'intégration API.
                  </p>
                  
                  <div className="space-y-2">
                    {scopesDisponibles.map((scope) => (
                      <div key={scope.value} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                        <Checkbox
                          id={scope.value}
                          checked={formData.scopes_demandes.includes(scope.value)}
                          onCheckedChange={() => toggleScope(scope.value)}
                        />
                        <div className="flex-1">
                          <Label htmlFor={scope.value} className="cursor-pointer">
                            {scope.label}
                          </Label>
                          <Badge className="ml-2 text-xs" variant={
                            scope.type === 'lecture' ? 'outline' : 
                            scope.type === 'ecriture' ? 'default' : 'secondary'
                          }>
                            {scope.type}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEtape(1)} className="flex-1">
                    ← Retour
                  </Button>
                  <Button
                    onClick={() => setEtape(3)}
                    disabled={formData.services_offerts.length === 0}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    Continuer →
                  </Button>
                </div>
              </>
            )}

            {/* Étape 3: Documents */}
            {etape === 3 && (
              <>
                <div className="space-y-4">
                  <div>
                    <Label>Agrément MSP (PDF) *</Label>
                    <div className="mt-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, 'document_agrement')}
                      />
                      {formData.document_agrement && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Document uploadé
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Registre de commerce (PDF) *</Label>
                    <div className="mt-2">
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleFileUpload(e, 'document_registre_commerce')}
                      />
                      {formData.document_registre_commerce && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Document uploadé
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Documents requis</p>
                        <ul className="space-y-1 text-xs">
                          <li>• Agrément MSP valide</li>
                          <li>• Registre de commerce ou équivalent</li>
                          <li>• Format PDF uniquement (max 5 MB)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEtape(2)} className="flex-1">
                    ← Retour
                  </Button>
                  <Button
                    onClick={() => soumettreDemande.mutate()}
                    disabled={!formData.document_agrement || !formData.document_registre_commerce || soumettreDemande.isPending}
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                  >
                    {soumettreDemande.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Envoi...
                      </>
                    ) : (
                      'Soumettre la demande'
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}