import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Bell, Calendar, Stethoscope, Baby, Syringe, Activity,
  CheckCircle2, Clock, AlertCircle, ChevronRight, Plus, FileText
} from 'lucide-react';
import { format, addWeeks, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import AjouterRappelRDV from './AjouterRappelRDV';

// Calendrier prénatal standard
const CALENDRIER_PRENATAL = [
  { semaine: 8, type: 'consultation', titre: '1ère consultation prénatale', description: 'Confirmation de grossesse, prise de sang', icone: Stethoscope, urgent: true },
  { semaine: 12, type: 'echographie', titre: 'Échographie de datation', description: 'Datation précise, dépistage T21', icone: Baby, urgent: true },
  { semaine: 16, type: 'consultation', titre: '2ème consultation', description: 'Suivi de routine', icone: Stethoscope },
  { semaine: 20, type: 'echographie', titre: 'Échographie morphologique', description: 'Examen détaillé du bébé', icone: Baby, urgent: true },
  { semaine: 24, type: 'consultation', titre: '3ème consultation', description: 'Test glucose (optionnel)', icone: Stethoscope },
  { semaine: 28, type: 'consultation', titre: '4ème consultation', description: 'Injection anti-D si Rh-', icone: Stethoscope },
  { semaine: 28, type: 'vaccin', titre: 'Vaccin coqueluche', description: 'Protection du nouveau-né', icone: Syringe, urgent: true },
  { semaine: 32, type: 'echographie', titre: 'Échographie de croissance', description: 'Position du bébé, croissance', icone: Baby },
  { semaine: 34, type: 'consultation', titre: '5ème consultation', description: 'Préparation à l\'accouchement', icone: Stethoscope },
  { semaine: 36, type: 'consultation', titre: 'Consultation pré-accouchement', description: 'Monitoring, col utérin', icone: Stethoscope, urgent: true },
  { semaine: 37, type: 'consultation', titre: 'Prélèvement vaginal', description: 'Dépistage Streptocoque B', icone: Activity },
  { semaine: 39, type: 'consultation', titre: 'Consultation terme', description: 'Surveillance de fin de grossesse', icone: Stethoscope },
  { semaine: 41, type: 'consultation', titre: 'Dépassement de terme', description: 'Monitoring et surveillance', icone: AlertCircle, urgent: true },
];

export default function RappelsPrenatals({ grossesse, semainesGrossesse }) {
  const queryClient = useQueryClient();
  const [showSettings, setShowSettings] = useState(false);
  const [showAjouterRappel, setShowAjouterRappel] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilMaman } = useQuery({
    queryKey: ['profil_maman', user?.email],
    queryFn: async () => {
      const profils = await base44.entities.ProfilMaman.filter({ created_by: user.email });
      return profils[0] || null;
    },
    enabled: !!user,
  });

  // Calculer la date pour chaque RDV
  const getRdvDate = (semaine) => {
    if (!grossesse?.date_derniere_regle) return null;
    return addWeeks(new Date(grossesse.date_derniere_regle), semaine);
  };

  // Statut de chaque RDV
  const getRdvStatus = (rdv) => {
    const rdvDate = getRdvDate(rdv.semaine);
    if (!rdvDate) return 'unknown';

    const today = new Date();
    const joursRestants = differenceInDays(rdvDate, today);

    // Vérifier si déjà effectué (dans consultations/echographies)
    const consultationsEffectuees = grossesse?.consultations || [];
    const echosEffectuees = grossesse?.echographies || [];
    const vaccinsEffectues = grossesse?.vaccins || [];

    const isEffectue = 
      (rdv.type === 'consultation' && consultationsEffectuees.some(c => c.semaine_grossesse === rdv.semaine)) ||
      (rdv.type === 'echographie' && echosEffectuees.some(e => e.trimestre && rdv.semaine <= e.trimestre * 14)) ||
      (rdv.type === 'vaccin' && vaccinsEffectues.some(v => v.nom_vaccin?.toLowerCase().includes('coqueluche')));

    if (isEffectue) return 'effectue';
    if (joursRestants < 0) return 'retard';
    if (joursRestants <= 7) return 'imminent';
    if (joursRestants <= 14) return 'proche';
    return 'planifie';
  };

  // Filtrer les RDV à afficher (passés récents + à venir)
  const rdvsAfficher = CALENDRIER_PRENATAL.filter(rdv => {
    const status = getRdvStatus(rdv);
    // Afficher: en retard, imminent, proche, ou planifié dans les 8 prochaines semaines
    if (status === 'retard' || status === 'imminent' || status === 'proche') return true;
    if (status === 'effectue') return false; // Masquer les effectués
    return rdv.semaine <= semainesGrossesse + 8;
  });

  // Créer notification pour un RDV
  const createRappelMutation = useMutation({
    mutationFn: async (rdv) => {
      const rdvDate = getRdvDate(rdv.semaine);
      
      await base44.entities.Notification.create({
        destinataire_email: user.email,
        type: 'rendez_vous_rappel',
        titre: `Rappel: ${rdv.titre}`,
        message: `N'oubliez pas votre ${rdv.titre.toLowerCase()} prévu à la semaine ${rdv.semaine}. ${rdv.description}`,
        priorite: rdv.urgent ? 'haute' : 'normale',
        action_page: 'Teleconsultation',
        icone: 'Stethoscope'
      });
    },
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'effectue':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Effectué</Badge>;
      case 'retard':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="w-3 h-3 mr-1" />En retard</Badge>;
      case 'imminent':
        return <Badge className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Cette semaine</Badge>;
      case 'proche':
        return <Badge className="bg-blue-100 text-blue-800"><Calendar className="w-3 h-3 mr-1" />Bientôt</Badge>;
      default:
        return <Badge variant="outline">Planifié</Badge>;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'retard': return 'border-l-red-500 bg-red-50';
      case 'imminent': return 'border-l-amber-500 bg-amber-50';
      case 'proche': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-300';
    }
  };

  // RDVs urgents (en retard ou imminents)
  const rdvsUrgents = rdvsAfficher.filter(r => {
    const status = getRdvStatus(r);
    return status === 'retard' || status === 'imminent';
  });

  // Rappels personnalisés
  const rappelsPersonnalises = grossesse.rappels_rdv || [];
  const rappelsActifs = rappelsPersonnalises.filter(r => r.statut !== 'annule' && r.statut !== 'realise');

  return (
    <div className="space-y-4">
      {/* Mes rappels personnalisés */}
      {rappelsActifs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50 flex justify-between items-center">
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-500" />
              Mes rappels personnalisés ({rappelsActifs.length})
            </p>
            <Button size="sm" onClick={() => setShowAjouterRappel(true)} className="bg-blue-600">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <div className="divide-y">
            {rappelsActifs.map((rappel) => {
              const dateRappel = new Date(rappel.date_prevue);
              const joursRestants = differenceInDays(dateRappel, new Date());
              const estPasse = joursRestants < 0;
              
              return (
                <div key={rappel.id} className={`p-3 ${estPasse ? 'bg-red-50' : joursRestants <= 2 ? 'bg-amber-50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{rappel.titre}</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {format(dateRappel, 'dd MMMM yyyy à HH:mm', { locale: fr })}
                      </p>
                      {rappel.lieu && <p className="text-xs text-gray-500">{rappel.lieu}</p>}
                      {rappel.documents_requis && rappel.documents_requis.length > 0 && (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {rappel.documents_requis.map((doc, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px]">
                              <FileText className="w-2 h-2 mr-0.5" />{doc}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    {estPasse ? (
                      <Badge className="bg-red-100 text-red-800">En retard</Badge>
                    ) : joursRestants <= 2 ? (
                      <Badge className="bg-amber-100 text-amber-800">{joursRestants}j</Badge>
                    ) : (
                      <Badge variant="outline">{joursRestants}j</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!rappelsActifs.length && (
        <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 mb-3">Aucun rappel personnalisé</p>
          <Button onClick={() => setShowAjouterRappel(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Créer un rappel
          </Button>
        </div>
      )}

      {/* Alerte RDV urgents - Compact */}
      {rdvsUrgents.length > 0 && (
        <Link to={createPageUrl('Teleconsultation')}>
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-4 text-white active:scale-[0.99] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold">{rdvsUrgents.length} RDV à planifier</p>
                <p className="text-xs text-white/80">Appuyez pour prendre RDV</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80" />
            </div>
          </div>
        </Link>
      )}

      {/* Liste des RDV - Compact mobile */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-gradient-to-r from-pink-50 to-purple-50">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-pink-500" />
              Calendrier prénatal
            </p>
            <Badge className="bg-pink-100 text-pink-800 text-xs">SA {semainesGrossesse}</Badge>
          </div>
        </div>

        <div className="divide-y max-h-[400px] overflow-y-auto">
          {rdvsAfficher.map((rdv, index) => {
            const status = getRdvStatus(rdv);
            const rdvDate = getRdvDate(rdv.semaine);
            const Icon = rdv.icone;
            const joursRestants = rdvDate ? differenceInDays(rdvDate, new Date()) : 0;

            return (
              <div key={index} className={`p-3 border-l-4 ${getStatusColor(status)} active:bg-gray-50 transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    rdv.type === 'echographie' ? 'bg-purple-100' : rdv.type === 'vaccin' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      rdv.type === 'echographie' ? 'text-purple-600' : rdv.type === 'vaccin' ? 'text-green-600' : 'text-blue-600'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-medium text-sm text-gray-900 truncate">{rdv.titre}</p>
                      {rdv.urgent && status !== 'effectue' && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 rounded">!</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      SA {rdv.semaine} • {rdvDate && format(rdvDate, 'dd MMM', { locale: fr })}
                      {status !== 'effectue' && joursRestants > 0 && ` • ${joursRestants}j`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {status === 'effectue' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                    {status === 'retard' && <AlertCircle className="w-5 h-5 text-red-500" />}
                    {status === 'imminent' && <Clock className="w-5 h-5 text-amber-500" />}
                    {status !== 'effectue' && (
                      <Link to={createPageUrl('Teleconsultation')}>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info compact */}
      <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-2">
        <Bell className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <p className="text-xs text-blue-700">Rappels automatiques 1 semaine avant chaque RDV</p>
      </div>

      {showAjouterRappel && (
        <AjouterRappelRDV
          grossesse={grossesse}
          onClose={() => setShowAjouterRappel(false)}
        />
      )}
    </div>
  );
}