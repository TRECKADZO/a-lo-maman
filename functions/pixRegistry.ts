import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * IHE PIX (Patient Identifier Cross-referencing) Registry
 * Gestion des identités patient multi-domaines
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const url = new URL(req.url);
    const method = req.method;

    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    // POST /pix/register - Enregistrer identité patient dans PIX
    if (url.pathname.includes('/register') && method === 'POST') {
      const body = await req.json();
      const {
        patient_email,
        identifiants_externes,
        traits_identite
      } = body;

      // Vérifier si identité existe déjà
      const existing = await base44.asServiceRole.entities.IdentitePatientPIX.filter({ patient_email });

      if (existing.length > 0) {
        // Mise à jour
        const updated = await base44.asServiceRole.entities.IdentitePatientPIX.update(existing[0].id, {
          identifiants_externes: [
            ...(existing[0].identifiants_externes || []),
            ...identifiants_externes
          ],
          traits_identite: { ...existing[0].traits_identite, ...traits_identite },
          derniere_synchronisation: new Date().toISOString()
        });

        return Response.json({
          success: true,
          message: 'Identité mise à jour',
          master_patient_id: updated.master_patient_id
        });
      }

      // Nouvelle identité
      const masterPatientId = `MPI-CI-${Date.now()}`;
      
      const identite = await base44.asServiceRole.entities.IdentitePatientPIX.create({
        patient_email,
        master_patient_id: masterPatientId,
        identifiants_externes,
        traits_identite,
        statut_verification: 'verifie',
        score_confiance: 100,
        derniere_synchronisation: new Date().toISOString()
      });

      return Response.json({
        success: true,
        message: 'Identité enregistrée dans PIX',
        master_patient_id: masterPatientId
      }, { status: 201 });
    }

    // POST /pix/query - Rechercher identités patient (PIX Query)
    if (url.pathname.includes('/query') && method === 'POST') {
      const body = await req.json();
      const { domaine, identifiant, traits_identite } = body;

      // Recherche par identifiant externe
      if (domaine && identifiant) {
        const identites = await base44.asServiceRole.entities.IdentitePatientPIX.filter({
          'identifiants_externes': {
            $elemMatch: {
              domaine,
              identifiant
            }
          }
        });

        if (identites.length > 0) {
          return Response.json({
            found: true,
            master_patient_id: identites[0].master_patient_id,
            patient_email: identites[0].patient_email,
            identifiants_externes: identites[0].identifiants_externes
          });
        }
      }

      // Recherche floue par traits d'identité
      if (traits_identite) {
        const allIdentities = await base44.asServiceRole.entities.IdentitePatientPIX.list();
        
        // Algorithme simple de matching (à améliorer avec Levenshtein distance)
        const matches = allIdentities.filter(identite => {
          const traits = identite.traits_identite || {};
          let score = 0;

          if (traits.nom?.toLowerCase() === traits_identite.nom?.toLowerCase()) score += 30;
          if (traits.prenom?.toLowerCase() === traits_identite.prenom?.toLowerCase()) score += 30;
          if (traits.date_naissance === traits_identite.date_naissance) score += 40;

          return score >= 60; // Seuil de confiance
        }).map(identite => ({
          master_patient_id: identite.master_patient_id,
          patient_email: identite.patient_email,
          score_confiance: 85, // Score simplifié
          traits_identite: identite.traits_identite
        }));

        return Response.json({
          found: matches.length > 0,
          matches
        });
      }

      return Response.json({ found: false });
    }

    // POST /pix/link - Lier deux identités (même patient, domaines différents)
    if (url.pathname.includes('/link') && method === 'POST') {
      const body = await req.json();
      const { master_patient_id, nouveau_identifiant } = body;

      const identites = await base44.asServiceRole.entities.IdentitePatientPIX.filter({ master_patient_id });

      if (identites.length === 0) {
        return Response.json({ error: 'Patient not found' }, { status: 404 });
      }

      const updated = await base44.asServiceRole.entities.IdentitePatientPIX.update(identites[0].id, {
        identifiants_externes: [
          ...(identites[0].identifiants_externes || []),
          {
            ...nouveau_identifiant,
            date_creation: new Date().toISOString()
          }
        ],
        derniere_synchronisation: new Date().toISOString()
      });

      return Response.json({
        success: true,
        message: 'Identifiants liés avec succès',
        master_patient_id
      });
    }

    return Response.json({
      message: 'A\'lo Maman PIX Registry',
      endpoints: [
        'POST /pix/register - Register patient identity',
        'POST /pix/query - Query patient identity',
        'POST /pix/link - Link patient identifiers'
      ]
    });

  } catch (error) {
    console.error('PIX Registry Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});