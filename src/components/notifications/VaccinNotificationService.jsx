import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { addMonths, addDays, isBefore, differenceInDays, startOfDay } from 'date-fns';

// Calendrier vaccinal
const CALENDRIER_VACCINAL = [
  { nom: 'BCG', age_mois: 0 },
  { nom: 'Polio 0 (VPO)', age_mois: 0 },
  { nom: 'Hépatite B', age_mois: 0 },
  { nom: 'Pentavalent 1', age_mois: 2 },
  { nom: 'Polio 1 (VPO)', age_mois: 2 },
  { nom: 'Pneumocoque 1', age_mois: 2 },
  { nom: 'Rotavirus 1', age_mois: 2 },
  { nom: 'Pentavalent 2', age_mois: 3 },
  { nom: 'Polio 2 (VPO)', age_mois: 3 },
  { nom: 'Pneumocoque 2', age_mois: 3 },
  { nom: 'Rotavirus 2', age_mois: 3 },
  { nom: 'Pentavalent 3', age_mois: 4 },
  { nom: 'Polio 3 (VPO)', age_mois: 4 },
  { nom: 'Pneumocoque 3', age_mois: 4 },
  { nom: 'VPI', age_mois: 4 },
  { nom: 'Rougeole-Rubéole 1', age_mois: 9 },
  { nom: 'Fièvre Jaune', age_mois: 9 },
  { nom: 'Rougeole-Rubéole 2', age_mois: 15 },
  { nom: 'DTC Rappel', age_mois: 18 },
];

