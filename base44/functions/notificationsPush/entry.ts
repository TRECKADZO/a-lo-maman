import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { type, data } = await req.json();

    switch (type) {
      case 'rappel_rdv':
        return await envoyerRappelRDV(base44, data);
      case 'resultat_medical':
        return await envoyerAlerteResultat(base44, data);
      case 'notification_dmp':
        return await envoyerNotificationDMP(base44, data);
      case 'alerte_risque':
        return await envoyerAlerteRisque(base44, data);
      default:
        return Response.json({ error: 'Type de notification inconnu' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function envoyerRappelRDV(base44, data) {
  const { rdv_id } = data;
  
  const rdv = (await base44.asServiceRole.entities.RendezVous.filter({ id: rdv_id }))[0];
  if (!rdv) {
    return Response.json({ error: 'RDV introuvable' }, { status: 404 });
  }

  const dateRdv = new Date(rdv.date_rdv);
  const maintenant = new Date();
  const heuresRestantes = Math.round((dateRdv - maintenant) / (1000 * 60 * 60));

  let message = '';
  if (heuresRestantes === 24) {
    message = `📅 Rappel : Vous avez un rendez-vous demain à ${dateRdv.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (heuresRestantes === 1) {
    message = `⏰ Votre rendez-vous est dans 1 heure`;
  } else {
    message = `📋 Rendez-vous confirmé pour le ${dateRdv.toLocaleDateString('fr-FR')}`;
  }

  await base44.asServiceRole.entities.Notification.create({
    user_email: rdv.created_by,
    type: 'rappel_rdv',
    titre: 'Rappel de rendez-vous',
    message,
    priority: 'haute',
    lien: `/pages/MesRendezVous`,
    metadata: { rdv_id },
    lu: false
  });

  // Email optionnel
  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: rdv.created_by,
      subject: 'Rappel de rendez-vous - A\'lo Maman',
      body: `${message}\n\nType: ${rdv.type_consultation}\nMotif: ${rdv.motif || 'Consultation'}`
    });
  } catch (e) {
    console.error('Email error:', e);
  }

  return Response.json({ success: true, notification_envoyee: true });
}

async function envoyerAlerteResultat(base44, data) {
  const { patient_email, type_resultat, details } = data;

  const message = type_resultat === 'analyse' 
    ? '🔬 Vos résultats d\'analyses sont disponibles'
    : type_resultat === 'echographie'
    ? '🖼️ Votre échographie est disponible'
    : '📄 Nouveaux résultats médicaux disponibles';

  await base44.asServiceRole.entities.Notification.create({
    user_email: patient_email,
    type: 'resultat_medical',
    titre: 'Résultats médicaux',
    message,
    priority: 'haute',
    lien: '/pages/MonEspaceSante',
    metadata: { type_resultat, details },
    lu: false
  });

  try {
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: patient_email,
      subject: 'Résultats disponibles - A\'lo Maman',
      body: `${message}\n\nConnectez-vous pour consulter vos résultats.`
    });
  } catch (e) {
    console.error('Email error:', e);
  }

  return Response.json({ success: true, notification_envoyee: true });
}

async function envoyerNotificationDMP(base44, data) {
  const { patient_email, action, document_title } = data;

  let message = '';
  if (action === 'publication') {
    message = `✅ Document "${document_title}" publié dans votre DMP`;
  } else if (action === 'mise_a_jour') {
    message = `🔄 Mise à jour de "${document_title}" dans votre DMP`;
  } else {
    message = `📋 Nouvelle activité sur votre DMP`;
  }

  await base44.asServiceRole.entities.Notification.create({
    user_email: patient_email,
    type: 'dmp',
    titre: 'Dossier Médical Partagé',
    message,
    priority: 'moyenne',
    lien: '/pages/Interoperabilite',
    metadata: { action, document_title },
    lu: false
  });

  return Response.json({ success: true, notification_envoyee: true });
}

async function envoyerAlerteRisque(base44, data) {
  const { patient_email, type_risque, niveau, details } = data;

  const icons = {
    'pre_eclampsie': '⚠️',
    'diabete_gestationnel': '🩺',
    'accouchement_premature': '🚨',
    'retard_croissance': '📊'
  };

  const message = `${icons[type_risque] || '⚠️'} Alerte : ${details}`;

  await base44.asServiceRole.entities.Notification.create({
    user_email: patient_email,
    type: 'alerte_risque',
    titre: `Alerte ${type_risque.replace(/_/g, ' ')}`,
    message,
    priority: niveau === 'eleve' || niveau === 'critique' ? 'urgente' : 'haute',
    lien: '/pages/Grossesse',
    metadata: { type_risque, niveau, details },
    lu: false
  });

  // Email urgent pour risques élevés
  if (niveau === 'eleve' || niveau === 'critique') {
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: patient_email,
        subject: '⚠️ ALERTE MÉDICALE - A\'lo Maman',
        body: `${message}\n\nNiveau: ${niveau}\n\nVeuillez contacter votre médecin rapidement.`
      });
    } catch (e) {
      console.error('Email error:', e);
    }
  }

  return Response.json({ success: true, notification_envoyee: true });
}