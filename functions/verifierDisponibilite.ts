// Fonction backend pour vérifier la disponibilité d'un créneau
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { professionnel_id, date, heure, type_consultation } = await req.json();

    // Récupérer le professionnel
    const proList = await base44.asServiceRole.entities.Professionnel.filter({ id: professionnel_id });
    const pro = proList[0];

    if (!pro) {
      return Response.json({ error: 'Professionnel non trouvé' }, { status: 404 });
    }

    const dateRdv = new Date(`${date}T${heure}:00`);
    const jourSemaine = dateRdv.toLocaleDateString('fr-FR', { weekday: 'long' }).toLowerCase();

    // Vérifier les disponibilités configurées
    const disponibilites = pro.disponibilites || [];
    const dispoJour = disponibilites.find(d => d.jour.toLowerCase() === jourSemaine);

    if (!dispoJour) {
      return Response.json({
        disponible: false,
        raison: `Le professionnel ne travaille pas le ${jourSemaine}`
      });
    }

    // Vérifier l'horaire
    const heureDebut = dispoJour.heure_debut;
    const heureFin = dispoJour.heure_fin;

    if (heure < heureDebut || heure >= heureFin) {
      return Response.json({
        disponible: false,
        raison: `Hors des heures de consultation (${heureDebut} - ${heureFin})`
      });
    }

    // Vérifier le type de consultation
    if (dispoJour.types_consultation && !dispoJour.types_consultation.includes(type_consultation)) {
      return Response.json({
        disponible: false,
        raison: `Ce type de consultation n'est pas disponible le ${jourSemaine}`
      });
    }

    // Vérifier les exceptions (congés, fermetures)
    const exceptions = pro.exceptions_agenda || [];
    const exception = exceptions.find(e => e.date === date);

    if (exception) {
      if (exception.type === 'fermeture' || exception.type === 'conges') {
        return Response.json({
          disponible: false,
          raison: exception.type === 'conges' ? 'Le professionnel est en congés' : 'Cabinet fermé ce jour'
        });
      }
    }

    // Vérifier les RDV existants (pas de double booking)
    const rdvExistants = await base44.asServiceRole.entities.RendezVous.filter({
      professionnel_id: professionnel_id
    });

    const conflit = rdvExistants.find(rdv => {
      if (rdv.statut === 'annule') return false;
      const rdvDate = new Date(rdv.date_rdv);
      const diffMinutes = Math.abs((rdvDate - dateRdv) / (1000 * 60));
      return diffMinutes < 30; // Créneaux de 30 min minimum
    });

    if (conflit) {
      return Response.json({
        disponible: false,
        raison: 'Ce créneau est déjà réservé'
      });
    }

    // Tout est OK
    return Response.json({
      disponible: true,
      professionnel: {
        nom: pro.nom_complet,
        specialite: pro.specialite,
        tarif: pro.tarifs_par_type?.[type_consultation] || pro.tarif_consultation
      }
    });

  } catch (error) {
    console.error('Erreur vérification disponibilité:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});