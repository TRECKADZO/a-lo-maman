import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  Upload,
  Plus,
  Bell,
  Download,
  ChevronDown,
  ChevronUp,
  Syringe
} from 'lucide-react';
import { format, differenceInMonths, addMonths, addDays, isBefore, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BottomSheet } from '@/components/ui/safe-area-view';
import { Touchable } from '@/components/ui/native-interactions';

// Calendrier vaccinal recommandé (Côte d'Ivoire / OMS)
const CALENDRIER_VACCINAL = [
  { nom: 'BCG', age_mois: 0, description: 'Protection contre la tuberculose' },
  { nom: 'Polio 0 (VPO)', age_mois: 0, description: 'Dose de naissance' },
  { nom: 'Hépatite B', age_mois: 0, description: 'Dose de naissance' },
  { nom: 'Pentavalent 1', age_mois: 2, description: 'DTC-HepB-Hib' },
  { nom: 'Polio 1 (VPO)', age_mois: 2, description: '1ère dose' },
  { nom: 'Pneumocoque 1', age_mois: 2, description: 'PCV13' },
  { nom: 'Rotavirus 1', age_mois: 2, description: '1ère dose' },
  { nom: 'Pentavalent 2', age_mois: 3, description: 'DTC-HepB-Hib' },
  { nom: 'Polio 2 (VPO)', age_mois: 3, description: '2ème dose' },
  { nom: 'Pneumocoque 2', age_mois: 3, description: 'PCV13' },
  { nom: 'Rotavirus 2', age_mois: 3, description: '2ème dose' },
  { nom: 'Pentavalent 3', age_mois: 4, description: 'DTC-HepB-Hib' },
  { nom: 'Polio 3 (VPO)', age_mois: 4, description: '3ème dose' },
  { nom: 'Pneumocoque 3', age_mois: 4, description: 'PCV13' },
  { nom: 'VPI', age_mois: 4, description: 'Vaccin Polio Inactivé' },
  { nom: 'Rougeole-Rubéole 1', age_mois: 9, description: '1ère dose' },
  { nom: 'Fièvre Jaune', age_mois: 9, description: 'Dose unique' },
  { nom: 'Rougeole-Rubéole 2', age_mois: 15, description: '2ème dose (rappel)' },
  { nom: 'DTC Rappel', age_mois: 18, description: 'Rappel diphtérie, tétanos, coqueluche' },
];

