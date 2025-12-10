import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Baby,
  Syringe,
  TrendingUp,
  Calendar,
  AlertCircle,
  Heart,
  Activity,
  Edit,
  FileText,
  Star,
  Share2,
  Users
} from "lucide-react";
import { format, differenceInMonths } from "date-fns";
import { fr } from "date-fns/locale";


import GraphiqueCroissance from "./GraphiqueCroissance";
import JalonsDeveloppement from "./JalonsDeveloppement";
import AnalyseCroissanceIA from './AnalyseCroissanceIA';
import HistoriqueMedical from './HistoriqueMedical';
import PremieresExperiences from './PremieresExperiences';
import GestionCertificats from '../documents/GestionCertificats';
import EditAllergies from "./modals/EditAllergies";
import EditInfosGenerales from "./modals/EditInfosGenerales";
import PartagerCarnet from "./PartagerCarnet";
import SuiviVaccins from "./SuiviVaccins";
import CourbesCroissanceEnhanced from '../visualizations/CourbesCroissanceEnhanced';

export default function ProfilEnfant({ enfant, onRetour, isEditable = false }) {
  const [onglet, setOnglet] = useState("infos");
  const [modalOpen, setModalOpen] = useState(null);
  const [showPartage, setShowPartage] = useState(false);

  const calculateAge = (dateNaissance) => {
    const mois = differenceInMonths(new Date(), new Date(dateNaissance));
    if (mois < 12) return `${mois} mois`;
    const annees = Math.floor(mois / 12);
    const moisRestants = mois % 12;
    return moisRestants > 0 ? `${annees} ans ${moisRestants} mois` : `${annees} ans`;
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8" style={{ paddingBottom: 'max(6rem, env(safe-area-inset-bottom))' }}>
      <Button variant="outline" onClick={onRetour} className="flex items-center gap-2">
        <ArrowLeft className="w-4 h-4" />
        Retour
      </Button>

      {/* En-tête profil */}
      <Card className="shadow-xl border-none">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center">
              {enfant.photo ? (
                <img src={enfant.photo} alt={enfant.prenom} className="w-full h-full rounded-full object-cover" />
              ) : (
                <Baby className="w-12 h-12 text-white" />
              )}
            </div>
            <div className="flex-1">
              <CardTitle className="text-3xl mb-2">
                {enfant.prenom} {enfant.nom}
              </CardTitle>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="text-sm">
                  {calculateAge(enfant.date_naissance)}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  {enfant.sexe}
                </Badge>
                {enfant.groupe_sanguin && (
                  <Badge className="bg-red-100 text-red-800">
                    {enfant.groupe_sanguin}
                  </Badge>
                )}
                {(enfant.partages_famille?.length > 0) && (
                  <Badge className="bg-pink-100 text-pink-800">
                    <Users className="w-3 h-3 mr-1" />
                    Partagé ({enfant.partages_famille.length})
                  </Badge>
                )}
              </div>
            </div>
            {isEditable && (
              <Button 
                variant="outline" 
                onClick={() => setShowPartage(true)}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Partager
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Onglets */}
      <Tabs value={onglet} onValueChange={setOnglet}>
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-8">
          <TabsTrigger value="infos">
            <Heart className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Infos</span>
          </TabsTrigger>
          <TabsTrigger value="premieres">
            <Star className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">1ères fois</span>
          </TabsTrigger>
          <TabsTrigger value="vaccins">
            <Syringe className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Vaccins</span>
          </TabsTrigger>
          <TabsTrigger value="croissance">
            <TrendingUp className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Croissance</span>
          </TabsTrigger>
          <TabsTrigger value="jalons">
            <Activity className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Jalons</span>
          </TabsTrigger>
          <TabsTrigger value="medical">
            <Activity className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Médical</span>
          </TabsTrigger>
          <TabsTrigger value="analyse">
            <Activity className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">IA</span>
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-1 md:mr-2" />
            <span className="hidden md:inline">Docs</span>
          </TabsTrigger>
        </TabsList>

        {/* Onglet Informations */}
        <TabsContent value="infos" className="space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Informations générales</CardTitle>
              {isEditable && (
                <Button variant="outline" size="sm" onClick={() => setModalOpen('infos')}>
                  <Edit className="w-4 h-4 mr-2" /> Modifier
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Date de naissance</p>
                  <p className="font-semibold">{format(new Date(enfant.date_naissance), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
                {enfant.numero_cmu && (
                  <div>
                    <p className="text-sm text-gray-600">Numéro CMU</p>
                    <p className="font-semibold">{enfant.numero_cmu}</p>
                  </div>
                )}
                {enfant.identifiant_provisoire && (
                   <div>
                    <p className="text-sm text-gray-600">Identifiant Provisoire</p>
                    <p className="font-semibold">{enfant.identifiant_provisoire}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600">Poids à la naissance</p>
                  <p className="font-semibold">{enfant.poids_naissance} kg</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Taille à la naissance</p>
                  <p className="font-semibold">{enfant.taille_naissance} cm</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Allergies */}
          {enfant.allergies && enfant.allergies.length > 0 && (
            <Card className="shadow-lg border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  Allergies
                </CardTitle>
                 {isEditable && (
                  <Button variant="outline" size="sm" onClick={() => setModalOpen('allergies')}>
                    <Edit className="w-4 h-4 mr-2" /> Gérer
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {enfant.allergies.map((allergie, i) => (
                    <Badge key={i} className="bg-red-100 text-red-800">
                      {allergie}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Maladies chroniques */}
          {enfant.maladies_chroniques && enfant.maladies_chroniques.length > 0 && (
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Maladies chroniques</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {enfant.maladies_chroniques.map((maladie, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span>{maladie}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Onglet Premières Expériences */}
        <TabsContent value="premieres">
          <PremieresExperiences enfant={enfant} isEditable={isEditable} />
        </TabsContent>

        {/* Onglet Vaccins */}
        <TabsContent value="vaccins">
          <SuiviVaccins enfant={enfant} isEditable={isEditable} />
        </TabsContent>

        {/* Onglet Croissance */}
        <TabsContent value="croissance">
          <CourbesCroissanceEnhanced enfant={enfant} />
        </TabsContent>

        {/* Onglet Jalons */}
        <TabsContent value="jalons">
          <JalonsDeveloppement enfant={enfant} isEditable={isEditable} />
        </TabsContent>

        {/* Onglet Historique Médical */}
        <TabsContent value="medical">
          <HistoriqueMedical enfant={enfant} isEditable={isEditable} />
        </TabsContent>

        {/* Onglet Analyse IA */}
        <TabsContent value="analyse">
          <AnalyseCroissanceIA enfant={enfant} />
        </TabsContent>

        {/* Onglet Documents */}
        <TabsContent value="documents">
          <GestionCertificats enfantId={enfant.id} />
        </TabsContent>
      </Tabs>
      
      {/* Modales de modification */}
      {isEditable && modalOpen === 'allergies' && (
        <EditAllergies enfant={enfant} onClose={() => setModalOpen(null)} />
      )}
      {isEditable && modalOpen === 'infos' && (
        <EditInfosGenerales enfant={enfant} onClose={() => setModalOpen(null)} />
      )}

      {/* Modal partage */}
      {showPartage && (
        <PartagerCarnet enfant={enfant} onClose={() => setShowPartage(false)} />
      )}
    </div>
  );
}