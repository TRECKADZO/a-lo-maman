import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Stethoscope, MessageSquare, Shield, Lock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function MessagerieProfessionnels() {
  const avantages = [
    {
      icon: Lock,
      titre: "Messagerie sécurisée",
      description: "Communications chiffrées de bout en bout pour protéger vos échanges médicaux"
    },
    {
      icon: Stethoscope,
      titre: "Accès direct aux spécialistes",
      description: "Gynécologues, sages-femmes, pédiatres disponibles pour répondre à vos questions"
    },
    {
      icon: Shield,
      titre: "Confidentialité garantie",
      description: "Vos conversations restent strictement confidentielles et conformes au secret médical"
    },
    {
      icon: CheckCircle,
      titre: "Réponses rapides",
      description: "Obtenez des réponses à vos questions de santé sans attendre un rendez-vous"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="shadow-xl border-none bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Messagerie Sécurisée avec les Professionnels
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Communiquez directement avec votre équipe médicale en toute sécurité
            </p>
          </CardContent>
        </Card>

        {/* Avantages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {avantages.map((avantage, i) => (
            <Card key={i} className="shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <avantage.icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">{avantage.titre}</h3>
                    <p className="text-sm text-gray-600">{avantage.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comment ça marche */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Comment utiliser la messagerie ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Trouvez un professionnel</p>
                  <p className="text-sm text-gray-600">
                    Rendez-vous dans la section "Professionnels" et choisissez un spécialiste
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Démarrez une conversation</p>
                  <p className="text-sm text-gray-600">
                    Cliquez sur "Contacter" sur le profil du professionnel
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Échangez en toute sécurité</p>
                  <p className="text-sm text-gray-600">
                    Posez vos questions, partagez des documents, recevez des conseils personnalisés
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="flex-1 bg-teal-600 hover:bg-teal-700">
            <Link to={createPageUrl('Teleconsultation')}>
              <Stethoscope className="w-5 h-5 mr-2" />
              Trouver un professionnel
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-1">
            <Link to={createPageUrl('Messagerie')}>
              <MessageSquare className="w-5 h-5 mr-2" />
              Mes conversations
            </Link>
          </Button>
        </div>

        {/* Sécurité */}
        <Card className="shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Shield className="w-12 h-12 text-green-600 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-green-900 mb-2 text-lg">
                  Vos échanges sont 100% sécurisés
                </h3>
                <ul className="space-y-2 text-sm text-green-800">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Chiffrement AES-256 des messages</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Conformité RGPD et secret médical</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Serveurs sécurisés en Côte d'Ivoire</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>Vos données ne sont jamais partagées</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}