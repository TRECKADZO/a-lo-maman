import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  Baby,
  Users,
  Stethoscope,
  Sparkles,
  Shield,
  Lock,
  FileText,
  UserPlus,
  CheckCircle
} from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function Intro() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
    retry: false,
  });

  React.useEffect(() => {
    if (user) {
      navigate(createPageUrl('Dashboard'), { replace: true });
    }
  }, [user, navigate]);

  const features = [
    {
      icon: Baby,
      title: "Suivi Grossesse",
      description: "Suivez votre grossesse semaine par semaine avec des conseils personnalisés",
      color: "from-pink-400 to-rose-500"
    },
    {
      icon: Heart,
      title: "Carnets de Santé",
      description: "Gérez les carnets de santé de vos enfants : vaccins, croissance, jalons",
      color: "from-blue-400 to-cyan-500"
    },
    {
      icon: Stethoscope,
      title: "Téléconsultations",
      description: "Consultez des spécialistes en ligne : gynécologues, pédiatres, sages-femmes",
      color: "from-teal-400 to-emerald-500"
    },
    {
      icon: Sparkles,
      title: "Assistant IA",
      description: "Obtenez des réponses instantanées à vos questions sur la santé",
      color: "from-purple-400 to-violet-500"
    },
    {
      icon: Users,
      title: "Communauté",
      description: "Échangez avec d'autres mamans et des professionnels de santé",
      color: "from-amber-400 to-orange-500"
    },
    {
      icon: Shield,
      title: "100% Sécurisé",
      description: "Chiffrement de bout en bout AES-256 pour toutes vos données médicales",
      color: "from-green-400 to-emerald-500"
    }
  ];

  const testimonials = [
    {
      name: "Aïcha K.",
      role: "Maman de 2 enfants",
      text: "A'lo Maman m'a permis de suivre ma grossesse sereinement. L'assistant IA répond à toutes mes questions !",
      avatar: "👩🏾"
    },
    {
      name: "Dr. Koné",
      role: "Pédiatre",
      text: "Excellente plateforme pour suivre mes patients à distance. Les carnets de santé numériques sont très pratiques.",
      avatar: "👨🏾‍⚕️"
    },
    {
      name: "Fatou M.",
      role: "Future maman",
      text: "Grâce à la communauté, je ne me sens plus seule. J'ai trouvé des réponses et du soutien à toutes mes inquiétudes.",
      avatar: "👩🏿"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-rose-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400/20 to-purple-400/20 backdrop-blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-pink-400 to-rose-500 rounded-3xl flex items-center justify-center shadow-2xl rotate-3 hover:rotate-0 transition-transform">
                <Heart className="w-14 h-14 text-white fill-white" />
              </div>
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              Bienvenue sur<br />
              <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                A'lo Maman
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto leading-relaxed">
              Votre plateforme complète pour la <strong>santé maternelle et infantile</strong>.
              Suivez votre grossesse, gérez la santé de vos enfants, et connectez-vous avec des spécialistes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all w-full sm:w-auto"
              >
                <Link to={createPageUrl('Inscription')}>
                  <UserPlus className="w-5 h-5 mr-2" />
                  Créer un compte gratuit
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 border-pink-500 text-pink-600 hover:bg-pink-50 px-8 py-6 text-lg w-full sm:w-auto"
              >
                <Link to={createPageUrl('Connexion')}>
                  Se connecter
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-none"
            >
              <CardContent className="p-6">
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security & Privacy Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
            Sécurité & Confidentialité
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Vos données de santé sont notre priorité. Nous utilisons les technologies les plus avancées pour protéger vos informations.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-none shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Chiffrement AES-256</h3>
                <p className="text-sm text-gray-600">
                  Toutes vos données médicales sont chiffrées de bout en bout avec le standard militaire AES-256-GCM.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">RGPD Conforme</h3>
                <p className="text-sm text-gray-600">
                  Conformité totale avec les réglementations sur la protection des données personnelles et médicales.
                </p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-purple-50 to-violet-50">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-lg mb-2">Vous gardez le contrôle</h3>
                <p className="text-sm text-gray-600">
                  Vos données vous appartiennent. Vous pouvez les exporter ou les supprimer à tout moment.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">
            Ce qu'ils disent de nous
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-none shadow-lg">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{testimonial.avatar}</div>
                  <p className="text-gray-700 italic mb-4">"{testimonial.text}"</p>
                  <div>
                    <p className="font-semibold text-gray-800">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <Card className="border-none shadow-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white">
          <CardContent className="p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prête à commencer votre aventure ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Rejoignez des milliers de mamans qui font confiance à A'lo Maman
            </p>
            <Button
              size="lg"
              onClick={() => navigate(createPageUrl('Inscription'))}
              className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-6 text-lg shadow-xl transform hover:scale-105 transition-all"
            >
              Créer mon compte gratuitement
              <Heart className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-sm mt-4 opacity-75">
              ✓ 100% Gratuit • ✓ Sans engagement • ✓ Support en français
            </p>
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8">
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Link to={createPageUrl('Conditions')}>
              <Card className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Conditions d'utilisation</h3>
                  <p className="text-sm text-gray-600">
                    Consultez nos conditions générales d'utilisation
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl('Politique')}>
              <Card className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Politique de confidentialité</h3>
                  <p className="text-sm text-gray-600">
                    Découvrez comment nous protégeons vos données
                  </p>
                </CardContent>
              </Card>
            </Link>

            <Link to={createPageUrl('Parametres')}>
              <Card className="border-none shadow-md hover:shadow-xl transition-all cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-800 mb-2">Sécurité des données</h3>
                  <p className="text-sm text-gray-600">
                    Chiffrement de bout en bout et protection maximale
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="text-center text-gray-600 text-sm border-t pt-6">
            <p className="mb-2">
              © 2025 A'lo Maman • Plateforme de santé maternelle et infantile
            </p>
            <p className="text-xs text-gray-500">
              🔒 Vos données médicales sont chiffrées et sécurisées • ✓ Conforme RGPD
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}