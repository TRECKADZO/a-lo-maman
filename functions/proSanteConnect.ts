import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Intégration Pro Santé Connect (PSC)
 * OAuth 2.0 pour authentification professionnels de santé
 * Accès DMP (Dossier Médical Partagé) avec consentement
 */

const PSC_CONFIG = {
  auth_url: 'https://auth.esw.esante.gouv.fr/auth',
  token_url: 'https://auth.esw.esante.gouv.fr/token',
  userinfo_url: 'https://auth.esw.esante.gouv.fr/userinfo',
  client_id: Deno.env.get('PSC_CLIENT_ID'),
  client_secret: Deno.env.get('PSC_CLIENT_SECRET'),
  dmp_api_url: 'https://portail.esante.gouv.fr/api/dmp'
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ 
        error: 'Unauthorized',
        details: 'Authentication required'
      }, { status: 401 });
    }

    const { action, ...data } = await req.json();

    console.log(`[PSC] Action: ${action}`, {
      user: user.email,
      timestamp: new Date().toISOString()
    });

    switch (action) {
      case 'exchange_token':
        return await exchangeToken(data);
      
      case 'access_dmp':
        return await accessDMP(base44, user, data);
      
      case 'verify_consent':
        return await verifyConsent(base44, data);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[PSC] Error:', error);
    return Response.json({ 
      error: 'PSC operation failed',
      details: error.message
    }, { status: 500 });
  }
});

// Échanger le code OAuth contre un access token
async function exchangeToken(data) {
  const { code, redirect_uri } = data;

  if (!PSC_CONFIG.client_id || !PSC_CONFIG.client_secret) {
    throw new Error('PSC credentials not configured. Set PSC_CLIENT_ID and PSC_CLIENT_SECRET.');
  }

  const tokenResponse = await fetch(PSC_CONFIG.token_url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${btoa(`${PSC_CONFIG.client_id}:${PSC_CONFIG.client_secret}`)}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri
    })
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`PSC token exchange failed: ${error}`);
  }

  const tokens = await tokenResponse.json();

  console.log('[PSC] Token exchange successful');

  // Récupérer infos utilisateur (professionnel de santé)
  const userinfoResponse = await fetch(PSC_CONFIG.userinfo_url, {
    headers: {
      'Authorization': `Bearer ${tokens.access_token}`
    }
  });

  const userinfo = await userinfoResponse.json();

  console.log('[PSC] Professional info:', {
    sub: userinfo.sub,
    name: userinfo.name,
    rpps: userinfo.SubjectRefPro?.exercices?.[0]?.nationalId
  });

  return Response.json({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    id_token: tokens.id_token,
    expires_in: tokens.expires_in,
    professional_info: {
      id: userinfo.sub,
      name: userinfo.name,
      given_name: userinfo.given_name,
      family_name: userinfo.family_name,
      rpps: userinfo.SubjectRefPro?.exercices?.[0]?.nationalId,
      specialty: userinfo.SubjectRefPro?.exercices?.[0]?.codeProfession
    }
  });
}

// Accéder au DMP d'une patiente
async function accessDMP(base44, user, data) {
  const { access_token, patient_email } = data;

  // Vérifier que le professionnel a l'autorisation
  const professionnels = await base44.asServiceRole.entities.Professionnel.filter({
    email: user.email
  });

  if (!professionnels || professionnels.length === 0) {
    throw new Error('Not a registered professional');
  }

  // Vérifier consentement de la patiente
  const consentements = await base44.asServiceRole.entities.ConsentementBPPC.filter({
    patient_email,
    policy_type: 'opt-in',
    status: 'active',
    scope: 'document-sharing'
  });

  if (consentements.length === 0) {
    throw new Error('Patient has not consented to DMP access');
  }

  console.log('[PSC] Consent verified for patient:', patient_email);

  // Récupérer identifiant INS de la patiente (requis pour DMP)
  const patientProfile = await base44.asServiceRole.entities.ProfilMaman.filter({
    created_by: patient_email
  });

  if (!patientProfile || !patientProfile[0]?.numero_cmu) {
    throw new Error('Patient INS identifier not found');
  }

  const ins = patientProfile[0].numero_cmu;

  // Appel API DMP (requiert access_token PSC)
  const dmpResponse = await fetch(`${PSC_CONFIG.dmp_api_url}/v1/patients/${ins}/documents`, {
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Accept': 'application/json'
    }
  });

  if (!dmpResponse.ok) {
    const error = await dmpResponse.text();
    throw new Error(`DMP API error: ${error}`);
  }

  const dmpData = await dmpResponse.json();

  console.log('[PSC] DMP access successful:', {
    patient_email,
    documents_count: dmpData.documents?.length || 0
  });

  // Logger l'accès (audit trail obligatoire)
  await base44.asServiceRole.entities.DocumentXDS.create({
    document_id: crypto.randomUUID(),
    patient_email,
    class_code: 'ACCESS_LOG',
    type_code: 'DMP_QUERY',
    title: `Accès DMP par ${user.email}`,
    creation_time: new Date().toISOString(),
    author: {
      name: professionnels[0].nom_complet,
      institution: professionnels[0].structure_sante,
      role: professionnels[0].specialite
    }
  });

  return Response.json({
    success: true,
    patient_ins: ins,
    documents: dmpData.documents || [],
    accessed_by: user.email,
    accessed_at: new Date().toISOString()
  });
}

// Vérifier le consentement d'une patiente
async function verifyConsent(base44, data) {
  const { patient_email, scope } = data;

  const consentements = await base44.asServiceRole.entities.ConsentementBPPC.filter({
    patient_email,
    status: 'active',
    ...(scope && { scope })
  });

  const hasConsent = consentements.length > 0 && consentements.some(c => c.decision === 'permit');

  return Response.json({
    has_consent: hasConsent,
    consentements: consentements.map(c => ({
      policy_type: c.policy_type,
      scope: c.scope,
      decision: c.decision,
      date: c.date_time,
      expiration: c.expiration_date
    }))
  });
}