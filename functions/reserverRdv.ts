// Réservation sécurisée de rendez-vous
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { professionnel_id, date_rdv, type_consultation, motif } = await req.json();

    // Vérifier le professionnel
    const proList = await base44.asServiceRole.entities.Professionnel.filter({ id: professionnel_id });
    const pro = proList[0];

    if (!pro) {
      return Response.json({ error: 'Professionnel non trouvé' }, { status: 404 });
    }

    // Vérifier la disponibilité (pas de double booking)
    const dateRdvObj = new Date(date_rdv);
    const rdvExistants = await base44.asServiceRole.entities.RendezVous.filter({
      professionnel_id: professionnel_id
    });

    const conflit = rdvExistants.find(rdv => {
      if (rdv.statut === 'annule') return false;
      const rdvDate = new Date(rdv.date_rdv);
      const diffMinutes = Math.abs((rdvDate - dateRdvObj) / (1000 * 60));
      return diffMinutes < 30;
    });

    if (conflit) {
      return Response.json({ 
        success: false, 
        error: 'Ce créneau n\'est plus disponible' 
      }, { status: 409 });
    }

    // Créer le RDV
    const rdv = await base44.asServiceRole.entities.RendezVous.create({
      professionnel_id,
      date_rdv,
      type_consultation,
      motif,
      statut: 'planifie',
      created_by: user.email
    });

    // Notifier le professionnel
    await base44.asServiceRole.entities.Notification.create({
      destinataire_email: pro.email,
      type: 'rendez_vous',
      titre: '📅 Nouvelle demande de RDV',
      message: `${user.full_name || user.email} souhaite un rendez-vous le ${dateRdvObj.toLocaleDateString('fr-FR')} à ${dateRdvObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.`,
      action_page: 'MonAgenda',
      priorite: 'haute',
      icone: 'Calendar',
      metadata: { rdv_id: rdv.id }
    });

    // Email au professionnel
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: pro.email,
      subject: '📅 Nouvelle demande de RDV - A\'lo Maman',
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f0fdfa; border-radius: 12px;">
          <h2 style="color: #0f766e;">Nouvelle demande de rendez-vous</h2>
          <div style="background: white; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p><strong>Patient:</strong> ${user.full_name || user.email}</p>
            <p><strong>Date:</strong> ${dateRdvObj.toLocaleDateString('fr-FR')}</p>
            <p><strong>Heure:</strong> ${dateRdvObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Type:</strong> ${type_consultation}</p>
            <p><strong>Motif:</strong> ${motif || 'Non précisé'}</p>
          </div>
          <p style="color: #6b7280;">Connectez-vous à l'application pour confirmer ou reprogrammer ce rendez-vous.</p>
        </div>
      `
    });

    return Response.json({ 
      success: true, 
      rdv_id: rdv.id,
      message: 'Rendez-vous créé avec succès'
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});