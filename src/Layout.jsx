import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Home,
  Heart,
  Calendar,
  Baby,
  Users,
  Stethoscope,
  Menu,
  Bell,
  Settings,
  LogOut,
  HeartPulse,
  MessageSquare,
  Loader2,
  Sparkles,
  FolderOpen,
  BookOpen
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import InstallPWA from "@/components/general/InstallPWA";
import InstallPWADesktop from "@/components/general/InstallPWADesktop";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import FloatingChatButton from "@/components/chatbot/FloatingChatButton";
import NotificationToast from "@/components/notifications/NotificationToast";
import LiveChatWidget from "@/components/support/LiveChatWidget";
import AppointmentReminders from "@/components/notifications/AppointmentReminders";
import MessageNotifications from "@/components/notifications/MessageNotifications";
import RappelsChecker from "@/components/notifications/RappelsChecker";
import VaccinNotificationService from "@/components/notifications/VaccinNotificationService";
import ABTestProvider from "@/components/analytics/ABTestProvider";
import FeedbackWidget from "@/components/analytics/FeedbackWidget";
import OfflineManager from "@/components/offline/OfflineManager";
import ServiceWorkerRegistration from "@/components/offline/ServiceWorkerRegistration";

const getNavigationItems = (lang, isSpecialist, isAdmin) => {
    if (isAdmin) {
      const items = {
        fr: [
          { title: "Accueil", url: createPageUrl("0_Accueil"), icon: Home, color: "text-pink-500" },
          { title: "Analytics", url: createPageUrl("AdminAnalytics"), icon: Sparkles, color: "text-purple-500" },
          { title: "Modèle tarifaire", url: createPageUrl("ModeleTarifaire"), icon: Users, color: "text-amber-500" },
        ],
        en: [
          { title: "Home", url: createPageUrl("0_Accueil"), icon: Home, color: "text-pink-500" },
          { title: "Analytics", url: createPageUrl("AdminAnalytics"), icon: Sparkles, color: "text-purple-500" },
          { title: "Pricing Model", url: createPageUrl("ModeleTarifaire"), icon: Users, color: "text-amber-500" },
        ],
      };
      return items[lang] || items.fr;
    }
    if (isSpecialist) {
      const items = {
        fr: [
          { title: "Accueil", url: createPageUrl("0_Accueil"), icon: Home, color: "text-pink-500" },
          { title: "Tableau de bord", url: createPageUrl("Dashboard"), icon: Sparkles, color: "text-teal-500" },
          { title: "Mon Agenda", url: createPageUrl("MonAgenda"), icon: Calendar, color: "text-blue-500" },
          { title: "Configurer mon agenda", url: createPageUrl("ConfigurerAgenda"), icon: Settings, color: "text-indigo-500" },
          { title: "Mes Patients", url: createPageUrl("MesPatients"), icon: Users, color: "text-purple-500" },
          { title: "Messagerie", url: createPageUrl("Messagerie"), icon: MessageSquare, color: "text-orange-500" },
          { title: "Communauté", url: createPageUrl("Communaute"), icon: Users, color: "text-amber-500" },
          { title: "Famille", url: createPageUrl("FamilleConnectee"), icon: Heart, color: "text-rose-500" },
        ],
        en: [
          { title: "Home", url: createPageUrl("0_Accueil"), icon: Home, color: "text-pink-500" },
          { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Sparkles, color: "text-teal-500" },
          { title: "My Schedule", url: createPageUrl("MonAgenda"), icon: Calendar, color: "text-blue-500" },
          { title: "Configure Schedule", url: createPageUrl("ConfigurerAgenda"), icon: Settings, color: "text-indigo-500" },
          { title: "My Patients", url: createPageUrl("MesPatients"), icon: Users, color: "text-purple-500" },
          { title: "Messaging", url: createPageUrl("Messagerie"), icon: MessageSquare, color: "text-orange-500" },
          { title: "Community", url: createPageUrl("Communaute"), icon: Users, color: "text-amber-500" },
        { title: "Family", url: createPageUrl("FamilleConnectee"), icon: Heart, color: "text-rose-500" },
        ],
      };
      return items[lang] || items.fr;
    } else {
    const items = {
      fr: [
        { title: "Accueil", url: createPageUrl("0_Accueil"), icon: Home, color: "text-pink-500" },
        { title: "Tableau de bord", url: createPageUrl("Dashboard"), icon: Sparkles, color: "text-purple-500" },
        { title: "Mon Espace Santé", url: createPageUrl("MonEspaceSante"), icon: HeartPulse, color: "text-purple-500" },
        { title: "Assistant IA", url: createPageUrl("AssistantIA"), icon: Sparkles, color: "text-indigo-500" },
        { title: "Contraception", url: createPageUrl("Contraception"), icon: Heart, color: "text-rose-500" },
        { title: "Suivi Grossesse", url: createPageUrl("Grossesse"), icon: HeartPulse, color: "text-pink-600" },
        { title: "Carnets Enfants", url: createPageUrl("Enfants"), icon: Baby, color: "text-blue-500" },
        { title: "Professionnels", url: createPageUrl("Teleconsultation"), icon: Stethoscope, color: "text-teal-500" },
        { title: "Messagerie", url: createPageUrl("Messagerie"), icon: MessageSquare, color: "text-orange-500" },
        { title: "Communauté", url: createPageUrl("Communaute"), icon: Users, color: "text-amber-500" },
        { title: "Famille", url: createPageUrl("FamilleConnectee"), icon: Heart, color: "text-rose-500" },
        { title: "Documents", url: createPageUrl("MesDocuments"), icon: FolderOpen, color: "text-indigo-500" },
                      { title: "Ressources", url: createPageUrl("Ressources"), icon: BookOpen, color: "text-emerald-500" },
                  ],
                  en: [
        { title: "Home", url: createPageUrl("0_Accueil"), icon: Home, color: "text-pink-500" },
        { title: "Dashboard", url: createPageUrl("Dashboard"), icon: Sparkles, color: "text-purple-500" },
        { title: "My Health Portal", url: createPageUrl("MonEspaceSante"), icon: HeartPulse, color: "text-purple-500" },
        { title: "AI Assistant", url: createPageUrl("AssistantIA"), icon: Sparkles, color: "text-indigo-500" },
        { title: "Contraception", url: createPageUrl("Contraception"), icon: Heart, color: "text-rose-500" },
        { title: "Pregnancy Tracking", url: createPageUrl("Grossesse"), icon: HeartPulse, color: "text-pink-600" },
        { title: "Children's Records", url: createPageUrl("Enfants"), icon: Baby, color: "text-blue-500" },
        { title: "Specialists", url: createPageUrl("Teleconsultation"), icon: Stethoscope, color: "text-teal-500" },
        { title: "Messaging", url: createPageUrl("Messagerie"), icon: MessageSquare, color: "text-orange-500" },
        { title: "Community", url: createPageUrl("Communaute"), icon: Users, color: "text-amber-500" },
        { title: "Family", url: createPageUrl("FamilleConnectee"), icon: Heart, color: "text-rose-500" },
        { title: "Documents", url: createPageUrl("MesDocuments"), icon: FolderOpen, color: "text-indigo-500" },
                      { title: "Resources", url: createPageUrl("Ressources"), icon: BookOpen, color: "text-emerald-500" },
                    ],
                  };
                  return items[lang] || items.fr;
  }
};

