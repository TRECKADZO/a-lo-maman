// Fonction backend pour générer un compte-rendu de consultation avec l'IA
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { rdv_id, notes_consultation, symptomes, diagnostic, prescriptions } = await req.json();

    // Récupérer le RDV
    const rdvList = await base44.asServiceRole.entities.RendezVous.filter({ id: rdv_id });
    const rdv = rdvList[0];

    if (!rdv) {
      return Response.json({ error: 'Rendez-vous non trouvé' }, { status: 404 });
    }

    // Récupérer les infos du professionnel
    const proList = await base44.asServiceRole.entities.Professionnel.filter({ email: user.email });
    const pro = proList[0];

    if (!pro) {
      return Response.json({ error: 'Profil professionnel non trouvé' }, { status: 404 });
    }

    // Récupérer les infos de la patiente
    const patientProfiles = await base44.asServiceRole.entities.ProfilMaman.filter({ created_by: rdv.created_by });
    const patient = patientProfiles[0];

    // Générer le compte-rendu avec l'IA
    const prompt = `
Tu es un assistant médical professionnel. Génère un compte-rendu de consultation structuré et professionnel basé sur les informations suivantes:

**Informations de la consultation:**
- Date: ${new Date(rdv.date_rdv).toLocaleDateString('fr-FR')}
- Type: ${rdv.type_consultation}
- Motif initial: ${rdv.motif || 'Non précisé'}

**Notes du praticien:**
${notes_consultation || 'Aucune note'}

**Symptômes rapportés:**
${symptomes || 'Non précisés'}

**Diagnostic:**
${diagnostic || 'En cours d\'évaluation'}

**Prescriptions:**
${prescriptions || 'Aucune'}

**Informations patient:**
- Allergies: ${patient?.allergies?.join(', ') || 'Aucune connue'}
- Antécédents: ${patient?.maladies_chroniques?.join(', ') || 'Aucun connu'}

Génère un compte-rendu professionnel en français, structuré avec les sections:
1. Motif de consultation
2. Anamnèse et symptômes
3. Examen clinique (si applicable)
4. Diagnostic/Impression clinique
5. Plan de traitement
6. Recommandations et suivi

Le ton doit être médical mais compréhensible.
`;

    const response = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          compte_rendu: { type: 'string' },
          resume_patient: { type: 'string', description: 'Résumé simplifié pour le patient' },
          recommandations: { type: 'array', items: { type: 'string' } },
          prochain_rdv_suggere: { type: 'string' }
        }
      }
    });

    // Mettre à jour le RDV avec les notes
    await base44.asServiceRole.entities.RendezVous.update(rdv.id, {
      notes_professionnel: response.compte_rendu,
      statut: 'termine'
    });

    // Créer une notification pour la patiente
    await base44.asServiceRole.entities.Notification.create({
      destinataire_email: rdv.created_by,
      type: 'compte_rendu',
      titre: '📋 Compte-rendu disponible',
      message: `Le compte-rendu de votre consultation du ${new Date(rdv.date_rdv).toLocaleDateString('fr-FR')} avec ${pro.nom_complet} est maintenant disponible.`,
      action_page: 'MesRendezVous',
      priorite: 'normale',
      icone: 'FileText'
    });

    return Response.json({
      success: true,
      compte_rendu: response.compte_rendu,
      resume_patient: response.resume_patient,
      recommandations: response.recommandations,
      prochain_rdv_suggere: response.prochain_rdv_suggere
    });

  } catch (error) {
    console.error('Erreur génération compte-rendu:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});