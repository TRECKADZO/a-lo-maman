import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

/**
 * Gestionnaire de webhooks pour notifier les cliniques en temps réel
 * Events supportés : patient.created, appointment.created, document.uploaded, etc.
 */

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Service role pour les webhooks système
    const { action, data } = await req.json();

    console.log(`[Webhook Manager] Action: ${action}`, {
      timestamp: new Date().toISOString()
    });

    switch (action) {
      case 'register':
        return await registerWebhook(base44, data);
      
      case 'unregister':
        return await unregisterWebhook(base44, data);
      
      case 'list':
        return await listWebhooks(base44, data);
      
      case 'trigger':
        return await triggerWebhook(base44, data);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[Webhook Manager] Error:', error);
    return Response.json({ 
      error: 'Webhook operation failed',
      details: error.message
    }, { status: 500 });
  }
});

// Enregistrer un nouveau webhook
async function registerWebhook(base44, data) {
  const { clinique_id, url, events, secret } = data;

  // Validation URL HTTPS
  if (!url.startsWith('https://')) {
    throw new Error('Webhook URL must use HTTPS (TLS 1.3 required)');
  }

  // Générer un secret si non fourni
  const webhookSecret = secret || generateSecret();

  const webhook = await base44.asServiceRole.entities.Clinique.update(clinique_id, {
    webhooks: [
      {
        id: crypto.randomUUID(),
        url,
        events,
        secret: webhookSecret,
        active: true,
        created_at: new Date().toISOString()
      }
    ]
  });

  console.log('[Webhook] Registered:', {
    clinique_id,
    url,
    events: events.join(', ')
  });

  return Response.json({
    success: true,
    webhook: {
      url,
      events,
      secret: webhookSecret,
      message: 'Webhook registered successfully. Store the secret securely to verify webhook signatures.'
    }
  });
}

// Supprimer un webhook
async function unregisterWebhook(base44, data) {
  const { clinique_id, webhook_id } = data;

  const clinique = await base44.asServiceRole.entities.Clinique.filter({ id: clinique_id });
  if (!clinique || clinique.length === 0) {
    throw new Error('Clinique not found');
  }

  const webhooks = (clinique[0].webhooks || []).filter(wh => wh.id !== webhook_id);
  
  await base44.asServiceRole.entities.Clinique.update(clinique_id, { webhooks });

  console.log('[Webhook] Unregistered:', { clinique_id, webhook_id });

  return Response.json({
    success: true,
    message: 'Webhook deleted successfully'
  });
}

// Lister les webhooks d'une clinique
async function listWebhooks(base44, data) {
  const { clinique_id } = data;

  const clinique = await base44.asServiceRole.entities.Clinique.filter({ id: clinique_id });
  if (!clinique || clinique.length === 0) {
    throw new Error('Clinique not found');
  }

  const webhooks = clinique[0].webhooks || [];

  return Response.json({
    success: true,
    webhooks: webhooks.map(wh => ({
      id: wh.id,
      url: wh.url,
      events: wh.events,
      active: wh.active,
      created_at: wh.created_at
    }))
  });
}

// Déclencher un webhook (appelé par d'autres services)
async function triggerWebhook(base44, data) {
  const { event, payload, clinique_id } = data;

  console.log('[Webhook] Triggering event:', event, { clinique_id });

  // Récupérer les webhooks de la clinique
  const clinique = await base44.asServiceRole.entities.Clinique.filter({ id: clinique_id });
  if (!clinique || clinique.length === 0) {
    console.warn('[Webhook] No clinique found for ID:', clinique_id);
    return Response.json({ success: true, sent: 0 });
  }

  const webhooks = (clinique[0].webhooks || [])
    .filter(wh => wh.active && wh.events.includes(event));

  if (webhooks.length === 0) {
    console.log('[Webhook] No active webhooks for event:', event);
    return Response.json({ success: true, sent: 0 });
  }

  // Envoyer le webhook à chaque URL
  const results = await Promise.allSettled(
    webhooks.map(webhook => sendWebhook(webhook, event, payload))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log('[Webhook] Delivery results:', {
    event,
    clinique_id,
    successful,
    failed
  });

  return Response.json({
    success: true,
    sent: successful,
    failed,
    details: results.map((r, i) => ({
      url: webhooks[i].url,
      status: r.status,
      error: r.status === 'rejected' ? r.reason.message : null
    }))
  });
}

// Envoyer un webhook HTTP POST
async function sendWebhook(webhook, event, payload) {
  const { url, secret } = webhook;

  const webhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data: payload
  };

  // Générer signature HMAC SHA-256
  const signature = await generateSignature(JSON.stringify(webhookPayload), secret);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Alomaman-Signature': signature,
      'X-Alomaman-Event': event,
      'User-Agent': 'Alomaman-Webhook/1.0'
    },
    body: JSON.stringify(webhookPayload),
  });

  if (!response.ok) {
    throw new Error(`Webhook delivery failed: ${response.status} ${response.statusText}`);
  }

  console.log('[Webhook] Delivered successfully:', { url, event });

  return response;
}

// Générer un secret aléatoire
function generateSecret() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Générer signature HMAC SHA-256
async function generateSignature(payload, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}