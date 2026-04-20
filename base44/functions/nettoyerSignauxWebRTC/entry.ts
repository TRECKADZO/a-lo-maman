// Fonction backend pour nettoyer les signaux WebRTC expirés
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Cette fonction peut être appelée par un cron ou manuellement
    // Vérifier l'authentification basique
    const user = await base44.auth.me().catch(() => null);
    
    // Récupérer tous les signaux
    const allSignals = await base44.asServiceRole.entities.SignalWebRTC.list('-created_date', 500);

    const now = new Date();
    let deleted = 0;
    let processed = 0;

    for (const signal of allSignals) {
      // Supprimer les signaux expirés (plus de 10 minutes)
      const signalDate = new Date(signal.created_date);
      const ageMinutes = (now - signalDate) / (1000 * 60);

      if (ageMinutes > 10 || signal.processed) {
        await base44.asServiceRole.entities.SignalWebRTC.delete(signal.id);
        deleted++;
      }
    }

    return Response.json({
      success: true,
      message: `Nettoyage terminé: ${deleted} signaux supprimés sur ${allSignals.length} total`,
      deleted,
      total: allSignals.length
    });

  } catch (error) {
    console.error('Erreur nettoyage:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});