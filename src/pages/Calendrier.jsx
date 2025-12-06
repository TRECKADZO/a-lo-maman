import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  Clock,
  MapPin,
  User,
  Loader2,
  Filter,
  Video,
  Phone,
  Building2,
  Briefcase,
  CheckCircle,
  XCircle,
  Calendar as CalendarClock
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUT_COLORS = {
  'planifie': 'bg-blue-100 text-blue-800 border-blue-200',
  'confirme': 'bg-green-100 text-green-800 border-green-200',
  'en_cours': 'bg-purple-100 text-purple-800 border-purple-200',
  'termine': 'bg-gray-100 text-gray-800 border-gray-200',
  'annule': 'bg-red-100 text-red-800 border-red-200',
};

const STATUT_ICONS = {
  'planifie': CalendarClock,
  'confirme': CheckCircle,
  'en_cours': Clock,
  'termine': CheckCircle,
  'annule': XCircle,
};

const TYPE_ICONS = {
  'cabinet': Briefcase,
  'clinique': Building2,
  'hopital': Building2,
  'telephone': Phone,
  'visio': Video,
};

export default function Calendrier() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterStatut, setFilterStatut] = useState('tous');
  const [filterType, setFilterType] = useState('tous');
  const [viewMode, setViewMode] = useState('mois'); // 'mois' ou 'semaine'

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: userProfile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const specialites = ['gynecologie', 'pediatrie', 'sage_femme', 'medecin_generaliste', 'infirmier', 'nutritionniste'];
  const isSpecialist = userProfile?.type_compte && specialites.includes(userProfile.type_compte);

  const { data: rendezVous = [], isLoading } = useQuery({
    queryKey: ['rendez_vous_calendrier', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const rdvs = await base44.entities.RendezVous.filter(
        { created_by: user.email },
        '-date_rdv'
      );
      return rdvs;
    },
    enabled: !!user && !isSpecialist,
  });

  const { data: professionnels = [] } = useQuery({
    queryKey: ['professionnels'],
    queryFn: () => base44.entities.Professionnel.list(),
    enabled: !isSpecialist,
  });

  // Filtrer les rendez-vous
  const filteredRdvs = rendezVous.filter(rdv => {
    if (filterStatut !== 'tous' && rdv.statut !== filterStatut) return false;
    if (filterType !== 'tous' && rdv.type_consultation !== filterType) return false;
    return true;
  });

  // Générer les jours du calendrier
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: fr });
  const calendarEnd = endOfWeek(monthEnd, { locale: fr });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Rendez-vous par jour
  const rdvsByDate = filteredRdvs.reduce((acc, rdv) => {
    const date = format(new Date(rdv.date_rdv), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(rdv);
    return acc;
  }, {});

  // Rendez-vous du jour sélectionné
  const selectedDateRdvs = rdvsByDate[format(selectedDate, 'yyyy-MM-dd')] || [];

  // Exporter au format iCal
  const generateICalFile = () => {
    let icalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//A\'lo Maman//Calendrier Médical//FR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Mes Rendez-vous Médicaux',
      'X-WR-TIMEZONE:Africa/Abidjan',
    ];

    filteredRdvs.forEach(rdv => {
      const pro = professionnels.find(p => p.id === rdv.professionnel_id);
      const dtstart = format(new Date(rdv.date_rdv), "yyyyMMdd'T'HHmmss");
      const dtend = format(new Date(new Date(rdv.date_rdv).getTime() + 30 * 60000), "yyyyMMdd'T'HHmmss");
      
      icalContent.push(
        'BEGIN:VEVENT',
        `UID:${rdv.id}@alomaman.com`,
        `DTSTAMP:${format(new Date(), "yyyyMMdd'T'HHmmss")}`,
        `DTSTART:${dtstart}`,
        `DTEND:${dtend}`,
        `SUMMARY:RDV ${pro?.specialite || 'Médical'} - ${pro?.nom_complet || 'Spécialiste'}`,
        `DESCRIPTION:Type: ${rdv.type_consultation}\\nMotif: ${rdv.motif || 'Non spécifié'}\\nStatut: ${rdv.statut}`,
        rdv.adresse_consultation ? `LOCATION:${rdv.adresse_consultation}` : '',
        `STATUS:${rdv.statut === 'confirme' ? 'CONFIRMED' : 'TENTATIVE'}`,
        'END:VEVENT'
      );
    });

    icalContent.push('END:VCALENDAR');
    
    const blob = new Blob([icalContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rdv-medicaux-${format(new Date(), 'yyyy-MM')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Générer lien de partage Google Calendar
  const shareToGoogleCalendar = (rdv) => {
    const pro = professionnels.find(p => p.id === rdv.professionnel_id);
    const startDate = format(new Date(rdv.date_rdv), "yyyyMMdd'T'HHmmss");
    const endDate = format(new Date(new Date(rdv.date_rdv).getTime() + 30 * 60000), "yyyyMMdd'T'HHmmss");
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `RDV ${pro?.specialite || 'Médical'} - ${pro?.nom_complet || 'Spécialiste'}`,
      dates: `${startDate}/${endDate}`,
      details: `Type: ${rdv.type_consultation}\nMotif: ${rdv.motif || 'Non spécifié'}\nStatut: ${rdv.statut}`,
      location: rdv.adresse_consultation || '',
    });

    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  };

  // Navigation mois
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (isSpecialist) {
    navigate(createPageUrl('MonAgenda'), { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-400 to-purple-500 rounded-xl">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              Mon Calendrier Médical
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Vue d'ensemble de vos rendez-vous et consultations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shadow-sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter / Synchroniser
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuItem onClick={generateICalFile}>
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger (.ics)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => alert('Ouvrez le fichier .ics téléchargé avec Google Calendar, Outlook, ou Apple Calendar pour synchroniser automatiquement.')}>
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Comment synchroniser ?
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={goToToday} variant="outline">
              Aujourd'hui
            </Button>
          </div>
        </div>

        {/* Info Synchronisation */}
        <Alert className="bg-blue-50 border-blue-200">
          <CalendarIcon className="w-4 h-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>💡 Synchronisez avec vos calendriers :</strong> Téléchargez le fichier .ics et importez-le dans Google Calendar, Outlook, ou Apple Calendar pour voir vos rendez-vous partout !
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendrier Principal */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-xl border-none">
              <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold">
                    {format(currentDate, 'MMMM yyyy', { locale: fr })}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={prevMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {/* Jours de la semaine */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grille du calendrier */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const dayRdvs = rdvsByDate[dateKey] || [];
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isTodayDate = isToday(day);

                    return (
                      <div
                        key={dateKey}
                        onClick={() => setSelectedDate(day)}
                        className={`
                          min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all
                          ${isSelected ? 'bg-pink-100 border-pink-400 shadow-lg scale-105' : 'bg-white border-gray-200 hover:bg-gray-50'}
                          ${!isCurrentMonth && 'opacity-40'}
                          ${isTodayDate && !isSelected && 'border-purple-500 border-2 bg-purple-50'}
                        `}
                      >
                        <div className={`text-sm font-semibold mb-1 ${isTodayDate ? 'text-purple-600' : 'text-gray-700'}`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayRdvs.slice(0, 2).map(rdv => (
                            <div
                              key={rdv.id}
                              className={`text-xs p-1 rounded truncate ${STATUT_COLORS[rdv.statut] || 'bg-gray-100'}`}
                            >
                              {format(new Date(rdv.date_rdv), 'HH:mm')}
                            </div>
                          ))}
                          {dayRdvs.length > 2 && (
                            <div className="text-xs text-gray-600 font-semibold">
                              +{dayRdvs.length - 2}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stats rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{filteredRdvs.length}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Confirmés</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredRdvs.filter(r => r.statut === 'confirme').length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">En attente</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {filteredRdvs.filter(r => r.statut === 'planifie').length}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-red-50 to-rose-50 border-red-200">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Annulés</p>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredRdvs.filter(r => r.statut === 'annule').length}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Sidebar - Détails du jour */}
          <div className="space-y-4">
            {/* Filtres */}
            <Card className="shadow-lg border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Statut</label>
                  <Select value={filterStatut} onValueChange={setFilterStatut}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous</SelectItem>
                      <SelectItem value="planifie">Planifié</SelectItem>
                      <SelectItem value="confirme">Confirmé</SelectItem>
                      <SelectItem value="termine">Terminé</SelectItem>
                      <SelectItem value="annule">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous</SelectItem>
                      <SelectItem value="cabinet">Cabinet</SelectItem>
                      <SelectItem value="clinique">Clinique</SelectItem>
                      <SelectItem value="hopital">Hôpital</SelectItem>
                      <SelectItem value="telephone">Téléphone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Rendez-vous du jour sélectionné */}
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedDateRdvs.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDateRdvs.map(rdv => {
                      const pro = professionnels.find(p => p.id === rdv.professionnel_id);
                      const StatusIcon = STATUT_ICONS[rdv.statut] || Clock;
                      const TypeIcon = TYPE_ICONS[rdv.type_consultation] || CalendarIcon;

                      return (
                        <div key={rdv.id} className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-gray-600" />
                              <span className="font-semibold text-gray-900">
                                {format(new Date(rdv.date_rdv), 'HH:mm')}
                              </span>
                            </div>
                            <Badge className={STATUT_COLORS[rdv.statut]}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {rdv.statut}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="font-medium">{pro?.nom_complet || 'Spécialiste'}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <TypeIcon className="w-4 h-4 text-gray-500" />
                              <span className="capitalize">{rdv.type_consultation}</span>
                            </div>

                            {rdv.adresse_consultation && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                                <span className="text-xs text-gray-600">{rdv.adresse_consultation}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 mt-3 pt-3 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => shareToGoogleCalendar(rdv)}
                              className="flex-1 text-xs"
                            >
                              <Share2 className="w-3 h-3 mr-1" />
                              Partager
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => navigate(createPageUrl('Teleconsultation'))}
                              className="flex-1 text-xs"
                            >
                              Détails
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">Aucun rendez-vous</p>
                    <p className="text-sm">ce jour-là</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}