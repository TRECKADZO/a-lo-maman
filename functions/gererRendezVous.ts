import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, data } = await req.json();

    console.log(`📅 Action RDV: ${action}`);

    if (action === 'creer') {
      const rdv = await base44.entities.RendezVousAdministratif.create({
        centre_id: data.centre_id,
        centre_nom: data.centre_nom,
        patient_nom: data.patient_nom,
        patient_email: data.patient_email,
        patient_telephone: data.patient_telephone,
        date_rdv: data.date_rdv,
        type_consultation: data.type_consultation,
        duree_minutes: data.duree_minutes || 30,
        statut: 'planifie',
        source: data.source || 'plateforme'
      });

      console.log(`✅ RDV créé: ${rdv.id}`);
      return Response.json({ success: true, rdv });
    }

    if (action === 'confirmer') {
      await base44.entities.RendezVousAdministratif.update(data.rdv_id, {
        statut: 'confirme'
      });
      return Response.json({ success: true, message: 'RDV confirmé' });
    }

    if (action === 'annuler') {
      await base44.entities.RendezVousAdministratif.update(data.rdv_id, {
        statut: 'annule',
        notes_professionnel: data.raison || 'Annulé'
      });
      return Response.json({ success: true, message: 'RDV annulé' });
    }

    if (action === 'marquer_termine') {
      await base44.entities.RendezVousAdministratif.update(data.rdv_id, {
        statut: 'termine',
        notes_professionnel: data.notes
      });
      return Response.json({ success: true, message: 'RDV marqué comme terminé' });
    }

    return Response.json({ error: 'Action inconnue' }, { status: 400 });

  } catch (error) {
    console.error('❌ Erreur RDV:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});