export default function VaccinNotificationService() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const { data: enfants } = useQuery({
    queryKey: ['enfants', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.EnfantCarnet.filter({ created_by: user.email });
    },
    enabled: !!user,
    refetchInterval: 1000 * 60 * 60 * 24, // Vérifier une fois par jour
  });

  useEffect(() => {
    if (!enfants || !user) return;

    const verifierVaccins = async () => {
      const aujourdhui = startOfDay(new Date());

      for (const enfant of enfants) {
        const calendrierPrevu = CALENDRIER_VACCINAL.map(vaccin => ({
          ...vaccin,
          date_prevue: addMonths(new Date(enfant.date_naissance), vaccin.age_mois),
        }));

        const vaccinsAdministres = enfant.vaccins || [];

        for (const vaccinPrevu of calendrierPrevu) {
          // Vérifier si le vaccin a déjà été administré
          const dejaFait = vaccinsAdministres.some(v => 
            v.nom_vaccin.toLowerCase().includes(vaccinPrevu.nom.toLowerCase()) ||
            vaccinPrevu.nom.toLowerCase().includes(v.nom_vaccin.toLowerCase())
          );

          if (dejaFait) continue;

          const datePrevue = startOfDay(vaccinPrevu.date_prevue);
          const dateButoir = addDays(datePrevue, 30);
          const joursAvant = differenceInDays(datePrevue, aujourdhui);
          const joursRetard = differenceInDays(aujourdhui, datePrevue);

          // Notification 7 jours avant
          if (joursAvant === 7) {
            await creerNotification({
              user,
              enfant,
              vaccin: vaccinPrevu,
              type: 'rappel_7j',
              titre: `📅 Vaccin dans 7 jours - ${enfant.prenom}`,
              message: `Le vaccin "${vaccinPrevu.nom}" pour ${enfant.prenom} est prévu dans 7 jours. Pensez à prendre rendez-vous.`,
              priorite: 'normale'
            });
          }

          // Notification le jour J
          if (joursAvant === 0) {
            await creerNotification({
              user,
              enfant,
              vaccin: vaccinPrevu,
              type: 'jour_j',
              titre: `🔔 Vaccin aujourd'hui - ${enfant.prenom}`,
              message: `C'est aujourd'hui le jour du vaccin "${vaccinPrevu.nom}" pour ${enfant.prenom}. N'oubliez pas !`,
              priorite: 'haute'
            });
          }

          // Notification de retard (tous les 7 jours)
          if (joursRetard > 0 && joursRetard % 7 === 0 && isBefore(aujourdhui, dateButoir)) {
            await creerNotification({
              user,
              enfant,
              vaccin: vaccinPrevu,
              type: 'retard',
              titre: `⚠️ Vaccin en retard - ${enfant.prenom}`,
              message: `Le vaccin "${vaccinPrevu.nom}" pour ${enfant.prenom} est en retard de ${joursRetard} jours. Prenez rendez-vous rapidement.`,
              priorite: joursRetard > 30 ? 'urgente' : 'haute'
            });
          }

          // Alerte critique après 30 jours
          if (joursRetard > 30 && joursRetard % 14 === 0) {
            await creerNotification({
              user,
              enfant,
              vaccin: vaccinPrevu,
              type: 'critique',
              titre: `🚨 URGENT - Vaccin très en retard`,
              message: `Le vaccin "${vaccinPrevu.nom}" pour ${enfant.prenom} est en retard de ${joursRetard} jours. Consultez immédiatement un professionnel de santé.`,
              priorite: 'urgente'
            });
          }
        }

        // Vérifier les rappels des vaccins déjà administrés
        for (const vaccin of vaccinsAdministres) {
          if (!vaccin.prochain_rappel) continue;

          const dateRappel = startOfDay(new Date(vaccin.prochain_rappel));
          const joursAvant = differenceInDays(dateRappel, aujourdhui);
          const joursRetard = differenceInDays(aujourdhui, dateRappel);

          // Notification 7 jours avant le rappel
          if (joursAvant === 7) {
            await creerNotification({
              user,
              enfant,
              vaccin: { nom: `${vaccin.nom_vaccin} (rappel)`, date_prevue: dateRappel },
              type: 'rappel_7j',
              titre: `📅 Rappel vaccin dans 7 jours - ${enfant.prenom}`,
              message: `Le rappel du vaccin "${vaccin.nom_vaccin}" pour ${enfant.prenom} est prévu dans 7 jours.`,
              priorite: 'normale'
            });
          }

          // Notification 1 jour avant
          if (joursAvant === 1) {
            await creerNotification({
              user,
              enfant,
              vaccin: { nom: `${vaccin.nom_vaccin} (rappel)`, date_prevue: dateRappel },
              type: 'rappel_1j',
              titre: `⏰ Rappel vaccin demain - ${enfant.prenom}`,
              message: `Le rappel du vaccin "${vaccin.nom_vaccin}" pour ${enfant.prenom} est prévu demain.`,
              priorite: 'haute'
            });
          }

          // Notification si en retard
          if (joursRetard > 0 && joursRetard <= 7) {
            await creerNotification({
              user,
              enfant,
              vaccin: { nom: `${vaccin.nom_vaccin} (rappel)`, date_prevue: dateRappel },
              type: 'rappel_retard',
              titre: `⚠️ Rappel vaccin en retard - ${enfant.prenom}`,
              message: `Le rappel du vaccin "${vaccin.nom_vaccin}" pour ${enfant.prenom} est en retard de ${joursRetard} jour(s).`,
              priorite: 'haute'
            });
          }
        }
      }
    };

    verifierVaccins();
  }, [enfants, user]);

  return null;
}

async function creerNotification({ user, enfant, vaccin, type, titre, message, priorite }) {
  try {
    // Vérifier si une notification similaire existe déjà (moins de 24h)
    const notificationsExistantes = await base44.entities.Notification.filter({
      destinataire_email: user.email,
      'metadata.enfant_id': enfant.id,
      'metadata.vaccin_nom': vaccin.nom,
      'metadata.type': type
    });

    const notifRecente = notificationsExistantes.find(n => {
      const dateCreation = new Date(n.created_date);
      const diffHeures = (new Date() - dateCreation) / (1000 * 60 * 60);
      return diffHeures < 24;
    });

    if (notifRecente) return; // Ne pas créer de doublon

    await base44.entities.Notification.create({
      destinataire_email: user.email,
      type: 'vaccin_rappel',
      titre,
      message,
      priorite,
      icone: 'Syringe',
      action_page: 'Enfants',
      action_params: { 
        enfantId: enfant.id, 
        onglet: 'vaccins' 
      },
      metadata: {
        enfant_id: enfant.id,
        enfant_prenom: enfant.prenom,
        vaccin_nom: vaccin.nom,
        date_prevue: vaccin.date_prevue,
        type
      }
    });
  } catch (error) {
    console.error('Erreur création notification vaccin:', error);
  }
}