import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Générer un code TOTP simple à 6 chiffres (basique, pas TOTP complet)
function generateTOTPCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Générer des codes de secours
function generateBackupCodes(count = 10) {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push({
      code,
      utilise: false,
      date_utilisation: null
    });
  }
  return codes;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, methode, telephone, code, secret } = await req.json();

    if (!['initialiser', 'valider', 'desactiver', 'verifier'].includes(action)) {
      return Response.json({ error: 'Action invalide' }, { status: 400 });
    }

    // Récupérer la config 2FA existante
    const existing2FA = await base44.entities.Authentification2FA.filter({
      user_email: user.email
    });

    if (action === 'initialiser') {
      const codeTemp = generateTOTPCode();
      const backupCodes = generateBackupCodes();

      const auth2FA = {
        user_email: user.email,
        methode: methode || 'totp',
        telephone: methode === 'sms' ? telephone : null,
        secret_totp: codeTemp,
        active: false,
        codes_secours: backupCodes
      };

      if (existing2FA.length > 0) {
        await base44.entities.Authentification2FA.update(existing2FA[0].id, auth2FA);
      } else {
        await base44.entities.Authentification2FA.create(auth2FA);
      }

      return Response.json({
        success: true,
        code_temporaire: codeTemp,
        codes_secours: backupCodes.map(c => c.code),
        message: 'Configuration initiale créée. Entrez le code pour confirmer.'
      });
    }

    if (action === 'valider') {
      if (!existing2FA.length) {
        return Response.json({ error: 'Configuration 2FA non trouvée' }, { status: 404 });
      }

      const config = existing2FA[0];
      
      // Vérifier le code
      if (code !== config.secret_totp) {
        return Response.json({ error: 'Code incorrect' }, { status: 400 });
      }

      // Activer le 2FA
      await base44.entities.Authentification2FA.update(config.id, {
        active: true,
        date_activation: new Date().toISOString()
      });

      // Logger dans AuditLog
      await base44.asServiceRole.entities.AuditLog.create({
        user_email: user.email,
        action: 'create',
        entity_type: 'Authentification2FA',
        entity_id: config.id,
        details: { methode: config.methode, action: 'activation' },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      return Response.json({
        success: true,
        message: '2FA activé avec succès'
      });
    }

    if (action === 'verifier') {
      if (!existing2FA.length || !existing2FA[0].active) {
        return Response.json({ error: '2FA non configuré' }, { status: 400 });
      }

      const config = existing2FA[0];
      
      // Vérifier code principal
      if (code === config.secret_totp) {
        await base44.entities.Authentification2FA.update(config.id, {
          derniere_verification: new Date().toISOString()
        });

        return Response.json({
          success: true,
          verified: true
        });
      }

      // Vérifier codes de secours
      const backupCodeIndex = config.codes_secours.findIndex(
        c => c.code === code && !c.utilise
      );

      if (backupCodeIndex !== -1) {
        const updatedCodes = config.codes_secours.map((c, idx) =>
          idx === backupCodeIndex
            ? { ...c, utilise: true, date_utilisation: new Date().toISOString() }
            : c
        );

        await base44.entities.Authentification2FA.update(config.id, {
          codes_secours: updatedCodes,
          derniere_verification: new Date().toISOString()
        });

        return Response.json({
          success: true,
          verified: true,
          message: 'Code de secours utilisé. Générez de nouveaux codes.'
        });
      }

      return Response.json({
        success: false,
        verified: false,
        error: 'Code 2FA incorrect'
      }, { status: 401 });
    }

    if (action === 'desactiver') {
      if (!existing2FA.length) {
        return Response.json({ error: '2FA non configuré' }, { status: 404 });
      }

      await base44.entities.Authentification2FA.update(existing2FA[0].id, {
        active: false
      });

      // Logger
      await base44.asServiceRole.entities.AuditLog.create({
        user_email: user.email,
        action: 'delete',
        entity_type: 'Authentification2FA',
        entity_id: existing2FA[0].id,
        details: { action: 'desactivation' },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent'),
        timestamp: new Date().toISOString()
      });

      return Response.json({
        success: true,
        message: '2FA désactivé'
      });
    }

  } catch (error) {
    console.error('Erreur 2FA:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});