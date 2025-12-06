
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  MessageSquare,
  Gem,
  CreditCard,
  GraduationCap,
  Award,
  Globe,
  FileText,
  Briefcase,
  Building2,
  Video
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AvisSection from "./AvisSection";
import ReserverRendezVous from './ReserverRendezVous';
import { Tabs, TabsList, TabsContent, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function DetailsProfessionnel({ professionnel, onClose }) {
  const [showReservation, setShowReservation] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user || !user.email) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles.length > 0 ? profiles[0] : null;
    },
    enabled: !!user && !!user.email,
  });

  const isPremiumOrTrial = userProfile?.statut_abonnement === 'premium_trial' || userProfile?.statut_abonnement === 'premium_payant';

  const handleContacter = async () => {
    try {
      if (!user || !user.email) {
        alert("Impossible de récupérer vos informations. Veuillez vous connecter.");
        return;
      }
      if (!professionnel.email) {
        alert("Ce professionnel n'a pas d'adresse e-mail renseignée pour la messagerie.");
        return;
      }

      const participantEmails = [user.email, professionnel.email].sort();

      // Chercher si une conversation existe déjà
      const existingConversations = await base44.entities.Conversation.filter({
        participant_emails: participantEmails
      });

      let conversationId;

      if (existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        // Créer une nouvelle conversation
        const newConversation = await base44.entities.Conversation.create({
          participant_emails: participantEmails,
          last_message_content: "Début de la conversation",
          last_message_date: new Date().toISOString()
        });
        conversationId = newConversation.id;
      }

      // Naviguer vers la page de messagerie
      navigate(createPageUrl(`Messagerie?conversationId=${conversationId}`));
    } catch (error) {
      console.error("Erreur lors de la création/recherche de conversation:", error);
      alert("Une erreur est survenue lors de la tentative de contact.");
    }
  };

  if (showReservation) {
    return (
      <ReserverRendezVous
        professionnel={professionnel}
        onClose={() => setShowReservation(false)}
        onSuccess={() => {
          setShowReservation(false);
          queryClient.invalidateQueries({ queryKey: ['mes_rdv'] });
          alert('✅ Rendez-vous confirmé avec succès !');
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="w-full max-w-4xl my-8 shadow-2xl">
        {/* En-tête avec retour */}
        <div className="flex items-center gap-4 p-4 md:p-6 pb-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex items-center gap-2 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Retour</span>
          </Button>
        </div>

        {/* Carte professionnel */}
        <Card className="shadow-xl border-none mx-4 md:mx-6 p-4 md:p-6 overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row gap-4 md:gap-6">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 mx-auto md:mx-0">
                {professionnel.photo ? (
                  <img src={professionnel.photo} alt={professionnel.nom_complet} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-2xl md:text-3xl font-bold text-white">
                    {professionnel.nom_complet?.charAt(0) || "P"}
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-3 md:space-y-4 min-w-0">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-gray-800 break-words">
                    {professionnel.nom_complet}
                  </h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <Badge className="bg-teal-100 text-teal-800 truncate">
                      {professionnel.specialite?.replace(/_/g, ' ')}
                    </Badge>
                    {professionnel.accepte_cmu && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">CMU</span>
                      </Badge>
                    )}
                    {professionnel.annees_experience && (
                      <Badge variant="outline" className="truncate">
                        {professionnel.annees_experience} ans
                      </Badge>
                    )}
                  </div>

                  {professionnel.note_moyenne && (
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex flex-shrink-0">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 md:w-5 md:h-5 ${i < Math.round(professionnel.note_moyenne) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      <span className="font-semibold text-sm md:text-base">{professionnel.note_moyenne}/5</span>
                      <span className="text-xs md:text-sm text-gray-500 truncate">({professionnel.nombre_avis})</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  {professionnel.telephone && (
                    <div className="flex items-center gap-2 text-sm md:text-base text-gray-600">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{professionnel.telephone}</span>
                    </div>
                  )}
                  {professionnel.email && (
                    <div className="flex items-center gap-2 text-sm md:text-base text-gray-600">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{professionnel.email}</span>
                    </div>
                  )}
                  {professionnel.ville && (
                    <div className="flex items-center gap-2 text-sm md:text-base text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{professionnel.ville}, {professionnel.region}</span>
                    </div>
                  )}
                  {professionnel.structure_sante && (
                    <div className="flex items-center gap-2 text-sm md:text-base text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{professionnel.structure_sante}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <CardContent className="p-4 md:p-6 max-h-[60vh] md:max-h-[70vh] overflow-y-auto">
          <Tabs defaultValue="presentation" className="w-full">
            <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 p-1">
              <TabsTrigger value="presentation" className="text-xs md:text-sm px-2 md:px-4 py-2">Présentation</TabsTrigger>
              <TabsTrigger value="formation" className="text-xs md:text-sm px-2 md:px-4 py-2">Formation</TabsTrigger>
              <TabsTrigger value="expertise" className="text-xs md:text-sm px-2 md:px-4 py-2">Expertise</TabsTrigger>
              <TabsTrigger value="documents" className="text-xs md:text-sm px-2 md:px-4 py-2">Documents</TabsTrigger>
              <TabsTrigger value="avis" className="text-xs md:text-sm px-2 md:px-4 py-2">Avis</TabsTrigger>
            </TabsList>

            {/* Présentation */}
            <TabsContent value="presentation" className="space-y-4 mt-4">
              {professionnel.biographie && (
                <Card className="shadow-none border-none p-0">
                  <CardHeader className="p-0">
                    <CardTitle className="text-base md:text-lg">À propos</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 mt-3">
                    <p className="text-sm md:text-base text-gray-700 leading-relaxed whitespace-pre-line break-words">
                      {professionnel.biographie}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Tarifs */}
              {professionnel.tarifs_par_type && Object.values(professionnel.tarifs_par_type).some(t => t > 0) && (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-sm md:text-base text-purple-900 mb-3 flex items-center gap-2">
                    <CreditCard className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">Tarifs de consultation</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {professionnel.tarifs_par_type.cabinet > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Briefcase className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">Cabinet</span>
                        </div>
                        <span className="font-bold text-purple-900 text-sm md:text-base flex-shrink-0">{professionnel.tarifs_par_type.cabinet.toLocaleString()} F</span>
                      </div>
                    )}
                    {professionnel.tarifs_par_type.clinique > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">Clinique</span>
                        </div>
                        <span className="font-bold text-purple-900 text-sm md:text-base flex-shrink-0">{professionnel.tarifs_par_type.clinique.toLocaleString()} F</span>
                      </div>
                    )}
                    {professionnel.tarifs_par_type.hopital > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Building2 className="w-4 h-4 text-red-600 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">Hôpital</span>
                        </div>
                        <span className="font-bold text-purple-900 text-sm md:text-base flex-shrink-0">{professionnel.tarifs_par_type.hopital.toLocaleString()} F</span>
                      </div>
                    )}
                    {professionnel.tarifs_par_type.telephone > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Phone className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">Téléphone</span>
                        </div>
                        <span className="font-bold text-purple-900 text-sm md:text-base flex-shrink-0">{professionnel.tarifs_par_type.telephone.toLocaleString()} F</span>
                      </div>
                    )}
                    {professionnel.tarifs_par_type.visio > 0 && (
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Video className="w-4 h-4 text-teal-600 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">Vidéo</span>
                        </div>
                        <span className="font-bold text-purple-900 text-sm md:text-base flex-shrink-0">{professionnel.tarifs_par_type.visio.toLocaleString()} F</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assurances acceptées */}
              {professionnel.assurances_acceptees && professionnel.assurances_acceptees.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-sm md:text-base text-blue-900 mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">Assurances acceptées</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {professionnel.assurances_acceptees.map((assurance, index) => (
                      <Badge key={index} variant="outline" className="bg-white border-blue-300 text-blue-800 text-xs truncate max-w-full">
                        <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                        <span className="truncate">{assurance}</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Disponibilités */}
              {professionnel.disponibilites && professionnel.disponibilites.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm md:text-base text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    <span className="truncate">Disponibilités</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {professionnel.disponibilites.map((dispo, index) => (
                      <div key={index} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-2">
                        <span className="font-medium text-sm md:text-base text-gray-900 truncate">{dispo.jour}</span>
                        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                          <span className="text-xs md:text-sm text-gray-600">
                            {dispo.heure_debut} - {dispo.heure_fin}
                          </span>
                          {dispo.types_consultation && dispo.types_consultation.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                              {dispo.types_consultation.map((type, i) => (
                                <Badge key={i} variant="outline" className="text-xs capitalize truncate">
                                  {type.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Formation */}
            <TabsContent value="formation" className="space-y-4 mt-4">
              {professionnel.formation && professionnel.formation.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm md:text-base text-gray-900 mb-3 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-teal-600 flex-shrink-0" />
                    <span className="truncate">Diplômes et Formation</span>
                  </h4>
                  {professionnel.formation.map((form, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200 overflow-hidden">
                      <p className="font-semibold text-sm md:text-base text-teal-900 break-words">{form.diplome}</p>
                      <p className="text-xs md:text-sm text-teal-700 break-words">{form.etablissement}</p>
                      {form.annee && (
                        <Badge className="mt-2 bg-teal-600 text-white">
                          {form.annee}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <GraduationCap className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm md:text-base">Formation non renseignée</p>
                </div>
              )}

              {professionnel.annees_experience && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-xs md:text-sm text-gray-600">Années d'expérience</p>
                  <p className="text-xl md:text-2xl font-bold text-purple-900">
                    {professionnel.annees_experience} ans
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Expertise et Certifications */}
            <TabsContent value="expertise" className="space-y-4 mt-4">
              {professionnel.certifications && professionnel.certifications.length > 0 ? (
                <div>
                  <h4 className="font-semibold text-sm md:text-base text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                    <span className="truncate">Domaines d'expertise</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {professionnel.certifications.map((cert, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 hover:shadow-md transition-shadow overflow-hidden">
                        <div className="flex items-start gap-3">
                          <Award className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-1" />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm md:text-base text-yellow-900 break-words">{cert}</p>
                            <Badge className="mt-2 bg-yellow-600 text-white text-xs">
                              Certifié
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <Award className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm md:text-base">Expertises non renseignées</p>
                </div>
              )}

              {/* Langues parlées */}
              {professionnel.langues && professionnel.langues.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-sm md:text-base text-blue-900 mb-3 flex items-center gap-2">
                    <Globe className="w-5 h-5 flex-shrink-0" />
                    <span className="truncate">Langues parlées</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {professionnel.langues.map((langue, index) => (
                      <Badge key={index} variant="outline" className="bg-white border-blue-300 text-blue-800 text-xs truncate">
                        {langue}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Documents professionnels */}
            <TabsContent value="documents" className="space-y-4 mt-4">
              {professionnel.documents_professionnels && professionnel.documents_professionnels.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm md:text-base text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <span className="truncate">Documents vérifiés</span>
                  </h4>
                  {professionnel.documents_professionnels.map((doc, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow overflow-hidden">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 bg-teal-100 rounded-lg flex-shrink-0">
                            <FileText className="w-5 h-5 text-teal-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm md:text-base text-gray-900 break-words">{doc.label}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {doc.file_name}
                            </p>
                            {doc.uploaded_at && (
                              <p className="text-xs text-gray-400 mt-1">
                                Ajouté le {format(new Date(doc.uploaded_at), 'dd/MM/yyyy', { locale: fr })}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-800 flex-shrink-0 text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          <span className="hidden md:inline">Vérifié</span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <FileText className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 text-gray-300" />
                  <p className="text-sm md:text-base">Aucun document disponible</p>
                </div>
              )}
            </TabsContent>

            {/* Avis */}
            <TabsContent value="avis" className="mt-4">
              <AvisSection
                professionnelId={professionnel.id}
                currentUserEmail={user?.email}
              />
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardContent className="p-4 md:p-6 pt-0">
          <Button
            onClick={() => setShowReservation(true)}
            className="w-full bg-pink-600 hover:bg-pink-700 shadow-md mb-3 active:scale-95 transition-transform"
            size="lg"
          >
            <Calendar className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="truncate">Prendre rendez-vous</span>
          </Button>

          {isPremiumOrTrial ? (
            <Button
              variant="outline"
              onClick={handleContacter}
              className="w-full active:scale-95 transition-transform"
            >
              <MessageSquare className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">Contacter</span>
            </Button>
          ) : (
            <Button asChild variant="outline" className="w-full active:scale-95 transition-transform">
              <Link to={createPageUrl('Tarifs')}>
                <Gem className="w-4 h-4 mr-2 text-yellow-500 flex-shrink-0" />
                <span className="truncate">Contacter (Premium)</span>
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {showReservation && (
        <ReserverRendezVous
          professionnel={professionnel}
          onClose={() => setShowReservation(false)}
          onSuccess={() => {
            setShowReservation(false);
            queryClient.invalidateQueries({ queryKey: ['mes_rdv'] });
            alert('✅ Rendez-vous confirmé avec succès !');
          }}
        />
      )}
    </div>
  );
}
