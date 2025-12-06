// Fonction backend pour envoyer des rappels de RDV aux patients
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { rdv_id, type_rappel } = await req.json();

    // Récupérer le RDV
    const rdvList = await base44.asServiceRole.entities.RendezVous.filter({ id: rdv_id });
    const rdv = rdvList[0];

    if (!rdv) {
      return Response.json({ error: 'Rendez-vous non trouvé' }, { status: 404 });
    }

    // Récupérer le professionnel
    const proList = await base44.asServiceRole.entities.Professionnel.filter({ id: rdv.professionnel_id });
    const pro = proList[0];

    const dateRdv = new Date(rdv.date_rdv);
    const dateFormatee = dateRdv.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const heureFormatee = dateRdv.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    const typeConsultation = {
      'cabinet': 'au cabinet',
      'clinique': 'à la clinique',
      'hopital': 'à l\'hôpital',
      'telephone': 'par téléphone',
      'visio': 'en vidéoconsultation'
    }[rdv.type_consultation] || rdv.type_consultation;

    // Créer la notification
    await base44.asServiceRole.entities.Notification.create({
      destinataire_email: rdv.created_by,
      type: 'rappel_rdv',
      titre: `⏰ Rappel: RDV ${type_rappel === '24h' ? 'demain' : 'dans 1h'}`,
      message: `Votre rendez-vous avec ${pro?.nom_complet || 'votre spécialiste'} est prévu le ${dateFormatee} à ${heureFormatee} ${typeConsultation}.`,
      action_page: 'MesRendezVous',
      priorite: type_rappel === '1h' ? 'haute' : 'normale',
      icone: 'Bell',
      metadata: { rdv_id: rdv.id }
    });

    // Envoyer l'email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: rdv.created_by,
      subject: `⏰ Rappel: Votre RDV ${type_rappel === '24h' ? 'demain' : 'dans 1 heure'} - A'lo Maman`,
      body: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(to bottom right, #fdf2f8, #fce7f3); border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 64px; height: 64px; margin: 0 auto; background: linear-gradient(to bottom right, #ec4899, #f43f5e); border-radius: 16px; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px; color: white;">⏰</span>
            </div>
          </div>
          
          <h2 style="color: #be185d; text-align: center; font-size: 24px; margin-bottom: 16px;">
            Rappel de rendez-vous
          </h2>
          
          <div style="background: white; padding: 20px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <p style="color: #374151; margin: 8px 0;">
              <strong>📅 Date:</strong> ${dateFormatee}
            </p>
            <p style="color: #374151; margin: 8px 0;">
              <strong>🕐 Heure:</strong> ${heureFormatee}
            </p>
            <p style="color: #374151; margin: 8px 0;">
              <strong>👨‍⚕️ Professionnel:</strong> ${pro?.nom_complet || 'Votre spécialiste'}
            </p>
            <p style="color: #374151; margin: 8px 0;">
              <strong>📍 Type:</strong> ${typeConsultation}
            </p>
            ${rdv.motif ? `<p style="color: #374151; margin: 8px 0;"><strong>📋 Motif:</strong> ${rdv.motif}</p>` : ''}
          </div>
          
          ${rdv.type_consultation === 'visio' ? `
          <div style="background: #ecfdf5; padding: 16px; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 20px;">
            <p style="color: #065f46; margin: 0; font-size: 14px;">
              <strong>📹 Vidéoconsultation:</strong> Connectez-vous à l'application quelques minutes avant l'heure du RDV pour rejoindre la consultation.
            </p>
          </div>
          ` : ''}
          
          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #f9a8d4;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2025 A'lo Maman - Plateforme de santé maternelle et infantile
            </p>
          </div>
        </div>
      `
    });

    // Mettre à jour le RDV pour marquer le rappel comme envoyé
    const updateData = type_rappel === '24h' 
      ? { rappel_24h_envoye: true }
      : { rappel_1h_envoye: true };
    
    await base44.asServiceRole.entities.RendezVous.update(rdv.id, updateData);

    return Response.json({ 
      success: true, 
      message: `Rappel ${type_rappel} envoyé à ${rdv.created_by}` 
    });

  } catch (error) {
    console.error('Erreur envoi rappel:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});