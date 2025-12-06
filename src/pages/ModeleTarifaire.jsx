import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Heart, Users, Stethoscope, Building2, CheckCircle2, Star,
  Baby, Calendar, MessageSquare, Shield, TrendingUp, Sparkles,
  ArrowRight, Gift, Crown, Zap
} from 'lucide-react';

export default function ModeleTarifaire() {
  const offres = [
    {
      id: 'maman',
      titre: 'Mamans & Enfants',
      sousTitre: 'Gratuit à vie',
      prix: '0',
      devise: 'FCFA',
      periode: '',
      couleur: 'from-pink-400 to-rose-500',
      icone: Heart,
      badge: 'GRATUIT',
      badgeColor: 'bg-green-500',
      features: [
        { texte: 'Suivi de grossesse complet', inclus: true },
        { texte: 'Carnet de santé enfants illimité', inclus: true },
        { texte: 'Calendrier vaccinal intelligent', inclus: true },
        { texte: 'Suivi contraception personnalisé', inclus: true },
        { texte: 'Assistant IA santé 24h/24', inclus: true },
        { texte: 'Téléconsultation avec spécialistes', inclus: true },
        { texte: 'Messagerie sécurisée', inclus: true },
        { texte: 'Communauté d\'entraide', inclus: true },
        { texte: 'Rappels vaccins & RDV', inclus: true },
        { texte: 'Documents médicaux sécurisés', inclus: true },
      ],
      cta: 'Commencer gratuitement',
      lien: 'Inscription',
      populaire: true,
    },
    {
      id: 'pro_basic',
      titre: 'Professionnel Essentiel',
      sousTitre: 'Sages-femmes & Infirmiers',
      prix: '5 000',
      devise: 'FCFA',
      periode: '/mois',
      couleur: 'from-teal-400 to-cyan-500',
      icone: Stethoscope,
      badge: 'POPULAIRE',
      badgeColor: 'bg-teal-500',
      features: [
        { texte: 'Profil professionnel vérifié', inclus: true },
        { texte: 'Gestion agenda en ligne', inclus: true },
        { texte: 'Jusqu\'à 50 patients/mois', inclus: true },
        { texte: 'Téléconsultation vidéo', inclus: true },
        { texte: 'Messagerie avec patients', inclus: true },
        { texte: 'Ordonnances électroniques', inclus: true },
        { texte: 'Statistiques de base', inclus: true },
        { texte: 'Support prioritaire', inclus: false },
        { texte: 'API & Intégrations', inclus: false },
      ],
      cta: 'S\'abonner',
      lien: 'Tarifs',
    },
    {
      id: 'pro_premium',
      titre: 'Professionnel Premium',
      sousTitre: 'Médecins & Gynécologues',
      prix: '15 000',
      devise: 'FCFA',
      periode: '/mois',
      couleur: 'from-purple-400 to-indigo-500',
      icone: Crown,
      badge: 'PREMIUM',
      badgeColor: 'bg-purple-500',
      features: [
        { texte: 'Tout du plan Essentiel', inclus: true },
        { texte: 'Patients illimités', inclus: true },
        { texte: 'Tableau de bord analytique', inclus: true },
        { texte: 'Dossiers patients complets', inclus: true },
        { texte: 'Multi-cabinets / cliniques', inclus: true },
        { texte: 'Synchronisation calendrier', inclus: true },
        { texte: 'Support prioritaire 24/7', inclus: true },
        { texte: 'Visibilité premium', inclus: true },
        { texte: 'Rapports personnalisés', inclus: true },
      ],
      cta: 'Essai gratuit 30 jours',
      lien: 'Tarifs',
    },
    {
      id: 'institution',
      titre: 'Institutions & Partenaires',
      sousTitre: 'Hôpitaux, Laboratoires, ONG',
      prix: 'Sur mesure',
      devise: '',
      periode: '',
      couleur: 'from-amber-400 to-orange-500',
      icone: Building2,
      badge: 'ENTREPRISE',
      badgeColor: 'bg-amber-500',
      features: [
        { texte: 'Accès données anonymisées', inclus: true },
        { texte: 'Tableau de bord analytique', inclus: true },
        { texte: 'Rapports santé publique', inclus: true },
        { texte: 'Export données (CSV, Excel, PDF)', inclus: true },
        { texte: 'API accès programmatique', inclus: true },
        { texte: 'Intégration systèmes existants', inclus: true },
        { texte: 'Visibilité partenaire', inclus: true },
        { texte: 'Account manager dédié', inclus: true },
        { texte: 'Formation équipes', inclus: true },
      ],
      cta: 'Nous contacter',
      lien: null,
      contact: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Badge className="bg-white/20 text-white mb-4">
            <Gift className="w-4 h-4 mr-1" />
            100% gratuit pour les mamans
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            La santé maternelle accessible à toutes
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
            A'lo Maman est gratuit pour toutes les mamans et leurs enfants. 
            Les professionnels de santé paient pour bénéficier d'outils premium.
          </p>
        </div>
      </div>

      {/* Cartes tarifaires */}
      <div className="max-w-7xl mx-auto px-4 py-12 -mt-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {offres.map((offre) => (
            <Card 
              key={offre.id}
              className={`relative overflow-hidden shadow-xl border-none ${offre.populaire ? 'ring-2 ring-pink-500 ring-offset-2' : ''}`}
            >
              {offre.badge && (
                <Badge className={`absolute top-4 right-4 ${offre.badgeColor} text-white`}>
                  {offre.badge}
                </Badge>
              )}
              
              <CardHeader className={`bg-gradient-to-br ${offre.couleur} text-white pb-8`}>
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                  <offre.icone className="w-7 h-7" />
                </div>
                <CardTitle className="text-xl">{offre.titre}</CardTitle>
                <p className="text-white/80 text-sm">{offre.sousTitre}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{offre.prix}</span>
                  <span className="text-lg ml-1">{offre.devise}</span>
                  <span className="text-white/80">{offre.periode}</span>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <ul className="space-y-3 mb-6">
                  {offre.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.inclus ? 'text-green-500' : 'text-gray-300'}`} />
                      <span className={feature.inclus ? 'text-gray-700' : 'text-gray-400 line-through'}>
                        {feature.texte}
                      </span>
                    </li>
                  ))}
                </ul>

                {offre.contact ? (
                  <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                    {offre.cta}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Link to={createPageUrl(offre.lien)}>
                    <Button className={`w-full bg-gradient-to-r ${offre.couleur} hover:opacity-90`}>
                      {offre.cta}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Avantages pour chaque cible */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
          Des avantages pour tous
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Mamans */}
          <Card className="shadow-lg border-t-4 border-t-pink-500">
            <CardHeader>
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-3">
                <Heart className="w-6 h-6 text-pink-500" />
              </div>
              <CardTitle>Pour les Mamans</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Baby className="w-5 h-5 text-pink-500" />
                <span>Suivi complet de vos enfants</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-500" />
                <span>RDV faciles avec spécialistes</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-500" />
                <span>Conseils IA personnalisés</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-pink-500" />
                <span>Communauté bienveillante</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-pink-500" />
                <span>Données 100% sécurisées</span>
              </div>
            </CardContent>
          </Card>

          {/* Professionnels */}
          <Card className="shadow-lg border-t-4 border-t-teal-500">
            <CardHeader>
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-3">
                <Stethoscope className="w-6 h-6 text-teal-500" />
              </div>
              <CardTitle>Pour les Professionnels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-500" />
                <span>Nouveaux patients qualifiés</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-teal-500" />
                <span>Agenda en ligne optimisé</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-teal-500" />
                <span>Téléconsultation intégrée</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-500" />
                <span>Revenus supplémentaires</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-teal-500" />
                <span>Visibilité et réputation</span>
              </div>
            </CardContent>
          </Card>

          {/* Institutions */}
          <Card className="shadow-lg border-t-4 border-t-amber-500">
            <CardHeader>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-3">
                <Building2 className="w-6 h-6 text-amber-500" />
              </div>
              <CardTitle>Pour les Institutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-500" />
                <span>Données santé anonymisées</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                <span>Conformité RGPD</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span>Rapports épidémiologiques</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span>Visibilité partenaire</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Impact santé publique</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Final */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Rejoignez des milliers de mamans et professionnels
          </h2>
          <p className="text-white/90 mb-8">
            Commencez gratuitement dès aujourd'hui. Aucune carte bancaire requise.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to={createPageUrl('Inscription')}>
              <Button size="lg" className="bg-white text-pink-600 hover:bg-gray-100">
                <Heart className="w-5 h-5 mr-2" />
                Je suis une maman
              </Button>
            </Link>
            <Link to={createPageUrl('Tarifs')}>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Stethoscope className="w-5 h-5 mr-2" />
                Je suis professionnel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}