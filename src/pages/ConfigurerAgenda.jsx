import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  Save,
  Loader2,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Building2,
  Phone,
  Video,
  Sparkles,
  CalendarClock,
  Copy,
  Zap,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AuthGuard from '../components/auth/AuthGuard';

const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const TYPES_CONSULTATION = ['cabinet', 'clinique', 'hopital', 'telephone', 'visio'];

const TEMPLATES = [
  {
    nom: "Standard Temps Plein",
    icon: Briefcase,
    description: "Lun-Ven 8h-17h avec pause déjeuner",
    disponibilites: [
      { jour: 'Lundi', heure_debut: '08:00', heure_fin: '12:00', types_consultation: [] },
      { jour: 'Lundi', heure_debut: '14:00', heure_fin: '17:00', types_consultation: [] },
      { jour: 'Mardi', heure_debut: '08:00', heure_fin: '12:00', types_consultation: [] },
      { jour: 'Mardi', heure_debut: '14:00', heure_fin: '17:00', types_consultation: [] },
      { jour: 'Mercredi', heure_debut: '08:00', heure_fin: '12:00', types_consultation: [] },
      { jour: 'Mercredi', heure_debut: '14:00', heure_fin: '17:00', types_consultation: [] },
      { jour: 'Jeudi', heure_debut: '08:00', heure_fin: '12:00', types_consultation: [] },
      { jour: 'Jeudi', heure_debut: '14:00', heure_fin: '17:00', types_consultation: [] },
      { jour: 'Vendredi', heure_debut: '08:00', heure_fin: '12:00', types_consultation: [] },
      { jour: 'Vendredi', heure_debut: '14:00', heure_fin: '17:00', types_consultation: [] },
    ]
  },
  {
    nom: "Temps Partiel",
    icon: Clock,
    description: "Lun, Mer, Ven matinées uniquement",
    disponibilites: [
      { jour: 'Lundi', heure_debut: '08:00', heure_fin: '12:00', types_consultation: [] },
      { jour: 'Mercredi', heure_debut: '08:00', heure_fin: '12:00', types_consultation: [] },
      { jour: 'Vendredi', heure_debut: '08:00', heure_fin: '12:00', types_consultation: [] },
    ]
  },
  {
    nom: "Weekend",
    icon: Calendar,
    description: "Samedi et Dimanche",
    disponibilites: [
      { jour: 'Samedi', heure_debut: '09:00', heure_fin: '13:00', types_consultation: [] },
      { jour: 'Dimanche', heure_debut: '09:00', heure_fin: '13:00', types_consultation: [] },
    ]
  },
  {
    nom: "Flexible",
    icon: Sparkles,
    description: "Tous les jours 9h-18h",
    disponibilites: JOURS_SEMAINE.map(jour => ({
      jour,
      heure_debut: '09:00',
      heure_fin: '18:00',
      types_consultation: []
    }))
  }
];

const getIconType = (type) => {
  switch(type) {
    case 'cabinet': return <Briefcase className="w-4 h-4" />;
    case 'clinique': return <Building2 className="w-4 h-4" />;
    case 'hopital': return <Building2 className="w-4 h-4" />;
    case 'telephone': return <Phone className="w-4 h-4" />;
    case 'visio': return <Video className="w-4 h-4" />;
    default: return <Video className="w-4 h-4" />;
  }
};

const getTypeLabel = (type) => {
  const labels = {
    'cabinet': 'Cabinet',
    'clinique': 'Clinique',
    'hopital': 'Hôpital',
    'telephone': 'Téléphone',
    'visio': 'Vidéo'
  };
  return labels[type] || type;
};

