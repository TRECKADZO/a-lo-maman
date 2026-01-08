import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.1';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { declarationId } = await req.json();

    if (!declarationId) {
      return Response.json({ error: 'Declaration ID required' }, { status: 400 });
    }

    // Récupérer la déclaration
    const declarations = await base44.entities.DeclarationNaissance.filter({ id: declarationId });
    const declaration = declarations[0];

    if (!declaration) {
      return Response.json({ error: 'Declaration not found' }, { status: 404 });
    }

    // Générer le PDF
    const doc = new jsPDF();

    // Header
    doc.setFillColor(236, 72, 153); // Pink-500
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("DÉCLARATION DE NAISSANCE", 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text("République de Côte d'Ivoire", 105, 25, { align: 'center' });
    doc.text("Office National de l'État Civil (ONECI)", 105, 32, { align: 'center' });

    // Numéro de suivi
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.text(`N° de suivi : ${declaration.numero_suivi}`, 105, 50, { align: 'center' });
    doc.text(`Date de soumission : ${new Date(declaration.date_soumission).toLocaleDateString('fr-FR')}`, 105, 57, { align: 'center' });

    // Informations de l'enfant
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("INFORMATIONS DE L'ENFANT", 20, 75);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);

    let y = 85;
    const leftCol = 20;
    const rightCol = 120;

    doc.text("Prénom(s) :", leftCol, y);
    doc.setFont(undefined, 'bold');
    doc.text(declaration.prenoms_enfant || '', leftCol + 40, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    doc.text("Nom de famille :", leftCol, y);
    doc.setFont(undefined, 'bold');
    doc.text(declaration.nom_famille || '', leftCol + 40, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    doc.text("Sexe :", leftCol, y);
    doc.setFont(undefined, 'bold');
    doc.text(declaration.sexe === 'garcon' ? 'Garçon' : 'Fille', leftCol + 40, y);
    doc.setFont(undefined, 'normal');

    // Naissance
    y += 20;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text("LIEU ET DATE DE NAISSANCE", 20, y);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(11);

    y += 10;
    doc.text("Date :", leftCol, y);
    doc.setFont(undefined, 'bold');
    doc.text(new Date(declaration.date_naissance).toLocaleDateString('fr-FR'), leftCol + 40, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    doc.text("Heure :", leftCol, y);
    doc.setFont(undefined, 'bold');
    doc.text(declaration.heure_naissance || '', leftCol + 40, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    doc.text("Lieu :", leftCol, y);
    doc.setFont(undefined, 'bold');
    const lieu = doc.splitTextToSize(declaration.lieu_naissance || '', 80);
    doc.text(lieu, leftCol + 40, y);
    doc.setFont(undefined, 'normal');

    y += lieu.length * 5 + 5;
    doc.text("Ville :", leftCol, y);
    doc.setFont(undefined, 'bold');
    doc.text(declaration.ville || '', leftCol + 40, y);
    doc.setFont(undefined, 'normal');

    y += 10;
    doc.text("Région :", leftCol, y);
    doc.setFont(undefined, 'bold');
    doc.text(declaration.region || '', leftCol + 40, y);
    doc.setFont(undefined, 'normal');

    // Parents
    if (declaration.prenom_pere || declaration.nom_pere) {
      y += 20;
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text("INFORMATIONS DU PÈRE", 20, y);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(11);

      y += 10;
      doc.text("Prénom et nom :", leftCol, y);
      doc.setFont(undefined, 'bold');
      doc.text(`${declaration.prenom_pere || ''} ${declaration.nom_pere || ''}`, leftCol + 40, y);
      doc.setFont(undefined, 'normal');
    }

    // CMU
    if (declaration.no_cmu_mere) {
      y += 15;
      doc.text("N° CMU de la mère :", leftCol, y);
      doc.setFont(undefined, 'bold');
      doc.text(declaration.no_cmu_mere, leftCol + 40, y);
      doc.setFont(undefined, 'normal');
    }

    // Footer
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Document généré automatiquement par A'lo Maman (alomaman.com)", 105, 280, { align: 'center' });
    doc.text("Ce document doit être présenté à l'état civil pour obtenir l'acte de naissance officiel", 105, 287, { align: 'center' });

    // Convertir en bytes
    const pdfBytes = doc.output('arraybuffer');

    // Uploader le PDF
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const pdfFile = new File([pdfBlob], `declaration_${declaration.numero_suivi}.pdf`, { type: 'application/pdf' });
    
    const { file_url } = await base44.integrations.Core.UploadFile({ file: pdfFile });

    // Mettre à jour la déclaration avec le PDF
    await base44.asServiceRole.entities.DeclarationNaissance.update(declarationId, {
      pdf_declaration_url: file_url,
      statut: 'transmise'
    });

    // Envoyer email avec le PDF
    await base44.integrations.Core.SendEmail({
      to: declaration.maman_email,
      subject: `✅ Déclaration de naissance de ${declaration.prenoms_enfant} - ${declaration.numero_suivi}`,
      body: `
Bonjour,

Votre déclaration de naissance a été enregistrée avec succès !

Enfant : ${declaration.prenoms_enfant} ${declaration.nom_famille}
Date de naissance : ${new Date(declaration.date_naissance).toLocaleDateString('fr-FR')}
Numéro de suivi : ${declaration.numero_suivi}

Vous trouverez ci-joint le formulaire pré-rempli à présenter à l'état civil.

Prochaines étapes :
1. Téléchargez le PDF depuis votre espace A'lo Maman
2. Présentez-vous à l'état civil de votre commune sous 60 jours
3. Vous recevrez l'acte de naissance officiel

N'hésitez pas à créer le carnet médical numérique de votre bébé pour suivre sa croissance et ses vaccinations !

Équipe A'lo Maman
alomaman.com
      `.trim()
    });

    return Response.json({ 
      success: true, 
      pdf_url: file_url,
      numero_suivi: declaration.numero_suivi 
    });

  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});