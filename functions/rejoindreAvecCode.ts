import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { code, relation } = await req.json();

    if (!code || code.length !== 6) {
      return Response.json({ error: 'Code invalide (6 caractères requis)' }, { status: 400 });
    }

    // Utiliser service role pour chercher la famille par code
    const allFamilles = await base44.asServiceRole.entities.FamilleConnectee.list();
    const familleAvecCode = allFamilles.find(f => f.code_partage === code.toUpperCase());

    if (!familleAvecCode) {
      return Response.json({ error: 'Code invalide ou famille introuvable' }, { status: 404 });
    }

    // Vérifier si déjà membre ou propriétaire
    if (familleAvecCode.proprietaire_email === user.email) {
      return Response.json({ error: 'Vous êtes le propriétaire de cette famille' }, { status: 400 });
    }

    const dejaMembre = familleAvecCode.membres?.some(m => m.email === user.email);
    if (dejaMembre) {
      return Response.json({ error: 'Vous êtes déjà membre de cette famille' }, { status: 400 });
    }

    // Ajouter l'utilisateur comme membre
    const newMembre = {
      email: user.email,
      nom: user.full_name,
      relation: relation || 'autre',
      statut: 'accepte',
      date_ajout: new Date().toISOString(),
      permissions: {
        grossesse: true,
        grossesse_details: false,
        enfants: true,
        enfants_details: false,
        rendez_vous: true,
        documents: false,
        messagerie: true
      }
    };

    const membres = [...(familleAvecCode.membres || []), newMembre];
    
    await base44.asServiceRole.entities.FamilleConnectee.update(familleAvecCode.id, { membres });

    return Response.json({ 
      success: true, 
      famille: {
        nom_groupe: familleAvecCode.parametres?.nom_groupe || 'Ma Famille',
        proprietaire: familleAvecCode.proprietaire_email,
        nombre_membres: membres.length
      }
    });

  } catch (error) {
    console.error('Erreur rejoindre famille:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});