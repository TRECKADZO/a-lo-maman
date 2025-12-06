// Génération de fichiers ICS pour synchronisation calendrier
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { type } = await req.json(); // 'patient' ou 'professionnel'

    let rdvList = [];

    if (type === 'professionnel') {
      const proList = await base44.asServiceRole.entities.Professionnel.filter({ email: user.email });
      const pro = proList[0];
      if (pro) {
        rdvList = await base44.asServiceRole.entities.RendezVous.filter({ professionnel_id: pro.id });
      }
    } else {
      rdvList = await base44.asServiceRole.entities.RendezVous.filter({ created_by: user.email });
    }

    // Filtrer les RDV non annulés et futurs
    const now = new Date();
    rdvList = rdvList.filter(rdv => rdv.statut !== 'annule' && new Date(rdv.date_rdv) >= now);

    // Générer le fichier ICS
    let ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//A'lo Maman//Calendrier RDV//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:A'lo Maman - Rendez-vous
`;

    for (const rdv of rdvList) {
      const dateDebut = new Date(rdv.date_rdv);
      const dateFin = new Date(dateDebut.getTime() + 30 * 60000); // +30 min

      const formatDate = (d) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      const typeLabel = {
        'cabinet': 'Cabinet',
        'clinique': 'Clinique',
        'hopital': 'Hôpital',
        'telephone': 'Téléphone',
        'visio': 'Vidéoconsultation'
      }[rdv.type_consultation] || rdv.type_consultation;

      ics += `BEGIN:VEVENT
UID:${rdv.id}@alomaman.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(dateDebut)}
DTEND:${formatDate(dateFin)}
SUMMARY:RDV ${typeLabel}${rdv.motif ? ' - ' + rdv.motif : ''}
DESCRIPTION:${rdv.motif || 'Rendez-vous médical'}
STATUS:${rdv.statut === 'confirme' ? 'CONFIRMED' : 'TENTATIVE'}
END:VEVENT
`;
    }

    ics += 'END:VCALENDAR';

    return new Response(ics, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'attachment; filename=alomaman-rdv.ics'
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});