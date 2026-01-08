import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { action, data } = await req.json();

    console.log(`💳 Action facturation: ${action}`);

    if (action === 'creer') {
      const montantHT = data.montant_ht || data.montant_ttc / 1.18;
      const tauxTVA = data.tva_pourcentage || 18;
      const montantTVA = montantHT * (tauxTVA / 100);
      const montantTTC = montantHT + montantTVA;

      const facture = await base44.entities.Facturation.create({
        centre_id: data.centre_id,
        centre_nom: data.centre_nom,
        numero_facture: `FAC-${Date.now()}`,
        date_emission: new Date().toISOString().split('T')[0],
        date_echeance: data.date_echeance || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        patient_nom: data.patient_nom,
        patient_email: data.patient_email,
        rdv_id: data.rdv_id || null,
        type_service: data.type_service || 'consultation',
        description: data.description,
        montant_ht: parseFloat(montantHT.toFixed(2)),
        tva_pourcentage: tauxTVA,
        montant_tva: parseFloat(montantTVA.toFixed(2)),
        montant_ttc: parseFloat(montantTTC.toFixed(2)),
        statut: 'envoyee',
        mode_paiement: 'non_defini'
      });

      console.log(`✅ Facture créée: ${facture.numero_facture}`);
      return Response.json({ success: true, facture });
    }

    if (action === 'enregistrer_paiement') {
      const facture = await base44.entities.Facturation.list();
      const f = facture.find(fac => fac.id === data.facture_id);

      if (!f) {
        return Response.json({ error: 'Facture non trouvée' }, { status: 404 });
      }

      const paiements = f.paiements || [];
      paiements.push({
        id: `PAI-${Date.now()}`,
        date: new Date().toISOString(),
        montant: data.montant,
        mode: data.mode,
        reference: data.reference
      });

      const montantTotal = paiements.reduce((sum, p) => sum + p.montant, 0);
      const nouveauStatut = montantTotal >= f.montant_ttc ? 'payee' : 'partiellement_payee';

      await base44.entities.Facturation.update(data.facture_id, {
        paiements,
        statut: nouveauStatut
      });

      console.log(`✅ Paiement enregistré: ${data.montant}F`);
      return Response.json({ 
        success: true, 
        statut: nouveauStatut,
        montant_paye: montantTotal 
      });
    }

    if (action === 'marquer_payee') {
      await base44.entities.Facturation.update(data.facture_id, {
        statut: 'payee'
      });
      return Response.json({ success: true, message: 'Facture marquée comme payée' });
    }

    return Response.json({ error: 'Action inconnue' }, { status: 400 });

  } catch (error) {
    console.error('❌ Erreur facturation:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});