const mamanBottomNavItems = [
  { title: "Accueil", url: "0_Accueil", icon: Home },
  { title: "Tableau de bord", url: "Dashboard", icon: Sparkles },
  { title: "Rappels", url: "MesRappels", icon: Bell },
  { title: "Spécialistes", url: "Teleconsultation", icon: Stethoscope },
  { title: "Menu", url: "#", icon: Menu },
];

const proBottomNavItems = [
  { title: "Accueil", url: "0_Accueil", icon: Home },
  { title: "Dashboard", url: "Dashboard", icon: Sparkles },
  { title: "Patients", url: "MesPatients", icon: Users },
  { title: "Messages", url: "Messagerie", icon: MessageSquare },
  { title: "Menu", url: "#", icon: Menu },
];

const getPageTitle = (pageName, lang) => {
  const titles = {
    fr: {
      "0_Accueil": "Accueil",
      "Dashboard": "Tableau de bord",
      "MonEspaceSante": "Mon Espace Santé",
      "MesRendezVous": "Mes Rendez-vous",
      "MesRappels": "Mes Rappels",
      "Calendrier": "Calendrier",
      "AssistantIA": "Assistant IA",
      "Contraception": "Contraception",
      "Cycle": "Cycle & Fertilité",
      "Grossesse": "Suivi Grossesse",
      "Enfants": "Carnets Enfants",
      "Teleconsultation": "Professionnels",
      "Messagerie": "Messagerie",
      "Communaute": "Communauté",
      "Parametres": "Paramètres",
      "Tarifs": "Abonnement",
      "Paiement": "Paiement",
      "Conditions": "Conditions d'utilisation",
      "Politique": "Politique de confidentialité",
      "SelectionCompte": "Choix du profil",
      "MonAgenda": "Mon Agenda",
      "ConfigurerAgenda": "Configurer mon agenda",
      "MesPatients": "Mes Patients",
      "DossierPatient": "Dossier Patient",
      "IntroSlides": "Bienvenue",
      "Intro": "Bienvenue",
      "ProfilProfessionnel": "Mon Profil"
    },
    en: {
      "0_Accueil": "Home",
      "Dashboard": "Dashboard",
      "MonEspaceSante": "My Health Portal",
      "MesRendezVous": "My Appointments",
      "MesRappels": "My Reminders",
      "Calendrier": "Calendar",
      "AssistantIA": "AI Assistant",
      "Contraception": "Contraception",
      "Cycle": "Cycle & Fertility",
      "Grossesse": "Pregnancy Tracking",
      "Enfants": "Children's Records",
      "Teleconsultation": "Specialists",
      "Messagerie": "Messaging",
      "Communaute": "Community",
      "Parametres": "Settings",
      "Tarifs": "Subscription",
      "Paiement": "Payment",
      "Conditions": "Terms of Use",
      "Politique": "Privacy Policy",
      "SelectionCompte": "Account Selection",
      "MonAgenda": "My Schedule",
      "ConfigurerAgenda": "Configure Schedule",
      "MesPatients": "My Patients",
      "DossierPatient": "Patient File",
      "IntroSlides": "Welcome",
      "Intro": "Welcome",
      "ProfilProfessionnel": "My Profile"
    }
  };
  return (titles[lang] || titles.fr)[pageName] || pageName;
};

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
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
    retry: false,
  });

  const isSpecialist = !!profiles?.pro;
  const isAdmin = user?.role === 'admin';
  const currentProfile = profiles?.pro || profiles?.maman;
  const lang = currentProfile?.langue_preferee === 'anglais' ? 'en' : 'fr';
  const theme = currentProfile?.theme_prefere || 'clair';

  const navigationItems = getNavigationItems(lang, isSpecialist, isAdmin);
  const currentBottomNavItems = isSpecialist ? proBottomNavItems : mamanBottomNavItems;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme === 'sombre' ? 'dark' : 'light');

    document.title = "A'lo Maman - Santé Maternelle & Infantile";

    const themeColor = theme === 'sombre' ? "#111827" : (isSpecialist ? "#14B8A6" : "#FF6B9D");
    const head = document.head;
    
    const setMeta = (key, content, isProperty = false) => {
      const attributeName = isProperty ? 'property' : 'name';
      let element = head.querySelector(`meta[${attributeName}="${key}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attributeName, key);
        head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    setMeta('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    setMeta('theme-color', themeColor);

    // PWA meta tags pour mode standalone
    setMeta('apple-mobile-web-app-capable', 'yes');
    setMeta('mobile-web-app-capable', 'yes');
    setMeta('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMeta('apple-mobile-web-app-title', "A'lo Maman");

    // Meta tags pour masquer l'interface du navigateur
    setMeta('apple-touch-fullscreen', 'yes');
    setMeta('format-detection', 'telephone=no');
  }, [theme, isSpecialist]);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      queryClient.clear();
      
      if (base44.auth.logout) {
        await base44.auth.logout();
      }
      
      navigate(createPageUrl('0_Accueil'), { replace: true });
      
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      window.location.href = createPageUrl('0_Accueil');
    }
  };

  const publicPagesDisplay = ['IntroSlides', 'Intro', 'Inscription', 'Connexion', 'Conditions', 'Politique', 'SelectionCompte', '0_Accueil'];
  if (publicPagesDisplay.includes(currentPageName)) {
    return <>{children}</>;
  }

  if (!user || !currentProfile) {
    return <>{children}</>;
  }

  const primaryColor = isSpecialist ? '#14B8A6' : '#FF6B9D';
  const primaryGradient = isSpecialist 
    ? 'from-teal-400 to-cyan-500' 
    : 'from-pink-400 to-rose-500';

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --color-primary: ${primaryColor};
          --safe-area-inset-top: env(safe-area-inset-top, 0px);
          --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
          --safe-area-inset-left: env(safe-area-inset-left, 0px);
          --safe-area-inset-right: env(safe-area-inset-right, 0px);
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        
        input, textarea, select {
          -webkit-user-select: text;
          user-select: text;
        }

        /* Optimisations scroll mobile */
        .mobile-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          scroll-behavior: smooth;
        }

        /* Hide scrollbar but keep functionality */
        .mobile-scroll::-webkit-scrollbar {
          display: none;
        }

        .mobile-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        /* Safe area bottom pour mobile */
        .bottom-nav-safe {
          padding-bottom: calc(env(safe-area-inset-bottom) + 0.5rem);
        }

        /* Prevent pull-to-refresh sur toute l'app */
        body {
          overscroll-behavior-y: contain;
        }
      `}</style>
      
      <div className="min-h-screen flex w-full bg-white">
        {/* Sidebar - Desktop cachée, accessible via Menu sur mobile */}
        <Sidebar className="hidden lg:flex border-r">
          <SidebarHeader className="border-b p-6">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 bg-gradient-to-br ${primaryGradient} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}>
                {isSpecialist ? <Stethoscope className="w-7 h-7 text-white" /> : <Heart className="w-7 h-7 text-white fill-white" />}
              </div>
              <div>
                <h2 className="font-bold text-xl">A'lo Maman</h2>
                <p className="text-xs text-gray-500">
                  {isSpecialist ? (lang === 'fr' ? 'Espace Professionnel' : 'Professional Space') : (lang === 'fr' ? 'Santé Maternelle' : 'Maternal Health')}
                </p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild className={`transition-all rounded-xl mb-2 py-6 ${isActive ? `bg-gradient-to-r ${isSpecialist ? 'from-teal-100 to-cyan-100' : 'from-pink-100 to-rose-100'} shadow-sm` : 'hover:bg-gray-50'}`}>
                          <Link to={item.url} className="flex items-center gap-3 px-4">
                            <item.icon className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500'}`} />
                            <span className={`font-medium ${isActive ? 'text-gray-800' : 'text-gray-600'}`}>{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t p-4">
            {user && (
              <div className="space-y-3">
                <div className={`flex items-center gap-3 p-3 bg-gradient-to-r ${isSpecialist ? 'from-teal-50 to-cyan-50' : 'from-pink-50 to-purple-50'} rounded-xl`}>
                  <div className={`w-10 h-10 bg-gradient-to-br ${primaryGradient} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-sm">{(currentProfile?.display_name || currentProfile?.nom_complet || user.full_name)?.[0]?.toUpperCase() || 'U'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{currentProfile?.display_name || currentProfile?.nom_complet || user.full_name || 'Utilisateur'}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" size="sm" className="w-full text-xs">
                    <Link to={createPageUrl(isSpecialist ? 'ProfilProfessionnel' : 'Parametres')}>
                      <Settings className="w-3 h-3 mr-1" />
                      {lang === 'fr' ? (isSpecialist ? 'Profil' : 'Paramètres') : (isSpecialist ? 'Profile' : 'Settings')}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout} className="w-full text-xs text-red-600">
                    <LogOut className="w-3 h-3 mr-1" />Déconnexion
                  </Button>
                </div>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        
        {/* Mobile Layout */}
        <div className="flex-1 flex flex-col lg:hidden h-screen overflow-hidden">
          {/* Header Mobile avec safe area */}
          <header 
            className="bg-white/80 backdrop-blur-sm border-b px-4 py-3 flex items-center justify-between flex-shrink-0 z-10"
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            <h1 className="text-base md:text-lg font-bold truncate flex-1">{getPageTitle(currentPageName, lang)}</h1>
            <NotificationCenter />
          </header>

          {/* Main Content - Scroll optimisé */}
          <main 
            className="flex-1 overflow-y-auto overflow-x-hidden"
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehaviorY: 'contain',
              touchAction: 'pan-y',
              paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))'
            }}
          >
            {children}
          </main>
          
          {/* Bottom Navigation avec safe area */}
          <footer 
            className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t z-50 bottom-nav-safe"
            style={{ 
              paddingBottom: 'env(safe-area-inset-bottom)',
            }}
          >
            <div className="flex justify-around items-center h-16 px-1">
              {currentBottomNavItems.map((item) => {
                const isActive = item.url === currentPageName;
                return item.title === "Menu" ? (
                  <SidebarTrigger key={item.title} asChild>
                    <button className="flex flex-col items-center justify-center text-gray-500 space-y-1 flex-1 py-2 active:scale-95 transition-transform min-w-0">
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-[10px] font-medium truncate max-w-full">Menu</span>
                    </button>
                  </SidebarTrigger>
                ) : (
                  <Link key={item.title} to={createPageUrl(item.url)} className={`flex flex-col items-center justify-center space-y-1 flex-1 py-2 active:scale-95 transition-transform min-w-0 ${isActive ? (isSpecialist ? "text-teal-500" : "text-pink-500") : "text-gray-500"}`}>
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[10px] font-medium truncate max-w-full">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </footer>
        </div>

        {/* Desktop Main */}
        <main className="hidden lg:flex flex-1 flex-col overflow-hidden h-screen">
          <header className="bg-white/80 backdrop-blur-sm border-b px-8 py-4 flex items-center justify-end flex-shrink-0">
            <NotificationCenter />
          </header>
          
          <div className="flex-1 overflow-auto">
            {children}
          </div>
          
          <footer className="text-center p-4 border-t flex-shrink-0">
            <p className="text-xs text-gray-500">© 2025 A'lo Maman. Tous droits réservés.</p>
          </footer>
        </main>
        
        <ABTestProvider>
          <InstallPWA />
          <InstallPWADesktop />
          <FloatingChatButton />
          <LiveChatWidget />
          <FeedbackWidget />
          <OfflineManager />
          <ServiceWorkerRegistration />
          <NotificationToast />
          <AppointmentReminders />
          <MessageNotifications />
          <RappelsChecker />
          <VaccinNotificationService />
        </ABTestProvider>
        </div>
        </SidebarProvider>
        );
        }