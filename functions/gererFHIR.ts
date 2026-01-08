import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const { action, centreId, ...data } = await req.json();

    // Récupérer le centre
    const centre = await base44.entities.Clinique.get(centreId);
    if (!centre) {
      return Response.json({ error: 'Centre introuvable' }, { status: 404 });
    }

    const ipAdresse = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'inconnu';

    // Logger l'action
    const auditLog = {
      centre_id: centreId,
      centre_nom: centre.nom,
      type_action: action,
      utilisateur_email: user.email,
      endpoint_url: centre.fhir_endpoint,
      ip_adresse: ipAdresse,
      timestamp: new Date().toISOString(),
    };

    if (action === 'tester_connexion') {
      try {
        const startTime = Date.now();
        const response = await fetch(`${centre.fhir_endpoint}/Patient`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${centre.api_key}`,
            'Accept': 'application/fhir+json',
          },
        });

        const dureeMs = Date.now() - startTime;

        if (response.ok) {
          auditLog.statut = 'succes';
          auditLog.code_reponse = response.status;
          auditLog.details = {
            duree_ms: dureeMs,
            ressource_type: 'Patient',
          };
        } else {
          auditLog.statut = 'echec';
          auditLog.code_reponse = response.status;
          auditLog.details = {
            duree_ms: dureeMs,
            message_erreur: `HTTP ${response.status}`,
          };

          // Créer une alerte si 3 échecs
          const echecs = await base44.entities.AuditFHIR.filter({
            centre_id: centreId,
            statut: 'echec',
            timestamp: { $gte: new Date(Date.now() - 60000).toISOString() } // Dernière minute
          });

          if (echecs.length >= 3) {
            await base44.asServiceRole.entities.AlerteFHIR.create({
              centre_id: centreId,
              centre_nom: centre.nom,
              type_alerte: 'taux_erreur_eleve',
              severite: 'haute',
              description: `Taux d'erreur élevé (${echecs.length} erreurs en 1 minute)`,
              ip_adresse: ipAdresse,
              utilisateur_email: user.email,
              tentatives: echecs.length,
              dernier_incident: new Date().toISOString(),
              actions_recommandees: [
                'Vérifier l\'endpoint FHIR',
                'Valider la clé API',
                'Contacter l\'administrateur technique du centre'
              ]
            });
          }
        }
      } catch (error) {
        auditLog.statut = 'echec';
        auditLog.details = {
          message_erreur: error.message,
        };
      }
    }

    // Sauvegarder le log d'audit
    await base44.asServiceRole.entities.AuditFHIR.create(auditLog);

    return Response.json({
      success: true,
      audit: auditLog,
    });

  } catch (error) {
    console.error('Erreur FHIR:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});