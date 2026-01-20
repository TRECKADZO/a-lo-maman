import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Building2, Upload, CheckCircle, Loader2, ArrowRight, ArrowLeft, MapPin, Phone, Mail, FileText, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const REGIONS = [
  "Abidjan", "Agnéby-Tiassa", "Bafing", "Bagoué", "Bélier", "Béré",
  "Bounkani", "Cavally", "Folon", "Gbêkê", "Gbôklé", "Gôh", "Gontougo",
  "Grands-Ponts", "Guémon", "Hambol", "Haut-Sassandra", "Iffou",
  "Indénié-Djuablin", "Kabadougou", "La Mé", "Lôh-Djiboua", "Marahoué",
  "Moronou", "N'Zi", "Nawa", "Poro", "San-Pédro", "Sud-Comoé",
  "Tchologo", "Tonkpi", "Worodougou", "Yamoussoukro"
].sort();

const TYPES_ETABLISSEMENT = [
  { value: 'clinique_privee', label: 'Clinique privée' },
  { value: 'hopital_public', label: 'Hôpital public' },
  { value: 'centre_sante', label: 'Centre de santé' },
  { value: 'maternite', label: 'Maternité' },
  { value: 'pmi', label: 'PMI' },
];

const SERVICES = [
  { value: 'consultation_prenatale', label: 'Consultation prénatale' },
  { value: 'accouchement', label: 'Accouchement' },
  { value: 'pediatrie', label: 'Pédiatrie' },
  { value: 'echographie', label: 'Échographie' },
  { value: 'laboratoire', label: 'Laboratoire' },
  { value: 'urgences', label: 'Urgences' },
  { value: 'planification_familiale', label: 'Planification familiale' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'suivi_post_partum', label: 'Suivi post-partum' },
];

export default function InscriptionClinique() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({
    nom: '',
    type_etablissement: 'clinique_privee',
    region: '',
    ville: '',
    telephone: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      setError('Utilisateur non connecté');
      return;
    }

    if (!formData.nom?.trim() || !formData.region || !formData.ville?.trim() || !formData.telephone?.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const codeInvitation = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const centreData = {
        nom: formData.nom.trim(),
        type_etablissement: formData.type_etablissement,
        region: formData.region,
        ville: formData.ville.trim(),
        telephone: formData.telephone.trim(),
        email_contact: user.email,
        administrateur_email: user.email,
        administrateur_nom: user.full_name || '',
        administrateurs: [user.email],
        code_invitation: codeInvitation,
        statut_validation: 'approuve',
        actif: true,
        onboarding_completed: false,
        date_demande: new Date().toISOString(),
      };

      console.log('🏥 Création centre:', centreData);
      await base44.entities.Clinique.create(centreData);
      console.log('✅ Centre créé avec succès');
      
      // Stocker un flag pour éviter la redirection vers SelectionCompte
      localStorage.setItem('centre_just_created', 'true');
      
      setTimeout(() => {
        window.location.href = createPageUrl('Dashboard') + '?t=' + Date.now();
      }, 2000);
      
    } catch (err) {
      console.error('❌ Erreur création:', err);
      setError(err.message || 'Erreur lors de la création du centre');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-16 h-16 animate-spin text-teal-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Création en cours...</h3>
            <p className="text-gray-600">
              Votre centre de santé est en cours de création. Vous serez redirigé automatiquement.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-teal-50 to-cyan-50 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto py-4 sm:py-6 md:py-8 px-4 sm:px-6 md:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl">
              <Building2 className="w-9 h-9 sm:w-11 sm:h-11 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">
              Créer votre Centre de Santé
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Rejoignez A'lo Maman en quelques clics. Complétez votre profil ensuite dans le tableau de bord.
            </p>
          </div>

          {/* Formulaire simplifié */}
          <Card className="shadow-2xl border-none">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-3">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600 flex-shrink-0" />
                <span>Informations essentielles</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="p-4 sm:p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <Label htmlFor="nom" className="text-xs sm:text-sm">Nom de l'établissement *</Label>
                  <Input
                    id="nom"
                    placeholder="Ex: Clinique Notre-Dame"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    className="mt-1 text-base"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="type" className="text-xs sm:text-sm">Type d'établissement *</Label>
                  <Select 
                    value={formData.type_etablissement} 
                    onValueChange={(v) => setFormData({...formData, type_etablissement: v})}
                  >
                    <SelectTrigger className="mt-1 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPES_ETABLISSEMENT.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label htmlFor="region" className="text-xs sm:text-sm">Région *</Label>
                    <Select 
                      value={formData.region} 
                      onValueChange={(v) => setFormData({...formData, region: v})}
                    >
                      <SelectTrigger className="mt-1 text-base">
                        <SelectValue placeholder="Sélectionner" />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map(region => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="ville" className="text-xs sm:text-sm">Ville *</Label>
                    <Input
                      id="ville"
                      placeholder="Ex: Abidjan"
                      value={formData.ville}
                      onChange={(e) => setFormData({...formData, ville: e.target.value})}
                      className="mt-1 text-base"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="telephone" className="text-xs sm:text-sm">Téléphone principal *</Label>
                  <Input
                    id="telephone"
                    type="tel"
                    placeholder="+225 XX XX XX XX XX"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    className="mt-1 text-base"
                    required
                  />
                </div>

                <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs sm:text-sm text-blue-900">
                    <CheckCircle className="w-4 h-4 inline mr-2" />
                    <strong>Vous êtes administrateur:</strong> {user?.email}
                  </p>
                </div>

                <div className="p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-xs sm:text-sm text-amber-900 mb-2">
                    📋 <strong>Prochaines étapes après création :</strong>
                  </p>
                  <ul className="text-xs text-amber-800 space-y-1 ml-4">
                    <li>• Compléter les informations (agrément, adresse, services...)</li>
                    <li>• Configurer vos horaires et tarifs</li>
                    <li>• Inviter votre équipe</li>
                    <li>• Personnaliser votre profil public</li>
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(createPageUrl('SelectionCompte'))}
                    className="flex-1 text-sm sm:text-base"
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-sm sm:text-base"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Créer mon centre
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Aide */}
          <Card className="mt-4 border-none shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardContent className="p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm text-blue-900 min-w-0">
                <p className="font-semibold mb-1">Besoin d'aide ?</p>
                <p className="text-blue-700">
                  Contactez <strong>support@alomaman.ci</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}