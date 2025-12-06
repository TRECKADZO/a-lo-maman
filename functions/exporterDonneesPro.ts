// Fonction backend pour exporter les données du professionnel (RGPD)
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { format } = await req.json(); // 'json' ou 'csv'

    // Récupérer le profil professionnel
    const proList = await base44.asServiceRole.entities.Professionnel.filter({ email: user.email });
    const pro = proList[0];

    if (!pro) {
      return Response.json({ error: 'Profil professionnel non trouvé' }, { status: 404 });
    }

    // Récupérer toutes les données
    const rdv = await base44.asServiceRole.entities.RendezVous.filter({
      professionnel_id: pro.id
    });

    const avis = await base44.asServiceRole.entities.AvisProfessionnel.filter({
      professionnel_id: pro.id
    });

    const exportData = {
      date_export: new Date().toISOString(),
      professionnel: {
        nom: pro.nom_complet,
        email: pro.email,
        specialite: pro.specialite,
        telephone: pro.telephone,
        adresse: pro.adresse,
        ville: pro.ville,
        region: pro.region,
        numero_ordre: pro.numero_ordre,
        annees_experience: pro.annees_experience,
        langues: pro.langues,
        certifications: pro.certifications,
        note_moyenne: pro.note_moyenne,
        nombre_avis: pro.nombre_avis,
        compte_verifie: pro.compte_verifie
      },
      statistiques: {
        total_rdv: rdv.length,
        rdv_termines: rdv.filter(r => r.statut === 'termine').length,
        rdv_annules: rdv.filter(r => r.statut === 'annule').length,
        patients_uniques: [...new Set(rdv.map(r => r.created_by))].length
      },
      rendez_vous: rdv.map(r => ({
        date: r.date_rdv,
        type: r.type_consultation,
        statut: r.statut,
        motif: r.motif
      })),
      avis: avis.map(a => ({
        date: a.created_date,
        note: a.note,
        commentaire: a.commentaire
      }))
    };

    if (format === 'csv') {
      // Générer CSV pour les RDV
      let csv = 'Date,Type,Statut,Motif\n';
      exportData.rendez_vous.forEach(r => {
        csv += `"${r.date}","${r.type}","${r.statut}","${r.motif || ''}"\n`;
      });

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=export_pro_${new Date().toISOString().split('T')[0]}.csv`
        }
      });
    }

    return Response.json({
      success: true,
      data: exportData
    });

  } catch (error) {
    console.error('Erreur export:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});