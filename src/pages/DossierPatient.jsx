import React, { useState } from "react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  User,
  Heart,
  Syringe,
  TrendingUp,
  FileText,
  ArrowLeft,
  UserPlus,
  CheckCircle,
  MessageSquare,
  Upload,
  Calendar,
  Plus,
  Download,
  File,
  Image,
  X,
  AlertCircle,
  Clock,
  Mail,
  Phone,
  Activity,
  Shield
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import SuiviVaccins from "../components/enfants/SuiviVaccins";
import GraphiqueCroissance from "../components/enfants/GraphiqueCroissance";
import { createPageUrl } from "@/utils";
import { format, differenceInYears, differenceInMonths, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import PlanifierRDVSuivi from "../components/messagerie/PlanifierRDVSuivi";
import SuiviPatientComplet from "../components/patients/SuiviPatientComplet";
import AjouterNoteEvolution from "../components/patients/AjouterNoteEvolution";
import CreerRappelSuivi from "../components/patients/CreerRappelSuivi";
import ConsulterDMPProfessionnel from "../components/dmp/ConsulterDMPProfessionnel";
import PublierDMPProfessionnel from "../components/dmp/PublierDMPProfessionnel";
import ExtractionDocumentIA from "../components/dmp/ExtractionDocumentIA";
import ResumeMedicalIA from "../components/dmp/ResumeMedicalIA";
import VueSynthese from "../components/dossier-medical/VueSynthese";
import VueCardiologie from "../components/dossier-medical/VueCardiologie";
import VueOncologie from "../components/dossier-medical/VueOncologie";
import VuePsychiatrie from "../components/dossier-medical/VuePsychiatrie";
import GestionConsentements from "../components/dossier-medical/GestionConsentements";

export default function DossierPatient() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const enfantId = new URLSearchParams(location.search).get("enfantId");

  const [showNoteConsultation, setShowNoteConsultation] = useState(false);
  const [showUploadDocument, setShowUploadDocument] = useState(false);
  const [showPlanifierRDV, setShowPlanifierRDV] = useState(false);
  const [noteConsultation, setNoteConsultation] = useState({
    date: new Date().toISOString().split('T')[0],
    diagnostic: '',
    traitement: '',
    notes: '',
  });
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docInfo, setDocInfo] = useState({
    nom: '',
    type: 'resultat_labo',
    description: '',
  });

  const { data: user } = useQuery({ 
    queryKey: ['user'], 
    queryFn: () => base44.auth.me() 
  });
  
  const { data: profiles } = useQuery({
    queryKey: ['user_profiles', user?.email],
    queryFn: async () => {
      if (!user) return { maman: null, pro: null };
      
      const [mamanProfiles, proProfilesList] = await Promise.all([
        base44.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
        base44.entities.Professionnel.list().catch(() => [])
      ]);
      
      const proProfil = proProfilesList.find(p => p.email === user.email);
      
      return {
        maman: mamanProfiles[0] || null,
        pro: proProfil || null
      };
    },
    enabled: !!user,
  });

  const profilPro = profiles?.pro;

  const { data: enfant, isLoading: loadingEnfant } = useQuery({
    queryKey: ["dossier_enfant", enfantId],
    queryFn: async () => {
      const results = await base44.entities.EnfantCarnet.filter({ id: enfantId });
      return results[0] || null;
    },
    enabled: !!enfantId,
  });

  const { data: rdvPatient = [] } = useQuery({
    queryKey: ['rdv_patient', enfantId],
    queryFn: async () => {
      if (!enfant) return [];
      const rdvs = await base44.entities.RendezVous.filter({
        created_by: enfant.created_by
      }, '-date_rdv');
      return rdvs;
    },
    enabled: !!enfant,
  });

  const { data: metriquesSante = [] } = useQuery({
    queryKey: ['metriques_patient', enfant?.created_by],
    queryFn: async () => {
      if (!enfant) return [];
      return await base44.entities.MetriqueSante.filter({
        created_by: enfant.created_by
      }, '-date_mesure', 10);
    },
    enabled: !!enfant,
  });

  const { data: dossierMedical } = useQuery({
    queryKey: ['dossier_medical_patient', enfant?.created_by],
    queryFn: async () => {
      if (!enfant) return null;
      const dossiers = await base44.entities.DossierMedicalComplet.filter({
        patient_email: enfant.created_by
      });
      return dossiers[0] || null;
    },
    enabled: !!enfant,
  });

  const isPatientInList = profilPro && enfant?.professionnels_suivi?.includes(profilPro.email);

  const addPatientMutation = useMutation({
    mutationFn: async () => {
      if (!profilPro || !enfant) return;
      const suivis = enfant.professionnels_suivi || [];
      if (!suivis.includes(profilPro.email)) {
        await base44.entities.EnfantCarnet.update(enfant.id, {
          professionnels_suivi: [...suivis, profilPro.email],
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier_enfant', enfantId] });
      queryClient.invalidateQueries({ queryKey: ['mes_patients', profilPro.email] });
      alert('✅ Patient ajouté à votre liste de suivi');
    },
  });

  const addConsultationMutation = useMutation({
    mutationFn: async (data) => {
      const historique = enfant.historique_medical || [];
      await base44.entities.EnfantCarnet.update(enfant.id, {
        historique_medical: [
          ...historique,
          {
            date: data.date,
            type: 'consultation',
            diagnostic: data.diagnostic,
            traitement: data.traitement,
            professionnel: profilPro.nom_complet,
            notes: data.notes,
          }
        ]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier_enfant', enfantId] });
      setShowNoteConsultation(false);
      setNoteConsultation({ date: new Date().toISOString().split('T')[0], diagnostic: '', traitement: '', notes: '' });
      alert('✅ Note de consultation ajoutée');
    }
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ file, info }) => {
      setUploadingDoc(true);
      try {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        
        const documents = enfant.documents_medicaux || [];
        await base44.entities.EnfantCarnet.update(enfant.id, {
          documents_medicaux: [
            ...documents,
            {
              nom: info.nom,
              type: info.type,
              date_document: new Date().toISOString().split('T')[0],
              professionnel: profilPro.nom_complet,
              file_uri: file_uri,
              file_name: file.name,
              file_type: file.type,
              description: info.description,
              date_upload: new Date().toISOString(),
            }
          ]
        });
      } finally {
        setUploadingDoc(false);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dossier_enfant', enfantId] });
      setShowUploadDocument(false);
      setDocInfo({ nom: '', type: 'resultat_labo', description: '' });
      alert('✅ Document ajouté avec succès');
    }
  });

  const handleContacter = async () => {
    if (!user || !enfant) {
        alert("Informations manquantes");
        return;
    }
    try {
      const parentEmail = enfant.created_by;
      const specialistEmail = user.email;

      if (!parentEmail) {
        alert("Impossible de trouver l'email du parent pour ce patient.");
        return;
      }
      
      const participantEmails = [parentEmail, specialistEmail].sort();

      const existingConversations = await base44.entities.Conversation.filter({
        participant_emails: participantEmails
      });

      let conversationId;
      if (existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        const newConversation = await base44.entities.Conversation.create({
          participant_emails: participantEmails,
          last_message_content: "Début de la conversation",
          last_message_date: new Date().toISOString()
        });
        conversationId = newConversation.id;
      }
      
      navigate(createPageUrl(`Messagerie?conversationId=${conversationId}`));

    } catch (error) {
      console.error("Erreur lors de l'initialisation de la conversation:", error);
      alert("Une erreur est survenue");
    }
  };

  const handleDownloadDocument = async (document) => {
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({
        file_uri: document.file_uri,
        expires_in: 3600
      });
      window.open(signed_url, '_blank');
    } catch (error) {
      alert('Erreur lors du téléchargement');
    }
  };

  const calculateAge = (dob) => {
    const birthDate = new Date(dob);
    const now = new Date();

    const years = differenceInYears(now, birthDate);
    if (years > 0) {
      return `${years} an${years > 1 ? 's' : ''}`;
    }

    const months = differenceInMonths(now, birthDate);
    if (months > 0) {
      return `${months} mois`;
    }

    const days = differenceInDays(now, birthDate);
    if (days > 0) {
      return `${days} jour${days > 1 ? 's' : ''}`;
    }

    return "Nouveau-né";
  };

  if (loadingEnfant) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement du dossier...</p>
        </div>
      </div>
    );
  }

  if (!enfant) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 text-xl">Dossier patient non trouvé</p>
      </div>
    );
  }

  const prochainRdv = rdvPatient.find(rdv => new Date(rdv.date_rdv) > new Date() && rdv.statut !== 'annule');
  const rdvPasses = rdvPatient.filter(rdv => new Date(rdv.date_rdv) <= new Date() || rdv.statut === 'termine');

  return (
    <div className="min-h-full bg-gradient-to-br from-teal-50 to-cyan-50 p-4 md:p-8" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Button asChild variant="outline" className="active:scale-95 transition-transform">
            <Link to={createPageUrl('MesPatients')}>
              <ArrowLeft className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Retour</span>
            </Link>
          </Button>

          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={handleContacter}
              className="active:scale-95 transition-transform"
            >
              <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Contacter</span>
            </Button>
            
            <Button
              onClick={() => setShowPlanifierRDV(true)}
              className="bg-purple-600 hover:bg-purple-700 active:scale-95 transition-transform"
            >
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Planifier RDV</span>
            </Button>

            {!isPatientInList && (
              <Button 
                onClick={() => addPatientMutation.mutate()} 
                disabled={addPatientMutation.isPending}
                className="bg-teal-600 hover:bg-teal-700 active:scale-95 transition-transform"
              >
                {addPatientMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2"/>
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                <span className="truncate">Ajouter</span>
              </Button>
            )}
            {isPatientInList && (
              <Button variant="secondary" disabled>
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Patient ajouté
              </Button>
            )}
          </div>
        </div>

        {/* Carte patient */}
        <Card className="shadow-xl border-none overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                {enfant.photo ? (
                  <img src={enfant.photo} alt={enfant.prenom} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-8 h-8 md:w-10 md:h-10 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl md:text-3xl break-words">
                  {enfant.prenom} {enfant.nom}
                </CardTitle>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge className="bg-teal-100 text-teal-800">{calculateAge(enfant.date_naissance)}</Badge>
                  <Badge variant="outline">{enfant.sexe}</Badge>
                  {enfant.groupe_sanguin && (
                    <Badge className="bg-red-100 text-red-800">{enfant.groupe_sanguin}</Badge>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {enfant.numero_cmu && (
                    <p className="text-xs md:text-sm text-gray-600 truncate">
                      <strong>CMU:</strong> {enfant.numero_cmu}
                    </p>
                  )}
                  {enfant.created_by && (
                    <p className="text-xs md:text-sm text-gray-600 truncate">
                      <strong>Parent:</strong> {enfant.created_by}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg overflow-hidden">
                <h4 className="font-semibold text-xs md:text-sm text-gray-700 mb-1">Groupe Sanguin</h4>
                <p className="text-sm md:text-base truncate">{enfant.groupe_sanguin || 'Non renseigné'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg overflow-hidden">
                <h4 className="font-semibold text-xs md:text-sm text-gray-700 mb-1">Allergies</h4>
                <p className="text-sm md:text-base line-clamp-2 break-words">
                  {enfant.allergies?.join(', ') || 'Aucune'}
                </p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg overflow-hidden">
                <h4 className="font-semibold text-xs md:text-sm text-gray-700 mb-1">Maladies chroniques</h4>
                <p className="text-sm md:text-base line-clamp-2 break-words">
                  {enfant.maladies_chroniques?.join(', ') || 'Aucune'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertes médicales */}
        {enfant.allergies && enfant.allergies.length > 0 && (
          <Alert className="border-l-4 border-l-red-500 bg-red-50">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <AlertDescription className="text-red-800">
              <strong>⚠️ Allergies connues:</strong> {enfant.allergies.join(', ')}
            </AlertDescription>
          </Alert>
        )}

        {/* Prochain RDV */}
        {prochainRdv && (
          <Card className="shadow-lg border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-cyan-50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm md:text-lg mb-1">Prochain rendez-vous</h3>
                    <p className="text-xs md:text-base text-gray-700 break-words">
                      {format(new Date(prochainRdv.date_rdv), 'EEEE d MMMM yyyy à HH:mm', { locale: fr })}
                    </p>
                    {prochainRdv.motif && (
                      <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                        {prochainRdv.motif}
                      </p>
                    )}
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800 flex-shrink-0 text-xs">
                  {prochainRdv.type_consultation}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Métriques récentes */}
        {metriquesSante.length > 0 && (
          <Card className="shadow-lg border-none overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Activity className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <span className="truncate">Métriques récentes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {metriquesSante.slice(0, 4).map((metrique, idx) => (
                  <div key={idx} className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg border border-orange-200 overflow-hidden">
                    <p className="text-xs text-gray-600 mb-1 truncate">{metrique.type}</p>
                    <p className="text-base md:text-lg font-bold text-orange-900 truncate">
                      {metrique.valeur} {metrique.unite}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {format(new Date(metrique.date_mesure), 'dd/MM')}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Suivi Patient Complet */}
        <SuiviPatientComplet 
        patientEmail={enfant.created_by}
        patientNom={`${enfant.prenom} ${enfant.nom}`}
        />

        {/* Tabs */}
        <Tabs defaultValue="suivi" className="space-y-4">
          <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 p-1">
            <TabsTrigger value="suivi" className="text-xs md:text-sm px-3 py-2">Suivi Patient</TabsTrigger>
            <TabsTrigger value="dossier-medical" className="text-xs md:text-sm px-3 py-2 flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Dossier Médical
            </TabsTrigger>
            <TabsTrigger value="dmp" className="text-xs md:text-sm px-3 py-2 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              DMP
            </TabsTrigger>
            <TabsTrigger value="historique" className="text-xs md:text-sm px-3 py-2">Historique</TabsTrigger>
            <TabsTrigger value="vaccins" className="text-xs md:text-sm px-3 py-2">Vaccins</TabsTrigger>
            <TabsTrigger value="croissance" className="text-xs md:text-sm px-3 py-2">Croissance</TabsTrigger>
            <TabsTrigger value="documents" className="text-xs md:text-sm px-3 py-2">Documents</TabsTrigger>
            <TabsTrigger value="consultations" className="text-xs md:text-sm px-3 py-2">RDV</TabsTrigger>
          </TabsList>

          {/* Suivi Patient */}
          <TabsContent value="suivi">
            <SuiviPatientComplet
              patientEmail={enfant.created_by}
              patientNom={`${enfant.prenom} ${enfant.nom}`}
            />
          </TabsContent>

          {/* Dossier Médical Dynamique */}
          <TabsContent value="dossier-medical" className="space-y-4">
            <GestionConsentements 
              dossier={dossierMedical} 
              patientEmail={enfant.created_by}
              isPatientView={false}
            />
            
            {dossierMedical ? (
              <>
                <VueSynthese dossier={dossierMedical} />
                {profilPro?.specialite === 'cardiologie' && (
                  <VueCardiologie dossier={dossierMedical} />
                )}
                {profilPro?.specialite === 'oncologie' && (
                  <VueOncologie dossier={dossierMedical} />
                )}
                {profilPro?.specialite === 'psychiatrie' && (
                  <VuePsychiatrie dossier={dossierMedical} />
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Aucun dossier médical complet disponible</p>
                  <p className="text-sm text-gray-500 mt-2">Le dossier médical sera créé lors de la première consultation</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* DMP - Dossier Médical Partagé */}
          <TabsContent value="dmp" className="space-y-6">
            {/* Résumé médical intelligent */}
            <ResumeMedicalIA patientEmail={enfant.created_by} />

            {/* Extraction automatique par IA */}
            <ExtractionDocumentIA
              patientEmail={enfant.created_by}
              enfantId={enfant.id}
              onExtractionComplete={() => {
                queryClient.invalidateQueries({ queryKey: ['documents_patient', enfant.created_by] });
              }}
            />

            <ConsulterDMPProfessionnel
              patientEmail={enfant.created_by}
              professionnelId={profilPro?.id}
            />

            <PublierDMPProfessionnel
              patientEmail={enfant.created_by}
              professionnelId={profilPro?.id}
              professionnelNom={profilPro?.nom_complet}
            />
          </TabsContent>

          {/* Historique Médical */}
          <TabsContent value="historique">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Historique Médical
                  </span>
                  <Button onClick={() => setShowNoteConsultation(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une note
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enfant.historique_medical && enfant.historique_medical.length > 0 ? (
                  <div className="space-y-4">
                    {enfant.historique_medical.sort((a, b) => new Date(b.date) - new Date(a.date)).map((event, index) => (
                      <div key={index} className="border-l-4 border-l-teal-500 pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{event.nom_maladie || event.diagnostic || event.type}</p>
                            <p className="text-sm text-gray-600">{format(new Date(event.date), 'dd MMMM yyyy', { locale: fr })}</p>
                            {event.professionnel && (
                              <p className="text-xs text-gray-500 mt-1">Par: {event.professionnel}</p>
                            )}
                          </div>
                          <Badge variant="outline">{event.type}</Badge>
                        </div>
                        {event.diagnostic && <p className="text-sm mt-2">Diagnostic: {event.diagnostic}</p>}
                        {event.traitement && <p className="text-sm mt-1">Traitement: {event.traitement}</p>}
                        {event.notes && <p className="text-sm text-gray-600 mt-2">{event.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucun historique médical enregistré</p>
                )}
              </CardContent>
            </Card>

            {showNoteConsultation && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Ajouter une note de consultation
                      <Button variant="ghost" size="icon" onClick={() => setShowNoteConsultation(false)}>
                        <X className="w-5 h-5" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={noteConsultation.date}
                        onChange={(e) => setNoteConsultation({ ...noteConsultation, date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Diagnostic</Label>
                      <Input
                        value={noteConsultation.diagnostic}
                        onChange={(e) => setNoteConsultation({ ...noteConsultation, diagnostic: e.target.value })}
                        placeholder="Ex: Bronchite aiguë"
                      />
                    </div>
                    <div>
                      <Label>Traitement prescrit</Label>
                      <Textarea
                        value={noteConsultation.traitement}
                        onChange={(e) => setNoteConsultation({ ...noteConsultation, traitement: e.target.value })}
                        placeholder="Ex: Sirop antitussif, repos..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Notes complémentaires</Label>
                      <Textarea
                        value={noteConsultation.notes}
                        onChange={(e) => setNoteConsultation({ ...noteConsultation, notes: e.target.value })}
                        rows={4}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setShowNoteConsultation(false)} className="flex-1">
                        Annuler
                      </Button>
                      <Button
                        onClick={() => addConsultationMutation.mutate(noteConsultation)}
                        disabled={addConsultationMutation.isPending || !noteConsultation.diagnostic}
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                      >
                        {addConsultationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Enregistrer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Vaccins */}
          <TabsContent value="vaccins">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="w-5 h-5 text-blue-500" />
                  Suivi des Vaccins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SuiviVaccins enfant={enfant} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Croissance */}
          <TabsContent value="croissance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Courbe de Croissance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GraphiqueCroissance enfant={enfant} isEditable={true} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-500" />
                    Documents Médicaux
                  </span>
                  <Button onClick={() => setShowUploadDocument(true)} size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Ajouter un document
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {enfant.documents_medicaux && enfant.documents_medicaux.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enfant.documents_medicaux.sort((a,b) => new Date(b.date_document) - new Date(a.date_document)).map((doc, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {doc.file_type?.startsWith('image/') ? (
                              <Image className="w-10 h-10 text-blue-600" />
                            ) : (
                              <File className="w-10 h-10 text-gray-600" />
                            )}
                            <div>
                              <p className="font-semibold">{doc.nom}</p>
                              <Badge variant="outline" className="mt-1">{doc.type}</Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {format(new Date(doc.date_document), 'dd/MM/yyyy', { locale: fr })}
                              </p>
                              {doc.professionnel && (
                                <p className="text-xs text-gray-600 mt-1">Par: {doc.professionnel}</p>
                              )}
                              {doc.description && (
                                <p className="text-sm text-gray-600 mt-2">{doc.description}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucun document médical enregistré</p>
                )}
              </CardContent>
            </Card>

            {showUploadDocument && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Ajouter un document médical
                      <Button variant="ghost" size="icon" onClick={() => setShowUploadDocument(false)}>
                        <X className="w-5 h-5" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Nom du document *</Label>
                      <Input
                        value={docInfo.nom}
                        onChange={(e) => setDocInfo({ ...docInfo, nom: e.target.value })}
                        placeholder="Ex: Résultats prise de sang"
                      />
                    </div>
                    <div>
                      <Label>Type de document *</Label>
                      <select
                        value={docInfo.type}
                        onChange={(e) => setDocInfo({ ...docInfo, type: e.target.value })}
                        className="w-full p-2 border rounded"
                      >
                        <option value="resultat_labo">Résultat de laboratoire</option>
                        <option value="ordonnance">Ordonnance</option>
                        <option value="rapport_specialiste">Rapport de spécialiste</option>
                        <option value="certificat_vaccination">Certificat de vaccination</option>
                        <option value="radio">Radiographie</option>
                        <option value="echographie">Échographie</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={docInfo.description}
                        onChange={(e) => setDocInfo({ ...docInfo, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Fichier *</Label>
                      <Input
                        type="file"
                        id="doc-file"
                        accept="image/*,.pdf"
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={() => setShowUploadDocument(false)} className="flex-1">
                        Annuler
                      </Button>
                      <Button
                        onClick={() => {
                          const fileInput = document.getElementById('doc-file');
                          const file = fileInput.files[0];
                          if (!file || !docInfo.nom) {
                            alert('Veuillez remplir tous les champs obligatoires');
                            return;
                          }
                          uploadDocumentMutation.mutate({ file, info: docInfo });
                        }}
                        disabled={uploadingDoc}
                        className="flex-1 bg-teal-600 hover:bg-teal-700"
                      >
                        {uploadingDoc ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                        Télécharger
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Historique Consultations/RDV */}
          <TabsContent value="consultations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-500" />
                  Historique des Rendez-vous
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rdvPasses.length > 0 ? (
                  <div className="space-y-3">
                    {rdvPasses.sort((a,b) => new Date(b.date_rdv) - new Date(a.date_rdv)).map((rdv) => (
                      <div key={rdv.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{format(new Date(rdv.date_rdv), 'dd MMMM yyyy à HH:mm', { locale: fr })}</p>
                            <p className="text-sm text-gray-600">{rdv.motif}</p>
                            {rdv.notes_professionnel && (
                              <p className="text-sm text-gray-700 mt-2 bg-gray-50 p-2 rounded">
                                <strong>Notes:</strong> {rdv.notes_professionnel}
                              </p>
                            )}
                          </div>
                          <Badge className={
                            rdv.statut === 'termine' ? 'bg-green-100 text-green-800' :
                            rdv.statut === 'annule' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }>
                            {rdv.statut}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Aucun rendez-vous passé</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {showPlanifierRDV && (
        <PlanifierRDVSuivi
          patientEmail={enfant.created_by}
          conversationId={null}
          onClose={() => setShowPlanifierRDV(false)}
          onRDVSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['rdv_patient', enfantId] });
            setShowPlanifierRDV(false);
          }}
        />
      )}
    </div>
  );
}