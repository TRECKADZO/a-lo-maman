import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { code, relation } = await req.json();

    if (!code || !relation) {
      return Response.json({ error: 'Code et relation requis' }, { status: 400 });
    }

    console.log(`🔍 Recherche famille avec code: ${code}`);

    // Chercher la famille avec ce code
    const familles = await base44.entities.FamilleConnectee.filter({
      code_partage: code.toUpperCase()
    });

    if (!familles || familles.length === 0) {
      return Response.json({ error: 'Code de famille invalide' }, { status: 404 });
    }

    const famille = familles[0];

    // Vérifier si l'utilisateur est déjà membre
    const estDejaMembre = famille.membres?.some(m => m.email === user.email);
    if (estDejaMembre) {
      return Response.json({ error: 'Vous êtes déjà membre de cette famille' }, { status: 400 });
    }

    // Ajouter le nouveau membre
    const nouveauMembre = {
      email: user.email,
      nom: user.full_name,
      relation: relation,
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

    const membres = [...(famille.membres || []), nouveauMembre];

    await base44.entities.FamilleConnectee.update(famille.id, {
      membres
    });

    console.log(`✅ ${user.full_name} a rejoint la famille ${famille.parametres?.nom_groupe}`);

    return Response.json({
      success: true,
      famille: {
        id: famille.id,
        nom_groupe: famille.parametres?.nom_groupe
      }
    });

  } catch (error) {
    console.error('❌ Erreur rejoindre code:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});