export default function ConfigurerAgenda() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modeConfiguration, setModeConfiguration] = useState('rapide');
  const [disponibilites, setDisponibilites] = useState([]);
  const [exceptions, setExceptions] = useState([]);
  const [typesSelectionnes, setTypesSelectionnes] = useState([]);
  const [errorDetails, setErrorDetails] = useState(null);
  
  const [jourSelectionne, setJourSelectionne] = useState('Lundi');
  const [creneauTemp, setCreneauTemp] = useState({
    heure_debut: '09:00',
    heure_fin: '17:00'
  });

  const { data: user, isLoading: userLoading } = useQuery({
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

  React.useEffect(() => {
    if (profilPro) {
      setDisponibilites(profilPro.disponibilites || []);
      setExceptions(profilPro.exceptions_agenda || []);
      setTypesSelectionnes(profilPro.types_consultation_offerts || []);
    }
  }, [profilPro]);

  const champsObligatoiresAgenda = {
    nom_complet: profilPro?.nom_complet,
    specialite: profilPro?.specialite,
    region: profilPro?.region,
    ville: profilPro?.ville,
    telephone: profilPro?.telephone,
    biographie: profilPro?.biographie,
  };

  const champsMananquants = Object.entries(champsObligatoiresAgenda)
    .filter(([key, value]) => !value || (typeof value === 'string' && value.trim() === ''))
    .map(([key]) => {
      const labels = {
        nom_complet: 'Nom complet',
        specialite: 'Spécialité',
        region: 'Région',
        ville: 'Ville',
        telephone: 'Téléphone professionnel',
        biographie: 'Présentation professionnelle'
      };
      return labels[key] || key;
    });

  const profilCompletPourAgenda = champsMananquants.length === 0;

  const sauvegarderMutation = useMutation({
    mutationFn: async () => {
      setErrorDetails(null);
      
      if (!user) {
        throw new Error('❌ Utilisateur non connecté');
      }
      
      if (!profilPro || !profilPro.id) {
        throw new Error('Profil professionnel introuvable. Veuillez compléter votre profil puis réessayer.');
      }
      
      if (profilPro.email !== user.email) {
        throw new Error(`Incohérence: profil.email (${profilPro.email}) ≠ user.email (${user.email})`);
      }
      
      if (!Array.isArray(disponibilites)) {
        throw new Error('Données de disponibilités invalides');
      }
      
      const dataToUpdate = {
        disponibilites: disponibilites,
        exceptions_agenda: exceptions || [],
        types_consultation_offerts: typesSelectionnes.length > 0 ? typesSelectionnes : TYPES_CONSULTATION
      };
      
      try {
        const result = await base44.entities.Professionnel.update(profilPro.id, dataToUpdate);
        return result;
      } catch (updateError) {
        throw new Error(`Erreur technique: ${updateError.message || 'Impossible de sauvegarder. Vérifiez vos permissions.'}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profil_professionnel'] });
      queryClient.invalidateQueries({ queryKey: ['user_profiles'] });
      queryClient.invalidateQueries({ queryKey: ['professionnels'] });
      alert('✅ Agenda configuré avec succès !');
      navigate(createPageUrl('MonAgenda'));
    },
    onError: (error) => {
      setErrorDetails(error.message);
      alert(`❌ Erreur: ${error.message}`);
    }
  });

  const appliquerTemplate = (template) => {
    setDisponibilites(template.disponibilites);
    alert(`✅ Template "${template.nom}" appliqué ! Personnalisez si besoin puis sauvegardez.`);
  };

  const copierSurJours = (joursACopier) => {
    const creneauxDuJour = disponibilites.filter(d => d.jour === jourSelectionne);
    if (creneauxDuJour.length === 0) {
      alert('Aucun créneau à copier pour ce jour');
      return;
    }

    const nouveauxCreneaux = [];
    joursACopier.forEach(jour => {
      if (jour !== jourSelectionne) {
        creneauxDuJour.forEach(creneau => {
          nouveauxCreneaux.push({
            ...creneau,
            jour: jour
          });
        });
      }
    });

    setDisponibilites([
      ...disponibilites.filter(d => !joursACopier.includes(d.jour) || d.jour === jourSelectionne),
      ...nouveauxCreneaux
    ]);
    alert(`✅ Créneaux copiés sur ${joursACopier.length} jour(s)`);
  };

  const ajouterCreneau = () => {
    if (creneauTemp.heure_debut >= creneauTemp.heure_fin) {
      alert('Heure de fin doit être après heure de début');
      return;
    }

    setDisponibilites([
      ...disponibilites,
      {
        jour: jourSelectionne,
        heure_debut: creneauTemp.heure_debut,
        heure_fin: creneauTemp.heure_fin,
        types_consultation: []
      }
    ]);
  };

  const supprimerCreneau = (index) => {
    setDisponibilites(disponibilites.filter((_, i) => i !== index));
  };

  const toggleType = (type) => {
    if (typesSelectionnes.includes(type)) {
      setTypesSelectionnes(typesSelectionnes.filter(t => t !== type));
    } else {
      setTypesSelectionnes([...typesSelectionnes, type]);
    }
  };

  if (userLoading || loadingProfil) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-teal-50 to-cyan-50">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500 mb-4" />
        <p className="text-gray-600">Chargement...</p>
      </div>
    );
  }

  if (!profilPro) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 p-4 md:p-8 flex items-center justify-center">
          <Card className="max-w-md shadow-2xl border-red-200">
            <CardHeader className="bg-red-50">
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertCircle className="w-6 h-6" />
                Profil Incomplet
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">
                  <strong>Votre profil professionnel n'est pas encore créé.</strong>
                  <br />
                  Veuillez d'abord compléter vos informations professionnelles.
                </AlertDescription>
              </Alert>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate(createPageUrl('ProfilProfessionnel'))}
                  className="bg-red-600 hover:bg-red-700 w-full"
                >
                  Compléter mon profil professionnel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Dashboard'))}
                  className="w-full"
                >
                  Retour au tableau de bord
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  if (!profilCompletPourAgenda) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 p-4 md:p-8 flex items-center justify-center">
          <Card className="max-w-2xl shadow-2xl border-orange-300">
            <CardHeader className="bg-orange-50">
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <AlertCircle className="w-6 h-6" />
                Informations Obligatoires Manquantes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Alert className="bg-orange-50 border-orange-300">
                <AlertDescription className="text-orange-900">
                  <strong>⚠️ Profil incomplet</strong>
                  <p className="mt-2">
                    Avant de configurer votre agenda, vous devez compléter les informations suivantes dans votre profil professionnel :
                  </p>
                </AlertDescription>
              </Alert>

              <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Champs obligatoires manquants :
                </h4>
                <ul className="space-y-2">
                  {champsMananquants.map((champ, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <strong className="text-orange-900">{champ}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>💡 Pourquoi ces informations ?</strong><br />
                  Ces données sont essentielles pour que les patients puissent vous trouver et prendre rendez-vous en toute confiance.
                </p>
              </div>
              
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => navigate(createPageUrl('ProfilProfessionnel'))}
                  className="bg-orange-600 hover:bg-orange-700 w-full"
                >
                  Compléter mon profil professionnel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate(createPageUrl('Dashboard'))}
                  className="w-full"
                >
                  Retour au tableau de bord
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthGuard>
    );
  }

  const creneauxParJour = JOURS_SEMAINE.map(jour => ({
    jour,
    creneaux: disponibilites.filter(d => d.jour === jour)
  }));

  const totalCreneaux = disponibilites.length;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4 md:p-8 pb-safe">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-xl">
                  <CalendarClock className="w-6 h-6 md:w-8 md:h-8 text-teal-600" />
                </div>
                Configurer mon agenda
              </h1>
              <p className="text-sm md:text-base text-gray-600 mt-2">
                Configuration simplifiée de vos disponibilités
              </p>
            </div>

            <Button
              onClick={() => {
                sauvegarderMutation.mutate();
              }}
              disabled={sauvegarderMutation.isPending || disponibilites.length === 0}
              className="bg-teal-600 hover:bg-teal-700 shadow-lg px-6 w-full md:w-auto"
              size="lg"
            >
              {sauvegarderMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Sauvegarder ({totalCreneaux})
                </>
              )}
            </Button>
          </div>

          {errorDetails && (
            <Alert variant="destructive" className="shadow-lg">
              <AlertCircle className="w-5 h-5" />
              <AlertDescription>
                <strong>Erreur de sauvegarde:</strong><br />
                {errorDetails}
              </AlertDescription>
            </Alert>
          )}

          <Alert className="bg-blue-50 border-blue-200">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <AlertDescription className="text-blue-900">
              <strong>✅ Profil détecté:</strong> {profilPro.nom_complet} ({profilPro.email})
              <br />
              <span className="text-xs">ID: {profilPro.id}</span>
            </AlertDescription>
          </Alert>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <Layers className="w-6 h-6 text-teal-600" />
                <h3 className="font-bold text-lg">Mode de configuration</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => setModeConfiguration('rapide')}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    modeConfiguration === 'rapide'
                      ? 'border-teal-500 bg-teal-50 shadow-md'
                      : 'border-gray-300 hover:border-teal-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className={`w-6 h-6 ${modeConfiguration === 'rapide' ? 'text-teal-600' : 'text-gray-400'}`} />
                    <h4 className="font-bold text-lg">Configuration Rapide</h4>
                    {modeConfiguration === 'rapide' && <CheckCircle className="w-5 h-5 text-teal-600 ml-auto" />}
                  </div>
                  <p className="text-sm text-gray-600">
                    Utilisez des modèles pré-configurés et gagnez du temps
                  </p>
                </div>

                <div
                  onClick={() => setModeConfiguration('avance')}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                    modeConfiguration === 'avance'
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-300 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <Layers className={`w-6 h-6 ${modeConfiguration === 'avance' ? 'text-purple-600' : 'text-gray-400'}`} />
                    <h4 className="font-bold text-lg">Configuration Avancée</h4>
                    {modeConfiguration === 'avance' && <CheckCircle className="w-5 h-5 text-purple-600 ml-auto" />}
                  </div>
                  <p className="text-sm text-gray-600">
                    Configurez manuellement chaque créneau jour par jour
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {modeConfiguration === 'rapide' && (
            <div className="space-y-6">
              <Card className="shadow-lg border-none">
                <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-6 h-6 text-teal-600" />
                    Choisissez un modèle
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TEMPLATES.map((template, i) => (
                      <div
                        key={i}
                        className="p-6 border-2 border-gray-200 rounded-lg hover:border-teal-400 hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => appliquerTemplate(template)}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-3 bg-teal-100 rounded-lg group-hover:bg-teal-200 transition-colors">
                            <template.icon className="w-6 h-6 text-teal-600" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{template.nom}</h4>
                            <p className="text-sm text-gray-600">{template.description}</p>
                          </div>
                        </div>
                        <Badge className="bg-teal-100 text-teal-800">
                          {template.disponibilites.length} créneaux
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg border-none">
                <CardHeader>
                  <CardTitle>Types de consultation offerts</CardTitle>
                  <p className="text-sm text-gray-600">Sélectionnez les modes de consultation que vous proposez</p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {TYPES_CONSULTATION.map(type => (
                      <div
                        key={type}
                        onClick={() => toggleType(type)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          typesSelectionnes.includes(type)
                            ? 'border-teal-500 bg-teal-50 shadow-md'
                            : 'border-gray-300 hover:border-teal-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2 text-center">
                          {getIconType(type)}
                          <span className="text-sm font-medium">{getTypeLabel(type)}</span>
                          {typesSelectionnes.includes(type) && (
                            <CheckCircle className="w-4 h-4 text-teal-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {modeConfiguration === 'avance' && (
            <Card className="shadow-lg border-none">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-6 h-6 text-purple-600" />
                  Configuration jour par jour
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label className="mb-3 block font-semibold">Configurer le :</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {JOURS_SEMAINE.map(jour => (
                      <Button
                        key={jour}
                        variant={jourSelectionne === jour ? 'default' : 'outline'}
                        onClick={() => setJourSelectionne(jour)}
                        className={jourSelectionne === jour ? 'bg-purple-600' : ''}
                      >
                        {jour}
                        {disponibilites.filter(d => d.jour === jour).length > 0 && (
                          <Badge className="ml-2 bg-green-100 text-green-800">
                            {disponibilites.filter(d => d.jour === jour).length}
                          </Badge>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg space-y-4">
                  <h4 className="font-semibold">Ajouter un créneau pour {jourSelectionne}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Heure de début</Label>
                      <Input
                        type="time"
                        value={creneauTemp.heure_debut}
                        onChange={(e) => setCreneauTemp({ ...creneauTemp, heure_debut: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Heure de fin</Label>
                      <Input
                        type="time"
                        value={creneauTemp.heure_fin}
                        onChange={(e) => setCreneauTemp({ ...creneauTemp, heure_fin: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={ajouterCreneau} className="flex-1 bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Ajouter ce créneau
                    </Button>
                    {disponibilites.filter(d => d.jour === jourSelectionne).length > 0 && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          const autresJours = JOURS_SEMAINE.filter(j => j !== jourSelectionne);
                          copierSurJours(autresJours);
                        }}
                        className="flex-1"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copier sur toute la semaine
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Créneaux configurés pour {jourSelectionne}</h4>
                  {disponibilites.filter(d => d.jour === jourSelectionne).length > 0 ? (
                    <div className="space-y-2">
                      {disponibilites.map((dispo, index) => {
                        if (dispo.jour !== jourSelectionne) return null;
                        return (
                          <div key={index} className="p-3 bg-white border rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">
                                {dispo.heure_debut} - {dispo.heure_fin}
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => supprimerCreneau(index)}
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-lg text-center">
                      Aucun créneau pour ce jour
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-lg border-none bg-gradient-to-br from-teal-50 to-cyan-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-teal-600" />
                Aperçu de votre semaine ({totalCreneaux} créneaux)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {creneauxParJour.map(({ jour, creneaux }) => (
                  <div key={jour} className={`p-4 rounded-lg ${creneaux.length > 0 ? 'bg-white border-2 border-teal-200' : 'bg-gray-50 border border-gray-200'}`}>
                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                      {creneaux.length > 0 && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {jour}
                    </h4>
                    {creneaux.length > 0 ? (
                      <div className="space-y-1">
                        {creneaux.map((c, i) => (
                          <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                            <Clock className="w-3 h-3 text-teal-600" />
                            <span>{c.heure_debut} - {c.heure_fin}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic">Non disponible</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Modes de consultation actifs</p>
                  <div className="flex flex-wrap gap-2">
                    {(typesSelectionnes.length > 0 ? typesSelectionnes : TYPES_CONSULTATION).map(type => (
                      <Badge key={type} className="bg-teal-100 text-teal-800 flex items-center gap-1">
                        {getIconType(type)}
                        {getTypeLabel(type)}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('MonAgenda'))}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                sauvegarderMutation.mutate();
              }}
              disabled={sauvegarderMutation.isPending || disponibilites.length === 0}
              className="flex-1 bg-teal-600 hover:bg-teal-700 shadow-lg"
            >
              {sauvegarderMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder et terminer
                </>
              )}
            </Button>
          </div>
        </div>

        <style jsx>{`
          .pb-safe {
            padding-bottom: max(6rem, env(safe-area-inset-bottom));
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}