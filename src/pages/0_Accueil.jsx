import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import NaissanceCTA from "@/components/naissance/NaissanceCTA";
import {
  Heart,
  Baby,
  Users,
  Stethoscope,
  Sparkles,
  Shield,
  Calendar,
  MessageSquare,
  CheckCircle,
  ArrowRight,
  Star,
  Lock,
  Globe,
  Zap,
  UserPlus,
  LogIn,
  LogOut,
  Settings,
  Activity,
  Brain,
  BookOpen,
  Target,
  TrendingUp,
  Bell,
  FileText,
  Video,
  Pill,
  Building2,
  FolderOpen,
  Share2
} from "lucide-react";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';

export default function Accueil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
    retry: false,
  });

  const { data: profiles } = useQuery({
    queryKey: ['user_profiles', user?.email],
    queryFn: async () => {
      if (!user) return { maman: null, pro: null };
      
      const [mamanProfiles, proProfiles] = await Promise.all([
        base44.entities.ProfilMaman.filter({ created_by: user.email }).catch(() => []),
        base44.entities.Professionnel.list().catch(() => [])
      ]);
      
      const proProfil = proProfiles.find(p => p.email === user.email);
      
      return {
        maman: mamanProfiles[0] || null,
        pro: proProfil || null
      };
    },
    enabled: !!user,
  });

  const profilPro = profiles?.pro;

  const handleLogout = async () => {
    try {
      localStorage.clear();
      queryClient.clear();
      if (base44.auth.logout) await base44.auth.logout();
      navigate(createPageUrl('0_Accueil'), { replace: true });
      setTimeout(() => window.location.reload(), 100);
    } catch (error) {
      window.location.href = createPageUrl('0_Accueil');
    }
  };

  const handleSignup = async () => {
    console.log('🔵 Signup clicked, redirecting to login...');
    try {
      await base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('❌ Error redirecting to login:', error);
      alert('Erreur lors de la redirection. Veuillez réessayer.');
    }
  };

  const fonctionnalites = [
    {
      icon: Baby,
      titre: "Suivi de Grossesse Intelligent",
      description: "Suivez semaine par semaine avec conseils IA personnalisés, journal photo et alertes automatiques",
      color: "from-pink-500 to-rose-500",
      badge: "IA"
    },
    {
      icon: Activity,
      titre: "Carnets de Santé Numériques",
      description: "Vaccins, croissance, jalons de développement détaillés avec détection précoce des retards",
      color: "from-blue-500 to-cyan-500",
      badge: "Nouveau"
    },
    {
      icon: FolderOpen,
      titre: "DMP Intelligent",
      description: "Dossier médical partagé sécurisé avec catégorisation, recherche avancée et autorisations granulaires",
      color: "from-indigo-500 to-purple-500",
      badge: "Nouveau"
    },
    {
      icon: Building2,
      titre: "Portail Cliniques",
      description: "Recherchez et prenez RDV directement avec des cliniques partenaires certifiées FHIR",
      color: "from-cyan-500 to-teal-500",
      badge: "Nouveau"
    },
    {
      icon: Video,
      titre: "Téléconsultations HD",
      description: "Consultez spécialistes en vidéo avec partage documents et ordonnances en temps réel",
      color: "from-teal-500 to-emerald-500",
      badge: "Amélioré"
    },
    {
      icon: MessageSquare,
      titre: "Messagerie Temps Réel",
      description: "Chat sécurisé avec professionnels, partage documents médicaux et réception d'ordonnances",
      color: "from-orange-500 to-amber-500",
      badge: "Amélioré"
    },
    {
      icon: Sparkles,
      titre: "Assistant IA Santé 24/7",
      description: "Réponses instantanées validées médicalement, analyse de symptômes et recommandations",
      color: "from-amber-500 to-yellow-500",
      badge: "IA"
    },
    {
      icon: Share2,
      titre: "Partage Famille Sécurisé",
      description: "Partagez les carnets avec la famille avec permissions granulaires et traçabilité",
      color: "from-rose-500 to-pink-500",
      badge: null
    }
  ];

  const metriquesImpact = [
    { nombre: "95%", label: "Taux de détection précoce", icon: Target },
    { nombre: "40+", label: "Jalons développement suivis", icon: Brain },
    { nombre: "24/7", label: "Messagerie temps réel", icon: MessageSquare },
    { nombre: "FHIR", label: "Interopérabilité certifiée", icon: Shield }
  ];

  const avantagesPlatform = [
    { icon: Shield, titre: "Conformité FHIR", desc: "Interopérabilité certifiée avec les systèmes hospitaliers" },
    { icon: Lock, titre: "AES-256 Chiffré", desc: "Chiffrement militaire pour vos données médicales" },
    { icon: Globe, titre: "DMP Sécurisé", desc: "Dossier médical partagé avec autorisations granulaires" },
    { icon: Sparkles, titre: "IA Validée", desc: "Conseils santé validés médicalement 24/7" }
  ];

  const temoignages = [
    {
      nom: "Aïcha K.",
      role: "Maman de 2 enfants, Abidjan",
      texte: "Le DMP sécurisé me permet de partager facilement les documents médicaux de mes enfants avec les spécialistes. La messagerie instantanée est très pratique !",
      note: 5,
      avatar: "👩🏾"
    },
    {
      nom: "Dr. Koné",
      role: "Pédiatre, CHU Cocody",
      texte: "L'intégration FHIR avec notre système hospitalier simplifie énormément le suivi. Je peux recevoir et envoyer des ordonnances directement par chat !",
      note: 5,
      avatar: "👨🏾‍⚕️"
    },
    {
      nom: "Clinique Sainte Marie",
      role: "Maternité privée, Plateau",
      texte: "Le portail clinique nous permet de gérer tous nos RDV en un endroit. L'accès aux DMP patients avec leur autorisation facilite le travail.",
      note: 5,
      avatar: "🏥"
    }
  ];

  const avantages = [
    { icon: CheckCircle, text: "100% Gratuit" },
    { icon: CheckCircle, text: "Compatible CMU" },
    { icon: CheckCircle, text: "Support en français" },
    { icon: CheckCircle, text: "Données chiffrées" },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Header pour utilisateurs connectés */}
      {user && (
        <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-14 md:h-16 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-shrink">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Heart className="w-4 h-4 md:w-5 md:h-5 text-white fill-white" />
                </div>
                <h2 className="text-sm md:text-xl font-bold text-gray-900 hidden sm:block truncate">A'lo Maman</h2>
              </div>

              <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                <Button asChild variant="outline" size="sm" className="h-8 md:h-9 px-2 md:px-3">
                  <Link to={createPageUrl('Dashboard')}>
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                    <span className="hidden md:inline text-xs">Mon Espace</span>
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8 md:h-9 px-2 md:px-3">
                  <Link to={createPageUrl(profilPro ? 'ProfilProfessionnel' : 'Parametres')}>
                    <Settings className="w-3 h-3 md:w-4 md:h-4 md:mr-2" />
                    <span className="hidden md:inline text-xs">Paramètres</span>
                  </Link>
                </Button>
                <Button variant="outline" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 md:h-9 px-2 md:px-3">
                  <LogOut className="w-3 h-3 md:w-4 md:h-4 md:mr-1" />
                  <span className="text-xs">Déconnexion</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section - Design moderne */}
      <div className="relative overflow-hidden bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 min-h-[90vh] flex items-center">
        {/* Éléments décoratifs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-purple-400/20 rounded-full blur-2xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-white"
            >
              <Badge className="bg-white/20 text-white border-white/30 mb-6 text-sm md:text-base px-4 py-1.5 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 mr-2" />
                Plateforme IA de santé maternelle et infantile
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
                Votre santé et celle de vos enfants,<br />
                <span className="bg-gradient-to-r from-white to-pink-200 bg-clip-text text-transparent">
                  entre de bonnes mains
                </span>
              </h1>

              <p className="text-lg md:text-xl mb-8 text-white/90 leading-relaxed max-w-xl">
               A'lo Maman accompagne les familles avec un suivi intelligent de grossesse, 
               des carnets de santé numériques avec <strong>détection précoce des retards</strong>, 
               un <strong>DMP sécurisé</strong> et un accès instantané à des cliniques et spécialistes certifiés.
              </p>

              {/* Boutons CTA */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {!userLoading && !user ? (
                  <>
                    <Button
                      onClick={handleSignup}
                      size="lg"
                      className="bg-white text-pink-600 hover:bg-pink-50 px-8 py-6 text-lg shadow-2xl h-auto font-bold group"
                    >
                      <UserPlus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Créer un compte gratuit
                    </Button>
                    <Button
                      onClick={async () => {
                        console.log('🔵 Login clicked');
                        await base44.auth.redirectToLogin(createPageUrl('Dashboard'));
                      }}
                      size="lg"
                      className="bg-white/20 text-white hover:bg-white/30 border-2 border-white/50 px-8 py-6 text-lg h-auto font-semibold backdrop-blur-sm"
                    >
                      <LogIn className="w-5 h-5 mr-2" />
                      Se connecter
                    </Button>
                  </>
                ) : user ? (
                  <Button asChild size="lg" className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-6 text-lg shadow-2xl h-auto font-bold group">
                    <Link to={createPageUrl('Dashboard')}>
                      <Sparkles className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Mon Tableau de bord
                    </Link>
                  </Button>
                ) : null}
              </div>

              {/* Avantages */}
              <div className="grid grid-cols-2 gap-3">
                {avantages.map((avantage, i) => (
                  <div key={i} className="flex items-center gap-2 text-white/90">
                    <avantage.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-sm font-medium">{avantage.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Image Hero */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl shadow-2xl">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f581a271fd9d0a4b7128e5/c0d3064ce_shared_image_1762984370323.jpg"
                  alt="Mère africaine souriante avec son bébé lors d'une consultation médicale"
                  className="w-full h-[350px] lg:h-[550px] object-cover"
                  style={{ objectPosition: '50% 30%' }}
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                
                {/* Badge photo réelle */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/90 backdrop-blur-sm text-gray-900 shadow-lg border border-white/50 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                    Photo réelle
                  </Badge>
                </div>
                
                {/* Card flottante - visible sur desktop */}
                <div className="absolute bottom-4 right-4 max-w-xs hidden md:block">
                  <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-md">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">Suivi Développement</p>
                          <p className="text-xs text-gray-600">40+ jalons suivis par enfant</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
                        <Target className="w-4 h-4 text-green-600" />
                        <p className="text-xs font-medium text-green-800">Détection précoce à 95%</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Métriques d'impact */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metriquesImpact.map((metric, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <metric.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-white mb-1">{metric.nombre}</p>
                <p className="text-gray-400 text-sm">{metric.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Avantages Plateforme */}
      <div className="bg-gradient-to-br from-gray-50 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="bg-indigo-100 text-indigo-800 mb-4 text-base px-4 py-1.5">
              <Zap className="w-4 h-4 mr-2" />
              Plateforme Professionnelle
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Standards internationaux de qualité et sécurité
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {avantagesPlatform.map((avantage, i) => {
              const Icon = avantage.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="border-none shadow-lg hover:shadow-xl transition-all h-full">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-md">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="font-bold text-gray-900 mb-2">{avantage.titre}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{avantage.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <p className="text-3xl font-bold text-indigo-600 mb-2">FHIR v4.0</p>
                <p className="text-sm text-gray-700 font-medium">Standard d'interopérabilité healthcare</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-purple-600 mb-2">RGPD</p>
                <p className="text-sm text-gray-700 font-medium">Conformité protection données</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-pink-600 mb-2">ISO 27001</p>
                <p className="text-sm text-gray-700 font-medium">Sécurité information certifiée</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Déclaration Naissance - Pour utilisateurs connectés */}
      {user && profiles?.maman && (
        <div className="py-16 bg-gradient-to-br from-pink-50 to-purple-50">
          <div className="max-w-4xl mx-auto px-4">
            <NaissanceCTA variant="full" />
          </div>
        </div>
      )}

      {/* Fonctionnalités */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-pink-100 text-pink-800 mb-4 text-base px-4 py-1.5">
              <Zap className="w-4 h-4 mr-2" />
              Fonctionnalités Avancées
            </Badge>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              Tout pour votre santé familiale
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Des outils intelligents pour un suivi complet de la grossesse et du développement de vos enfants
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {fonctionnalites.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="group h-full hover:shadow-2xl transition-all duration-300 border-none hover:-translate-y-2 bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <feature.icon className="w-7 h-7 text-white" />
                      </div>
                      {feature.badge && (
                        <Badge className={`text-xs ${feature.badge === 'IA' ? 'bg-purple-100 text-purple-800' : feature.badge === 'Nouveau' ? 'bg-blue-100 text-blue-800' : feature.badge === 'Premium' ? 'bg-amber-100 text-amber-800' : 'bg-pink-100 text-pink-800'}`}>
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.titre}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Section Développement Enfant - Mise en avant */}
      <div className="py-20 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-purple-100 text-purple-800 mb-4 text-base px-4 py-1.5">
                <Brain className="w-4 h-4 mr-2" />
                Suivi du Développement
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Détection précoce des retards de développement
              </h2>
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                Suivez plus de <strong>40 jalons de développement</strong> dans 7 domaines clés : 
                moteur global, moteur fin, langage réceptif et expressif, cognitif, social-émotionnel et autonomie.
              </p>

              <div className="space-y-4">
                {[
                  { icon: Target, text: "Détection précoce avant l'âge d'alerte", color: "text-green-600" },
                  { icon: Activity, text: "Scores par domaine avec visualisation", color: "text-blue-600" },
                  { icon: Bell, text: "Alertes automatiques en cas de retard", color: "text-amber-600" },
                  { icon: FolderOpen, text: "DMP avec recherche et catégorisation", color: "text-indigo-600" },
                  { icon: Building2, text: "Prise RDV directe avec cliniques", color: "text-teal-600" },
                  { icon: MessageSquare, text: "Chat temps réel avec professionnels", color: "text-orange-600" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm">
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                    <span className="text-gray-800 font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { domaine: "Moteur", score: 92, color: "from-blue-500 to-cyan-500" },
                { domaine: "Langage", score: 78, color: "from-green-500 to-emerald-500" },
                { domaine: "Cognitif", score: 88, color: "from-purple-500 to-violet-500" },
                { domaine: "Social", score: 95, color: "from-pink-500 to-rose-500" }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="border-none shadow-xl overflow-hidden">
                    <CardContent className={`p-6 bg-gradient-to-br ${item.color} text-white`}>
                      <p className="text-sm font-medium text-white/80 mb-1">{item.domaine}</p>
                      <p className="text-4xl font-bold mb-2">{item.score}%</p>
                      <div className="w-full bg-white/30 rounded-full h-2">
                        <div className="bg-white rounded-full h-2" style={{ width: `${item.score}%` }}></div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sécurité */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-green-100 text-green-800 mb-4 text-base px-4 py-1.5">
              <Shield className="w-4 h-4 mr-2" />
              Sécurité & Confidentialité
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vos données sont protégées
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Lock, title: "Chiffrement AES-256", desc: "Toutes vos données médicales sont chiffrées avec le standard militaire", color: "from-green-500 to-emerald-500", bg: "from-green-50 to-emerald-50" },
              { icon: Shield, title: "Conformité FHIR & RGPD", desc: "Interopérabilité certifiée avec hôpitaux et respect total du RGPD", color: "from-blue-500 to-cyan-500", bg: "from-blue-50 to-cyan-50" },
              { icon: FileText, title: "Autorisations DMP", desc: "Contrôlez précisément qui accède à vos documents médicaux avec traçabilité", color: "from-purple-500 to-violet-500", bg: "from-purple-50 to-violet-50" }
            ].map((item, i) => (
              <Card key={i} className={`border-none shadow-xl bg-gradient-to-br ${item.bg}`}>
                <CardContent className="p-8 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <item.icon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-gray-900">{item.title}</h3>
                  <p className="text-gray-700 leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Témoignages */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="bg-amber-100 text-amber-800 mb-4 text-base px-4 py-1.5">Témoignages</Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Ils nous font confiance</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {temoignages.map((t, i) => (
              <Card key={i} className="border-none shadow-xl hover:shadow-2xl transition-all">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.note)].map((_, j) => (
                      <Star key={j} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 italic mb-6 leading-relaxed">"{t.texte}"</p>
                  <div className="flex items-center gap-4 pt-4 border-t">
                    <div className="text-4xl">{t.avatar}</div>
                    <div>
                      <p className="font-bold text-gray-900">{t.nom}</p>
                      <p className="text-sm text-gray-600">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Final */}
      <div className="py-20 bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-block p-4 bg-white/20 rounded-3xl backdrop-blur-sm mb-6">
              <Heart className="w-16 h-16 text-white fill-white" />
            </div>
            
            <h2 className="text-3xl md:text-5xl font-extrabold mb-6">
              {user ? 'Bienvenue sur A\'lo Maman' : 'Prête à commencer ?'}
            </h2>
            <p className="text-xl mb-10 text-white/90 max-w-2xl mx-auto">
              {user 
                ? 'Accédez à toutes vos fonctionnalités de santé maternelle et infantile' 
                : 'Rejoignez des milliers de familles qui font confiance à A\'lo Maman'
              }
            </p>

            {!userLoading && !user ? (
              <Button onClick={handleSignup} size="lg" className="bg-white text-pink-600 hover:bg-gray-100 px-10 py-7 text-lg shadow-2xl h-auto font-bold group">
                Créer mon compte maintenant
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            ) : user ? (
              <Button asChild size="lg" className="bg-white text-pink-600 hover:bg-gray-100 px-10 py-7 text-lg shadow-2xl h-auto font-bold group">
                <Link to={createPageUrl('Dashboard')}>
                  Accéder à mon tableau de bord
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            ) : null}

            <p className="text-sm mt-8 text-white/80">{!user && '✓ 100% Gratuit • ✓ Accessible à tous • ✓ Sécurisé'}</p>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white fill-white" />
                </div>
                <h3 className="text-2xl font-bold">A'lo Maman</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                La plateforme IA de santé maternelle et infantile certifiée FHIR. 
                DMP sécurisé, téléconsultations avec partage documents, messagerie temps réel, 
                recherche de cliniques et détection précoce des retards de développement.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Liens utiles</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link to={createPageUrl('Conditions')} className="hover:text-white">Conditions d'utilisation</Link></li>
                <li><Link to={createPageUrl('Politique')} className="hover:text-white">Politique de confidentialité</Link></li>
                <li><Link to={createPageUrl('FAQ')} className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400">
                <li>📧 support@alomaman.ci</li>
                <li>📱 +225 07 XX XX XX XX</li>
                <li>📍 Abidjan, Côte d'Ivoire</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-400 text-sm">
            <p>© 2025 A'lo Maman. Tous droits réservés.</p>
            <p className="mt-2 text-xs">🔒 Données médicales chiffrées et sécurisées • Made with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
}