import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  FileText,
  Activity,
  MessageSquare,
  Heart,
  Loader2,
  Bell,
  CheckCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

import MesRendezVousPatient from '@/components/espacesante/MesRendezVousPatient';
import DocumentsMedicaux from '@/components/espacesante/DocumentsMedicaux';
import MetriquesSante from '@/components/espacesante/MetriquesSante';
import MessagerieSante from '@/components/espacesante/MessagerieSante';
import RappelsWidget from '@/components/rappels/RappelsWidget';
import SwipeableTabs from '@/components/navigation/SwipeableTabs';

export default function MonEspaceSante() {
  const [activeTab, setActiveTab] = useState('rendez-vous');

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilMaman, isLoading: profileLoading } = useQuery({
    queryKey: ['profilMaman', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profiles = await base44.entities.ProfilMaman.filter({ created_by: user.email });
      return profiles[0] || null;
    },
    enabled: !!user,
  });

  const { data: rendezVous = [] } = useQuery({
    queryKey: ['mes_rendez_vous', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.RendezVous.filter({ created_by: user.email }, '-date_rdv');
    },
    enabled: !!user,
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents_medicaux', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.DocumentMedical.filter({ patient_email: user.email });
    },
    enabled: !!user,
  });

  const { data: metriques = [] } = useQuery({
    queryKey: ['metriques_sante', user?.email],
    queryFn: async () => {
      if (!user) return [];
      return await base44.entities.MetriqueSante.filter({ created_by: user.email });
    },
    enabled: !!user,
  });

  const rdvAVenir = rendezVous.filter(rdv => 
    new Date(rdv.date_rdv) > new Date() && rdv.statut !== 'annule'
  ).length;

  const rdvPasses = rendezVous.filter(rdv => 
    new Date(rdv.date_rdv) < new Date() && rdv.statut === 'termine'
  ).length;

  if (userLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-pink-50 to-purple-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Chargement de votre espace santé...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { value: 'rendez-vous', label: 'Rendez-vous', icon: Calendar },
    { value: 'documents', label: 'Documents', icon: FileText },
    { value: 'metriques', label: 'Santé', icon: Activity },
    { value: 'messagerie', label: 'Messages', icon: MessageSquare }
  ];

  const renderTabContent = () => {
    switch(activeTab) {
      case 'rendez-vous':
        return <MesRendezVousPatient userEmail={user?.email} />;
      case 'documents':
        return <DocumentsMedicaux userEmail={user?.email} />;
      case 'metriques':
        return <MetriquesSante userEmail={user?.email} userProfile={profilMaman} />;
      case 'messagerie':
        return <MessagerieSante userEmail={user?.email} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 flex items-center gap-3 mb-2 break-words">
            <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl shadow-lg md:hidden flex-shrink-0">
              <Heart className="w-6 h-6 md:w-8 md:h-8 text-white" />
            </div>
            <span className="truncate">Mon Espace Santé</span>
          </h1>
          <p className="text-sm md:text-base text-gray-600 ml-0 md:ml-16 break-words">
            Gérez vos rendez-vous, documents et santé
          </p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-none shadow-md overflow-hidden active:scale-95 transition-transform">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-blue-600">{rdvAVenir}</p>
                  <p className="text-xs text-gray-600 truncate">RDV à venir</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-none shadow-md overflow-hidden active:scale-95 transition-transform">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 md:w-8 md:h-8 text-green-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-green-600">{rdvPasses}</p>
                  <p className="text-xs text-gray-600 truncate">Consultations</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-none shadow-md overflow-hidden active:scale-95 transition-transform">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 md:w-8 md:h-8 text-purple-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-purple-600">{documents.length}</p>
                  <p className="text-xs text-gray-600 truncate">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-none shadow-md overflow-hidden active:scale-95 transition-transform">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center gap-2">
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-orange-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xl md:text-2xl font-bold text-orange-600">{metriques.length}</p>
                  <p className="text-xs text-gray-600 truncate">Métriques</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Widget Rappels */}
        <RappelsWidget userEmail={user?.email} />

        {/* Mobile: Swipeable Tabs / Desktop: Regular Tabs */}
        <div className="lg:hidden">
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all active:scale-95 ${
                    activeTab === tab.value
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <SwipeableTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          >
            {renderTabContent()}
          </SwipeableTabs>
        </div>

        {/* Desktop: Standard Tabs */}
        <div className="hidden lg:block">
          <div className="flex gap-2 mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === tab.value
                      ? 'bg-pink-500 text-white shadow-md'
                      : 'bg-white text-gray-700 border hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {renderTabContent()}
          </div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}