export default function SuiviVaccinal({ enfant, isEditable = false }) {
  const queryClient = useQueryClient();
  const [showAjouter, setShowAjouter] = useState(false);
  const [vaccinSelectionne, setVaccinSelectionne] = useState(null);
  const [expandedVaccin, setExpandedVaccin] = useState(null);
  const [formData, setFormData] = useState({
    nom_vaccin: '',
    date_administration: new Date().toISOString().split('T')[0],
    lieu: '',
    professionnel: '',
    lot: '',
    prochain_rappel: '',
    document_uri: null,
    document_name: null,
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Calculer l'âge de l'enfant en mois
  const ageEnMois = differenceInMonths(new Date(), new Date(enfant.date_naissance));

  // Générer le calendrier prévu basé sur la date de naissance
  const calendrierPrevu = CALENDRIER_VACCINAL.map(vaccin => ({
    ...vaccin,
    date_prevue: addMonths(new Date(enfant.date_naissance), vaccin.age_mois),
    statut: 'prevu'
  }));

  // Fusionner avec les vaccins administrés
  const vaccins = enfant.vaccins || [];
  const calendrierComplet = calendrierPrevu.map(vaccinPrevu => {
    const vaccinAdministre = vaccins.find(v => 
      v.nom_vaccin.toLowerCase().includes(vaccinPrevu.nom.toLowerCase()) ||
      vaccinPrevu.nom.toLowerCase().includes(v.nom_vaccin.toLowerCase())
    );

    if (vaccinAdministre) {
      const dateAdmin = new Date(vaccinAdministre.date_administration);
      const joursRetard = differenceInDays(dateAdmin, vaccinPrevu.date_prevue);
      
      return {
        ...vaccinPrevu,
        ...vaccinAdministre,
        statut: 'administre',
        joursRetard: joursRetard > 0 ? joursRetard : 0
      };
    }

    const maintenant = new Date();
    const dateButoir = addDays(vaccinPrevu.date_prevue, 30); // 30 jours de marge
    
    if (isBefore(maintenant, vaccinPrevu.date_prevue)) {
      return { ...vaccinPrevu, statut: 'a_venir' };
    } else if (isBefore(maintenant, dateButoir)) {
      return { ...vaccinPrevu, statut: 'a_faire' };
    } else {
      return { ...vaccinPrevu, statut: 'retard' };
    }
  });

  // Statistiques
  const stats = {
    total: calendrierComplet.length,
    administres: calendrierComplet.filter(v => v.statut === 'administre').length,
    a_faire: calendrierComplet.filter(v => v.statut === 'a_faire').length,
    retard: calendrierComplet.filter(v => v.statut === 'retard').length,
    a_venir: calendrierComplet.filter(v => v.statut === 'a_venir').length,
  };

  const tauxCompletion = Math.round((stats.administres / stats.total) * 100);

  // Prochain vaccin urgent
  const prochainVaccinUrgent = calendrierComplet
    .filter(v => v.statut === 'a_faire' || v.statut === 'retard')
    .sort((a, b) => new Date(a.date_prevue) - new Date(b.date_prevue))[0];

  // Créer/mettre à jour les notifications automatiques
  useEffect(() => {
    if (!enfant.id) return;
    
    const vaccinsANotifier = calendrierComplet.filter(v => 
      v.statut === 'a_faire' || v.statut === 'retard'
    );

    vaccinsANotifier.forEach(vaccin => {
      creerNotificationVaccin(vaccin);
    });
  }, [enfant.id]);

  const creerNotificationVaccin = async (vaccin) => {
    try {
      const user = await base44.auth.me();
      const joursRetard = vaccin.statut === 'retard' 
        ? differenceInDays(new Date(), vaccin.date_prevue) 
        : 0;

      const titre = joursRetard > 0
        ? `⚠️ Vaccin en retard - ${enfant.prenom}`
        : `🔔 Rappel vaccin - ${enfant.prenom}`;

      const message = joursRetard > 0
        ? `Le vaccin "${vaccin.nom}" est en retard de ${joursRetard} jours pour ${enfant.prenom}. Prenez rendez-vous rapidement.`
        : `Il est temps de faire le vaccin "${vaccin.nom}" pour ${enfant.prenom}. Prévu le ${format(vaccin.date_prevue, 'dd/MM/yyyy')}.`;

      await base44.entities.Notification.create({
        destinataire_email: user.email,
        type: 'vaccin_rappel',
        titre,
        message,
        priorite: joursRetard > 30 ? 'urgente' : joursRetard > 0 ? 'haute' : 'normale',
        icone: 'Syringe',
        action_page: 'Enfants',
        action_params: { enfantId: enfant.id, onglet: 'vaccins' },
        metadata: {
          enfant_id: enfant.id,
          vaccin_nom: vaccin.nom,
          date_prevue: vaccin.date_prevue,
          statut: vaccin.statut
        }
      });
    } catch (error) {
      console.error('Erreur création notification:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingDoc(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      setFormData({
        ...formData,
        document_uri: file_uri,
        document_name: file.name
      });
    } catch (error) {
      console.error('Erreur upload:', error);
      alert('Erreur lors de l\'upload du document');
    } finally {
      setUploadingDoc(false);
    }
  };

  const ajouterVaccinMutation = useMutation({
    mutationFn: async (data) => {
      const vaccinsActuels = enfant.vaccins || [];
      await base44.entities.EnfantCarnet.update(enfant.id, {
        vaccins: [...vaccinsActuels, data]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier_enfant', enfant.id] });
      queryClient.invalidateQueries({ queryKey: ['enfants'] });
      setShowAjouter(false);
      setVaccinSelectionne(null);
      setFormData({
        nom_vaccin: '',
        date_administration: new Date().toISOString().split('T')[0],
        lieu: '',
        professionnel: '',
        lot: '',
        prochain_rappel: '',
        document_uri: null,
        document_name: null,
      });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    ajouterVaccinMutation.mutate(formData);
  };

  const telechargerCertificat = async (documentUri) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: documentUri,
        expires_in: 3600
      });
      window.open(signed_url, '_blank');
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement du document');
    }
  };

  const getStatutColor = (statut) => {
    switch(statut) {
      case 'administre': return 'bg-green-100 text-green-800 border-green-300';
      case 'a_faire': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'retard': return 'bg-red-100 text-red-800 border-red-300';
      case 'a_venir': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatutIcon = (statut) => {
    switch(statut) {
      case 'administre': return <CheckCircle2 className="w-4 h-4" />;
      case 'a_faire': return <Clock className="w-4 h-4" />;
      case 'retard': return <AlertCircle className="w-4 h-4" />;
      case 'a_venir': return <Calendar className="w-4 h-4" />;
      default: return <Syringe className="w-4 h-4" />;
    }
  };

  const getStatutLabel = (statut) => {
    switch(statut) {
      case 'administre': return 'Fait';
      case 'a_faire': return 'À faire';
      case 'retard': return 'En retard';
      case 'a_venir': return 'À venir';
      default: return 'Prévu';
    }
  };

  return (
    <div className="space-y-4">
      {/* Alerte vaccin urgent */}
      {prochainVaccinUrgent && (
        <Card className={`border-2 ${prochainVaccinUrgent.statut === 'retard' ? 'border-red-500 bg-red-50' : 'border-orange-500 bg-orange-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl ${prochainVaccinUrgent.statut === 'retard' ? 'bg-red-500' : 'bg-orange-500'}`}>
                {prochainVaccinUrgent.statut === 'retard' ? (
                  <AlertCircle className="w-6 h-6 text-white" />
                ) : (
                  <Bell className="w-6 h-6 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  {prochainVaccinUrgent.statut === 'retard' ? '⚠️ Vaccin en retard' : '🔔 Vaccin à faire'}
                </h3>
                <p className="text-sm font-semibold">{prochainVaccinUrgent.nom}</p>
                <p className="text-xs text-gray-600 mt-1">{prochainVaccinUrgent.description}</p>
                <p className="text-xs mt-2">
                  Date prévue: <strong>{format(prochainVaccinUrgent.date_prevue, 'dd MMMM yyyy', { locale: fr })}</strong>
                </p>
                {prochainVaccinUrgent.statut === 'retard' && (
                  <p className="text-xs text-red-600 font-semibold mt-1">
                    Retard: {differenceInDays(new Date(), prochainVaccinUrgent.date_prevue)} jours
                  </p>
                )}
              </div>
              {isEditable && (
                <Touchable onPress={() => {
                  setVaccinSelectionne(prochainVaccinUrgent);
                  setFormData({
                    ...formData,
                    nom_vaccin: prochainVaccinUrgent.nom,
                  });
                  setShowAjouter(true);
                }}>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Marquer fait
                  </Button>
                </Touchable>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-none shadow-lg">
          <CardContent className="p-4 text-center">
            <Shield className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-blue-600">{stats.administres}/{stats.total}</p>
            <p className="text-xs text-blue-900">Vaccins faits</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-none shadow-lg">
          <CardContent className="p-4 text-center">
            <Clock className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-orange-600">{stats.a_faire}</p>
            <p className="text-xs text-orange-900">À faire</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-none shadow-lg">
          <CardContent className="p-4 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-red-600">{stats.retard}</p>
            <p className="text-xs text-red-900">En retard</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-none shadow-lg">
          <CardContent className="p-4 text-center">
            <Calendar className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-600">{stats.a_venir}</p>
            <p className="text-xs text-purple-900">À venir</p>
          </CardContent>
        </Card>
      </div>

      {/* Progression */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold">Protection vaccinale</span>
            <span className="text-lg font-bold text-green-600">{tauxCompletion}%</span>
          </div>
          <Progress value={tauxCompletion} className="h-3" />
        </CardContent>
      </Card>

      {/* Calendrier vaccinal */}
      <Card className="shadow-xl border-none rounded-3xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              Calendrier Vaccinal
            </CardTitle>
            {isEditable && (
              <Touchable onPress={() => setShowAjouter(true)} haptic>
                <Button className="bg-blue-600 hover:bg-blue-700 rounded-xl">
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter un vaccin
                </Button>
              </Touchable>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {calendrierComplet.map((vaccin, index) => (
              <div
                key={index}
                className={`border-l-4 p-4 rounded-r-2xl shadow-sm transition-all ${
                  vaccin.statut === 'administre' ? 'border-l-green-500 bg-green-50' :
                  vaccin.statut === 'a_faire' ? 'border-l-orange-500 bg-orange-50' :
                  vaccin.statut === 'retard' ? 'border-l-red-500 bg-red-50' :
                  'border-l-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getStatutIcon(vaccin.statut)}
                      <h3 className="font-bold text-lg">{vaccin.nom}</h3>
                      <Badge className={getStatutColor(vaccin.statut)}>
                        {getStatutLabel(vaccin.statut)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{vaccin.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Prévu: {format(vaccin.date_prevue, 'dd MMM yyyy', { locale: fr })}
                      </span>
                      {vaccin.date_administration && (
                        <span className="flex items-center gap-1 text-green-700">
                          <CheckCircle2 className="w-3 h-3" />
                          Fait le: {format(new Date(vaccin.date_administration), 'dd MMM yyyy', { locale: fr })}
                        </span>
                      )}
                      {vaccin.joursRetard > 0 && (
                        <span className="flex items-center gap-1 text-red-700 font-semibold">
                          <AlertCircle className="w-3 h-3" />
                          Retard: {vaccin.joursRetard} jours
                        </span>
                      )}
                    </div>

                    {vaccin.statut === 'administre' && expandedVaccin === index && (
                      <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                        {vaccin.lieu && <p><strong>Lieu:</strong> {vaccin.lieu}</p>}
                        {vaccin.professionnel && <p><strong>Professionnel:</strong> {vaccin.professionnel}</p>}
                        {vaccin.lot && <p><strong>N° Lot:</strong> {vaccin.lot}</p>}
                        {vaccin.prochain_rappel && (
                          <p><strong>Prochain rappel:</strong> {format(new Date(vaccin.prochain_rappel), 'dd/MM/yyyy')}</p>
                        )}
                        {vaccin.document_uri && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => telechargerCertificat(vaccin.document_uri)}
                            className="mt-2"
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Télécharger le certificat
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 ml-2">
                    {vaccin.statut === 'administre' && (
                      <Touchable onPress={() => setExpandedVaccin(expandedVaccin === index ? null : index)}>
                        <Button size="sm" variant="ghost">
                          {expandedVaccin === index ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </Touchable>
                    )}
                    {isEditable && vaccin.statut !== 'administre' && (
                      <Touchable onPress={() => {
                        setVaccinSelectionne(vaccin);
                        setFormData({
                          ...formData,
                          nom_vaccin: vaccin.nom,
                        });
                        setShowAjouter(true);
                      }}>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Fait
                        </Button>
                      </Touchable>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Sheet - Ajouter un vaccin */}
      <BottomSheet
        isOpen={showAjouter}
        onClose={() => {
          setShowAjouter(false);
          setVaccinSelectionne(null);
        }}
        title="Enregistrer une vaccination"
        fullHeight
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Nom du vaccin *</Label>
              <Input
                value={formData.nom_vaccin}
                onChange={(e) => setFormData({ ...formData, nom_vaccin: e.target.value })}
                placeholder="Ex: BCG, Pentavalent 1..."
                required
                readOnly={!!vaccinSelectionne}
              />
            </div>

            <div>
              <Label>Date d'administration *</Label>
              <Input
                type="date"
                value={formData.date_administration}
                onChange={(e) => setFormData({ ...formData, date_administration: e.target.value })}
                required
              />
            </div>

            <div>
              <Label>Lieu de vaccination</Label>
              <Input
                value={formData.lieu}
                onChange={(e) => setFormData({ ...formData, lieu: e.target.value })}
                placeholder="Ex: Centre de santé communautaire"
              />
            </div>

            <div>
              <Label>Professionnel de santé</Label>
              <Input
                value={formData.professionnel}
                onChange={(e) => setFormData({ ...formData, professionnel: e.target.value })}
                placeholder="Nom du vaccinateur"
              />
            </div>

            <div>
              <Label>Numéro de lot</Label>
              <Input
                value={formData.lot}
                onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                placeholder="N° du lot de vaccin"
              />
            </div>

            <div>
              <Label>Prochain rappel (si applicable)</Label>
              <Input
                type="date"
                value={formData.prochain_rappel}
                onChange={(e) => setFormData({ ...formData, prochain_rappel: e.target.value })}
              />
            </div>

            <div>
              <Label>Certificat de vaccination (optionnel)</Label>
              <div className="mt-2">
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {formData.document_name ? formData.document_name : 'Cliquer pour uploader'}
                  </span>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingDoc}
                  />
                </label>
                {uploadingDoc && <p className="text-xs text-gray-500 mt-2">Upload en cours...</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAjouter(false);
                  setVaccinSelectionne(null);
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={ajouterVaccinMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {ajouterVaccinMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        </div>
      </BottomSheet>
    </div>
  );
}