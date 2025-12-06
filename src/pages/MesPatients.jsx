import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users,
  Search,
  User,
  Calendar,
  Loader2,
  Baby,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  AlertCircle,
  FileText,
  Activity,
  Filter,
  TrendingUp
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { differenceInMonths, differenceInYears, format, isToday, isTomorrow } from 'date-fns';
import { fr } from 'date-fns/locale';
import AuthGuard from '../components/auth/AuthGuard';

export default function MesPatients() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAge, setFilterAge] = useState('tous');
  const [filterAllergies, setFilterAllergies] = useState(false);
  const [activeTab, setActiveTab] = useState('tous');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profiles, isLoading: loadingProfil } = useQuery({
    queryKey: ['user_profiles', user?.email],
    queryFn: async () => {
      if (!user) return { maman: null, pro: null };

      const [mamanProfiles, proProfiles] = await Promise.all([
        base44.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
        base44.entities.Professionnel.list().catch(() => [])
      ]);

      const proProfil = proProfiles.find(p => p.email === user.email);

      return {
        maman: mamanProfiles[0] || null,
        pro: proProfil || null
      };
    },
    enabled: !!user,
  });

  const profilPro = profiles?.pro;

  const { data: mesPatients, isLoading: loadingPatients } = useQuery({
    queryKey: ['mes_patients', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      const enfants = await base44.entities.EnfantCarnet.filter({
        professionnels_suivi: { $in: [profilPro.id] }
      }, '-created_date');
      return enfants;
    },
    enabled: !!profilPro,
    initialData: [],
  });

  const { data: rendezVousPatients = [] } = useQuery({
    queryKey: ['rdv_tous_patients', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      return await base44.entities.RendezVous.filter(
        { professionnel_id: profilPro.id },
        '-date_rdv'
      );
    },
    enabled: !!profilPro,
  });

  const calculateAge = (dateNaissance) => {
    const mois = differenceInMonths(new Date(), new Date(dateNaissance));
    if (mois < 12) return `${mois} mois`;
    const annees = Math.floor(mois / 12);
    const moisRestants = mois % 12;
    return moisRestants > 0 ? `${annees} ans ${moisRestants} mois` : `${annees} ans`;
  };

  const getAgeEnMois = (dateNaissance) => {
    return differenceInMonths(new Date(), new Date(dateNaissance));
  };

  const getProchainRdv = (patientEmail) => {
    return rendezVousPatients.find(rdv =>
      rdv.created_by === patientEmail &&
      new Date(rdv.date_rdv) > new Date() &&
      rdv.statut !== 'annule'
    );
  };

  const getDerniereConsultation = (patient) => {
    const historique = patient.historique_medical || [];
    const consultations = historique.filter(h => h.type === 'consultation');
    if (consultations.length === 0) return null;
    return consultations[consultations.length - 1];
  };

  const patientsFiltres = mesPatients.filter(patient => {
    const matchSearch = patient.prenom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.nom?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.numero_cmu?.includes(searchQuery) ||
      patient.created_by?.toLowerCase().includes(searchQuery.toLowerCase());

    const ageMois = getAgeEnMois(patient.date_naissance);
    const matchAge =
      filterAge === 'tous' ||
      (filterAge === 'nouveau_ne' && ageMois <= 1) ||
      (filterAge === 'nourrisson' && ageMois > 1 && ageMois <= 12) ||
      (filterAge === 'bambin' && ageMois > 12 && ageMois <= 36) ||
      (filterAge === 'enfant' && ageMois > 36);

    const matchAllergies = !filterAllergies || (patient.allergies && patient.allergies.length > 0);

    return matchSearch && matchAge && matchAllergies;
  });

  // Statistiques
  const stats = {
    total: mesPatients.length,
    nouveaux_ne: mesPatients.filter(p => getAgeEnMois(p.date_naissance) <= 1).length,
    nourrissons: mesPatients.filter(p => {
      const age = getAgeEnMois(p.date_naissance);
      return age > 1 && age <= 12;
    }).length,
    avec_allergies: mesPatients.filter(p => p.allergies && p.allergies.length > 0).length,
    rdv_aujourdhui: rendezVousPatients.filter(rdv =>
      isToday(new Date(rdv.date_rdv)) && rdv.statut !== 'annule'
    ).length,
    rdv_semaine: rendezVousPatients.filter(rdv => {
      const date = new Date(rdv.date_rdv);
      const now = new Date();
      const in7days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return date > now && date < in7days && rdv.statut !== 'annule';
    }).length
  };

  const handleContacter = async (patient) => {
    try {
      const parentEmail = patient.created_by;
      const specialistEmail = user.email;
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
      console.error("Erreur:", error);
      alert("Erreur lors de l'ouverture de la messagerie");
    }
  };

  if (loadingProfil || loadingPatients) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de vos patients...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-full bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4 md:p-8" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl shadow-lg">
                <Users className="w-6 h-6 md:w-8 md:h-8 text-white" />
              </div>
              <span className="truncate">Mes Patients</span>
            </h1>
            <p className="text-sm md:text-base text-gray-600 ml-0 md:ml-16 break-words">
              Gérez et suivez vos patients
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-none shadow-md overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <Users className="w-6 h-6 md:w-8 md:h-8 text-teal-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-teal-600">{stats.total}</p>
                    <p className="text-xs text-gray-600 truncate">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-none shadow-md overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <Baby className="w-6 h-6 md:w-8 md:h-8 text-pink-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-pink-600">{stats.nouveaux_ne}</p>
                    <p className="text-xs text-gray-600 truncate">Nouveau-nés</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-none shadow-md overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-blue-600">{stats.nourrissons}</p>
                    <p className="text-xs text-gray-600 truncate">Nourrissons</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-orange-50 border-none shadow-md overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 md:w-8 md:h-8 text-red-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-red-600">{stats.avec_allergies}</p>
                    <p className="text-xs text-gray-600 truncate">Allergies</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-none shadow-md overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-6 h-6 md:w-8 md:h-8 text-green-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-green-600">{stats.rdv_aujourdhui}</p>
                    <p className="text-xs text-gray-600 truncate">Aujourd'hui</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 border-none shadow-md overflow-hidden">
              <CardContent className="p-3 md:p-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 md:w-8 md:h-8 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xl md:text-2xl font-bold text-purple-600">{stats.rdv_semaine}</p>
                    <p className="text-xs text-gray-600 truncate">Cette semaine</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg border-none">
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 flex-shrink-0" />
                  <Input
                    placeholder="Rechercher par nom, N° CMU, email parent..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={filterAge === 'tous' ? 'default' : 'outline'}
                    onClick={() => setFilterAge('tous')}
                    className="cursor-pointer active:scale-95 transition-transform"
                  >
                    Tous
                  </Badge>
                  <Badge
                    variant={filterAge === 'nouveau_ne' ? 'default' : 'outline'}
                    onClick={() => setFilterAge('nouveau_ne')}
                    className="cursor-pointer active:scale-95 transition-transform"
                  >
                    Nouveau-nés
                  </Badge>
                  <Badge
                    variant={filterAge === 'nourrisson' ? 'default' : 'outline'}
                    onClick={() => setFilterAge('nourrisson')}
                    className="cursor-pointer active:scale-95 transition-transform"
                  >
                    Nourrissons
                  </Badge>
                  <Badge
                    variant={filterAge === 'bambin' ? 'default' : 'outline'}
                    onClick={() => setFilterAge('bambin')}
                    className="cursor-pointer active:scale-95 transition-transform"
                  >
                    Bambins
                  </Badge>
                  <Badge
                    variant={filterAge === 'enfant' ? 'default' : 'outline'}
                    onClick={() => setFilterAge('enfant')}
                    className="cursor-pointer active:scale-95 transition-transform"
                  >
                    Enfants
                  </Badge>
                  <Badge
                    variant={filterAllergies ? 'default' : 'outline'}
                    onClick={() => setFilterAllergies(!filterAllergies)}
                    className="cursor-pointer bg-red-500 text-white active:scale-95 transition-transform"
                  >
                    <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                    Avec allergies
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full h-auto flex flex-wrap justify-start gap-1 p-1">
              <TabsTrigger value="tous" className="text-xs md:text-sm px-3 py-2">
                Tous ({patientsFiltres.length})
              </TabsTrigger>
              <TabsTrigger value="rdv-aujourdhui" className="text-xs md:text-sm px-3 py-2">
                RDV aujourd'hui ({stats.rdv_aujourdhui})
              </TabsTrigger>
              <TabsTrigger value="urgents" className="text-xs md:text-sm px-3 py-2">
                À surveiller ({stats.avec_allergies})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tous" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {patientsFiltres.map((patient) => {
                  const prochainRdv = getProchainRdv(patient.created_by);
                  const derniereConsult = getDerniereConsultation(patient);

                  return (
                    <Card
                      key={patient.id}
                      className="shadow-lg hover:shadow-xl transition-all cursor-pointer border-none active:scale-[0.98] overflow-hidden"
                      onClick={() => navigate(createPageUrl(`DossierPatient?enfantId=${patient.id}`))}
                    >
                      <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                            {patient.photo ? (
                              <img src={patient.photo} alt={patient.prenom} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <Baby className="w-6 h-6 md:w-7 md:h-7 text-white" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base md:text-lg truncate">
                              {patient.prenom} {patient.nom}
                            </CardTitle>
                            <p className="text-xs md:text-sm text-gray-600 truncate">
                              {calculateAge(patient.date_naissance)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-4 space-y-3">
                        {patient.numero_cmu && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs md:text-sm text-gray-600">CMU</span>
                            <span className="text-xs md:text-sm font-medium truncate">{patient.numero_cmu}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs md:text-sm text-gray-600">Sexe</span>
                          <Badge variant="outline" className="text-xs">{patient.sexe}</Badge>
                        </div>

                        {patient.groupe_sanguin && (
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs md:text-sm text-gray-600">Groupe</span>
                            <Badge className="bg-red-100 text-red-800 text-xs">{patient.groupe_sanguin}</Badge>
                          </div>
                        )}

                        {patient.allergies && patient.allergies.length > 0 && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded overflow-hidden">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-red-900 mb-1">Allergies</p>
                                <p className="text-xs text-red-800 line-clamp-2 break-words">
                                  {patient.allergies.join(', ')}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {prochainRdv && (
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded overflow-hidden">
                            <div className="flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Prochain RDV</p>
                                <p className="text-xs text-blue-800 truncate">
                                  {isToday(new Date(prochainRdv.date_rdv)) && "Aujourd'hui "}
                                  {isTomorrow(new Date(prochainRdv.date_rdv)) && "Demain "}
                                  {format(new Date(prochainRdv.date_rdv), 'HH:mm', { locale: fr })}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {derniereConsult && (
                          <div className="text-xs text-gray-500 truncate">
                            Dernière consultation: {format(new Date(derniereConsult.date), 'dd/MM/yyyy')}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContacter(patient);
                            }}
                            className="flex-1 active:scale-95 transition-transform"
                          >
                            <MessageSquare className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate text-xs md:text-sm">Contact</span>
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-teal-600 hover:bg-teal-700 active:scale-95 transition-transform"
                          >
                            <FileText className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate text-xs md:text-sm">Dossier</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {patientsFiltres.length === 0 && (
                  <Card className="col-span-full border-2 border-dashed">
                    <CardContent className="p-8 md:p-12 text-center">
                      <Users className="w-12 h-12 md:w-16 md:h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2 break-words">
                        {searchQuery ? 'Aucun patient trouvé' : 'Aucun patient pour le moment'}
                      </h3>
                      <p className="text-sm md:text-base text-gray-500 break-words">
                        {searchQuery
                          ? 'Essayez avec un autre terme de recherche'
                          : 'Les patients que vous suivez apparaîtront ici'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="rdv-aujourdhui" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {patientsFiltres.filter(p => {
                  const rdv = getProchainRdv(p.created_by);
                  return rdv && isToday(new Date(rdv.date_rdv));
                }).map(patient => {
                  const rdv = getProchainRdv(patient.created_by);
                  return (
                    <Card key={patient.id} className="shadow-lg border-l-4 border-l-green-500 hover:shadow-xl transition-all overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 p-4">
                        <div className="flex items-center gap-3">
                          <Baby className="w-10 h-10 text-green-600 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <CardTitle className="text-base md:text-lg truncate">
                              {patient.prenom} {patient.nom}
                            </CardTitle>
                            <p className="text-xs md:text-sm text-gray-600 truncate">
                              {format(new Date(rdv.date_rdv), 'HH:mm')} - {rdv.type_consultation}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2 break-words">{rdv.motif}</p>
                        <Button
                          onClick={() => navigate(createPageUrl(`DossierPatient?enfantId=${patient.id}`))}
                          className="w-full bg-green-600 hover:bg-green-700 active:scale-95 transition-transform"
                          size="sm"
                        >
                          <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">Voir le dossier</span>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="urgents" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {patientsFiltres.filter(p => p.allergies && p.allergies.length > 0).map(patient => (
                  <Card key={patient.id} className="shadow-lg border-l-4 border-l-red-500 hover:shadow-xl transition-all overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 p-4">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-10 h-10 text-red-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <CardTitle className="text-base md:text-lg truncate">
                            {patient.prenom} {patient.nom}
                          </CardTitle>
                          <p className="text-xs md:text-sm text-gray-600 truncate">
                            {calculateAge(patient.date_naissance)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      <div className="p-3 bg-red-50 border border-red-200 rounded overflow-hidden">
                        <p className="text-xs font-semibold text-red-900 mb-2">⚠️ Allergies connues</p>
                        <div className="flex flex-wrap gap-1">
                          {patient.allergies.map((allergie, idx) => (
                            <Badge key={idx} className="bg-red-500 text-white text-xs truncate">
                              {allergie}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        onClick={() => navigate(createPageUrl(`DossierPatient?enfantId=${patient.id}`))}
                        className="w-full bg-red-600 hover:bg-red-700 active:scale-95 transition-transform"
                        size="sm"
                      >
                        <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="truncate">Voir le dossier</span>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
}