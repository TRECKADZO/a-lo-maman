import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  Video,
  Building2,
  Briefcase,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  ArrowRight,
  Stethoscope,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { format, isAfter, isBefore, isToday, isTomorrow, isPast } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GestionRendezVous from '@/components/teleconsultation/GestionRendezVous';

export default function MesRendezVous() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRdv, setSelectedRdv] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState('tous');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: rendezVous = [], isLoading: rdvLoading } = useQuery({
    queryKey: ['mes_rendez_vous', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.RendezVous.filter(
        { created_by: user.email },
        '-date_rdv'
      );
    },
    enabled: !!user,
  });

  const { data: professionnels = [] } = useQuery({
    queryKey: ['professionnels'],
    queryFn: () => base44.entities.Professionnel.list(),
    initialData: [],
  });

  // Filtrer les rendez-vous
  const rdvFiltres = rendezVous.filter(rdv => {
    const matchSearch = !searchQuery || 
      rdv.motif?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rdv.notes_patient?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchStatut = filtreStatut === 'tous' || rdv.statut === filtreStatut;
    
    return matchSearch && matchStatut;
  });

  // Séparer futurs et passés
  const rdvFuturs = rdvFiltres.filter(rdv => 
    isAfter(new Date(rdv.date_rdv), new Date()) && rdv.statut !== 'annule'
  );

  const rdvPasses = rdvFiltres.filter(rdv => 
    isBefore(new Date(rdv.date_rdv), new Date()) || rdv.statut === 'termine' || rdv.statut === 'annule'
  );

  const rdvAujourdhui = rdvFiltres.filter(rdv => 
    isToday(new Date(rdv.date_rdv)) && rdv.statut !== 'annule'
  );

  // Stats
  const stats = {
    total: rendezVous.length,
    futurs: rdvFuturs.length,
    aujourdhui: rdvAujourdhui.length,
    passes: rdvPasses.length,
    annules: rendezVous.filter(r => r.statut === 'annule').length,
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'cabinet': return <Briefcase className="w-4 h-4" />;
      case 'clinique': return <Building2 className="w-4 h-4" />;
      case 'hopital': return <Building2 className="w-4 h-4" />;
      case 'telephone': return <Phone className="w-4 h-4" />;
      default: return <Video className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'cabinet': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'clinique': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'hopital': return 'bg-red-100 text-red-800 border-red-200';
      case 'telephone': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-teal-100 text-teal-800 border-teal-200';
    }
  };

  const getStatutBadge = (statut) => {
    const configs = {
      planifie: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Planifié' },
      confirme: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Confirmé' },
      en_cours: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'En cours' },
      termine: { color: 'bg-gray-100 text-gray-800', icon: CheckCircle, label: 'Terminé' },
      annule: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Annulé' },
    };
    const config = configs[statut] || configs.planifie;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getProfessionnelInfo = (profId) => {
    return professionnels.find(p => p.id === profId);
  };

  const getDateLabel = (dateStr) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Aujourd\'hui';
    if (isTomorrow(date)) return 'Demain';
    if (isPast(date)) return 'Passé';
    return format(date, 'EEEE d MMMM', { locale: fr });
  };

  const RdvCard = ({ rdv, isPast = false }) => {
    const pro = getProfessionnelInfo(rdv.professionnel_id);
    const dateLabel = getDateLabel(rdv.date_rdv);

    return (
      <Card className="hover:shadow-lg transition-all duration-300 border-none bg-white">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                {/* Avatar Pro */}
                <div className="w-14 h-14 bg-gradient-to-br from-pink-400 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0">
                  {pro?.photo ? (
                    <img src={pro.photo} alt={pro.nom_complet} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <Stethoscope className="w-7 h-7 text-white" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {pro?.nom_complet || 'Professionnel'}
                    </h3>
                    {getStatutBadge(rdv.statut)}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {pro?.specialite && (
                      <span className="capitalize">{pro.specialite.replace(/_/g, ' ')}</span>
                    )}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span className="font-medium">{dateLabel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{format(new Date(rdv.date_rdv), 'HH:mm')}</span>
                    </div>
                    <Badge className={getTypeColor(rdv.type_consultation)}>
                      {getTypeIcon(rdv.type_consultation)}
                      <span className="ml-1 capitalize">{rdv.type_consultation}</span>
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="flex-shrink-0">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    setSelectedRdv(rdv);
                    setShowDetails(true);
                  }}>
                    <Eye className="w-4 h-4 mr-2" />
                    Voir les détails
                  </DropdownMenuItem>
                  {!isPast && rdv.statut !== 'annule' && rdv.statut !== 'termine' && (
                    <>
                      <DropdownMenuItem onClick={() => {
                        setSelectedRdv(rdv);
                        setShowDetails(true);
                      }}>
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedRdv(rdv);
                          setShowDetails(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Annuler
                      </DropdownMenuItem>
                    </>
                  )}
                  {rdv.notes_professionnel && (
                    <DropdownMenuItem onClick={() => {
                      setSelectedRdv(rdv);
                      setShowDetails(true);
                    }}>
                      <FileText className="w-4 h-4 mr-2" />
                      Notes du médecin
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Motif */}
            {rdv.motif && (
              <div className="pt-3 border-t">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Motif :</span> {rdv.motif}
                </p>
              </div>
            )}

            {/* Adresse si physique */}
            {rdv.adresse_consultation && (
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{rdv.adresse_consultation}</span>
              </div>
            )}

            {/* Actions rapides */}
            <div className="flex gap-2 pt-3 border-t">
              {!isPast && rdv.statut !== 'annule' && rdv.statut !== 'termine' && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedRdv(rdv);
                    setShowDetails(true);
                  }}
                  className="bg-pink-600 hover:bg-pink-700"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Gérer
                </Button>
              )}
              
              {pro && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Teleconsultation'))}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Contacter
                </Button>
              )}

              {rdv.notes_professionnel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedRdv(rdv);
                    setShowDetails(true);
                  }}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Voir notes
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (userLoading || rdvLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <Loader2 className="w-10 h-10 animate-spin text-pink-500 mb-4" />
        <p className="text-gray-600">Chargement de vos rendez-vous...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-pink-100 rounded-xl">
                <Calendar className="w-8 h-8 text-pink-600" />
              </div>
              Mes Rendez-vous
            </h1>
            <p className="text-gray-600 mt-1">
              Gérez tous vos rendez-vous médicaux en un seul endroit
            </p>
          </div>

          <Button
            onClick={() => navigate(createPageUrl('Teleconsultation'))}
            className="bg-pink-600 hover:bg-pink-700"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Prendre un rendez-vous
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-200" />
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
                  <p className="text-xs text-gray-600 font-medium">À venir</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.futurs}</p>
                </div>
                <ArrowRight className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-gray-50 to-slate-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Passés</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.passes}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-gray-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-rose-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Annulés</p>
                  <p className="text-2xl font-bold text-red-600">{stats.annules}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="shadow-lg border-none">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par motif, spécialiste..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={filtreStatut}
                onChange={(e) => setFiltreStatut(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white text-sm min-w-[150px]"
              >
                <option value="tous">Tous les statuts</option>
                <option value="planifie">Planifié</option>
                <option value="confirme">Confirmé</option>
                <option value="en_cours">En cours</option>
                <option value="termine">Terminé</option>
                <option value="annule">Annulé</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Rendez-vous */}
        {rendezVous.length === 0 ? (
          <Card className="border-2 border-dashed shadow-lg">
            <CardContent className="p-12 text-center">
              <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Aucun rendez-vous
              </h3>
              <p className="text-gray-500 mb-6">
                Vous n'avez pas encore pris de rendez-vous avec un professionnel de santé.
              </p>
              <Button
                onClick={() => navigate(createPageUrl('Teleconsultation'))}
                className="bg-pink-600 hover:bg-pink-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Prendre mon premier rendez-vous
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="futurs" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 h-12">
              <TabsTrigger value="futurs" className="text-base">
                Rendez-vous à venir
                {rdvFuturs.length > 0 && (
                  <Badge className="ml-2 bg-pink-600">{rdvFuturs.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="passes" className="text-base">
                Historique
                {rdvPasses.length > 0 && (
                  <Badge className="ml-2 bg-gray-600">{rdvPasses.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Futurs */}
            <TabsContent value="futurs" className="space-y-4">
              {rdvFuturs.length > 0 ? (
                rdvFuturs.map(rdv => (
                  <RdvCard key={rdv.id} rdv={rdv} />
                ))
              ) : (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Aucun rendez-vous à venir. Prenez rendez-vous avec un spécialiste.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            {/* Passés */}
            <TabsContent value="passes" className="space-y-4">
              {rdvPasses.length > 0 ? (
                rdvPasses.map(rdv => (
                  <RdvCard key={rdv.id} rdv={rdv} isPast={true} />
                ))
              ) : (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Aucun rendez-vous dans l'historique.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Dialog détails */}
      {showDetails && selectedRdv && (
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Détails du rendez-vous</DialogTitle>
              <DialogDescription>
                {format(new Date(selectedRdv.date_rdv), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </DialogDescription>
            </DialogHeader>
            
            <GestionRendezVous 
              rdv={selectedRdv}
              currentUserEmail={user?.email}
              isSpecialist={false}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}