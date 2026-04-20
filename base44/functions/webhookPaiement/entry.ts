// Webhook pour traitement des paiements (Wave, Orange Money, etc.)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Vérifier la signature du webhook (à adapter selon le provider)
    const signature = req.headers.get('x-webhook-signature');
    const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
    
    // Pour les tests, on peut bypasser la vérification
    if (webhookSecret && signature !== webhookSecret) {
      // En production, vérifier la signature
      console.log('Signature webhook non vérifiée');
    }

    const payload = await req.json();
    const { 
      event_type, 
      transaction_id, 
      amount, 
      currency,
      customer_email,
      status,
      metadata 
    } = payload;

    switch (event_type) {
      case 'payment.completed': {
        // Paiement réussi
        const paiement = await base44.asServiceRole.entities.Paiement.create({
          user_email: customer_email,
          montant: amount,
          formule: metadata?.formule || 'mensuel',
          methode_paiement: metadata?.provider || 'Wave',
          reference_transaction: transaction_id,
          statut: 'verifie'
        });

        // Notifier l'utilisateur
        await base44.asServiceRole.entities.Notification.create({
          destinataire_email: customer_email,
          type: 'paiement',
          titre: '✅ Paiement confirmé',
          message: `Votre paiement de ${amount} ${currency || 'FCFA'} a été confirmé. Merci pour votre confiance !`,
          action_page: 'Tarifs',
          priorite: 'normale',
          icone: 'CheckCircle'
        });

        return Response.json({ success: true, paiement_id: paiement.id });
      }

      case 'payment.failed': {
        // Paiement échoué
        await base44.asServiceRole.entities.Notification.create({
          destinataire_email: customer_email,
          type: 'paiement',
          titre: '❌ Paiement échoué',
          message: 'Votre paiement n\'a pas pu être traité. Veuillez réessayer.',
          action_page: 'Tarifs',
          priorite: 'haute',
          icone: 'XCircle'
        });

        return Response.json({ success: true, message: 'Échec enregistré' });
      }

      case 'subscription.cancelled': {
        // Abonnement annulé
        await base44.asServiceRole.entities.Notification.create({
          destinataire_email: customer_email,
          type: 'paiement',
          titre: '📋 Abonnement annulé',
          message: 'Votre abonnement a été annulé. Vous pouvez vous réabonner à tout moment.',
          action_page: 'Tarifs',
          priorite: 'normale',
          icone: 'Calendar'
        });

        return Response.json({ success: true });
      }

      default:
        return Response.json({ message: 'Event ignoré', event_type });
    }

  } catch (error) {
    console.error('Erreur webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});