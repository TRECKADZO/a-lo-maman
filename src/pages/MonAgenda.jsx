
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Loader2, 
  Settings, 
  Phone, 
  Video,
  Building2,
  Briefcase,
  Search,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Bell,
  Move
} from 'lucide-react';
import { 
  format, 
  isToday, 
  isTomorrow, 
  startOfWeek, 
  endOfWeek, 
  isWithinInterval,
  differenceInMinutes,
  addDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay
} from 'date-fns';
import { fr } from 'date-fns/locale';
import GestionDisponibilites from '../components/teleconsultation/GestionDisponibilites';
import GestionRendezVous from '../components/teleconsultation/GestionRendezVous';
import GestionTarifs from '../components/teleconsultation/GestionTarifs';
import CalendrierDragDrop from '../components/teleconsultation/CalendrierDragDrop';
import CalendarSync from '../components/teleconsultation/CalendarSync';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AuthGuard from '../components/auth/AuthGuard';

export default function MonAgenda() {
  const navigate = useNavigate();
  const [vueActive, setVueActive] = useState('semaine');
  const [showGestionDispo, setShowGestionDispo] = useState(false);
  const [showGestionTarifs, setShowGestionTarifs] = useState(false);
  const [showCalendarSync, setShowCalendarSync] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtreType, setFiltreType] = useState('tous');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profiles } = useQuery({
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
  const isSpecialist = !!profilPro;

  // Rediriger les non-spécialistes
  React.useEffect(() => {
    // Only redirect if profiles data has loaded and user is not a specialist
    if (profiles !== undefined && !isSpecialist) {
      navigate(createPageUrl('Dashboard'), { replace: true });
    }
  }, [isSpecialist, profiles, navigate]);

  const { data: rendezVous, isLoading: loadingRdv } = useQuery({
    queryKey: ['rdv_professionnel', profilPro?.id],
    queryFn: async () => {
      if (!profilPro) return [];
      const rdvs = await base44.entities.RendezVous.filter(
        { professionnel_id: profilPro.id },
        '-date_rdv'
      );
      return rdvs;
    },
    enabled: !!profilPro,
    initialData: [],
  });

  if (userLoading || profiles === undefined) { // Check profiles loading status here
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p className="text-gray-600">Chargement de votre agenda...</p>
      </div>
    );
  }

  // Si pas spécialiste, afficher loader pendant redirection
  if (!isSpecialist) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  if (loadingRdv) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p className="text-gray-600">Chargement des rendez-vous...</p>
      </div>
    );
  }

  // Filtrer les RDV
  const rdvFiltres = rendezVous.filter(rdv => {
    const matchSearch = !searchQuery || 
      rdv.motif?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rdv.notes_patient?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchType = filtreType === 'tous' || rdv.type_consultation === filtreType;
    const matchStatut = filtreStatut === 'tous' || rdv.statut === filtreStatut;
    
    return matchSearch && matchType && matchStatut;
  });

  const rdvAujourdhui = rdvFiltres.filter(rdv => 
    isToday(new Date(rdv.date_rdv)) && rdv.statut !== 'annule'
  );

  const rdvDemain = rdvFiltres.filter(rdv => 
    isTomorrow(new Date(rdv.date_rdv)) && rdv.statut !== 'annule'
  );

  const rdvSemaine = rdvFiltres.filter(rdv => {
    const dateRdv = new Date(rdv.date_rdv);
    return isWithinInterval(dateRdv, {
      start: startOfWeek(new Date(), { locale: fr }),
      end: endOfWeek(new Date(), { locale: fr })
    }) && rdv.statut !== 'annule';
  });

  // Stats
  const stats = {
    total: rendezVous.length,
    aujourdhui: rdvAujourdhui.length,
    semaine: rdvSemaine.filter(r => new Date(r.date_rdv) > new Date()).length,
    confirmes: rendezVous.filter(r => r.statut === 'confirme' && new Date(r.date_rdv) > new Date()).length,
    enAttente: rendezVous.filter(r => r.statut === 'planifie' && new Date(r.date_rdv) > new Date()).length,
  };

  // Prochain RDV
  const prochainRdv = rendezVous.find(rdv => 
    new Date(rdv.date_rdv) > new Date() && rdv.statut !== 'annule'
  );

  const getTempsRestant = (dateRdv) => {
    const minutes = differenceInMinutes(new Date(dateRdv), new Date());
    if (minutes < 0) return 'En cours';
    if (minutes < 60) return `Dans ${minutes} min`;
    const heures = Math.floor(minutes / 60);
    if (heures < 24) return `Dans ${heures}h`;
    const jours = Math.floor(heures / 24);
    return `Dans ${jours}j`;
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'cabinet': return <Briefcase className="w-4 h-4" />;
      case 'clinique': return <Building2 className="w-4 h-4" />;
      case 'hopital': return <Building2 className="w-4 h-4" />;
      case 'telephone': return <Phone className="w-4 h-4" />;
      case 'visio': return <Video className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'cabinet': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'clinique': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hopital': return 'bg-red-100 text-red-800 border-red-200';
      case 'telephone': return 'bg-green-100 text-green-800 border-green-200';
      case 'visio': return 'bg-teal-100 text-teal-800 border-teal-200';
      default: return 'bg-teal-100 text-teal-800 border-teal-200';
    }
  };

  // Calendrier mensuel
  const joursDuMois = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate)
  });

  const rdvParJour = (jour) => {
    return rendezVous.filter(rdv => 
      isSameDay(new Date(rdv.date_rdv), jour) && rdv.statut !== 'annule'
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-gray-900 dark:to-gray-950">
        {/* Header avec stats */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 pb-24 lg:pb-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-xl">
                    <CalendarIcon className="w-8 h-8 text-teal-600" />
                  </div>
                  Mon Agenda Professionnel
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setShowGestionTarifs(true)}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Tarifs & Paiements
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Link to={createPageUrl('GestionRappels')}>
                    <Bell className="w-4 h-4 mr-2" />
                    Rappels
                  </Link>
                </Button>
                <Button
                  onClick={() => setShowCalendarSync(true)}
                  variant="outline"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Sync Calendrier
                </Button>
                <Button
                  onClick={() => setShowGestionDispo(true)}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Mes Disponibilités
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Total RDV</p>
                      <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                    </div>
                    <CalendarIcon className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Aujourd'hui</p>
                      <p className="text-2xl font-bold text-green-600">{stats.aujourdhui}</p>
                    </div>
                    <Clock className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-indigo-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Cette semaine</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.semaine}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-gradient-to-br from-teal-50 to-cyan-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Confirmés</p>
                      <p className="text-2xl font-bold text-teal-600">{stats.confirmes}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-teal-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600 font-medium">En attente</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.enAttente}</p>
                    </div>
                    <AlertCircle className="w-8 h-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Prochain RDV Alert */}
          {prochainRdv && (
            <Card className="border-l-4 border-l-teal-500 shadow-lg bg-gradient-to-r from-teal-50 to-cyan-50">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-teal-600" />
                      <h3 className="font-bold text-lg text-gray-900">Prochain rendez-vous</h3>
                      <Badge className="bg-teal-600 text-white">
                        {getTempsRestant(prochainRdv.date_rdv)}
                      </Badge>
                    </div>
                    <p className="text-gray-700 font-semibold mb-1">
                      {format(new Date(prochainRdv.date_rdv), "EEEE d MMMM 'à' HH:mm", { locale: fr })}
                    </p>
                    <p className="text-sm text-gray-600">{prochainRdv.motif}</p>
                  </div>
                  <Badge className={getTypeColor(prochainRdv.type_consultation)}>
                    {getTypeIcon(prochainRdv.type_consultation)}
                    <span className="ml-1">{prochainRdv.type_consultation}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Filtres et recherche */}
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par motif, patient..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={filtreType}
                    onChange={(e) => setFiltreType(e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white text-sm"
                  >
                    <option value="tous">Tous les types</option>
                    <option value="cabinet">Cabinet</option>
                    <option value="clinique">Clinique</option>
                    <option value="hopital">Hôpital</option>
                    <option value="telephone">Téléphone</option>
                    <option value="visio">Vidéoconsultation</option>
                  </select>

                  <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-white text-sm"
                  >
                    <option value="tous">Tous les statuts</option>
                    <option value="planifie">Planifié</option>
                    <option value="confirme">Confirmé</option>
                    <option value="en_cours">En cours</option>
                    <option value="termine">Terminé</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contenu principal avec scroll optimisé */}
          <Tabs value={vueActive} onValueChange={setVueActive} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 h-12">
              <TabsTrigger value="aujourdhui" className="text-sm">
                Aujourd'hui
                {rdvAujourdhui.length > 0 && (
                  <Badge className="ml-2 bg-green-600">{rdvAujourdhui.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="demain" className="text-sm">
                Demain
                {rdvDemain.length > 0 && (
                  <Badge className="ml-2 bg-blue-600">{rdvDemain.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="semaine" className="text-sm">
                Cette semaine
                {rdvSemaine.length > 0 && (
                  <Badge className="ml-2 bg-purple-600">{rdvSemaine.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="drag_drop" className="text-sm">
                <Move className="w-4 h-4 mr-1" />
                Déplacer
              </TabsTrigger>
              <TabsTrigger value="calendrier" className="text-sm">
                <CalendarIcon className="w-4 h-4 mr-2" />
                Calendrier
              </TabsTrigger>
            </TabsList>

            {/* Vue Aujourd'hui */}
            <TabsContent value="aujourdhui" className="space-y-4">
              {rdvAujourdhui.length > 0 ? (
                <div className="space-y-4">
                  {rdvAujourdhui.map(rdv => (
                    <GestionRendezVous 
                      key={rdv.id} 
                      rdv={rdv} 
                      currentUserEmail={user?.email}
                      isSpecialist={true}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-12 text-center">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Aucun rendez-vous aujourd'hui
                    </h3>
                    <p className="text-gray-500">
                      Profitez de cette journée pour rattraper votre retard administratif.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Vue Demain */}
            <TabsContent value="demain" className="space-y-4">
              {rdvDemain.length > 0 ? (
                <div className="space-y-4">
                  {rdvDemain.map(rdv => (
                    <GestionRendezVous 
                      key={rdv.id} 
                      rdv={rdv} 
                      currentUserEmail={user?.email}
                      isSpecialist={true}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-12 text-center">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Aucun rendez-vous demain
                    </h3>
                    <p className="text-gray-500">
                      Votre journée de demain est libre pour le moment.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Vue Semaine */}
            <TabsContent value="semaine" className="space-y-4">
              {rdvSemaine.length > 0 ? (
                <div className="space-y-4">
                  {rdvSemaine.map(rdv => (
                    <GestionRendezVous 
                      key={rdv.id} 
                      rdv={rdv} 
                      currentUserEmail={user?.email}
                      isSpecialist={true}
                    />
                  ))}
                </div>
              ) : (
                <Card className="border-2 border-dashed">
                  <CardContent className="p-12 text-center">
                    <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      Aucun rendez-vous cette semaine
                    </h3>
                    <p className="text-gray-500">
                      Votre semaine est libre. Les patients peuvent prendre rendez-vous.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Vue Drag & Drop */}
            <TabsContent value="drag_drop">
              <CalendrierDragDrop
                rendezVous={rdvFiltres}
                isSpecialist={true}
                currentUserEmail={user?.email}
              />
            </TabsContent>

            {/* Vue Calendrier */}
            <TabsContent value="calendrier">
              <Card className="shadow-lg border-none">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>
                      {format(selectedDate, 'MMMM yyyy', { locale: fr })}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(addDays(selectedDate, -30))}
                      >
                        ←
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(new Date())}
                      >
                        Aujourd'hui
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDate(addDays(selectedDate, 30))}
                      >
                        →
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(jour => (
                      <div key={jour} className="text-center text-xs font-semibold text-gray-600 py-2">
                        {jour}
                      </div>
                    ))}
                    
                    {joursDuMois.map(jour => {
                      const rdvsJour = rdvParJour(jour);
                      const estAujourdhui = isToday(jour);
                      
                      return (
                        <div
                          key={jour.toString()}
                          className={`
                            min-h-20 p-2 border rounded-lg cursor-pointer transition-all
                            ${estAujourdhui ? 'bg-teal-50 border-teal-500 ring-2 ring-teal-200' : 'bg-white hover:bg-gray-50'}
                            ${rdvsJour.length > 0 ? 'border-blue-300' : 'border-gray-200'}
                          `}
                        >
                          <div className={`text-sm font-semibold ${estAujourdhui ? 'text-teal-600' : 'text-gray-700'}`}>
                            {format(jour, 'd')}
                          </div>
                          {rdvsJour.length > 0 && (
                            <div className="mt-1 space-y-1">
                              {rdvsJour.slice(0, 2).map(rdv => (
                                <div
                                  key={rdv.id}
                                  className={`text-xs p-1 rounded ${getTypeColor(rdv.type_consultation)} truncate`}
                                >
                                  {format(new Date(rdv.date_rdv), 'HH:mm')}
                                </div>
                              ))}
                              {rdvsJour.length > 2 && (
                                <div className="text-xs text-gray-600 font-semibold">
                                  +{rdvsJour.length - 2} autre(s)
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Modals */}
        {showGestionDispo && profilPro && (
          <GestionDisponibilites
            professionnel={profilPro}
            onClose={() => setShowGestionDispo(false)}
          />
        )}

        {showGestionTarifs && profilPro && (
          <GestionTarifs
            professionnel={profilPro}
            onClose={() => setShowGestionTarifs(false)}
          />
        )}

        {showCalendarSync && profilPro && (
          <CalendarSync
            professionnel={profilPro}
            onClose={() => setShowCalendarSync(false)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
