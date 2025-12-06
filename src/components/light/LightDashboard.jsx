import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { LightCard, LightBadge, LightLoader, LightButton } from './LightCard';
import { differenceInWeeks, differenceInMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function LightDashboard() {
  const [user, setUser] = useState(null);
  const [grossesse, setGrossesse] = useState(null);
  const [enfants, setEnfants] = useState([]);
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        const [grossesseList, enfantsList, rdvsList] = await Promise.all([
          base44.entities.SuiviGrossesse.filter({ grossesse_active: true }).catch(() => []),
          base44.entities.EnfantCarnet.list().catch(() => []),
          base44.entities.RendezVous.filter({ statut: 'confirme' }).catch(() => [])
        ]);

        setGrossesse(grossesseList[0] || null);
        setEnfants(enfantsList || []);
        setRdvs((rdvsList || []).filter(r => new Date(r.date_rdv) > new Date()).slice(0, 3));
      } catch (e) {
        console.error('Erreur chargement:', e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LightLoader text="Chargement..." />;
  }

  const calculateGrossesseWeeks = () => {
    if (!grossesse) return null;
    const ddr = new Date(grossesse.date_derniere_regle);
    return differenceInWeeks(new Date(), ddr);
  };

  const weeks = calculateGrossesseWeeks();

  return (
    <div className="p-3 space-y-3 max-w-lg mx-auto">
      {/* Header simple */}
      <div className="text-center py-2">
        <p className="text-lg font-bold text-gray-800">
          Bonjour {user?.full_name?.split(' ')[0] || 'vous'} 👋
        </p>
      </div>

      {/* Grossesse */}
      {grossesse && (
        <Link to={createPageUrl('Grossesse')}>
          <LightCard className="bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-pink-600 font-medium">Grossesse</p>
                <p className="text-xl font-bold text-pink-800">{weeks} SA</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Accouchement prévu</p>
                <p className="text-sm font-medium">
                  {format(new Date(grossesse.date_accouchement_prevue), 'dd MMM', { locale: fr })}
                </p>
              </div>
            </div>
            {/* Barre progression simple */}
            <div className="mt-2 h-2 bg-pink-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500 rounded-full"
                style={{ width: `${Math.min((weeks / 40) * 100, 100)}%` }}
              />
            </div>
          </LightCard>
        </Link>
      )}

      {/* Enfants */}
      {enfants.length > 0 && (
        <LightCard>
          <p className="font-medium text-sm mb-2">Mes enfants</p>
          <div className="space-y-2">
            {enfants.slice(0, 3).map(enfant => {
              const ageMois = differenceInMonths(new Date(), new Date(enfant.date_naissance));
              return (
                <Link 
                  key={enfant.id} 
                  to={createPageUrl('Enfants') + `?enfantId=${enfant.id}`}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {enfant.prenom[0]}
                    </div>
                    <span className="font-medium text-sm">{enfant.prenom}</span>
                  </div>
                  <LightBadge color="blue">
                    {ageMois < 12 ? `${ageMois} mois` : `${Math.floor(ageMois / 12)} an(s)`}
                  </LightBadge>
                </Link>
              );
            })}
          </div>
          {enfants.length > 3 && (
            <Link to={createPageUrl('Enfants')} className="text-xs text-pink-600 mt-2 block">
              Voir tous ({enfants.length})
            </Link>
          )}
        </LightCard>
      )}

      {/* RDV */}
      {rdvs.length > 0 && (
        <LightCard>
          <p className="font-medium text-sm mb-2">Prochains RDV</p>
          <div className="space-y-2">
            {rdvs.map(rdv => (
              <div key={rdv.id} className="flex items-center justify-between p-2 bg-teal-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">{rdv.motif || 'Consultation'}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(rdv.date_rdv), 'dd/MM à HH:mm', { locale: fr })}
                  </p>
                </div>
                <LightBadge color="green">{rdv.type_consultation}</LightBadge>
              </div>
            ))}
          </div>
        </LightCard>
      )}

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-2">
        <Link to={createPageUrl('AssistantIA')}>
          <LightButton variant="primary" className="w-full">
            💬 Assistant IA
          </LightButton>
        </Link>
        <Link to={createPageUrl('Teleconsultation')}>
          <LightButton variant="secondary" className="w-full">
            🩺 Spécialistes
          </LightButton>
        </Link>
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-4 gap-2 pt-2">
        {[
          { icon: '🤰', label: 'Grossesse', page: 'Grossesse' },
          { icon: '👶', label: 'Enfants', page: 'Enfants' },
          { icon: '💊', label: 'Contraception', page: 'Contraception' },
          { icon: '📅', label: 'RDV', page: 'MesRendezVous' },
        ].map(item => (
          <Link 
            key={item.page}
            to={createPageUrl(item.page)}
            className="flex flex-col items-center gap-1 p-2 bg-gray-50 rounded-lg text-center"
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs text-gray-600">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}