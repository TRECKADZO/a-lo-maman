import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Vérifier que c'est une création de RDV
    if (event.type !== 'create' || !data) {
      return Response.json({ success: true, message: 'Pas une création de RDV' });
    }

    const rdv = data;
    const patientEmail = rdv.patient_email || rdv.created_by;
    const professionnelEmail = rdv.professionnel_email;

    if (!patientEmail || !professionnelEmail) {
      return Response.json({ success: true, message: 'Emails manquants' });
    }

    // 1. Lier au dossier médical complet
    const dossiers = await base44.asServiceRole.entities.DossierMedicalComplet.filter({
      patient_email: patientEmail
    });

    if (dossiers.length > 0) {
      const dossier = dossiers[0];
      const professionnels = dossier.professionnels_autorises || [];
      
      if (!professionnels.includes(professionnelEmail)) {
        await base44.asServiceRole.entities.DossierMedicalComplet.update(dossier.id, {
          professionnels_autorises: [...professionnels, professionnelEmail]
        });
      }
    } else {
      // Créer le dossier médical
      const profilsMaman = await base44.asServiceRole.entities.ProfilMaman.filter({
        created_by: patientEmail
      });
      const profil = profilsMaman[0];

      await base44.asServiceRole.entities.DossierMedicalComplet.create({
        patient_email: patientEmail,
        patient_nom: profil?.display_name || '',
        patient_prenom: '',
        professionnels_autorises: [professionnelEmail],
        consentements_partage: {
          cardiologie: true,
          oncologie: true,
          psychiatrie: true,
          rhumatologie: true,
          medecine_generale: true,
          kinesitherapie: true,
        },
      });
    }

    // 2. Lier aux grossesses actives
    const grossesses = await base44.asServiceRole.entities.SuiviGrossesse.filter({
      created_by: patientEmail,
      statut: 'en_cours'
    });

    for (const grossesse of grossesses) {
      const professionnels = grossesse.professionnels_suivi || [];
      if (!professionnels.includes(professionnelEmail)) {
        await base44.asServiceRole.entities.SuiviGrossesse.update(grossesse.id, {
          professionnels_suivi: [...professionnels, professionnelEmail]
        });
      }
    }

    // 3. Lier aux carnets enfants
    const enfants = await base44.asServiceRole.entities.EnfantCarnet.filter({
      created_by: patientEmail
    });

    for (const enfant of enfants) {
      const professionnels = enfant.professionnels_suivi || [];
      if (!professionnels.includes(professionnelEmail)) {
        await base44.asServiceRole.entities.EnfantCarnet.update(enfant.id, {
          professionnels_suivi: [...professionnels, professionnelEmail]
        });
      }
    }

    return Response.json({
      success: true,
      message: `Dossier lié au professionnel ${professionnelEmail}`
    });

  } catch (error) {
    console.error('Erreur liaison dossier:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});