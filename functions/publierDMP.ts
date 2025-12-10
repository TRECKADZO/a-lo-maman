import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Fonction de publication vers DMP nationaux/régionaux
 * Compatible IHE XDS.b, PIX/PDQ et FHIR R4
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      dmp_endpoint, 
      dmp_standard, 
      patient_email, 
      ressources_ids,
      consentement_id 
    } = await req.json();

    // Vérifier le consentement
    const consentement = await base44.asServiceRole.entities.ConsentementBPPC.filter({
      id: consentement_id,
      patient_email: patient_email,
      status: 'active',
      decision: 'permit',
      scope: 'document-sharing'
    });

    if (!consentement || consentement.length === 0) {
      return Response.json({ 
        error: 'Consentement patient requis pour publication DMP' 
      }, { status: 403 });
    }

    // Récupérer les ressources FHIR
    const ressources = await Promise.all(
      ressources_ids.map(id => 
        base44.asServiceRole.entities.RessourceFHIR.filter({ id })
      )
    );

    const ressourcesAPublier = ressources.flat();

    // Bundle FHIR pour transaction IHE XDS
    const bundle = {
      resourceType: 'Bundle',
      type: 'transaction',
      timestamp: new Date().toISOString(),
      entry: ressourcesAPublier.map(r => ({
        fullUrl: `urn:uuid:${r.fhir_id}`,
        resource: r.resource_json,
        request: {
          method: 'POST',
          url: r.resource_type
        }
      }))
    };

    // Publication vers DMP
    const dmpResponse = await fetch(dmp_endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/fhir+json',
        'Accept': 'application/fhir+json'
      },
      body: JSON.stringify(bundle)
    });

    if (!dmpResponse.ok) {
      const errorText = await dmpResponse.text();
      throw new Error(`Erreur DMP: ${errorText}`);
    }

    const result = await dmpResponse.json();

    // Mettre à jour le statut de synchronisation
    for (const ressource of ressourcesAPublier) {
      await base44.asServiceRole.entities.RessourceFHIR.update(ressource.id, {
        sync_status: 'synced',
        external_references: [
          ...(ressource.external_references || []),
          {
            system: dmp_standard,
            endpoint: dmp_endpoint,
            identifier: result.id || uuidv4(),
            synced_at: new Date().toISOString()
          }
        ]
      });
    }

    // Logger l'événement
    await base44.asServiceRole.functions.invoke('fhirLogger', {
      action: 'dmp_publication',
      patient_email,
      dmp_endpoint,
      ressources_count: ressourcesAPublier.length,
      consentement_id,
      success: true
    });

    // Déclencher webhook si configuré
    await base44.asServiceRole.functions.invoke('webhookManager', {
      endpoint: 'trigger',
      data: {
        event_type: 'dmp.published',
        patient_email,
        ressources_ids,
        dmp_endpoint,
        timestamp: new Date().toISOString()
      }
    });

    return Response.json({
      success: true,
      message: 'Ressources publiées vers DMP',
      ressources_publiees: ressourcesAPublier.length,
      dmp_response: result
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      details: 'Erreur lors de la publication vers DMP'
    }, { status: 500 });
  }
});