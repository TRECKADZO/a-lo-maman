import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

function genererCodeUnique() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { action, code_liaison } = await req.json();

    // Action: générer un nouveau code unique
    if (action === 'generer_code') {
      const pros = await base44.asServiceRole.entities.Professionnel.list();
      const proProfil = pros.find(p => p.email === user.email);

      if (!proProfil) {
        return Response.json({ error: 'Profil professionnel introuvable' }, { status: 404 });
      }

      // Générer un code unique
      let nouveauCode;
      let codeExiste = true;
      let tentatives = 0;

      while (codeExiste && tentatives < 10) {
        nouveauCode = genererCodeUnique();
        const prosAvecCode = pros.filter(p => p.code_liaison === nouveauCode);
        codeExiste = prosAvecCode.length > 0;
        tentatives++;
      }

      if (codeExiste) {
        return Response.json({ error: 'Impossible de générer un code unique' }, { status: 500 });
      }

      // Mettre à jour le profil
      await base44.asServiceRole.entities.Professionnel.update(proProfil.id, {
        code_liaison: nouveauCode,
      });

      return Response.json({ 
        success: true, 
        code: nouveauCode 
      });
    }

    // Action: lier un patient (appelé par le patient)
    if (action === 'lier_patient') {
      const pros = await base44.asServiceRole.entities.Professionnel.list();
      const pro = pros.find(p => p.code_liaison === code_liaison);

      if (!pro) {
        return Response.json({ error: 'Code invalide' }, { status: 404 });
      }

      // Récupérer ou créer le dossier médical du patient
      const dossiers = await base44.asServiceRole.entities.DossierMedicalComplet.filter({ 
        patient_email: user.email 
      });
      
      let dossier = dossiers[0];
      const profils = await base44.entities.ProfilMaman.filter({ created_by: user.email });
      const profil = profils[0];

      if (dossier) {
        const professionnels = dossier.professionnels_autorises || [];
        if (!professionnels.includes(pro.email)) {
          await base44.asServiceRole.entities.DossierMedicalComplet.update(dossier.id, {
            professionnels_autorises: [...professionnels, pro.email],
          });
        }
      } else {
        await base44.asServiceRole.entities.DossierMedicalComplet.create({
          patient_email: user.email,
          patient_nom: profil?.display_name || user.full_name || '',
          patient_prenom: '',
          professionnels_autorises: [pro.email],
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

      // Ajouter aux suivis de grossesse actifs
      const grossesses = await base44.asServiceRole.entities.SuiviGrossesse.filter({ 
        created_by: user.email,
        statut: 'en_cours'
      });
      
      for (const grossesse of grossesses) {
        const professionnels = grossesse.professionnels_suivi || [];
        if (!professionnels.includes(pro.email)) {
          await base44.asServiceRole.entities.SuiviGrossesse.update(grossesse.id, {
            professionnels_suivi: [...professionnels, pro.email],
          });
        }
      }

      // Ajouter aux carnets enfants
      const enfants = await base44.asServiceRole.entities.EnfantCarnet.filter({ 
        created_by: user.email 
      });
      
      for (const enfant of enfants) {
        const professionnels = enfant.professionnels_suivi || [];
        if (!professionnels.includes(pro.email)) {
          await base44.asServiceRole.entities.EnfantCarnet.update(enfant.id, {
            professionnels_suivi: [...professionnels, pro.email],
          });
        }
      }

      // Incrémenter le compteur de patients liés
      const count = pro.patients_lies_count || 0;
      await base44.asServiceRole.entities.Professionnel.update(pro.id, {
        patients_lies_count: count + 1,
      });

      return Response.json({ 
        success: true,
        professionnel: {
          nom: pro.nom_complet,
          specialite: pro.specialite,
          email: pro.email,
        }
      });
    }

    return Response.json({ error: 'Action invalide' }, { status: 400 });

  } catch (error) {
    console.error('Erreur gestion code liaison:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});