import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

async function chiffrerAvecCleSymetrique(data, cle) {
  const encoder = new TextEncoder();
  const cleBuf = encoder.encode(cle);
  const dataBuf = encoder.encode(data);
  
  // Utiliser SubtleCrypto pour AES-GCM
  const key = await crypto.subtle.importKey('raw', cleBuf, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuf
  );
  
  return {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(encrypted))
  };
}

async function dechiffrerAvecCleSymetrique(encrypted, cle) {
  const decoder = new TextDecoder();
  const cleBuf = new TextEncoder().encode(cle);
  const iv = new Uint8Array(encrypted.iv);
  const dataBuf = new Uint8Array(encrypted.data);
  
  const key = await crypto.subtle.importKey('raw', cleBuf, 'AES-GCM', false, ['decrypt']);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuf
  );
  
  return decoder.decode(decrypted);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, document_id, file_content, document_name } = await req.json();

    if (!['chiffrer', 'dechiffrer'].includes(action)) {
      return Response.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Générer clé basée sur email + salt
    const cle = `${user.email}-${document_id}-e2e-key`;

    if (action === 'chiffrer') {
      const encrypted = await chiffrerAvecCleSymetrique(file_content, cle);
      
      // Logger l'accès
      await base44.asServiceRole.entities.AuditLog.create({
        user_email: user.email,
        action: 'create',
        entity_type: 'DocumentChiffre',
        entity_id: document_id,
        details: { 
          document_name,
          encryption: 'AES-256-GCM'
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      return Response.json({
        success: true,
        encrypted: {
          iv: encrypted.iv,
          data: encrypted.data,
          algorithm: 'AES-256-GCM'
        }
      });
    }

    if (action === 'dechiffrer') {
      const decrypted = await dechiffrerAvecCleSymetrique(file_content, cle);
      
      // Logger l'accès
      await base44.asServiceRole.entities.AuditLog.create({
        user_email: user.email,
        action: 'read',
        entity_type: 'DocumentChiffre',
        entity_id: document_id,
        details: { 
          document_name,
          decryption: 'AES-256-GCM'
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      return Response.json({
        success: true,
        content: decrypted
      });
    }

  } catch (error) {
    console.error('Erreur chiffrement:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});