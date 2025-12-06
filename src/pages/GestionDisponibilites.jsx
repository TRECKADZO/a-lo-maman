import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Trash2, 
  Clock, 
  Calendar, 
  Save, 
  ArrowLeft,
  Briefcase, 
  Phone, 
  Building2, 
  CalendarIcon,
  Loader2,
  CheckCircle,
  Info,
  Edit,
  HelpCircle,
  XCircle,
  AlertTriangle,
  CalendarX,
  Repeat,
  CalendarCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import GuideDisponibilites from '../components/teleconsultation/GuideDisponibilites';
import { format, addDays, startOfDay, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function GestionDisponibilites() {
  const queryClient = useQueryClient();
  
  // Planning hebdomadaire type (réplicable)
  const [planningType, setPlanningType] = useState([]);
  
  // Exceptions pour jours spécifiques
  const [exceptions, setExceptions] = useState([]);
  
  // Form pour nouveau créneau type
  const [nouveauCreneau, setNouveauCreneau] = useState({
    jours: [],
    heure_debut: '',
    heure_fin: '',
    types_consultation: [],
  });
  
  // Form pour exception
  const [nouvelleException, setNouvelleException] = useState({
    date: null,
    type: 'fermeture', // fermeture | modification | conges
    raison: '',
    horaires: []
  });
  
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingException, setEditingException] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilPro, isLoading } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    },
    enabled: !!user,
  });

  React.useEffect(() => {
    if (profilPro) {
      setPlanningType(profilPro.planning_hebdomadaire_type || []);
      setExceptions(profilPro.exceptions_agenda || []);
    }
  }, [profilPro]);

  const typesConsultation = profilPro?.types_consultation_offerts || ['cabinet', 'clinique', 'hopital', 'telephone'];

  // Toggle jour pour planning type
  const toggleJour = (jour) => {
    if (editingIndex !== null) {
      setNouveauCreneau(prev => ({
        ...prev,
        jours: prev.jours.includes(jour) && prev.jours.length === 1 ? [] : [jour]
      }));
    } else {
      const jours = nouveauCreneau.jours;
      setNouveauCreneau({
        ...nouveauCreneau,
        jours: jours.includes(jour) ? jours.filter(j => j !== jour) : [...jours, jour]
      });
    }
  };

  const toggleTypeConsultation = (type) => {
    const types = nouveauCreneau.types_consultation;
    setNouveauCreneau({
      ...nouveauCreneau,
      types_consultation: types.includes(type) ? types.filter(t => t !== type) : [...types, type]
    });
  };

  // Ajouter créneau au planning type
  const addCreneauType = () => {
    if (nouveauCreneau.jours.length === 0 || !nouveauCreneau.heure_debut || !nouveauCreneau.heure_fin) {
      alert('Veuillez sélectionner au moins un jour et remplir les heures.');
      return;
    }

    if (nouveauCreneau.heure_debut >= nouveauCreneau.heure_fin) {
      alert("L'heure de fin doit être après l'heure de début.");
      return;
    }

    const nouveauxCreneaux = nouveauCreneau.jours.map(jour => ({
      jour: jour,
      heure_debut: nouveauCreneau.heure_debut,
      heure_fin: nouveauCreneau.heure_fin,
      types_consultation: [...nouveauCreneau.types_consultation],
    }));

    setPlanningType([...planningType, ...nouveauxCreneaux]);
    setNouveauCreneau({
      jours: [],
      heure_debut: '',
      heure_fin: '',
      types_consultation: [],
    });
  };

  const removeCreneauType = (index) => {
    setPlanningType(planningType.filter((_, i) => i !== index));
  };

  const startEditCreneau = (index) => {
    const creneau = planningType[index];
    setEditingIndex(index);
    setNouveauCreneau({
      jours: [creneau.jour],
      heure_debut: creneau.heure_debut,
      heure_fin: creneau.heure_fin,
      types_consultation: creneau.types_consultation || [],
    });
  };

  const saveEditCreneau = () => {
    if (editingIndex === null) return;
    
    if (nouveauCreneau.jours.length === 0 || !nouveauCreneau.heure_debut || !nouveauCreneau.heure_fin) {
      alert('Veuillez sélectionner un jour et remplir les heures.');
      return;
    }

    const updatedPlanning = [...planningType];
    updatedPlanning[editingIndex] = {
      jour: nouveauCreneau.jours[0],
      heure_debut: nouveauCreneau.heure_debut,
      heure_fin: nouveauCreneau.heure_fin,
      types_consultation: nouveauCreneau.types_consultation,
    };

    setPlanningType(updatedPlanning);
    setEditingIndex(null);
    setNouveauCreneau({
      jours: [],
      heure_debut: '',
      heure_fin: '',
      types_consultation: [],
    });
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setNouveauCreneau({
      jours: [],
      heure_debut: '',
      heure_fin: '',
      types_consultation: [],
    });
  };

  // Gestion des exceptions
  const addException = () => {
    if (!nouvelleException.date) {
      alert('Veuillez sélectionner une date.');
      return;
    }

    const dateStr = format(nouvelleException.date, 'yyyy-MM-dd');
    
    // Vérifier si exception existe déjà
    if (exceptions.some(e => e.date === dateStr)) {
      alert('Une exception existe déjà pour cette date.');
      return;
    }

    const newException = {
      date: dateStr,
      type: nouvelleException.type,
      raison: nouvelleException.raison,
      horaires: nouvelleException.type === 'modification' ? nouvelleException.horaires : []
    };

    setExceptions([...exceptions, newException]);
    setNouvelleException({
      date: null,
      type: 'fermeture',
      raison: '',
      horaires: []
    });
  };

  const removeException = (index) => {
    setExceptions(exceptions.filter((_, i) => i !== index));
  };

  const startEditException = (index) => {
    const exception = exceptions[index];
    setEditingException(index);
    setNouvelleException({
      date: parseISO(exception.date),
      type: exception.type,
      raison: exception.raison,
      horaires: exception.horaires || []
    });
  };

  const saveEditException = () => {
    if (editingException === null) return;
    
    if (!nouvelleException.date) {
      alert('Veuillez sélectionner une date.');
      return;
    }

    const updatedExceptions = [...exceptions];
    updatedExceptions[editingException] = {
      date: format(nouvelleException.date, 'yyyy-MM-dd'),
      type: nouvelleException.type,
      raison: nouvelleException.raison,
      horaires: nouvelleException.type === 'modification' ? nouvelleException.horaires : []
    };

    setExceptions(updatedExceptions);
    setEditingException(null);
    setNouvelleException({
      date: null,
      type: 'fermeture',
      raison: '',
      horaires: []
    });
  };

  const cancelEditException = () => {
    setEditingException(null);
    setNouvelleException({
      date: null,
      type: 'fermeture',
      raison: '',
      horaires: []
    });
  };

  // Sauvegarder tout
  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Professionnel.update(profilPro.id, {
        planning_hebdomadaire_type: planningType,
        exceptions_agenda: exceptions,
        disponibilites: planningType // Pour compatibilité avec ancien système
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profil_professionnel'] });
      queryClient.invalidateQueries({ queryKey: ['professionnels'] });
      alert('✅ Planning et exceptions sauvegardés avec succès !');
    },
  });

  // Helpers
  const getIconType = (type) => {
    switch(type) {
      case 'cabinet': return <Briefcase className="w-3 h-3" />;
      case 'clinique': return <Briefcase className="w-3 h-3" />;
      case 'hopital': return <Building2 className="w-3 h-3" />;
      case 'telephone': return <Phone className="w-3 h-3" />;
      default: return <Calendar className="w-3 h-3" />;
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'cabinet': return 'Cabinet';
      case 'clinique': return 'Clinique';
      case 'hopital': return 'Hôpital';
      case 'telephone': return 'Téléphone';
      default: return type;
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

  // Générer aperçu du mois avec planning + exceptions
  const generateMonthView = () => {
    const joursDuMois = eachDayOfInterval({
      start: startOfMonth(selectedMonth),
      end: endOfMonth(selectedMonth)
    });

    return joursDuMois.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const jourSemaine = format(date, 'EEEE', { locale: fr });
      const jourNormalized = jourSemaine.charAt(0).toUpperCase() + jourSemaine.slice(1);
      
      // Chercher exception pour cette date
      const exception = exceptions.find(e => e.date === dateStr);
      
      // Chercher créneaux du planning type pour ce jour
      const creneauxType = planningType.filter(c => c.jour === jourNormalized);
      
      return {
        date,
        dateStr,
        jourSemaine: jourNormalized,
        exception,
        creneauxType,
        hasCreneaux: exception?.type === 'modification' 
          ? exception.horaires.length > 0 
          : creneauxType.length > 0 && exception?.type !== 'fermeture' && exception?.type !== 'conges'
      };
    });
  };

  const monthView = generateMonthView();

  // Stats
  const stats = {
    totalCreneaux: planningType.length,
    joursCouverts: [...new Set(planningType.map(d => d.jour))].length,
    exceptionsCount: exceptions.length,
    fermeturesCount: exceptions.filter(e => e.type === 'fermeture' || e.type === 'conges').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50 dark:from-gray-900 dark:to-gray-950">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <Button asChild variant="ghost" className="mb-2 -ml-2">
              <Link to={createPageUrl('MonAgenda')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'agenda
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-teal-100 rounded-xl">
                <Repeat className="w-8 h-8 text-teal-600" />
              </div>
              Gestion de l'agenda annuel
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Planning hebdomadaire réplicable + exceptions pour jours spécifiques
            </p>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || (planningType.length === 0 && exceptions.length === 0)}
            className="bg-teal-600 hover:bg-teal-700 shadow-md"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sauvegarde...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder tout
              </>
            )}
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Planning type</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalCreneaux}</p>
                  <p className="text-xs text-gray-500 mt-1">créneaux</p>
                </div>
                <Repeat className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Jours couverts</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.joursCouverts}/7</p>
                </div>
                <CalendarCheck className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Exceptions</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.exceptionsCount}</p>
                </div>
                <AlertTriangle className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md bg-gradient-to-br from-red-50 to-pink-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Fermetures</p>
                  <p className="text-3xl font-bold text-red-600">{stats.fermeturesCount}</p>
                </div>
                <CalendarX className="w-12 h-12 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Alert */}
        <Alert className="bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
          <Info className="w-4 h-4 text-teal-600" />
          <AlertDescription className="text-teal-800">
            <strong>🔄 Fonctionnement :</strong>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• <strong>Planning hebdomadaire type</strong> : Votre emploi du temps habituel, répliqué automatiquement sur toute l'année</li>
              <li>• <strong>Exceptions</strong> : Modifiez des jours spécifiques (congés, fermetures, horaires exceptionnels)</li>
              <li>• <strong>Priorité</strong> : Les exceptions remplacent le planning type pour les dates concernées</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="planning" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="planning">
              <Repeat className="w-4 h-4 mr-2" />
              Planning type
            </TabsTrigger>
            <TabsTrigger value="exceptions">
              <CalendarX className="w-4 h-4 mr-2" />
              Exceptions ({stats.exceptionsCount})
            </TabsTrigger>
            <TabsTrigger value="apercu">
              <CalendarCheck className="w-4 h-4 mr-2" />
              Aperçu mensuel
            </TabsTrigger>
            <TabsTrigger value="guide">
              <HelpCircle className="w-4 h-4 mr-2" />
              Guide
            </TabsTrigger>
          </TabsList>

          {/* Planning hebdomadaire type */}
          <TabsContent value="planning" className="space-y-4">
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Repeat className="w-5 h-5 text-teal-600" />
                  Planning hebdomadaire type
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Ce planning sera automatiquement répliqué sur toute l'année
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Formulaire d'ajout */}
                <div className="space-y-4 p-6 bg-gray-50 rounded-lg border-2 border-dashed">
                  <h3 className="font-semibold flex items-center gap-2">
                    {editingIndex !== null ? (
                      <>
                        <Edit className="w-4 h-4 text-blue-600" />
                        Modifier le créneau
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 text-teal-600" />
                        Ajouter un créneau type
                      </>
                    )}
                  </h3>

                  {/* Sélection jours */}
                  <div className="space-y-2">
                    <Label>Jour(s) *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                      {JOURS_SEMAINE.map(jour => (
                        <div
                          key={jour}
                          onClick={() => toggleJour(jour)}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all text-center ${
                            nouveauCreneau.jours.includes(jour)
                              ? 'border-teal-500 bg-teal-100 shadow-md'
                              : 'border-gray-300 bg-white hover:border-teal-300'
                          }`}
                        >
                          <span className="text-sm font-medium">{jour.slice(0, 3)}</span>
                          {nouveauCreneau.jours.includes(jour) && (
                            <CheckCircle className="w-4 h-4 text-teal-600 mx-auto mt-1" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Horaires */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Heure début *</Label>
                      <Input
                        type="time"
                        value={nouveauCreneau.heure_debut}
                        onChange={(e) => setNouveauCreneau({ ...nouveauCreneau, heure_debut: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Heure fin *</Label>
                      <Input
                        type="time"
                        value={nouveauCreneau.heure_fin}
                        onChange={(e) => setNouveauCreneau({ ...nouveauCreneau, heure_fin: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Types consultation */}
                  <div className="space-y-2">
                    <Label>Types de consultation</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {typesConsultation.map(type => (
                        <div
                          key={type}
                          onClick={() => toggleTypeConsultation(type)}
                          className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            nouveauCreneau.types_consultation.includes(type)
                              ? 'border-teal-500 bg-teal-100'
                              : 'border-gray-300 bg-white hover:border-teal-300'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {getIconType(type)}
                            <span className="text-xs">{getTypeLabel(type)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-2">
                    {editingIndex !== null && (
                      <Button onClick={cancelEdit} variant="outline" className="flex-1">
                        Annuler
                      </Button>
                    )}
                    <Button
                      onClick={editingIndex !== null ? saveEditCreneau : addCreneauType}
                      className={`flex-1 ${editingIndex !== null ? 'bg-blue-600' : 'bg-teal-600'}`}
                    >
                      {editingIndex !== null ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Enregistrer
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Ajouter
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Liste des créneaux */}
                {planningType.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Créneaux configurés ({planningType.length})</h3>
                    <div className="space-y-2">
                      {JOURS_SEMAINE.map(jour => {
                        const creneauxJour = planningType.filter(c => c.jour === jour);
                        if (creneauxJour.length === 0) return null;
                        
                        return (
                          <div key={jour}>
                            <p className="text-sm font-semibold text-gray-700 mb-2">{jour}</p>
                            <div className="space-y-2 pl-4">
                              {creneauxJour.map((creneau, idx) => {
                                const globalIndex = planningType.findIndex(c => 
                                  c.jour === jour && 
                                  c.heure_debut === creneau.heure_debut && 
                                  c.heure_fin === creneau.heure_fin
                                );
                                
                                return (
                                  <div key={idx} className="flex items-center justify-between p-3 bg-teal-50 rounded-lg border border-teal-200">
                                    <div className="flex items-center gap-3">
                                      <Clock className="w-4 h-4 text-teal-600" />
                                      <span className="font-semibold">{creneau.heure_debut} - {creneau.heure_fin}</span>
                                      <div className="flex gap-1">
                                        {creneau.types_consultation?.map((type, i) => (
                                          <Badge key={i} variant="outline" className={`text-xs ${getTypeColor(type)}`}>
                                            {getTypeLabel(type)}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => startEditCreneau(globalIndex)}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeCreneauType(globalIndex)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Exceptions */}
          <TabsContent value="exceptions" className="space-y-4">
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarX className="w-5 h-5 text-orange-600" />
                  Gérer les exceptions
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Modifiez des jours spécifiques : congés, fermetures, horaires exceptionnels
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Formulaire exception */}
                <div className="space-y-4 p-6 bg-orange-50 rounded-lg border-2 border-dashed border-orange-200">
                  <h3 className="font-semibold flex items-center gap-2 text-orange-900">
                    {editingException !== null ? (
                      <>
                        <Edit className="w-4 h-4" />
                        Modifier l'exception
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Ajouter une exception
                      </>
                    )}
                  </h3>

                  {/* Sélection date */}
                  <div className="space-y-2">
                    <Label>Date *</Label>
                    <CalendarComponent
                      mode="single"
                      selected={nouvelleException.date}
                      onSelect={(date) => setNouvelleException({ ...nouvelleException, date })}
                      locale={fr}
                      className="rounded-md border bg-white"
                      disabled={(date) => date < startOfDay(new Date())}
                    />
                  </div>

                  {/* Type d'exception */}
                  <div className="space-y-2">
                    <Label>Type d'exception *</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        onClick={() => setNouvelleException({ ...nouvelleException, type: 'fermeture', horaires: [] })}
                        className={`p-4 border-2 rounded-lg cursor-pointer text-center ${
                          nouvelleException.type === 'fermeture'
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <XCircle className="w-6 h-6 mx-auto mb-2 text-red-600" />
                        <p className="text-sm font-semibold">Fermeture</p>
                      </div>
                      
                      <div
                        onClick={() => setNouvelleException({ ...nouvelleException, type: 'conges' })}
                        className={`p-4 border-2 rounded-lg cursor-pointer text-center ${
                          nouvelleException.type === 'conges'
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <CalendarX className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm font-semibold">Congés</p>
                      </div>
                      
                      <div
                        onClick={() => setNouvelleException({ ...nouvelleException, type: 'modification' })}
                        className={`p-4 border-2 rounded-lg cursor-pointer text-center ${
                          nouvelleException.type === 'modification'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        <Edit className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm font-semibold">Horaires modifiés</p>
                      </div>
                    </div>
                  </div>

                  {/* Raison */}
                  <div className="space-y-2">
                    <Label>Raison</Label>
                    <Textarea
                      value={nouvelleException.raison}
                      onChange={(e) => setNouvelleException({ ...nouvelleException, raison: e.target.value })}
                      placeholder="Ex: Formation, Congés annuels, Horaires réduits..."
                      rows={2}
                    />
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-2">
                    {editingException !== null && (
                      <Button onClick={cancelEditException} variant="outline" className="flex-1">
                        Annuler
                      </Button>
                    )}
                    <Button
                      onClick={editingException !== null ? saveEditException : addException}
                      className={`flex-1 ${editingException !== null ? 'bg-blue-600' : 'bg-orange-600'}`}
                    >
                      {editingException !== null ? 'Enregistrer' : 'Ajouter exception'}
                    </Button>
                  </div>
                </div>

                {/* Liste exceptions */}
                {exceptions.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Exceptions configurées ({exceptions.length})</h3>
                    <div className="space-y-2">
                      {exceptions.sort((a, b) => new Date(a.date) - new Date(b.date)).map((exception, index) => (
                        <div key={index} className="p-4 bg-white rounded-lg border-2 border-orange-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <CalendarIcon className="w-5 h-5 text-orange-600" />
                                <p className="font-bold text-gray-900">
                                  {format(parseISO(exception.date), 'EEEE d MMMM yyyy', { locale: fr })}
                                </p>
                                <Badge className={
                                  exception.type === 'fermeture' ? 'bg-red-600' :
                                  exception.type === 'conges' ? 'bg-purple-600' :
                                  'bg-blue-600'
                                }>
                                  {exception.type === 'fermeture' ? 'Fermé' :
                                   exception.type === 'conges' ? 'Congés' :
                                   'Horaires modifiés'}
                                </Badge>
                              </div>
                              {exception.raison && (
                                <p className="text-sm text-gray-600">{exception.raison}</p>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEditException(index)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeException(index)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aperçu mensuel */}
          <TabsContent value="apercu" className="space-y-4">
            <Card className="shadow-lg border-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarCheck className="w-5 h-5 text-green-600" />
                    Aperçu du planning réel
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonth(addDays(selectedMonth, -30))}
                    >
                      ←
                    </Button>
                    <span className="px-4 py-2 font-semibold">
                      {format(selectedMonth, 'MMMM yyyy', { locale: fr })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedMonth(addDays(selectedMonth, 30))}
                    >
                      →
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Visualisez votre planning final (planning type + exceptions)
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(jour => (
                    <div key={jour} className="text-center text-xs font-semibold text-gray-600 py-2">
                      {jour}
                    </div>
                  ))}
                  
                  {monthView.map(({ date, dateStr, jourSemaine, exception, creneauxType, hasCreneaux }) => (
                    <div
                      key={dateStr}
                      className={`
                        min-h-20 p-2 border rounded-lg
                        ${exception?.type === 'fermeture' || exception?.type === 'conges' 
                          ? 'bg-red-50 border-red-300' 
                          : exception?.type === 'modification'
                          ? 'bg-blue-50 border-blue-300'
                          : hasCreneaux
                          ? 'bg-green-50 border-green-300'
                          : 'bg-gray-50 border-gray-200'
                        }
                        ${isSameDay(date, new Date()) ? 'ring-2 ring-teal-500' : ''}
                      `}
                    >
                      <div className="text-sm font-semibold mb-1">
                        {format(date, 'd')}
                      </div>
                      
                      {exception && (
                        <Badge className={`text-xs ${
                          exception.type === 'fermeture' || exception.type === 'conges'
                            ? 'bg-red-600'
                            : 'bg-blue-600'
                        }`}>
                          {exception.type === 'fermeture' ? 'Fermé' :
                           exception.type === 'conges' ? 'Congés' :
                           'Modifié'}
                        </Badge>
                      )}
                      
                      {!exception && creneauxType.length > 0 && (
                        <div className="text-xs text-gray-600">
                          {creneauxType.length} créneau{creneauxType.length > 1 ? 'x' : ''}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Légende */}
                <div className="mt-6 flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-50 border-2 border-green-300 rounded" />
                    <span className="text-xs">Ouvert (planning type)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded" />
                    <span className="text-xs">Horaires modifiés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-50 border-2 border-red-300 rounded" />
                    <span className="text-xs">Fermé / Congés</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-50 border-2 border-gray-200 rounded" />
                    <span className="text-xs">Pas de créneaux</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guide */}
          <TabsContent value="guide">
            <GuideDisponibilites />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}