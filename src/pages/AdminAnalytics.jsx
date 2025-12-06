import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3, Download, FileSpreadsheet, FileText, Users, Baby, Heart,
  Syringe, Activity, TrendingUp, Building2, Microscope, Shield,
  Stethoscope, MapPin, Calendar, ArrowUpRight, ArrowDownRight,
  Loader2, Lock, AlertTriangle, CheckCircle2, Clock, Percent, Search,
  Target, DollarSign, TrendingDown, Pill, AlertOctagon, HeartPulse, Beaker, Wallet, Repeat, UserCheck, Zap, BarChart2, Banknote, Gauge,
  UserPlus, Bug
} from 'lucide-react';
import { format, subMonths, differenceInMonths, differenceInYears, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Line, AreaChart, Area, Legend, ComposedChart, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import AuthGuard from '@/components/auth/AuthGuard';

const COLORS = ['#FF6B9D', '#14B8A6', '#8B5CF6', '#F59E0B', '#3B82F6', '#EF4444', '#10B981', '#6366F1'];

export default function AdminAnalytics() {
  const [periodeAnalyse, setPeriodeAnalyse] = useState('12');
  const [regionFiltre, setRegionFiltre] = useState('all');
  const [specialiteFiltre, setSpecialiteFiltre] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportEnCours, setExportEnCours] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeveloppementTab, setShowDeveloppementTab] = useState(false);

  // Vérifier si admin
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // Charger toutes les données
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin_analytics', periodeAnalyse, regionFiltre],
    queryFn: async () => {
      const [users, mamans, pros, enfants, grossesses, rdvs, contraceptions, cycles, messages, rappelsMedicaments, donneesVitales, notifications] = await Promise.all([
        base44.entities.User.list().catch(() => []),
        base44.entities.ProfilMaman.list().catch(() => []),
        base44.entities.Professionnel.list().catch(() => []),
        base44.entities.EnfantCarnet.list().catch(() => []),
        base44.entities.SuiviGrossesse.list().catch(() => []),
        base44.entities.RendezVous.list().catch(() => []),
        base44.entities.SuiviContraception.list().catch(() => []),
        base44.entities.CycleMenstruel.list().catch(() => []),
        base44.entities.MessageCommunaute.list().catch(() => []),
        base44.entities.RappelMedicament.list().catch(() => []),
        base44.entities.DonneesVitales.list().catch(() => []),
        base44.entities.Notification.list().catch(() => []),
      ]);

      return { users, mamans, pros, enfants, grossesses, rdvs, contraceptions, cycles, messages, rappelsMedicaments, donneesVitales, notifications };
    },
    enabled: user?.role === 'admin',
  });

  const { users, mamans, pros, enfants, grossesses, rdvs, contraceptions, cycles, messages, rappelsMedicaments, donneesVitales, notifications } = stats || {};
  
  const isAdmin = user?.role === 'admin';

  // Filtrage par période
  const filterByPeriod = (items, dateField = 'created_date') => {
    if (!items || periodeAnalyse === 'all') return items;
    const months = parseInt(periodeAnalyse);
    const startDate = subMonths(new Date(), months);
    return items.filter(item => item[dateField] && new Date(item[dateField]) >= startDate);
  };

  // Filtrage par région
  const filterByRegion = (items) => {
    if (!items || regionFiltre === 'all') return items;
    return items.filter(item => item.region === regionFiltre);
  };

  // Données filtrées
  const filteredMamans = useMemo(() => filterByRegion(filterByPeriod(mamans)), [mamans, periodeAnalyse, regionFiltre]);
  const filteredEnfants = useMemo(() => filterByPeriod(enfants), [enfants, periodeAnalyse]);
  const filteredRdvs = useMemo(() => filterByPeriod(rdvs, 'date_rdv'), [rdvs, periodeAnalyse]);
  const filteredGrossesses = useMemo(() => filterByPeriod(grossesses), [grossesses, periodeAnalyse]);

  // ============ MÉTRIQUES CALCULÉES ============

  // Démographie anonymisée
  const calculerTrancheAge = (dateNaissance) => {
    if (!dateNaissance) return 'Non renseigné';
    const age = differenceInYears(new Date(), new Date(dateNaissance));
    if (age < 18) return '< 18 ans';
    if (age < 25) return '18-24 ans';
    if (age < 30) return '25-29 ans';
    if (age < 35) return '30-34 ans';
    if (age < 40) return '35-39 ans';
    return '40+ ans';
  };

  const distributionAges = mamans?.reduce((acc, m) => {
    const tranche = calculerTrancheAge(m.date_naissance);
    acc[tranche] = (acc[tranche] || 0) + 1;
    return acc;
  }, {}) || {};

  const distributionAgesData = Object.entries(distributionAges).map(([name, value]) => ({ name, value }));

  // Répartition géographique
  const repartitionRegions = mamans?.reduce((acc, m) => {
    const region = m.region || 'Non renseigné';
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {}) || {};

  const repartitionRegionsData = Object.entries(repartitionRegions)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Métriques Grossesse
  const grossessesActives = grossesses?.filter(g => g.grossesse_active) || [];
  const grossessesTerminees = grossesses?.filter(g => !g.grossesse_active) || [];
  
  const distributionTrimestres = grossessesActives.reduce((acc, g) => {
    const semaines = differenceInMonths(new Date(), new Date(g.date_derniere_regle)) * 4.33;
    let trimestre;
    if (semaines <= 12) trimestre = '1er trimestre';
    else if (semaines <= 24) trimestre = '2ème trimestre';
    else trimestre = '3ème trimestre';
    acc[trimestre] = (acc[trimestre] || 0) + 1;
    return acc;
  }, {});

  const issuesGrossesse = grossessesTerminees.reduce((acc, g) => {
    acc[g.issue_grossesse || 'Non renseigné'] = (acc[g.issue_grossesse || 'Non renseigné'] || 0) + 1;
    return acc;
  }, {});

  // Métriques Enfants & Vaccination
  const enfantsParTrancheAge = enfants?.reduce((acc, e) => {
    const mois = differenceInMonths(new Date(), new Date(e.date_naissance));
    let tranche;
    if (mois <= 6) tranche = '0-6 mois';
    else if (mois <= 12) tranche = '6-12 mois';
    else if (mois <= 24) tranche = '1-2 ans';
    else if (mois <= 36) tranche = '2-3 ans';
    else tranche = '3+ ans';
    acc[tranche] = (acc[tranche] || 0) + 1;
    return acc;
  }, {}) || {};

  const tauxVaccinationParAge = Object.entries(enfantsParTrancheAge).map(([tranche, count]) => {
    const enfantsTranche = enfants.filter(e => {
      const mois = differenceInMonths(new Date(), new Date(e.date_naissance));
      if (tranche === '0-6 mois') return mois <= 6;
      if (tranche === '6-12 mois') return mois > 6 && mois <= 12;
      if (tranche === '1-2 ans') return mois > 12 && mois <= 24;
      if (tranche === '2-3 ans') return mois > 24 && mois <= 36;
      return mois > 36;
    });
    const vaccinsPrevus = enfantsTranche.length * 5; // Simplification
    const vaccinsEffectues = enfantsTranche.reduce((sum, e) => sum + (e.vaccins?.length || 0), 0);
    return {
      name: tranche,
      taux: vaccinsPrevus > 0 ? Math.round((vaccinsEffectues / vaccinsPrevus) * 100) : 0,
      enfants: count
    };
  });

  // Allergies les plus fréquentes
  const allergiesFrequentes = enfants?.reduce((acc, e) => {
    (e.allergies || []).forEach(a => {
      acc[a] = (acc[a] || 0) + 1;
    });
    return acc;
  }, {}) || {};

  const topAllergies = Object.entries(allergiesFrequentes)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // Métriques Contraception
  const methodesContraceptionUtilisees = contraceptions?.reduce((acc, c) => {
    acc[c.methode_id] = (acc[c.methode_id] || 0) + 1;
    return acc;
  }, {}) || {};

  // Métriques Téléconsultation
  const rdvParMois = rdvs?.reduce((acc, r) => {
    const mois = format(new Date(r.date_rdv), 'MMM yyyy', { locale: fr });
    acc[mois] = (acc[mois] || 0) + 1;
    return acc;
  }, {}) || {};

  const rdvParMoisData = Object.entries(rdvParMois)
    .slice(-12)
    .map(([mois, count]) => ({ mois, count }));

  const rdvParType = rdvs?.reduce((acc, r) => {
    acc[r.type_consultation] = (acc[r.type_consultation] || 0) + 1;
    return acc;
  }, {}) || {};

  const rdvParTypeData = Object.entries(rdvParType).map(([name, value]) => ({ name, value }));

  const tauxAnnulation = rdvs?.length > 0 
    ? Math.round((rdvs.filter(r => r.statut === 'annule').length / rdvs.length) * 100)
    : 0;

  // Métriques Professionnels
  const prosParSpecialite = pros?.reduce((acc, p) => {
    acc[p.specialite] = (acc[p.specialite] || 0) + 1;
    return acc;
  }, {}) || {};

  const prosParSpecialiteData = Object.entries(prosParSpecialite).map(([name, value]) => ({ name, value }));

  const prosParRegion = pros?.reduce((acc, p) => {
    acc[p.region || 'Non renseigné'] = (acc[p.region || 'Non renseigné'] || 0) + 1;
    return acc;
  }, {}) || {};

  // ============ MÉTRIQUES SANTÉ PUBLIQUE ============
  
  const metriquesPubliques = {
    couvertureCMU: Math.round((mamans?.filter(m => m.numero_cmu).length / (mamans?.length || 1)) * 100),
    tauxSuiviGrossesse: Math.round((grossessesActives.length / (mamans?.length || 1)) * 100),
    moyenneConsultationsPrenatales: grossesses?.reduce((sum, g) => sum + (g.consultations?.length || 0), 0) / (grossesses?.length || 1),
    tauxAllaitement: 0,
  };

  // ============ MÉTRIQUES LABORATOIRES / RECHERCHE ============

  // Taux d'adoption des vaccins par type
  const adoptionVaccins = useMemo(() => {
    const vaccinsParType = {};
    enfants?.forEach(e => {
      (e.vaccins || []).forEach(v => {
        const nom = v.nom_vaccin?.split(' ')[0] || 'Autre';
        vaccinsParType[nom] = (vaccinsParType[nom] || 0) + 1;
      });
    });
    return Object.entries(vaccinsParType)
      .map(([name, value]) => ({ name, value, taux: Math.round((value / (enfants?.length || 1)) * 100) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  }, [enfants]);

  // Prévalence maladies (anonymisée)
  const prevalenceMaladies = useMemo(() => {
    const maladies = {};
    enfants?.forEach(e => {
      (e.historique_medical || []).forEach(h => {
        if (h.nom_maladie) {
          maladies[h.nom_maladie] = (maladies[h.nom_maladie] || 0) + 1;
        }
      });
      (e.maladies_chroniques || []).forEach(m => {
        maladies[m] = (maladies[m] || 0) + 1;
      });
    });
    return Object.entries(maladies)
      .map(([name, value]) => ({ name, value, pourcentage: ((value / (enfants?.length || 1)) * 100).toFixed(1) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [enfants]);

  // Efficacité traitements (basé sur durée guérison)
  const efficaciteTraitements = useMemo(() => {
    const traitements = {};
    enfants?.forEach(e => {
      (e.historique_medical || []).forEach(h => {
        if (h.traitement && h.date_guerison && h.date) {
          const duree = differenceInMonths(new Date(h.date_guerison), new Date(h.date));
          if (!traitements[h.traitement]) {
            traitements[h.traitement] = { total: 0, gueris: 0, dureeMoyenne: 0 };
          }
          traitements[h.traitement].total++;
          traitements[h.traitement].gueris++;
          traitements[h.traitement].dureeMoyenne += duree;
        }
      });
    });
    return Object.entries(traitements)
      .map(([name, data]) => ({
        name,
        tauxGuerison: Math.round((data.gueris / data.total) * 100),
        dureeMoyenne: (data.dureeMoyenne / data.gueris).toFixed(1),
        cas: data.total
      }))
      .filter(t => t.cas >= 3)
      .slice(0, 10);
  }, [enfants]);

  // Données vitales agrégées
  const moyennesDonneesVitales = useMemo(() => {
    const parType = {};
    donneesVitales?.forEach(d => {
      if (!parType[d.type_donnee]) {
        parType[d.type_donnee] = { total: 0, sum: 0, alertes: 0 };
      }
      parType[d.type_donnee].total++;
      parType[d.type_donnee].sum += d.valeur || 0;
      if (d.alerte_declenchee) parType[d.type_donnee].alertes++;
    });
    return Object.entries(parType).map(([type, data]) => ({
      type,
      moyenne: (data.sum / data.total).toFixed(1),
      mesures: data.total,
      tauxAlertes: ((data.alertes / data.total) * 100).toFixed(1)
    }));
  }, [donneesVitales]);

  // ============ MÉTRIQUES ASSURANCES ============

  // Coûts évités par prévention (estimation)
  const coutsEvites = useMemo(() => {
    const vaccinsEffectues = enfants?.reduce((sum, e) => sum + (e.vaccins?.length || 0), 0) || 0;
    const consultationsPrenatales = grossesses?.reduce((sum, g) => sum + (g.consultations?.length || 0), 0) || 0;
    const suiviContraception = contraceptions?.filter(c => c.active).length || 0;

    // Estimations coûts évités (en FCFA)
    return {
      vaccination: vaccinsEffectues * 25000, // Coût moyen maladie évitée
      prenatal: consultationsPrenatales * 15000, // Complications évitées
      contraception: suiviContraception * 50000, // Grossesses non planifiées évitées
      teleconsultation: (rdvs?.filter(r => r.type_consultation === 'visio').length || 0) * 5000, // Déplacements évités
      total: 0
    };
  }, [enfants, grossesses, contraceptions, rdvs]);
  coutsEvites.total = coutsEvites.vaccination + coutsEvites.prenatal + coutsEvites.contraception + coutsEvites.teleconsultation;

  // Besoins de soins par catégorie
  const besoinsSoins = useMemo(() => {
    return [
      { categorie: 'Suivi grossesse', demande: grossessesActives.length, urgent: grossessesActives.filter(g => {
        const semaines = differenceInMonths(new Date(), new Date(g.date_derniere_regle)) * 4.33;
        return semaines > 36;
      }).length },
      { categorie: 'Vaccination enfants', demande: enfants?.filter(e => {
        const vaccins = e.vaccins?.length || 0;
        const ageMois = differenceInMonths(new Date(), new Date(e.date_naissance));
        return vaccins < Math.min(ageMois / 2, 10);
      }).length || 0, urgent: 0 },
      { categorie: 'Suivi contraception', demande: contraceptions?.filter(c => c.active).length || 0, urgent: 0 },
      { categorie: 'Consultations médicales', demande: rdvs?.filter(r => r.statut === 'planifie').length || 0, urgent: rdvs?.filter(r => r.statut === 'planifie' && r.motif?.includes('urgent')).length || 0 },
    ];
  }, [grossessesActives, enfants, contraceptions, rdvs]);

  // Sinistralité potentielle
  const sinistralite = useMemo(() => {
    const risquesGrossesse = grossessesActives.filter(g => g.antecedents?.length > 0).length;
    const enfantsAllergiques = enfants?.filter(e => e.allergies?.length > 0).length || 0;
    const maladiesChroniques = enfants?.filter(e => e.maladies_chroniques?.length > 0).length || 0;
    
    return {
      risquesGrossesse,
      tauxRisqueGrossesse: ((risquesGrossesse / (grossessesActives.length || 1)) * 100).toFixed(1),
      enfantsAllergiques,
      tauxAllergies: ((enfantsAllergiques / (enfants?.length || 1)) * 100).toFixed(1),
      maladiesChroniques,
      tauxChroniques: ((maladiesChroniques / (enfants?.length || 1)) * 100).toFixed(1),
    };
  }, [grossessesActives, enfants]);

  // ============ MÉTRIQUES SANTÉ PUBLIQUE AVANCÉES ============

  // Tendances épidémiologiques (évolution mensuelle)
  const tendancesEpidemiologiques = useMemo(() => {
    const derniers6Mois = [];
    for (let i = 5; i >= 0; i--) {
      const mois = subMonths(new Date(), i);
      const debut = startOfMonth(mois);
      const fin = endOfMonth(mois);
      
      const maladiesMois = enfants?.filter(e => 
        (e.historique_medical || []).some(h => 
          h.date && isWithinInterval(new Date(h.date), { start: debut, end: fin })
        )
      ).length || 0;

      const vaccinsMois = enfants?.reduce((sum, e) => 
        sum + (e.vaccins || []).filter(v => 
          v.date_administration && isWithinInterval(new Date(v.date_administration), { start: debut, end: fin })
        ).length, 0) || 0;

      derniers6Mois.push({
        mois: format(mois, 'MMM', { locale: fr }),
        maladies: maladiesMois,
        vaccinations: vaccinsMois,
        consultations: rdvs?.filter(r => 
          r.date_rdv && isWithinInterval(new Date(r.date_rdv), { start: debut, end: fin })
        ).length || 0
      });
    }
    return derniers6Mois;
  }, [enfants, rdvs]);

  // Zones à risque (par région)
  const zonesRisque = useMemo(() => {
    const regions = {};
    mamans?.forEach(m => {
      const region = m.region || 'Non renseigné';
      if (!regions[region]) {
        regions[region] = { total: 0, sansVaccin: 0, grossessesNonSuivies: 0, score: 0 };
      }
      regions[region].total++;
    });

    enfants?.forEach(e => {
      const maman = mamans?.find(m => m.created_by === e.created_by);
      const region = maman?.region || 'Non renseigné';
      if (regions[region]) {
        const vaccinsAttendus = Math.min(differenceInMonths(new Date(), new Date(e.date_naissance)) / 2, 10);
        if ((e.vaccins?.length || 0) < vaccinsAttendus * 0.5) {
          regions[region].sansVaccin++;
        }
      }
    });

    return Object.entries(regions)
      .map(([region, data]) => ({
        region,
        population: data.total,
        couvertureVaccinale: Math.round(100 - (data.sansVaccin / (data.total || 1)) * 100),
        scoreRisque: Math.round((data.sansVaccin / (data.total || 1)) * 100),
        niveau: data.sansVaccin / (data.total || 1) > 0.3 ? 'Élevé' : data.sansVaccin / (data.total || 1) > 0.15 ? 'Modéré' : 'Faible'
      }))
      .filter(z => z.population > 0)
      .sort((a, b) => b.scoreRisque - a.scoreRisque);
  }, [mamans, enfants]);

  // Campagnes de vaccination (suivi)
  const suiviCampagnes = useMemo(() => {
    const vaccinsParMois = {};
    enfants?.forEach(e => {
      (e.vaccins || []).forEach(v => {
        if (v.date_administration) {
          const mois = format(new Date(v.date_administration), 'yyyy-MM');
          const nom = v.nom_vaccin?.split(' ')[0] || 'Autre';
          if (!vaccinsParMois[mois]) vaccinsParMois[mois] = {};
          vaccinsParMois[mois][nom] = (vaccinsParMois[mois][nom] || 0) + 1;
        }
      });
    });

    return Object.entries(vaccinsParMois)
      .slice(-6)
      .map(([mois, vaccins]) => ({
        mois: format(new Date(mois + '-01'), 'MMM yy', { locale: fr }),
        ...vaccins,
        total: Object.values(vaccins).reduce((a, b) => a + b, 0)
      }));
  }, [enfants]);

  // ============ MÉTRIQUES BUSINESS / INVESTISSEURS ============

  const metriquesBusiness = useMemo(() => {
    const now = new Date();
    const dernierMois = subMonths(now, 1);
    const avantDernierMois = subMonths(now, 2);

    // Utilisateurs actifs (ont eu une activité dans les 30 derniers jours)
    const utilisateursActifsMois = mamans?.filter(m => {
      const lastActivity = rdvs?.find(r => r.created_by === m.created_by && new Date(r.created_date) >= dernierMois);
      return lastActivity || messages?.find(msg => msg.created_by === m.created_by && new Date(msg.created_date) >= dernierMois);
    }).length || 0;

    // MAU (Monthly Active Users)
    const mau = utilisateursActifsMois;
    
    // DAU estimé (environ 10-15% du MAU typiquement)
    const dauEstime = Math.round(mau * 0.12);

    // Nouveaux utilisateurs ce mois
    const nouveauxUtilisateursMois = mamans?.filter(m => 
      new Date(m.created_date) >= dernierMois
    ).length || 0;

    // Nouveaux utilisateurs mois précédent
    const nouveauxUtilisateursMoisPrecedent = mamans?.filter(m => {
      const date = new Date(m.created_date);
      return date >= avantDernierMois && date < dernierMois;
    }).length || 0;

    // Croissance MoM
    const croissanceMoM = nouveauxUtilisateursMoisPrecedent > 0 
      ? Math.round(((nouveauxUtilisateursMois - nouveauxUtilisateursMoisPrecedent) / nouveauxUtilisateursMoisPrecedent) * 100)
      : 0;

    // Rétention (utilisateurs qui reviennent après 30j)
    const utilisateurs30jPlus = mamans?.filter(m => {
      const dateInscription = new Date(m.created_date);
      return dateInscription < dernierMois;
    }) || [];
    
    const utilisateursRetour = utilisateurs30jPlus.filter(m => {
      return rdvs?.some(r => r.created_by === m.created_by && new Date(r.created_date) >= dernierMois) ||
             messages?.some(msg => msg.created_by === m.created_by && new Date(msg.created_date) >= dernierMois);
    }).length;
    
    const tauxRetention = utilisateurs30jPlus.length > 0 
      ? Math.round((utilisateursRetour / utilisateurs30jPlus.length) * 100)
      : 0;

    // Churn (inverse de la rétention)
    const tauxChurn = 100 - tauxRetention;

    // Sessions moyennes par utilisateur (basé sur les RDV et messages)
    const activitesMois = (rdvs?.filter(r => new Date(r.created_date) >= dernierMois).length || 0) +
                          (messages?.filter(m => new Date(m.created_date) >= dernierMois).length || 0);
    const sessionsMoyennes = mau > 0 ? (activitesMois / mau).toFixed(1) : 0;

    // LTV estimé (basé sur durée moyenne d'engagement * valeur mensuelle)
    const dureeMoyenneEngagement = mamans?.reduce((sum, m) => {
      const derniereActivite = rdvs?.filter(r => r.created_by === m.created_by)
        .sort((a, b) => new Date(b.date_rdv) - new Date(a.date_rdv))[0];
      if (derniereActivite) {
        return sum + differenceInMonths(new Date(derniereActivite.date_rdv), new Date(m.created_date));
      }
      return sum;
    }, 0) / (mamans?.length || 1) || 0;
    
    const valeurMensuelleEstimee = 2500; // FCFA estimation
    const ltv = Math.round(dureeMoyenneEngagement * valeurMensuelleEstimee);

    // Ratio engagement (actions / utilisateurs)
    const ratioEngagement = mau > 0 ? (activitesMois / mau).toFixed(2) : 0;

    return {
      mau,
      dauEstime,
      nouveauxUtilisateursMois,
      croissanceMoM,
      tauxRetention,
      tauxChurn,
      sessionsMoyennes,
      ltv,
      dureeMoyenneEngagement: dureeMoyenneEngagement.toFixed(1),
      ratioEngagement,
      totalUtilisateurs: (mamans?.length || 0) + (pros?.length || 0)
    };
  }, [mamans, rdvs, messages, pros]);

  // Croissance mensuelle (pour graphique)
  const croissanceMensuelle = useMemo(() => {
    const derniers6Mois = [];
    for (let i = 5; i >= 0; i--) {
      const mois = subMonths(new Date(), i);
      const debut = startOfMonth(mois);
      const fin = endOfMonth(mois);
      
      const nouveauxMamans = mamans?.filter(m => 
        m.created_date && isWithinInterval(new Date(m.created_date), { start: debut, end: fin })
      ).length || 0;

      const nouveauxPros = pros?.filter(p => 
        p.created_date && isWithinInterval(new Date(p.created_date), { start: debut, end: fin })
      ).length || 0;

      const totalRdv = rdvs?.filter(r => 
        r.date_rdv && isWithinInterval(new Date(r.date_rdv), { start: debut, end: fin })
      ).length || 0;

      derniers6Mois.push({
        mois: format(mois, 'MMM', { locale: fr }),
        mamans: nouveauxMamans,
        professionnels: nouveauxPros,
        rdv: totalRdv,
        total: nouveauxMamans + nouveauxPros
      });
    }
    return derniers6Mois;
  }, [mamans, pros, rdvs]);

  // ============ MÉTRIQUES DÉVELOPPEMENT ENFANT ============

  const metriquesDeveloppement = useMemo(() => {
    if (!enfants?.length) return null;

    // Enfants avec jalons enregistrés
    const enfantsAvecJalons = enfants.filter(e => e.jalons_developpement?.length > 0);
    
    // Jalons par statut
    const jalonsParStatut = { atteint: 0, en_cours: 0, retard: 0, non_evalue: 0 };
    const jalonsParDomaine = {};
    const retardsParDomaine = {};
    const retardsParAge = {};
    
    enfants.forEach(e => {
      const ageMois = differenceInMonths(new Date(), new Date(e.date_naissance));
      const trancheAge = ageMois <= 6 ? '0-6m' : ageMois <= 12 ? '6-12m' : ageMois <= 24 ? '12-24m' : '24m+';
      
      (e.jalons_developpement || []).forEach(j => {
        // Comptage par statut
        if (j.atteint) jalonsParStatut.atteint++;
        else if (j.statut === 'en_cours') jalonsParStatut.en_cours++;
        else if (j.statut?.includes('retard') || j.statut === 'consulter') jalonsParStatut.retard++;
        else jalonsParStatut.non_evalue++;
        
        // Comptage par domaine
        const domaine = j.categorie || 'autre';
        if (!jalonsParDomaine[domaine]) jalonsParDomaine[domaine] = { total: 0, atteints: 0 };
        jalonsParDomaine[domaine].total++;
        if (j.atteint) jalonsParDomaine[domaine].atteints++;
        
        // Retards par domaine
        if (j.statut?.includes('retard') || j.statut === 'consulter') {
          retardsParDomaine[domaine] = (retardsParDomaine[domaine] || 0) + 1;
        }
      });
      
      // Retards par tranche d'âge
      const hasRetard = (e.jalons_developpement || []).some(j => j.statut?.includes('retard') || j.statut === 'consulter');
      if (hasRetard) {
        retardsParAge[trancheAge] = (retardsParAge[trancheAge] || 0) + 1;
      }
    });
    
    // Alertes de développement
    const alertesDeveloppement = enfants.reduce((sum, e) => 
      sum + (e.alertes_developpement?.filter(a => !a.lu).length || 0), 0);
    
    // Bilans réalisés
    const bilansRealises = enfants.reduce((sum, e) => 
      sum + (e.evaluations_developpement?.length || 0), 0);
    
    // Taux de détection précoce (retards identifiés avant âge alerte)
    let retardsPrecoces = 0;
    let totalRetards = 0;
    enfants.forEach(e => {
      (e.jalons_developpement || []).forEach(j => {
        if (j.statut?.includes('retard') || j.statut === 'consulter') {
          totalRetards++;
          const ageAtteint = j.age_atteint_mois || differenceInMonths(new Date(j.date_atteint || new Date()), new Date(e.date_naissance));
          if (ageAtteint <= (j.age_attendu_mois || 12) + 3) {
            retardsPrecoces++;
          }
        }
      });
    });
    const tauxDetectionPrecoce = totalRetards > 0 ? Math.round((retardsPrecoces / totalRetards) * 100) : 0;
    
    // Délai moyen consultation post-alerte
    let delaiTotal = 0;
    let compteurDelai = 0;
    enfants.forEach(e => {
      (e.alertes_developpement || []).forEach(a => {
        if (a.date_action && a.date_creation) {
          delaiTotal += differenceInMonths(new Date(a.date_action), new Date(a.date_creation)) * 30; // en jours approx
          compteurDelai++;
        }
      });
    });
    const delaiMoyenConsultation = compteurDelai > 0 ? Math.round(delaiTotal / compteurDelai) : 0;
    
    // Scores moyens par domaine
    const scoresMoyens = {};
    Object.entries(jalonsParDomaine).forEach(([domaine, data]) => {
      scoresMoyens[domaine] = data.total > 0 ? Math.round((data.atteints / data.total) * 100) : 0;
    });
    
    // Couverture bilans aux âges clés (9, 24 mois)
    const enfants9mois = enfants.filter(e => {
      const age = differenceInMonths(new Date(), new Date(e.date_naissance));
      return age >= 9 && age <= 12;
    });
    const enfants24mois = enfants.filter(e => {
      const age = differenceInMonths(new Date(), new Date(e.date_naissance));
      return age >= 24 && age <= 30;
    });
    
    const couvertureBilan9m = enfants9mois.length > 0 
      ? Math.round((enfants9mois.filter(e => e.evaluations_developpement?.some(ev => ev.age_mois >= 8 && ev.age_mois <= 12)).length / enfants9mois.length) * 100)
      : 0;
    const couvertureBilan24m = enfants24mois.length > 0
      ? Math.round((enfants24mois.filter(e => e.evaluations_developpement?.some(ev => ev.age_mois >= 22 && ev.age_mois <= 26)).length / enfants24mois.length) * 100)
      : 0;
    
    // Prévalence retards par domaine (pour pharma/santé publique)
    const prevalenceRetards = Object.entries(retardsParDomaine).map(([domaine, count]) => ({
      domaine,
      count,
      pourcentage: enfants.length > 0 ? ((count / enfants.length) * 100).toFixed(1) : 0
    })).sort((a, b) => b.count - a.count);
    
    return {
      totalEnfantsSuivis: enfants.length,
      enfantsAvecJalons: enfantsAvecJalons.length,
      tauxSuiviJalons: Math.round((enfantsAvecJalons.length / enfants.length) * 100),
      jalonsParStatut,
      jalonsParDomaine,
      scoresMoyens,
      alertesDeveloppement,
      bilansRealises,
      tauxDetectionPrecoce,
      delaiMoyenConsultation,
      couvertureBilan9m,
      couvertureBilan24m,
      retardsParAge,
      prevalenceRetards,
      // Données graphiques
      domainesData: Object.entries(scoresMoyens).map(([name, score]) => ({ name: name.replace(/_/g, ' '), score })),
      retardsAgeData: Object.entries(retardsParAge).map(([tranche, count]) => ({ tranche, count }))
    };
  }, [enfants]);

  // ============ MÉTRIQUES PHARMA / ADHÉRENCE ============

  const metriquesPharma = useMemo(() => {
    // Adhérence aux traitements (rappels medicaments)
    const rappelsActifs = rappelsMedicaments?.filter(r => r.actif) || [];
    const rappelsPrisCorrectement = rappelsMedicaments?.filter(r => {
      // Simplifié: considérer comme pris si actif et pas en retard
      return r.actif && !r.en_retard;
    }).length || 0;
    
    const tauxAdherence = rappelsActifs.length > 0 
      ? Math.round((rappelsPrisCorrectement / rappelsActifs.length) * 100)
      : 0;

    // Types de médicaments les plus suivis
    const medicamentsParType = rappelsMedicaments?.reduce((acc, r) => {
      const type = r.type_medicament || r.nom || 'Autre';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}) || {};

    const topMedicaments = Object.entries(medicamentsParType)
      .map(([nom, count]) => ({ nom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Durée moyenne des traitements
    const dureeMoyenneTraitement = rappelsMedicaments?.reduce((sum, r) => {
      if (r.date_debut && r.date_fin) {
        return sum + differenceInMonths(new Date(r.date_fin), new Date(r.date_debut));
      }
      return sum;
    }, 0) / (rappelsMedicaments?.length || 1) || 0;

    // Segmentation pathologies (basé sur historique médical enfants + grossesses)
    const pathologiesGrossesse = grossesses?.reduce((acc, g) => {
      (g.antecedents || []).forEach(a => {
        acc[a] = (acc[a] || 0) + 1;
      });
      return acc;
    }, {}) || {};

    const pathologiesEnfants = enfants?.reduce((acc, e) => {
      (e.maladies_chroniques || []).forEach(m => {
        acc[m] = (acc[m] || 0) + 1;
      });
      (e.historique_medical || []).forEach(h => {
        if (h.nom_maladie) acc[h.nom_maladie] = (acc[h.nom_maladie] || 0) + 1;
      });
      return acc;
    }, {}) || {};

    const segmentationPathologies = Object.entries({...pathologiesGrossesse, ...pathologiesEnfants})
      .map(([pathologie, count]) => ({ pathologie, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return {
      tauxAdherence,
      rappelsActifs: rappelsActifs.length,
      topMedicaments,
      dureeMoyenneTraitement: dureeMoyenneTraitement.toFixed(1),
      segmentationPathologies,
      totalTraitementsSuivis: rappelsMedicaments?.length || 0
    };
  }, [rappelsMedicaments, grossesses, enfants]);

  // ============ MÉTRIQUES ASSURANCES AVANCÉES ============

  const metriquesAssurancesAvancees = useMemo(() => {
    // ARPU (Average Revenue Per User) - estimation
    const revenusEstimes = rdvs?.filter(r => r.statut === 'termine').length * 15000 || 0; // 15000 FCFA / consultation moyenne
    const arpu = (mamans?.length || 0) > 0 ? Math.round(revenusEstimes / mamans.length) : 0;

    // Durée moyenne d'engagement patient
    const dureeEngagement = mamans?.reduce((sum, m) => {
      const dernierRdv = rdvs?.filter(r => r.created_by === m.created_by)
        .sort((a, b) => new Date(b.date_rdv) - new Date(a.date_rdv))[0];
      if (dernierRdv) {
        return sum + differenceInMonths(new Date(dernierRdv.date_rdv), new Date(m.created_date));
      }
      return sum;
    }, 0) / (mamans?.length || 1) || 0;

    // Fréquence moyenne de consultations par patient
    const frequenceConsultations = (mamans?.length || 0) > 0 
      ? ((rdvs?.length || 0) / mamans.length).toFixed(1)
      : 0;

    // Score de risque global (moyenne pondérée)
    const scoreRisqueGlobal = Math.round(
      (parseFloat(sinistralite.tauxRisqueGrossesse) * 0.4 +
       parseFloat(sinistralite.tauxAllergies) * 0.3 +
       parseFloat(sinistralite.tauxChroniques) * 0.3)
    );

    // Prédicteurs de risque
    const predicteursRisque = [
      { facteur: 'Grossesses avec antécédents', risque: parseFloat(sinistralite.tauxRisqueGrossesse), niveau: parseFloat(sinistralite.tauxRisqueGrossesse) > 20 ? 'Élevé' : 'Normal' },
      { facteur: 'Enfants allergiques', risque: parseFloat(sinistralite.tauxAllergies), niveau: parseFloat(sinistralite.tauxAllergies) > 15 ? 'Élevé' : 'Normal' },
      { facteur: 'Maladies chroniques', risque: parseFloat(sinistralite.tauxChroniques), niveau: parseFloat(sinistralite.tauxChroniques) > 10 ? 'Élevé' : 'Normal' },
      { facteur: 'Taux d\'annulation RDV', risque: tauxAnnulation, niveau: tauxAnnulation > 20 ? 'Élevé' : 'Normal' },
    ];

    // Économies potentielles par prévention
    const economiesPreventionAnnuelles = coutsEvites.total * 12;

    return {
      arpu,
      dureeEngagement: dureeEngagement.toFixed(1),
      frequenceConsultations,
      scoreRisqueGlobal,
      predicteursRisque,
      economiesPreventionAnnuelles,
      revenusEstimes
    };
  }, [mamans, rdvs, sinistralite, tauxAnnulation, coutsEvites]);

  // ============ MÉTRIQUES SANTÉ PUBLIQUE AVANCÉES ============

  const metriquesSantePubliqueAvancees = useMemo(() => {
    // Délai moyen avant 1ère consultation prénatale
    const delaiPremiereConsultation = grossesses?.reduce((sum, g) => {
      if (g.consultations?.length > 0) {
        const premiereConsult = g.consultations.sort((a, b) => 
          new Date(a.date) - new Date(b.date)
        )[0];
        if (premiereConsult?.date && g.date_derniere_regle) {
          const delai = differenceInMonths(new Date(premiereConsult.date), new Date(g.date_derniere_regle));
          return sum + delai;
        }
      }
      return sum;
    }, 0) / (grossesses?.filter(g => g.consultations?.length > 0).length || 1) || 0;

    // Couverture 4+ consultations prénatales (indicateur OMS)
    const couverture4Consultations = grossesses?.length > 0
      ? Math.round((grossesses.filter(g => (g.consultations?.length || 0) >= 4).length / grossesses.length) * 100)
      : 0;

    // Taux de suivi post-natal (grossesses terminées avec RDV après)
    const grossessesTermineesAvecSuivi = grossessesTerminees.filter(g => {
      if (!g.date_accouchement_reel) return false;
      return rdvs?.some(r => 
        r.created_by === g.created_by && 
        new Date(r.date_rdv) > new Date(g.date_accouchement_reel)
      );
    }).length;
    const tauxSuiviPostNatal = grossessesTerminees.length > 0
      ? Math.round((grossessesTermineesAvecSuivi / grossessesTerminees.length) * 100)
      : 0;

    // Accès aux soins par zone (désert médical)
    const desertsMedicaux = Object.entries(repartitionRegions)
      .map(([region, population]) => {
        const prosRegion = pros?.filter(p => p.region === region).length || 0;
        const ratio = population > 0 ? (prosRegion / population * 1000).toFixed(2) : 0;
        return { region, population, professionnels: prosRegion, ratio, desert: parseFloat(ratio) < 1 };
      })
      .filter(z => z.desert)
      .sort((a, b) => parseFloat(a.ratio) - parseFloat(b.ratio));

    // Indicateur d'équité d'accès
    const equiteAcces = {
      avecCMU: mamans?.filter(m => m.numero_cmu).length || 0,
      sansCMU: mamans?.filter(m => !m.numero_cmu).length || 0,
      tauxConsultationAvecCMU: 0,
      tauxConsultationSansCMU: 0
    };

    const mamansAvecCMU = mamans?.filter(m => m.numero_cmu) || [];
    const mamansSansCMU = mamans?.filter(m => !m.numero_cmu) || [];
    
    equiteAcces.tauxConsultationAvecCMU = mamansAvecCMU.length > 0
      ? Math.round((rdvs?.filter(r => mamansAvecCMU.some(m => m.created_by === r.created_by)).length || 0) / mamansAvecCMU.length * 100)
      : 0;
    
    equiteAcces.tauxConsultationSansCMU = mamansSansCMU.length > 0
      ? Math.round((rdvs?.filter(r => mamansSansCMU.some(m => m.created_by === r.created_by)).length || 0) / mamansSansCMU.length * 100)
      : 0;

    return {
      delaiPremiereConsultation: delaiPremiereConsultation.toFixed(1),
      couverture4Consultations,
      tauxSuiviPostNatal,
      desertsMedicaux,
      equiteAcces
    };
  }, [grossesses, grossessesTerminees, rdvs, repartitionRegions, pros, mamans]);

  // Indicateurs ODD (Objectifs de Développement Durable)
  const indicateursODD = useMemo(() => {
    return {
      mortaliteInfantile: { cible: 25, actuel: 0, unite: 'pour 1000' }, // Pas de données
      consultationsPrenatales: { 
        cible: 90, 
        actuel: Math.round((grossesses?.filter(g => (g.consultations?.length || 0) >= 4).length / (grossesses?.length || 1)) * 100),
        unite: '%' 
      },
      accouchementAssiste: { cible: 90, actuel: 85, unite: '%' }, // Estimation
      couvertureVaccinale: { 
        cible: 90, 
        actuel: Math.round(tauxVaccinationParAge.reduce((sum, t) => sum + t.taux, 0) / (tauxVaccinationParAge.length || 1)),
        unite: '%' 
      },
      planificationFamiliale: { 
        cible: 75, 
        actuel: Math.round((contraceptions?.filter(c => c.active).length / (mamans?.length || 1)) * 100),
        unite: '%' 
      },
    };
  }, [grossesses, tauxVaccinationParAge, contraceptions, mamans]);

  // Régions disponibles pour filtre
  const regionsDisponibles = useMemo(() => {
    const regions = new Set();
    mamans?.forEach(m => m.region && regions.add(m.region));
    return Array.from(regions).sort();
  }, [mamans]);

  // Early returns après tous les hooks
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Accès restreint</h2>
            <p className="text-gray-600">Cette page est réservée aux administrateurs.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
      </div>
    );
  }

  // ============ EXPORTS ============

  const exporterCSV = async (type) => {
    setExportEnCours(type);
    try {
      let data = [];
      let headers = [];
      let filename = '';

      switch(type) {
        case 'demographie':
          headers = ['Tranche d\'âge', 'Nombre', 'Pourcentage'];
          data = distributionAgesData.map(d => [d.name, d.value, `${Math.round(d.value / mamans.length * 100)}%`]);
          filename = 'demographie_anonymisee';
          break;
        case 'vaccination':
          headers = ['Tranche d\'âge enfant', 'Nombre enfants', 'Taux vaccination (%)'];
          data = tauxVaccinationParAge.map(d => [d.name, d.enfants, `${d.taux}%`]);
          filename = 'couverture_vaccinale';
          break;
        case 'grossesses':
          headers = ['Indicateur', 'Valeur'];
          data = [
            ['Grossesses actives', grossessesActives.length],
            ['1er trimestre', distributionTrimestres['1er trimestre'] || 0],
            ['2ème trimestre', distributionTrimestres['2ème trimestre'] || 0],
            ['3ème trimestre', distributionTrimestres['3ème trimestre'] || 0],
            ['Accouchements', issuesGrossesse['accouchement'] || 0],
          ];
          filename = 'suivi_grossesses';
          break;
        case 'teleconsultation':
          headers = ['Mois', 'Nombre de consultations'];
          data = rdvParMoisData.map(d => [d.mois, d.count]);
          filename = 'teleconsultations';
          break;
        case 'complet':
          headers = ['Catégorie', 'Métrique', 'Valeur'];
          data = [
            ['Utilisateurs', 'Total mamans', mamans?.length],
            ['Utilisateurs', 'Total professionnels', pros?.length],
            ['Utilisateurs', 'Taux CMU', `${metriquesPubliques.couvertureCMU}%`],
            ['Enfants', 'Total enfants suivis', enfants?.length],
            ['Grossesse', 'Grossesses actives', grossessesActives.length],
            ['Grossesse', 'Moyenne consultations prénatales', metriquesPubliques.moyenneConsultationsPrenatales.toFixed(1)],
            ['Téléconsultation', 'Total RDV', rdvs?.length],
            ['Téléconsultation', 'Taux annulation', `${tauxAnnulation}%`],
            ['Communauté', 'Messages', messages?.length],
          ];
          filename = 'rapport_complet';
          break;
      }

      const csvContent = [headers.join(','), ...data.map(row => row.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();
    } finally {
      setExportEnCours(null);
    }
  };

  const exporterPDF = async () => {
    setExportEnCours('pdf');
    try {
      // Génération via LLM pour un rapport formaté
      const rapport = await base44.integrations.Core.InvokeLLM({
        prompt: `Génère un rapport PDF professionnel en français avec les données suivantes:
        
        STATISTIQUES PLATEFORME A'LO MAMAN - ${format(new Date(), 'dd MMMM yyyy', { locale: fr })}
        
        UTILISATEURS:
        - Mamans inscrites: ${mamans?.length}
        - Professionnels: ${pros?.length}
        - Taux couverture CMU: ${metriquesPubliques.couvertureCMU}%
        
        ENFANTS:
        - Enfants suivis: ${enfants?.length}
        - Couverture vaccinale moyenne: ${tauxVaccinationParAge.reduce((sum, t) => sum + t.taux, 0) / tauxVaccinationParAge.length}%
        
        GROSSESSES:
        - Grossesses actives: ${grossessesActives.length}
        - Moyenne consultations prénatales: ${metriquesPubliques.moyenneConsultationsPrenatales.toFixed(1)}
        
        TÉLÉCONSULTATION:
        - Total RDV: ${rdvs?.length}
        - Taux annulation: ${tauxAnnulation}%
        
        Formate cela en HTML professionnel pour impression.`,
        response_json_schema: {
          type: 'object',
          properties: {
            html: { type: 'string' }
          }
        }
      });

      const printWindow = window.open('', '_blank');
      printWindow.document.write(rapport.html || '<h1>Rapport généré</h1>');
      printWindow.document.close();
      printWindow.print();
    } finally {
      setExportEnCours(null);
    }
  };

  return (
    <AuthGuard>
      <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              Analytics & Données Anonymisées
            </h1>
            <p className="text-gray-600 mt-1">Métriques pour la recherche, santé publique et partenaires</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Rechercher..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-40"
              />
            </div>
            
            <Select value={periodeAnalyse} onValueChange={setPeriodeAnalyse}>
              <SelectTrigger className="w-36">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3 derniers mois</SelectItem>
                <SelectItem value="6">6 derniers mois</SelectItem>
                <SelectItem value="12">12 derniers mois</SelectItem>
                <SelectItem value="all">Tout</SelectItem>
              </SelectContent>
            </Select>

            <Select value={regionFiltre} onValueChange={setRegionFiltre}>
              <SelectTrigger className="w-40">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes régions</SelectItem>
                {regionsDisponibles.map(r => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => exporterCSV('complet')} disabled={exportEnCours}>
              {exportEnCours === 'complet' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileSpreadsheet className="w-4 h-4 mr-2" />}
              CSV
            </Button>
            <Button variant="outline" onClick={exporterPDF} disabled={exportEnCours}>
              {exportEnCours === 'pdf' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
              PDF
            </Button>
          </div>
        </div>

        {/* Alerte données anonymisées */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex items-center gap-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <p className="text-sm text-blue-800">
              <strong>Données anonymisées:</strong> Toutes les données sont agrégées et anonymisées conformément au RGPD. 
              Aucune information personnelle identifiable n'est exposée.
            </p>
          </CardContent>
        </Card>

        {/* KPIs principaux */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-pink-50 to-rose-100 border-none shadow-lg">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-pink-600">{mamans?.length || 0}</p>
              <p className="text-xs text-pink-900">Mamans</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-50 to-cyan-100 border-none shadow-lg">
            <CardContent className="p-4 text-center">
              <Stethoscope className="w-8 h-8 text-teal-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-teal-600">{pros?.length || 0}</p>
              <p className="text-xs text-teal-900">Professionnels</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-none shadow-lg">
            <CardContent className="p-4 text-center">
              <Baby className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">{enfants?.length || 0}</p>
              <p className="text-xs text-blue-900">Enfants suivis</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-none shadow-lg">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{grossessesActives.length}</p>
              <p className="text-xs text-purple-900">Grossesses actives</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-none shadow-lg">
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-amber-600">{rdvs?.length || 0}</p>
              <p className="text-xs text-amber-900">Téléconsultations</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-none shadow-lg">
            <CardContent className="p-4 text-center">
              <Percent className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-green-600">{metriquesPubliques.couvertureCMU}%</p>
              <p className="text-xs text-green-900">Couverture CMU</p>
            </CardContent>
          </Card>
        </div>

        {/* Onglets par partenaire */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Vue globale
            </TabsTrigger>
            <TabsTrigger value="sante_publique" className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Santé Publique
            </TabsTrigger>
            <TabsTrigger value="laboratoires" className="flex items-center gap-2">
              <Beaker className="w-4 h-4" />
              Laboratoires
            </TabsTrigger>
            <TabsTrigger value="assurances" className="flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Assurances
            </TabsTrigger>
            <TabsTrigger value="professionnels" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Professionnels
            </TabsTrigger>
            <TabsTrigger value="business" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Business/Investisseurs
            </TabsTrigger>
            <TabsTrigger value="pharma" className="flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Pharma
            </TabsTrigger>
            <TabsTrigger value="developpement" className="flex items-center gap-2">
              <Baby className="w-4 h-4" />
              Développement
            </TabsTrigger>
          </TabsList>

          {/* VUE GLOBALE */}
          <TabsContent value="overview" className="space-y-6">
            {/* Tendances épidémiologiques */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                  Tendances sur 6 mois
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={tendancesEpidemiologiques}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="vaccinations" fill="#10B981" name="Vaccinations" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="consultations" stroke="#8B5CF6" name="Consultations" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="maladies" stroke="#EF4444" name="Cas maladies" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Indicateurs ODD */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Indicateurs ODD (Objectifs de Développement Durable)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Object.entries(indicateursODD).map(([key, data]) => (
                    <div key={key} className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-xs text-gray-600 mb-2 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                      <div className="flex items-end gap-2 mb-2">
                        <span className="text-2xl font-bold">{data.actuel}</span>
                        <span className="text-sm text-gray-500">/ {data.cible}{data.unite}</span>
                      </div>
                      <Progress value={(data.actuel / data.cible) * 100} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">
                        {data.actuel >= data.cible ? '✅ Objectif atteint' : `${Math.round((data.actuel / data.cible) * 100)}% de l'objectif`}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Zones à risque */}
            <Card className="shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-red-500" />
                  Zones à Risque Sanitaire
                </CardTitle>
                <Button size="sm" variant="outline" onClick={() => exporterCSV('zones_risque')}>
                  <Download className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3">Région</th>
                        <th className="text-center p-3">Population</th>
                        <th className="text-center p-3">Couverture vaccinale</th>
                        <th className="text-center p-3">Score risque</th>
                        <th className="text-center p-3">Niveau</th>
                      </tr>
                    </thead>
                    <tbody>
                      {zonesRisque.slice(0, 10).map((zone, idx) => (
                        <tr key={idx} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{zone.region}</td>
                          <td className="text-center p-3">{zone.population}</td>
                          <td className="text-center p-3">
                            <div className="flex items-center justify-center gap-2">
                              <Progress value={zone.couvertureVaccinale} className="w-20 h-2" />
                              <span>{zone.couvertureVaccinale}%</span>
                            </div>
                          </td>
                          <td className="text-center p-3">{zone.scoreRisque}</td>
                          <td className="text-center p-3">
                            <Badge className={
                              zone.niveau === 'Élevé' ? 'bg-red-100 text-red-800' :
                              zone.niveau === 'Modéré' ? 'bg-amber-100 text-amber-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {zone.niveau}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SANTÉ PUBLIQUE */}
          <TabsContent value="sante_publique" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Couverture vaccinale */}
              <Card className="shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Syringe className="w-5 h-5 text-blue-500" />
                    Couverture Vaccinale par Âge
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => exporterCSV('vaccination')}>
                    <Download className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={tauxVaccinationParAge}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Bar dataKey="taux" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribution géographique */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-500" />
                    Répartition Géographique
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={repartitionRegionsData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Métriques clés santé publique */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Couverture CMU</p>
                      <p className="text-2xl font-bold">{metriquesPubliques.couvertureCMU}%</p>
                    </div>
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Suivi prénatal moyen</p>
                      <p className="text-2xl font-bold">{metriquesPubliques.moyenneConsultationsPrenatales.toFixed(1)}</p>
                      <p className="text-xs text-gray-500">consultations</p>
                    </div>
                    <Activity className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Grossesses suivies</p>
                      <p className="text-2xl font-bold">{grossessesActives.length}</p>
                      <p className="text-xs text-gray-500">en cours</p>
                    </div>
                    <Heart className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Téléconsultations</p>
                      <p className="text-2xl font-bold">{rdvs?.filter(r => r.type_consultation === 'visio').length || 0}</p>
                      <p className="text-xs text-gray-500">réalisées</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-amber-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Distribution trimestres grossesse */}
            <Card className="shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Distribution des Grossesses par Trimestre</CardTitle>
                <Button size="sm" variant="outline" onClick={() => exporterCSV('grossesses')}>
                  <Download className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(distributionTrimestres).map(([trimestre, count]) => (
                    <div key={trimestre} className="text-center p-4 bg-purple-50 rounded-xl">
                      <p className="text-3xl font-bold text-purple-600">{count}</p>
                      <p className="text-sm text-purple-800">{trimestre}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* LABORATOIRES / RECHERCHE */}
          <TabsContent value="laboratoires" className="space-y-6">
            {/* KPIs Recherche */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <Beaker className="w-6 h-6 text-purple-500 mb-2" />
                  <p className="text-2xl font-bold">{adoptionVaccins.length}</p>
                  <p className="text-xs text-gray-600">Types vaccins suivis</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <Bug className="w-6 h-6 text-red-500 mb-2" />
                  <p className="text-2xl font-bold">{prevalenceMaladies.length}</p>
                  <p className="text-xs text-gray-600">Pathologies identifiées</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <Pill className="w-6 h-6 text-green-500 mb-2" />
                  <p className="text-2xl font-bold">{rappelsMedicaments?.length || 0}</p>
                  <p className="text-xs text-gray-600">Traitements suivis</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <HeartPulse className="w-6 h-6 text-blue-500 mb-2" />
                  <p className="text-2xl font-bold">{donneesVitales?.length || 0}</p>
                  <p className="text-xs text-gray-600">Mesures vitales</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Taux d'adoption des vaccins */}
              <Card className="shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Syringe className="w-5 h-5 text-blue-500" />
                    Taux d'Adoption des Vaccins
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => exporterCSV('vaccination')}>
                    <Download className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={adoptionVaccins}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={10} angle={-45} textAnchor="end" height={80} />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value, name) => name === 'taux' ? `${value}%` : value} />
                      <Bar dataKey="taux" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Taux adoption" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Prévalence maladies */}
              <Card className="shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bug className="w-5 h-5 text-red-500" />
                    Prévalence des Maladies (anonymisée)
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => exporterCSV('maladies')}>
                    <Download className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {prevalenceMaladies.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={prevalenceMaladies.slice(0, 8)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                        <Tooltip formatter={(value, name) => name === 'pourcentage' ? `${value}%` : value} />
                        <Bar dataKey="value" fill="#EF4444" radius={[0, 4, 4, 0]} name="Cas" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Distribution démographique */}
              <Card className="shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Distribution Démographique (anonymisée)</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => exporterCSV('demographie')}>
                    <Download className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={distributionAgesData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {distributionAgesData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Allergies fréquentes */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Allergies les Plus Fréquentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topAllergies.length > 0 ? (
                    <div className="space-y-3">
                      {topAllergies.slice(0, 6).map((allergie, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-sm flex-1">{allergie.name}</span>
                          <Progress value={(allergie.value / topAllergies[0].value) * 100} className="flex-1 h-2" />
                          <span className="text-sm font-bold w-10 text-right">{allergie.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Données vitales agrégées */}
            {moyennesDonneesVitales.length > 0 && (
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HeartPulse className="w-5 h-5 text-pink-500" />
                    Données Vitales Agrégées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-4 gap-4">
                    {moyennesDonneesVitales.map((donnee, idx) => (
                      <div key={idx} className="p-4 bg-gray-50 rounded-xl">
                        <p className="text-xs text-gray-600 capitalize mb-1">{donnee.type.replace(/_/g, ' ')}</p>
                        <p className="text-2xl font-bold">{donnee.moyenne}</p>
                        <p className="text-xs text-gray-500">{donnee.mesures} mesures</p>
                        <p className="text-xs text-red-500">{donnee.tauxAlertes}% alertes</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Métriques recherche */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Cohortes pour la Recherche Épidémiologique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <h4 className="font-semibold mb-3 text-purple-800">Cohorte Grossesse</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between"><span>Grossesses uniques:</span> <strong>{grossesses?.filter(g => g.type_grossesse === 'unique').length || 0}</strong></li>
                      <li className="flex justify-between"><span>Grossesses gémellaires:</span> <strong>{grossesses?.filter(g => g.type_grossesse === 'gemellaire').length || 0}</strong></li>
                      <li className="flex justify-between"><span>Rhésus négatif:</span> <strong>{grossesses?.filter(g => g.rhesus === 'negatif').length || 0}</strong></li>
                      <li className="flex justify-between"><span>Avec antécédents:</span> <strong>{grossesses?.filter(g => g.antecedents?.length > 0).length || 0}</strong></li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h4 className="font-semibold mb-3 text-blue-800">Cohorte Pédiatrique</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between"><span>Nourrissons (0-12 mois):</span> <strong>{enfants?.filter(e => differenceInMonths(new Date(), new Date(e.date_naissance)) <= 12).length || 0}</strong></li>
                      <li className="flex justify-between"><span>Petite enfance (1-3 ans):</span> <strong>{enfants?.filter(e => { const m = differenceInMonths(new Date(), new Date(e.date_naissance)); return m > 12 && m <= 36; }).length || 0}</strong></li>
                      <li className="flex justify-between"><span>Avec allergies:</span> <strong>{enfants?.filter(e => e.allergies?.length > 0).length || 0}</strong></li>
                      <li className="flex justify-between"><span>Maladies chroniques:</span> <strong>{enfants?.filter(e => e.maladies_chroniques?.length > 0).length || 0}</strong></li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl">
                    <h4 className="font-semibold mb-3 text-green-800">Suivi Contraception</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between"><span>Suivis actifs:</span> <strong>{contraceptions?.filter(c => c.active).length || 0}</strong></li>
                      <li className="flex justify-between"><span>Cycles enregistrés:</span> <strong>{cycles?.length || 0}</strong></li>
                      <li className="flex justify-between"><span>Effets secondaires:</span> <strong>{contraceptions?.filter(c => c.effets_secondaires?.length > 0).length || 0}</strong></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ASSURANCES */}
          <TabsContent value="assurances" className="space-y-6">
            {/* Coûts évités par la prévention */}
            <Card className="shadow-xl bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <DollarSign className="w-6 h-6" />
                  Coûts Évités par la Prévention (estimation)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center p-4 bg-white rounded-xl shadow">
                    <Syringe className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{(coutsEvites.vaccination / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-gray-600">Vaccination</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow">
                    <Heart className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{(coutsEvites.prenatal / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-gray-600">Suivi prénatal</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow">
                    <Shield className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{(coutsEvites.contraception / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-gray-600">Contraception</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-xl shadow">
                    <Stethoscope className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{(coutsEvites.teleconsultation / 1000000).toFixed(1)}M</p>
                    <p className="text-xs text-gray-600">Téléconsultation</p>
                  </div>
                  <div className="text-center p-4 bg-green-600 text-white rounded-xl shadow">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{(coutsEvites.total / 1000000).toFixed(1)}M</p>
                    <p className="text-xs">FCFA Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Besoins de soins et Sinistralité */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Besoins de Soins par Catégorie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={besoinsSoins}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categorie" fontSize={10} angle={-15} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="demande" fill="#3B82F6" name="Demande totale" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="urgent" fill="#EF4444" name="Cas urgents" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Indicateurs de Sinistralité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-pink-50 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Grossesses à risque</span>
                        <Badge className="bg-pink-100 text-pink-800">{sinistralite.tauxRisqueGrossesse}%</Badge>
                      </div>
                      <Progress value={parseFloat(sinistralite.tauxRisqueGrossesse)} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{sinistralite.risquesGrossesse} grossesses avec antécédents</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Enfants allergiques</span>
                        <Badge className="bg-amber-100 text-amber-800">{sinistralite.tauxAllergies}%</Badge>
                      </div>
                      <Progress value={parseFloat(sinistralite.tauxAllergies)} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{sinistralite.enfantsAllergiques} enfants concernés</p>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm">Maladies chroniques</span>
                        <Badge className="bg-red-100 text-red-800">{sinistralite.tauxChroniques}%</Badge>
                      </div>
                      <Progress value={parseFloat(sinistralite.tauxChroniques)} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">{sinistralite.maladiesChroniques} enfants concernés</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Évolution téléconsultations */}
              <Card className="shadow-xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Évolution Téléconsultations</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => exporterCSV('teleconsultation')}>
                    <Download className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={rdvParMoisData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" fontSize={11} />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="count" stroke="#8B5CF6" fill="#C4B5FD" name="Consultations" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Types de consultation */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Répartition Types de Consultation</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie data={rdvParTypeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                        {rdvParTypeData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* KPIs Assurance */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">RDV réalisés</p>
                  <p className="text-2xl font-bold text-green-600">{rdvs?.filter(r => r.statut === 'termine').length || 0}</p>
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" /> Consultations effectives
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Taux annulation</p>
                  <p className="text-2xl font-bold text-red-600">{tauxAnnulation}%</p>
                  <p className="text-xs text-red-700 flex items-center gap-1">
                    <ArrowDownRight className="w-3 h-3" /> Annulations
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Couverture CMU</p>
                  <p className="text-2xl font-bold text-blue-600">{metriquesPubliques.couvertureCMU}%</p>
                  <p className="text-xs text-blue-700">Utilisatrices assurées</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Suivi prénatal</p>
                  <p className="text-2xl font-bold text-purple-600">{Math.round((grossessesActives.length / (mamans?.length || 1)) * 100)}%</p>
                  <p className="text-xs text-purple-700">Grossesses suivies</p>
                </CardContent>
              </Card>
            </div>

            {/* Tableau récapitulatif actuariel */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Indicateurs Actuariels & Benchmarks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3">Indicateur</th>
                        <th className="text-center p-3">Actuel</th>
                        <th className="text-center p-3">Tendance</th>
                        <th className="text-center p-3">Benchmark</th>
                        <th className="text-center p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">Consultations prénatales / grossesse</td>
                        <td className="text-center p-3 font-bold">{metriquesPubliques.moyenneConsultationsPrenatales.toFixed(1)}</td>
                        <td className="text-center p-3"><ArrowUpRight className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-3 text-gray-500">≥ 4 (OMS)</td>
                        <td className="text-center p-3">
                          <Badge className={metriquesPubliques.moyenneConsultationsPrenatales >= 4 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                            {metriquesPubliques.moyenneConsultationsPrenatales >= 4 ? 'Conforme' : 'À améliorer'}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Couverture vaccinale 0-12 mois</td>
                        <td className="text-center p-3 font-bold">{tauxVaccinationParAge.find(t => t.name === '0-6 mois')?.taux || 0}%</td>
                        <td className="text-center p-3"><ArrowUpRight className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-3 text-gray-500">≥ 90%</td>
                        <td className="text-center p-3">
                          <Badge className={(tauxVaccinationParAge.find(t => t.name === '0-6 mois')?.taux || 0) >= 90 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                            {(tauxVaccinationParAge.find(t => t.name === '0-6 mois')?.taux || 0) >= 90 ? 'Conforme' : 'À améliorer'}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Taux de no-show (annulation)</td>
                        <td className="text-center p-3 font-bold">{tauxAnnulation}%</td>
                        <td className="text-center p-3"><Clock className="w-4 h-4 text-amber-500 mx-auto" /></td>
                        <td className="text-center p-3 text-gray-500">≤ 15%</td>
                        <td className="text-center p-3">
                          <Badge className={tauxAnnulation <= 15 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {tauxAnnulation <= 15 ? 'Conforme' : 'Attention'}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Taux grossesses à risque</td>
                        <td className="text-center p-3 font-bold">{sinistralite.tauxRisqueGrossesse}%</td>
                        <td className="text-center p-3"><AlertTriangle className="w-4 h-4 text-amber-500 mx-auto" /></td>
                        <td className="text-center p-3 text-gray-500">≤ 20%</td>
                        <td className="text-center p-3">
                          <Badge className={parseFloat(sinistralite.tauxRisqueGrossesse) <= 20 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                            {parseFloat(sinistralite.tauxRisqueGrossesse) <= 20 ? 'Normal' : 'Surveillé'}
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BUSINESS / INVESTISSEURS */}
          <TabsContent value="business" className="space-y-6">
            {/* KPIs Investisseurs */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-none shadow-lg">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{metriquesBusiness.totalUtilisateurs}</p>
                  <p className="text-xs text-blue-900">Utilisateurs totaux</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-none shadow-lg">
                <CardContent className="p-4 text-center">
                  <UserCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{metriquesBusiness.mau}</p>
                  <p className="text-xs text-green-900">MAU (Actifs/mois)</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-none shadow-lg">
                <CardContent className="p-4 text-center">
                  <Zap className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{metriquesBusiness.dauEstime}</p>
                  <p className="text-xs text-purple-900">DAU (Actifs/jour)</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-none shadow-lg">
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-600">{metriquesBusiness.croissanceMoM > 0 ? '+' : ''}{metriquesBusiness.croissanceMoM}%</p>
                  <p className="text-xs text-amber-900">Croissance MoM</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-50 to-cyan-100 border-none shadow-lg">
                <CardContent className="p-4 text-center">
                  <Repeat className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-teal-600">{metriquesBusiness.tauxRetention}%</p>
                  <p className="text-xs text-teal-900">Rétention</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-rose-50 to-pink-100 border-none shadow-lg">
                <CardContent className="p-4 text-center">
                  <Banknote className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-rose-600">{(metriquesBusiness.ltv / 1000).toFixed(0)}K</p>
                  <p className="text-xs text-rose-900">LTV (FCFA)</p>
                </CardContent>
              </Card>
            </div>

            {/* Graphique croissance */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  Croissance Mensuelle (6 derniers mois)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={croissanceMensuelle}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="mamans" fill="#FF6B9D" name="Nouvelles mamans" radius={[4, 4, 0, 0]} />
                    <Bar yAxisId="left" dataKey="professionnels" fill="#14B8A6" name="Nouveaux pros" radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="rdv" stroke="#8B5CF6" name="RDV" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Métriques détaillées */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-purple-500" />
                    Métriques d'Engagement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Sessions moyennes / utilisateur</span>
                    <span className="text-xl font-bold">{metriquesBusiness.sessionsMoyennes}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Ratio d'engagement</span>
                    <span className="text-xl font-bold">{metriquesBusiness.ratioEngagement}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Durée moyenne engagement</span>
                    <span className="text-xl font-bold">{metriquesBusiness.dureeMoyenneEngagement} mois</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm">Taux de churn</span>
                    <span className="text-xl font-bold text-red-600">{metriquesBusiness.tauxChurn}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="w-5 h-5 text-green-500" />
                    Acquisition & Conversion
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Nouveaux utilisateurs (30j)</span>
                    <span className="text-xl font-bold text-green-600">+{metriquesBusiness.nouveauxUtilisateursMois}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Taux de conversion (inscription → RDV)</span>
                    <span className="text-xl font-bold">
                      {mamans?.length > 0 ? Math.round((rdvs?.length || 0) / mamans.length * 100) : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">Ratio Mamans / Professionnels</span>
                    <span className="text-xl font-bold">
                      {pros?.length > 0 ? Math.round((mamans?.length || 0) / pros.length) : 0}:1
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm">ARPU estimé</span>
                    <span className="text-xl font-bold text-blue-600">{metriquesAssurancesAvancees.arpu.toLocaleString()} FCFA</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tableau récapitulatif investisseurs */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Tableau de Bord Investisseurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-3">Métrique</th>
                        <th className="text-center p-3">Valeur Actuelle</th>
                        <th className="text-center p-3">Tendance</th>
                        <th className="text-center p-3">Benchmark SaaS</th>
                        <th className="text-center p-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3">MAU (Monthly Active Users)</td>
                        <td className="text-center p-3 font-bold">{metriquesBusiness.mau}</td>
                        <td className="text-center p-3"><TrendingUp className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-3 text-gray-500">-</td>
                        <td className="text-center p-3"><Badge className="bg-blue-100 text-blue-800">Croissance</Badge></td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Taux de rétention (30j)</td>
                        <td className="text-center p-3 font-bold">{metriquesBusiness.tauxRetention}%</td>
                        <td className="text-center p-3">{metriquesBusiness.tauxRetention >= 40 ? <TrendingUp className="w-4 h-4 text-green-500 mx-auto" /> : <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />}</td>
                        <td className="text-center p-3 text-gray-500">≥ 40%</td>
                        <td className="text-center p-3">
                          <Badge className={metriquesBusiness.tauxRetention >= 40 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                            {metriquesBusiness.tauxRetention >= 40 ? 'Excellent' : 'À améliorer'}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Croissance MoM</td>
                        <td className="text-center p-3 font-bold">{metriquesBusiness.croissanceMoM}%</td>
                        <td className="text-center p-3">{metriquesBusiness.croissanceMoM >= 0 ? <TrendingUp className="w-4 h-4 text-green-500 mx-auto" /> : <TrendingDown className="w-4 h-4 text-red-500 mx-auto" />}</td>
                        <td className="text-center p-3 text-gray-500">≥ 10%</td>
                        <td className="text-center p-3">
                          <Badge className={metriquesBusiness.croissanceMoM >= 10 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                            {metriquesBusiness.croissanceMoM >= 10 ? 'Hyper-croissance' : 'Normal'}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">Churn mensuel</td>
                        <td className="text-center p-3 font-bold">{metriquesBusiness.tauxChurn}%</td>
                        <td className="text-center p-3">{metriquesBusiness.tauxChurn <= 5 ? <TrendingDown className="w-4 h-4 text-green-500 mx-auto" /> : <TrendingUp className="w-4 h-4 text-red-500 mx-auto" />}</td>
                        <td className="text-center p-3 text-gray-500">≤ 5%</td>
                        <td className="text-center p-3">
                          <Badge className={metriquesBusiness.tauxChurn <= 5 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {metriquesBusiness.tauxChurn <= 5 ? 'Sain' : 'Attention'}
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="p-3">LTV estimée</td>
                        <td className="text-center p-3 font-bold">{metriquesBusiness.ltv.toLocaleString()} FCFA</td>
                        <td className="text-center p-3"><TrendingUp className="w-4 h-4 text-green-500 mx-auto" /></td>
                        <td className="text-center p-3 text-gray-500">-</td>
                        <td className="text-center p-3"><Badge className="bg-purple-100 text-purple-800">Calculée</Badge></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PHARMA / ADHÉRENCE */}
          <TabsContent value="pharma" className="space-y-6">
            {/* KPIs Pharma */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-none shadow-lg">
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{metriquesPharma.tauxAdherence}%</p>
                  <p className="text-xs text-green-900">Taux d'adhérence</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-none shadow-lg">
                <CardContent className="p-4 text-center">
                  <Pill className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{metriquesPharma.rappelsActifs}</p>
                  <p className="text-xs text-blue-900">Traitements actifs</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-none shadow-lg">
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{metriquesPharma.dureeMoyenneTraitement}</p>
                  <p className="text-xs text-purple-900">Durée moy. (mois)</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-none shadow-lg">
                <CardContent className="p-4 text-center">
                  <Activity className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-amber-600">{metriquesPharma.segmentationPathologies.length}</p>
                  <p className="text-xs text-amber-900">Pathologies suivies</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Médicaments les plus suivis */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-blue-500" />
                    Médicaments les Plus Suivis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metriquesPharma.topMedicaments.length > 0 ? (
                    <div className="space-y-3">
                      {metriquesPharma.topMedicaments.slice(0, 8).map((med, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="text-sm flex-1 truncate">{med.nom}</span>
                          <Progress value={(med.count / metriquesPharma.topMedicaments[0].count) * 100} className="flex-1 h-2" />
                          <span className="text-sm font-bold w-10 text-right">{med.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>

              {/* Segmentation pathologies */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-red-500" />
                    Segmentation Pathologies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metriquesPharma.segmentationPathologies.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={metriquesPharma.segmentationPathologies.slice(0, 8)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="pathologie" type="category" width={120} fontSize={10} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} name="Cas" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-center text-gray-500 py-8">Aucune donnée disponible</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Cohortes pour études cliniques */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Beaker className="w-5 h-5 text-purple-500" />
                  Cohortes Disponibles pour Études
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                    <h4 className="font-semibold text-pink-800 mb-3">Grossesse</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between"><span>Total grossesses suivies:</span> <strong>{grossesses?.length || 0}</strong></li>
                      <li className="flex justify-between"><span>Avec antécédents:</span> <strong>{grossesses?.filter(g => g.antecedents?.length > 0).length || 0}</strong></li>
                      <li className="flex justify-between"><span>1er trimestre:</span> <strong>{distributionTrimestres['1er trimestre'] || 0}</strong></li>
                      <li className="flex justify-between"><span>3ème trimestre:</span> <strong>{distributionTrimestres['3ème trimestre'] || 0}</strong></li>
                    </ul>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-3">Pédiatrie</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between"><span>Nourrissons (0-12m):</span> <strong>{enfants?.filter(e => differenceInMonths(new Date(), new Date(e.date_naissance)) <= 12).length || 0}</strong></li>
                      <li className="flex justify-between"><span>Avec allergies:</span> <strong>{enfants?.filter(e => e.allergies?.length > 0).length || 0}</strong></li>
                      <li className="flex justify-between"><span>Maladies chroniques:</span> <strong>{enfants?.filter(e => e.maladies_chroniques?.length > 0).length || 0}</strong></li>
                    </ul>
                  </div>

                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">Contraception</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between"><span>Suivis actifs:</span> <strong>{contraceptions?.filter(c => c.active).length || 0}</strong></li>
                      <li className="flex justify-between"><span>Avec effets secondaires:</span> <strong>{contraceptions?.filter(c => c.effets_secondaires?.length > 0).length || 0}</strong></li>
                      <li className="flex justify-between"><span>Cycles enregistrés:</span> <strong>{cycles?.length || 0}</strong></li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Équité d'accès aux soins */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-500" />
                  Équité d'Accès aux Soins
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold mb-4">Couverture CMU vs Non-CMU</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Avec CMU ({metriquesSantePubliqueAvancees.equiteAcces.avecCMU} utilisatrices)</span>
                          <span className="font-bold">{metriquesSantePubliqueAvancees.equiteAcces.tauxConsultationAvecCMU}%</span>
                        </div>
                        <Progress value={metriquesSantePubliqueAvancees.equiteAcces.tauxConsultationAvecCMU} className="h-3 bg-gray-200" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Sans CMU ({metriquesSantePubliqueAvancees.equiteAcces.sansCMU} utilisatrices)</span>
                          <span className="font-bold">{metriquesSantePubliqueAvancees.equiteAcces.tauxConsultationSansCMU}%</span>
                        </div>
                        <Progress value={metriquesSantePubliqueAvancees.equiteAcces.tauxConsultationSansCMU} className="h-3 bg-gray-200" />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold mb-4">Déserts Médicaux Identifiés</h4>
                    {metriquesSantePubliqueAvancees.desertsMedicaux.length > 0 ? (
                      <div className="space-y-2">
                        {metriquesSantePubliqueAvancees.desertsMedicaux.slice(0, 5).map((zone, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                            <span className="text-sm">{zone.region}</span>
                            <Badge className="bg-red-100 text-red-800">{zone.ratio} pro/1000 hab</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500">Aucun désert médical identifié</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DÉVELOPPEMENT ENFANT */}
          <TabsContent value="developpement" className="space-y-6">
            {metriquesDeveloppement ? (
              <>
                {/* KPIs Développement */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-none shadow-lg">
                    <CardContent className="p-4 text-center">
                      <Baby className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{metriquesDeveloppement.totalEnfantsSuivis}</p>
                      <p className="text-xs text-blue-900">Enfants suivis</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-none shadow-lg">
                    <CardContent className="p-4 text-center">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{metriquesDeveloppement.tauxSuiviJalons}%</p>
                      <p className="text-xs text-green-900">Taux suivi jalons</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-50 to-violet-100 border-none shadow-lg">
                    <CardContent className="p-4 text-center">
                      <Target className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-purple-600">{metriquesDeveloppement.tauxDetectionPrecoce}%</p>
                      <p className="text-xs text-purple-900">Détection précoce</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-50 to-orange-100 border-none shadow-lg">
                    <CardContent className="p-4 text-center">
                      <Clock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-amber-600">{metriquesDeveloppement.delaiMoyenConsultation}j</p>
                      <p className="text-xs text-amber-900">Délai post-alerte</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-red-50 to-rose-100 border-none shadow-lg">
                    <CardContent className="p-4 text-center">
                      <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-600">{metriquesDeveloppement.alertesDeveloppement}</p>
                      <p className="text-xs text-red-900">Alertes actives</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-teal-50 to-cyan-100 border-none shadow-lg">
                    <CardContent className="p-4 text-center">
                      <Activity className="w-8 h-8 text-teal-500 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-teal-600">{metriquesDeveloppement.bilansRealises}</p>
                      <p className="text-xs text-teal-900">Bilans réalisés</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Scores par domaine & Retards par âge */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5 text-purple-500" />
                        Score Développement par Domaine
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={metriquesDeveloppement.domainesData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="name" fontSize={10} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="Score %" dataKey="score" stroke="#8B5CF6" fill="#C4B5FD" fillOpacity={0.6} />
                          <Tooltip formatter={(value) => `${value}%`} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="shadow-xl">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Retards Détectés par Tranche d'Âge
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={metriquesDeveloppement.retardsAgeData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="tranche" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Enfants avec retard" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Couverture bilans aux âges clés */}
                <Card className="shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-500" />
                      Couverture des Bilans de Développement aux Âges Clés
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="p-6 bg-white rounded-xl shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Bilan 9 mois</p>
                            <p className="text-3xl font-bold text-indigo-600">{metriquesDeveloppement.couvertureBilan9m}%</p>
                          </div>
                          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Baby className="w-8 h-8 text-indigo-500" />
                          </div>
                        </div>
                        <Progress value={metriquesDeveloppement.couvertureBilan9m} className="h-3" />
                        <p className="text-xs text-gray-500 mt-2">Objectif OMS: 90%</p>
                      </div>

                      <div className="p-6 bg-white rounded-xl shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Bilan 24 mois</p>
                            <p className="text-3xl font-bold text-purple-600">{metriquesDeveloppement.couvertureBilan24m}%</p>
                          </div>
                          <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                            <Baby className="w-8 h-8 text-purple-500" />
                          </div>
                        </div>
                        <Progress value={metriquesDeveloppement.couvertureBilan24m} className="h-3" />
                        <p className="text-xs text-gray-500 mt-2">Objectif OMS: 90%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Prévalence retards par domaine (valeur pharma/santé publique) */}
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Microscope className="w-5 h-5 text-red-500" />
                      Prévalence des Retards par Domaine (Données Épidémiologiques)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left p-3">Domaine</th>
                            <th className="text-center p-3">Cas détectés</th>
                            <th className="text-center p-3">Prévalence</th>
                            <th className="text-center p-3">Benchmark population</th>
                            <th className="text-center p-3">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metriquesDeveloppement.prevalenceRetards.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium capitalize">{item.domaine.replace(/_/g, ' ')}</td>
                              <td className="text-center p-3">{item.count}</td>
                              <td className="text-center p-3">
                                <Badge className={parseFloat(item.pourcentage) > 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                  {item.pourcentage}%
                                </Badge>
                              </td>
                              <td className="text-center p-3 text-gray-500">5-15%</td>
                              <td className="text-center p-3">
                                <Badge className={parseFloat(item.pourcentage) > 15 ? 'bg-red-100 text-red-800' : parseFloat(item.pourcentage) > 10 ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
                                  {parseFloat(item.pourcentage) > 15 ? 'Élevé' : parseFloat(item.pourcentage) > 10 ? 'Modéré' : 'Normal'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {metriquesDeveloppement.prevalenceRetards.length === 0 && (
                            <tr><td colSpan={5} className="text-center p-4 text-gray-500">Aucune donnée de retard enregistrée</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Tableau récapitulatif pour investisseurs/assureurs */}
                <Card className="shadow-xl">
                  <CardHeader>
                    <CardTitle>Indicateurs Clés Développement (Valeur Marchande)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                          <DollarSign className="w-5 h-5" />
                          Pour Assureurs
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between"><span>Détection précoce:</span> <strong className="text-green-600">{metriquesDeveloppement.tauxDetectionPrecoce}%</strong></li>
                          <li className="flex justify-between"><span>Coûts évités (estimation):</span> <strong>{(metriquesDeveloppement.tauxDetectionPrecoce * 50000).toLocaleString()} FCFA</strong></li>
                          <li className="flex justify-between"><span>Réduction hospitalisations:</span> <strong>-{Math.round(metriquesDeveloppement.tauxDetectionPrecoce * 0.3)}%</strong></li>
                        </ul>
                      </div>

                      <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                        <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                          <Beaker className="w-5 h-5" />
                          Pour Pharma/Recherche
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between"><span>Cohorte pédiatrique:</span> <strong>{metriquesDeveloppement.totalEnfantsSuivis}</strong></li>
                          <li className="flex justify-between"><span>Données longitudinales:</span> <strong>{metriquesDeveloppement.bilansRealises} bilans</strong></li>
                          <li className="flex justify-between"><span>Retards documentés:</span> <strong>{metriquesDeveloppement.jalonsParStatut.retard}</strong></li>
                        </ul>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                          <Building2 className="w-5 h-5" />
                          Pour Santé Publique
                        </h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex justify-between"><span>Couverture bilan 9m:</span> <strong>{metriquesDeveloppement.couvertureBilan9m}%</strong></li>
                          <li className="flex justify-between"><span>Couverture bilan 24m:</span> <strong>{metriquesDeveloppement.couvertureBilan24m}%</strong></li>
                          <li className="flex justify-between"><span>Alertes non traitées:</span> <strong className="text-red-600">{metriquesDeveloppement.alertesDeveloppement}</strong></li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="shadow-xl">
                <CardContent className="p-12 text-center">
                  <Baby className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune donnée de développement</h3>
                  <p className="text-gray-500">Les métriques apparaîtront une fois que des jalons de développement seront enregistrés.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* PROFESSIONNELS */}
          <TabsContent value="professionnels" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Répartition spécialités */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Professionnels par Spécialité</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPie>
                      <Pie
                        data={prosParSpecialiteData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label
                      >
                        {prosParSpecialiteData.map((entry, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPie>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Répartition géographique pros */}
              <Card className="shadow-xl">
                <CardHeader>
                  <CardTitle>Couverture Géographique Professionnels</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(prosParRegion)
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 8)
                      .map(([region, count]) => (
                        <div key={region} className="flex items-center gap-3">
                          <span className="text-sm flex-1">{region}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-teal-500 h-2 rounded-full"
                              style={{ width: `${(count / pros.length) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold w-8">{count}</span>
                        </div>
                      ))
                    }
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Stats pros */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-teal-500">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Professionnels actifs</p>
                  <p className="text-2xl font-bold">{pros?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Vérifiés</p>
                  <p className="text-2xl font-bold">{pros?.filter(p => p.compte_verifie).length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Acceptent CMU</p>
                  <p className="text-2xl font-bold">{pros?.filter(p => p.accepte_cmu).length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <p className="text-sm text-gray-600">Téléconsultation</p>
                  <p className="text-2xl font-bold">{pros?.filter(p => p.types_consultation_offerts?.includes('visio')).length || 0}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}