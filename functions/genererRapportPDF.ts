import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { type, data } = await req.json();

    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(219, 39, 119); // Pink
    doc.text("A'lo Maman - Rapport Médical", 20, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setTextColor(107, 114, 128); // Gray
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 20, yPos);
    yPos += 15;

    if (type === 'grossesse' && data.grossesse) {
      // Rapport de grossesse
      const g = data.grossesse;
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text('Résumé de Grossesse', 20, yPos);
      yPos += 10;

      doc.setFontSize(12);
      const ddr = new Date(g.date_derniere_regle);
      const dpa = new Date(g.date_accouchement_prevue);
      const semaines = Math.floor((new Date() - ddr) / (7 * 24 * 60 * 60 * 1000));

      doc.text(`Date des dernières règles: ${ddr.toLocaleDateString('fr-FR')}`, 20, yPos);
      yPos += 7;
      doc.text(`Date prévue d'accouchement: ${dpa.toLocaleDateString('fr-FR')}`, 20, yPos);
      yPos += 7;
      doc.text(`Semaine actuelle: ${semaines} SA`, 20, yPos);
      yPos += 7;
      doc.text(`Type de grossesse: ${g.type_grossesse || 'unique'}`, 20, yPos);
      yPos += 10;

      if (g.groupe_sanguin) {
        doc.text(`Groupe sanguin: ${g.groupe_sanguin} ${g.rhesus || ''}`, 20, yPos);
        yPos += 10;
      }

      // Consultations prénatales
      if (g.consultations && g.consultations.length > 0) {
        yPos += 5;
        doc.setFontSize(14);
        doc.text('Consultations Prénatales', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        g.consultations.slice(-5).forEach((consult, idx) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.text(`• SA ${consult.semaine_grossesse} - ${new Date(consult.date).toLocaleDateString('fr-FR')}`, 25, yPos);
          yPos += 5;
          
          if (consult.poids) {
            doc.text(`  Poids: ${consult.poids} kg`, 30, yPos);
            yPos += 5;
          }
          
          if (consult.tension_arterielle) {
            doc.text(`  Tension: ${consult.tension_arterielle}`, 30, yPos);
            yPos += 5;
          }
          
          if (consult.notes_medecin) {
            const lines = doc.splitTextToSize(consult.notes_medecin, 150);
            doc.text(lines, 30, yPos);
            yPos += lines.length * 5;
          }
          
          yPos += 3;
        });
      }

      // Développement bébé
      if (g.developpement_bebe && g.developpement_bebe.length > 0) {
        yPos += 5;
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Développement Fœtal', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        g.developpement_bebe.slice(-3).forEach((dev) => {
          doc.text(`• SA ${dev.semaine_amenorrhee} - ${new Date(dev.date_mesure).toLocaleDateString('fr-FR')}`, 25, yPos);
          yPos += 5;
          
          if (dev.taille_estimee_cm) {
            doc.text(`  Taille: ${dev.taille_estimee_cm} cm`, 30, yPos);
            yPos += 5;
          }
          
          if (dev.poids_estime_g) {
            doc.text(`  Poids: ${dev.poids_estime_g} g`, 30, yPos);
            yPos += 5;
          }
          
          yPos += 3;
        });
      }

      // Échographies
      if (g.echographies && g.echographies.length > 0) {
        yPos += 5;
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Échographies', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        g.echographies.forEach((echo) => {
          doc.text(`• ${echo.type} - Trimestre ${echo.trimestre}`, 25, yPos);
          yPos += 5;
          doc.text(`  Date: ${new Date(echo.date).toLocaleDateString('fr-FR')}`, 30, yPos);
          yPos += 5;
          
          if (echo.poids_estime) {
            doc.text(`  Poids estimé: ${echo.poids_estime}g`, 30, yPos);
            yPos += 5;
          }
          
          yPos += 3;
        });
      }
    }

    if (type === 'enfant' && data.enfant) {
      // Rapport enfant
      const e = data.enfant;
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(`Carnet de ${e.prenom}`, 20, yPos);
      yPos += 10;

      doc.setFontSize(12);
      doc.text(`Date de naissance: ${new Date(e.date_naissance).toLocaleDateString('fr-FR')}`, 20, yPos);
      yPos += 7;
      doc.text(`Sexe: ${e.sexe}`, 20, yPos);
      yPos += 7;
      
      if (e.lieu_naissance) {
        doc.text(`Lieu: ${e.lieu_naissance}`, 20, yPos);
        yPos += 7;
      }
      
      if (e.numero_cmu) {
        doc.text(`N° CMU: ${e.numero_cmu}`, 20, yPos);
        yPos += 7;
      }
      
      if (e.groupe_sanguin) {
        doc.text(`Groupe sanguin: ${e.groupe_sanguin}`, 20, yPos);
        yPos += 10;
      }

      // Vaccinations
      if (e.vaccins && e.vaccins.length > 0) {
        yPos += 5;
        doc.setFontSize(14);
        doc.text('Vaccinations', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        e.vaccins.forEach((vaccin) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
          
          doc.text(`• ${vaccin.nom_vaccin}`, 25, yPos);
          yPos += 5;
          doc.text(`  Date: ${new Date(vaccin.date_administration).toLocaleDateString('fr-FR')}`, 30, yPos);
          yPos += 5;
          
          if (vaccin.lot_vaccin) {
            doc.text(`  Lot: ${vaccin.lot_vaccin}`, 30, yPos);
            yPos += 5;
          }
          
          yPos += 3;
        });
      }

      // Croissance
      if (e.mesures_croissance && e.mesures_croissance.length > 0) {
        yPos += 5;
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        doc.setFontSize(14);
        doc.text('Courbe de Croissance', 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        e.mesures_croissance.slice(-10).forEach((mesure) => {
          doc.text(`• ${new Date(mesure.date).toLocaleDateString('fr-FR')}`, 25, yPos);
          yPos += 5;
          
          if (mesure.poids) {
            doc.text(`  Poids: ${mesure.poids} kg`, 30, yPos);
            yPos += 5;
          }
          
          if (mesure.taille) {
            doc.text(`  Taille: ${mesure.taille} cm`, 30, yPos);
            yPos += 5;
          }
          
          yPos += 3;
        });
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175);
      doc.text(`Page ${i} sur ${pageCount}`, 105, 290, { align: 'center' });
      doc.text("A'lo Maman - Plateforme de Santé Maternelle et Infantile", 105, 285, { align: 'center' });
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=rapport-${type}-${Date.now()}.pdf`
      }
    });

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});