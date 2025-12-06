import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Search,
  HelpCircle,
  Shield,
  MessageSquare,
  CreditCard,
  Stethoscope,
  Users,
  FileText,
  Heart,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FAQ() {
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    {
      id: "general",
      title: "Questions Générales",
      icon: HelpCircle,
      color: "from-pink-500 to-rose-500",
      questions: [
        {
          q: "Qu'est-ce que A'lo Maman ?",
          a: "A'lo Maman est une plateforme de santé maternelle et infantile en Côte d'Ivoire. Elle permet aux mamans de suivre leur grossesse, gérer la santé de leurs enfants, consulter des spécialistes en ligne et rejoindre une communauté d'entraide."
        },
        {
          q: "Qui peut utiliser A'lo Maman ?",
          a: "A'lo Maman est destiné aux mamans, futures mamans et familles en Côte d'Ivoire. Les professionnels de santé (gynécologues, pédiatres, sages-femmes, médecins généralistes, infirmiers, nutritionnistes) peuvent également s'inscrire pour offrir leurs services."
        },
        {
          q: "L'application est-elle disponible en français ?",
          a: "Oui, A'lo Maman est entièrement disponible en français. Une version anglaise est également proposée dans les paramètres."
        },
        {
          q: "Comment créer un compte ?",
          a: "Cliquez sur 'Créer un compte' sur la page d'accueil, choisissez votre type de compte (Maman ou Professionnel), puis remplissez le formulaire d'inscription. Actuellement, l'inscription nécessite une invitation d'un administrateur."
        },
        {
          q: "L'application fonctionne-t-elle hors ligne ?",
          a: "Certaines fonctionnalités de base sont accessibles hors ligne une fois que vous avez chargé vos données. Cependant, les fonctionnalités comme les téléconsultations et la messagerie nécessitent une connexion internet."
        }
      ]
    },
    {
      id: "securite",
      title: "Sécurité & Confidentialité",
      icon: Shield,
      color: "from-green-500 to-emerald-500",
      questions: [
        {
          q: "Mes données médicales sont-elles sécurisées ?",
          a: "Oui, absolument. Toutes vos données médicales sont chiffrées de bout en bout avec le standard militaire AES-256-GCM. Vos informations sensibles ne sont jamais stockées en clair et sont protégées par des mesures de sécurité avancées."
        },
        {
          q: "Qui peut voir mes informations personnelles ?",
          a: "Seuls vous et les professionnels de santé que vous autorisez explicitement peuvent accéder à vos données médicales. Vous gardez le contrôle total sur qui peut consulter vos informations."
        },
        {
          q: "Est-ce que A'lo Maman respecte le RGPD ?",
          a: "Oui, nous sommes en totale conformité avec le RGPD et les réglementations sur la protection des données personnelles et médicales. Vous avez le droit d'accéder, de modifier, d'exporter ou de supprimer vos données à tout moment."
        },
        {
          q: "Puis-je supprimer mon compte et mes données ?",
          a: "Oui, vous pouvez supprimer votre compte et toutes vos données à tout moment depuis les paramètres. Cette action est irréversible et toutes vos informations seront définitivement effacées de nos serveurs."
        },
        {
          q: "Comment est protégée ma carte bancaire ?",
          a: "A'lo Maman n'utilise pas de cartes bancaires. Les paiements se font exclusivement via Orange Money, Moov Money ou Wave, des systèmes de paiement mobile sécurisés. Aucune information bancaire n'est stockée sur nos serveurs."
        }
      ]
    },
    {
      id: "fonctionnalites",
      title: "Fonctionnalités Principales",
      icon: Sparkles,
      color: "from-purple-500 to-violet-500",
      questions: [
        {
          q: "Comment fonctionne le suivi de grossesse ?",
          a: "Le suivi de grossesse vous permet d'enregistrer votre date de dernières règles pour calculer votre terme. Vous pouvez suivre l'évolution de votre bébé semaine par semaine, enregistrer vos consultations prénatales, vos échographies, et recevoir des conseils personnalisés."
        },
        {
          q: "Qu'est-ce qu'un carnet de santé numérique ?",
          a: "C'est la version digitale du carnet de santé papier de votre enfant. Vous pouvez y enregistrer toutes les informations importantes : vaccins, poids, taille, jalons de développement, maladies, allergies, et conserver des documents médicaux de manière sécurisée."
        },
        {
          q: "Comment fonctionne l'Assistant IA ?",
          a: "L'Assistant IA est disponible 24/7 pour répondre à vos questions de santé maternelle et infantile. Il utilise l'intelligence artificielle pour vous fournir des informations fiables, mais ne remplace pas l'avis d'un professionnel de santé."
        },
        {
          q: "Puis-je créer plusieurs carnets pour mes enfants ?",
          a: "Oui, avec l'abonnement Premium, vous pouvez créer des carnets de santé illimités pour tous vos enfants. La version gratuite permet de créer un seul carnet."
        },
        {
          q: "Comment rejoindre la communauté ?",
          a: "Avec l'abonnement Premium, vous avez accès à la communauté où vous pouvez échanger avec d'autres mamans, poser vos questions, partager votre expérience, et recevoir du soutien. Les professionnels de santé y participent également."
        }
      ]
    },
    {
      id: "teleconsultation",
      title: "Téléconsultations",
      icon: Stethoscope,
      color: "from-teal-500 to-cyan-500",
      questions: [
        {
          q: "Comment prendre rendez-vous avec un spécialiste ?",
          a: "Allez dans la section 'Rendez-vous', recherchez un professionnel par spécialité ou localisation, consultez leurs disponibilités et sélectionnez un créneau qui vous convient. Vous recevrez une confirmation par notification et email."
        },
        {
          q: "Combien coûte une téléconsultation ?",
          a: "Les tarifs varient selon les professionnels de santé et le type de consultation. Chaque professionnel affiche ses tarifs sur son profil. Certaines consultations sont couvertes par la CMU."
        },
        {
          q: "La CMU couvre-t-elle les téléconsultations ?",
          a: "Oui, les téléconsultations peuvent être couvertes par la CMU selon le type de consultation et le professionnel. Vérifiez que le professionnel accepte la CMU avant de prendre rendez-vous."
        },
        {
          q: "Comment se déroule une téléconsultation ?",
          a: "Le jour du rendez-vous, rejoignez la salle d'attente virtuelle 5 minutes avant l'heure. Le spécialiste vous appellera en visioconférence sécurisée. Vous pourrez discuter, partager des documents, et recevoir une ordonnance si nécessaire."
        },
        {
          q: "Puis-je annuler ou reprogrammer un rendez-vous ?",
          a: "Oui, vous pouvez annuler ou reprogrammer un rendez-vous depuis votre espace. Pour les annulations de dernière minute (moins de 24h avant), des frais peuvent s'appliquer selon la politique du professionnel."
        },
        {
          q: "Comment recevoir mon ordonnance après une consultation ?",
          a: "Après la consultation, le spécialiste peut vous envoyer une ordonnance numérique sécurisée directement dans votre messagerie. Vous pouvez la télécharger et l'imprimer pour l'utiliser en pharmacie."
        }
      ]
    },
    {
      id: "messagerie",
      title: "Messagerie & Communication",
      icon: MessageSquare,
      color: "from-blue-500 to-indigo-500",
      questions: [
        {
          q: "Comment contacter un professionnel de santé ?",
          a: "Avec l'abonnement Premium, vous pouvez envoyer des messages directs aux professionnels via la messagerie sécurisée. Les réponses peuvent prendre 24 à 48 heures selon la disponibilité."
        },
        {
          q: "La messagerie est-elle sécurisée ?",
          a: "Oui, tous les messages sont chiffrés de bout en bout. Seuls vous et le destinataire pouvez lire les messages. Les professionnels de santé sont liés par le secret médical."
        },
        {
          q: "Puis-je envoyer des photos ou documents médicaux ?",
          a: "Oui, vous pouvez joindre des fichiers (photos, PDF, documents) à vos messages. Tous les fichiers sont également chiffrés et stockés de manière sécurisée."
        },
        {
          q: "Les professionnels répondent-ils rapidement ?",
          a: "Les professionnels s'engagent à répondre dans un délai de 24 à 48 heures. Pour les urgences, il est recommandé d'appeler directement ou de se rendre aux urgences."
        }
      ]
    },
    {
      id: "abonnement",
      title: "Abonnements & Paiements",
      icon: CreditCard,
      color: "from-amber-500 to-orange-500",
      questions: [
        {
          q: "Quelles sont les différences entre gratuit et Premium ?",
          a: "La version gratuite permet d'accéder aux fonctionnalités de base : recherche de professionnels, un carnet enfant, suivi de cycle basique. Le Premium inclut : suivi de grossesse détaillé, carnets illimités, messagerie avec spécialistes, communauté, sauvegarde cloud, statistiques avancées."
        },
        {
          q: "Combien coûte l'abonnement Premium ?",
          a: "L'abonnement Premium coûte 1.500 F CFA par mois ou 15.000 F CFA par an (soit 2 mois offerts). Un essai gratuit de 30 jours est offert pour tester toutes les fonctionnalités."
        },
        {
          q: "Comment souscrire à l'abonnement Premium ?",
          a: "Allez dans la section 'Abonnement' ou 'Tarifs', sélectionnez la formule Premium, puis procédez au paiement via Orange Money, Moov Money ou Wave."
        },
        {
          q: "Comment annuler mon abonnement ?",
          a: "Vous pouvez annuler votre abonnement à tout moment depuis les paramètres. Vous conserverez l'accès Premium jusqu'à la fin de votre période payée, puis repasserez automatiquement en version gratuite."
        },
        {
          q: "Puis-je obtenir un remboursement ?",
          a: "Les paiements mensuels ne sont pas remboursables. Pour les abonnements annuels, un remboursement partiel peut être demandé dans les 14 jours suivant la souscription, conformément à notre politique de remboursement."
        },
        {
          q: "Y a-t-il des frais cachés ?",
          a: "Non, absolument aucun frais caché. Le prix affiché est le prix final. Seules les consultations avec des professionnels peuvent engendrer des frais supplémentaires selon leurs tarifs."
        }
      ]
    },
    {
      id: "professionnels",
      title: "Pour les Professionnels",
      icon: Users,
      color: "from-teal-600 to-cyan-600",
      questions: [
        {
          q: "Comment devenir professionnel sur A'lo Maman ?",
          a: "Créez un compte professionnel en sélectionnant votre spécialité lors de l'inscription. Complétez votre profil avec vos diplômes, expérience, et disponibilités. Votre compte sera vérifié par notre équipe avant activation."
        },
        {
          q: "L'inscription est-elle gratuite pour les professionnels ?",
          a: "Oui, l'inscription et l'utilisation de la plateforme sont totalement gratuites pour les professionnels de santé. C'est notre engagement pour améliorer l'accès aux soins en Côte d'Ivoire."
        },
        {
          q: "Comment gérer mes rendez-vous ?",
          a: "Vous disposez d'un agenda professionnel complet pour gérer vos disponibilités, confirmer, reprogrammer ou annuler des rendez-vous. Vous pouvez synchroniser votre agenda avec Google Calendar ou Outlook."
        },
        {
          q: "Comment fixer mes tarifs de consultation ?",
          a: "Vous pouvez définir vos tarifs pour chaque type de consultation dans votre profil professionnel. Vous êtes libre de fixer vos prix et d'indiquer si vous acceptez la CMU."
        },
        {
          q: "A'lo Maman prend-il une commission sur mes consultations ?",
          a: "Non, nous ne prenons aucune commission sur vos consultations. Vous recevez l'intégralité des paiements de vos patients."
        },
        {
          q: "Comment recevoir les paiements de mes consultations ?",
          a: "Les patients vous paient directement via Orange Money, Moov Money ou Wave. Les transactions se font de manière sécurisée et vous recevez immédiatement les fonds."
        }
      ]
    },
    {
      id: "technique",
      title: "Support Technique",
      icon: FileText,
      color: "from-gray-600 to-gray-700",
      questions: [
        {
          q: "L'application est-elle disponible sur mobile ?",
          a: "A'lo Maman est une application web progressive (PWA) accessible depuis n'importe quel navigateur. Vous pouvez l'installer sur votre téléphone comme une application native pour un accès rapide."
        },
        {
          q: "Comment installer l'application sur mon téléphone ?",
          a: "Sur Android : ouvrez A'lo Maman dans Chrome, puis appuyez sur le menu (3 points) et sélectionnez 'Installer l'application'. Sur iOS : ouvrez dans Safari, touchez le bouton partager, puis 'Sur l'écran d'accueil'."
        },
        {
          q: "Puis-je synchroniser mes rendez-vous avec mon calendrier ?",
          a: "Oui, vous pouvez exporter vos rendez-vous vers Google Calendar, Outlook, Apple Calendar et autres via des fichiers iCal (.ics) ou des liens de souscription."
        },
        {
          q: "Que faire si j'ai oublié mon mot de passe ?",
          a: "Cliquez sur 'Mot de passe oublié' sur la page de connexion. Vous recevrez un email avec un lien pour réinitialiser votre mot de passe."
        },
        {
          q: "Comment contacter le support ?",
          a: "Vous pouvez nous contacter via l'email support@alomaman.ci ou par téléphone au +225 07 XX XX XX XX. Nous répondons généralement sous 24 heures."
        },
        {
          q: "J'ai trouvé un bug, comment le signaler ?",
          a: "Merci de nous aider à améliorer A'lo Maman ! Envoyez-nous un email détaillé avec des captures d'écran si possible à support@alomaman.ci. Nous traiterons votre signalement rapidement."
        }
      ]
    }
  ];

  const allQuestions = categories.flatMap(cat => 
    cat.questions.map(q => ({ ...q, category: cat.title }))
  );

  const filteredCategories = categories.map(category => ({
    ...category,
    questions: category.questions.filter(q =>
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 p-4 md:p-8 pb-safe">
      <div className="max-w-5xl mx-auto">
        {/* Bouton retour */}
        <Button
          asChild
          variant="ghost"
          className="mb-4 hover:bg-pink-100 active:scale-95 transition-transform"
        >
          <Link to={createPageUrl('Dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au menu
          </Link>
        </Button>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl shadow-xl mb-6">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Questions Fréquentes
          </h1>
          <p className="text-base md:text-xl text-gray-600 max-w-3xl mx-auto">
            Trouvez rapidement des réponses à vos questions sur A'lo Maman
          </p>
        </div>

        {/* Search Bar */}
        <Card className="shadow-xl border-none mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher une question... (ex: sécurité, paiement, téléconsultation)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-14 text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories & Questions */}
        <div className="space-y-6">
          {filteredCategories.length > 0 ? (
            filteredCategories.map((category) => {
              const Icon = category.icon;
              return (
                <Card key={category.id} className="shadow-lg border-none overflow-hidden">
                  <CardHeader className={`bg-gradient-to-r ${category.color} text-white p-6`}>
                    <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
                      <Icon className="w-6 h-6 md:w-7 md:h-7" />
                      {category.title}
                      <Badge className="ml-auto bg-white/20 text-white border-white/30">
                        {category.questions.length} {category.questions.length > 1 ? 'questions' : 'question'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((q, index) => (
                        <AccordionItem key={index} value={`item-${index}`}>
                          <AccordionTrigger className="text-left hover:text-pink-600 transition-colors font-semibold">
                            {q.q}
                          </AccordionTrigger>
                          <AccordionContent className="text-gray-700 leading-relaxed">
                            {q.a}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="shadow-lg border-none">
              <CardContent className="p-12 text-center">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Aucun résultat trouvé
                </h3>
                <p className="text-gray-500">
                  Essayez avec d'autres mots-clés ou contactez notre support
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Contact Support */}
        <Card className="mt-12 shadow-xl border-2 border-pink-200 bg-gradient-to-br from-pink-50 to-rose-50">
          <CardContent className="p-8 text-center">
            <Heart className="w-12 h-12 text-pink-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Vous n'avez pas trouvé votre réponse ?
            </h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Notre équipe de support est là pour vous aider. Contactez-nous et nous vous répondrons dans les plus brefs délais.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@alomaman.ci"
                className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                support@alomaman.ci
              </a>
              <a
                href="tel:+22507xxxxxxxx"
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-pink-600 font-semibold rounded-lg shadow-md border-2 border-pink-200 hover:bg-pink-50 transition-all"
              >
                📱 +225 07 XX XX XX XX
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      <style jsx>{`
        .pb-safe {
          padding-bottom: max(6rem, env(safe-area-inset-bottom));
        }
      `}</style>
    </div>
  );
}