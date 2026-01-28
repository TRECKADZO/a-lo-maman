import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create' || !data) {
      return Response.json({ success: true, message: 'Pas une création de RDV' });
    }

    const rdv = data;
    const patientEmail = rdv.patient_email || rdv.created_by;
    const professionnelEmail = rdv.professionnel_email;
    const professionnelId = rdv.professionnel_id;

    if (!patientEmail || !professionnelEmail || !professionnelId) {
      console.log('⚠️ RDV incomplet - emails ou ID manquants');
      return Response.json({ success: true, message: 'RDV incomplet' });
    }

    // ✅ Vérification: Le professionnel existe et l'email correspond
    const professionnelsList = await base44.asServiceRole.entities.Professionnel.filter({
      id: professionnelId,
      email: professionnelEmail
    });

    if (professionnelsList.length === 0) {
      console.error(`❌ Email ${professionnelEmail} ne correspond pas au professionnel ${professionnelId}`);
      return Response.json({
        error: 'Professionnel invalide'
      }, { status: 403 });
    }

    // Lier au dossier médical avec CONSENTEMENTS RESTREINTS
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

        // 📋 LOG D'AUDIT
        try {
          await base44.asServiceRole.entities.AuditLog.create({
            user_email: 'system',
            user_role: 'system',
            action: 'update',
            entity_type: 'DossierMedicalComplet',
            entity_id: dossier.id,
            details: {
              event: 'professionnel_added',
              professionnel_email: professionnelEmail,
              trigger: 'appointment_created'
            }
          });
        } catch (auditError) {
          console.warn('Audit log non disponible');
        }
      }
    } else {
      // Créer avec CONSENTEMENTS RESTREINTS (medecine_generale seulement)
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
          cardiologie: false,
          oncologie: false,
          psychiatrie: false,
          rhumatologie: false,
          medecine_generale: true,
          kinesitherapie: false,
        },
      });

      try {
        await base44.asServiceRole.entities.AuditLog.create({
          user_email: 'system',
          user_role: 'system',
          action: 'create',
          entity_type: 'DossierMedicalComplet',
          details: {
            event: 'dossier_created_for_appointment',
            patient_email: patientEmail,
            professionnel_email: professionnelEmail
          }
        });
      } catch (auditError) {
        console.warn('Audit log non disponible');
      }
    }

    // Lier aux grossesses actives
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

    // Lier aux carnets enfants
    const enfants = await base44.asServiceRole.entities.EnfantCarnet.filter({
      created_by: patientEmail
    });

    for (const enfant of enfants) {
      const professionnels = enfant.professionnels_suivi || [];
      if (!professionnels.includes(professionnelEmail)) {
        await base44.asServiceRole.entities.EnfantCarnet.update(enfant.id, {
          professionnels_suivi: [...professionnels, professionnelEmail]
        });

        try {
          await base44.asServiceRole.entities.AuditLog.create({
            user_email: 'system',
            user_role: 'system',
            action: 'update',
            entity_type: 'EnfantCarnet',
            entity_id: enfant.id,
            details: {
              event: 'professionnel_added',
              professionnel_email: professionnelEmail
            }
          });
        } catch (auditError) {
          console.warn('Audit log non disponible');
        }
      }
    }

    return Response.json({
      success: true,
      message: `Dossiers liés au professionnel ${professionnelEmail}`,
      audit_logged: true
    });

  } catch (error) {
    console.error('Erreur liaison dossier:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});