import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Stethoscope,
  Search,
  Filter,
  MapPin,
  Star,
  CheckCircle,
  Calendar,
  Video,
  Phone,
  Briefcase,
  Home,
  Hospital,
  Globe,
  CreditCard
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import DetailsProfessionnel from "../components/teleconsultation/DetailsProfessionnel";
import MesRendezVous from "../components/teleconsultation/MesRendezVous";
import FiltresAvances from "../components/teleconsultation/FiltresAvances";

export default function Teleconsultation() {
  const [vue, setVue] = useState("recherche"); // "recherche" ou "mes-rdv"
  const [professionnelSelectionne, setProfessionnelSelectionne] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [specialiteFiltre, setSpecialiteFiltre] = useState("toutes");
  const [regionFiltre, setRegionFiltre] = useState("toutes");
  const [typeConsultationFiltre, setTypeConsultationFiltre] = useState("tous");
  const [jourDispoFiltre, setJourDispoFiltre] = useState(null); // Changé en null pour le calendrier

  // Nouveaux filtres avancés
  const [filtresAvances, setFiltresAvances] = useState({
    accepte_cmu: false,
    disponible_weekend: false,
    langues: [],
    assurances: []
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // Check if the current user is a professional
  const { data: profilPro } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    },
    enabled: !!user,
  });

  // Determines if the current user is a specialist by checking if they have a professional profile
  const isSpecialist = !!profilPro;

  const { data: professionnels, isLoading: loadingPros } = useQuery({
    queryKey: ['professionnels'],
    queryFn: () => base44.entities.Professionnel.list(),
    initialData: [],
  });

  const { data: mesRendezVous, isLoading: loadingRdv } = useQuery({
    queryKey: ['mesRendezVous', user?.email],
    queryFn: async () => {
      if (!user) return [];
      const rdvs = await base44.entities.RendezVous.filter(
        { created_by: user.email },
        '-date_rdv'
      );
      return rdvs;
    },
    enabled: !!user,
    initialData: [],
  });

  const specialites = [
    { value: "gynecologie", label: "Gynécologie" },
    { value: "pediatrie", label: "Pédiatrie" },
    { value: "sage_femme", label: "Sage-femme" },
    { value: "medecin_generaliste", label: "Médecin généraliste" },
    { value: "infirmier", label: "Infirmier(ère)" },
    { value: "nutritionniste", label: "Nutritionniste" }
  ];

  const typesConsultation = [
    { value: "visio", label: "Vidéoconsultation", icon: Video },
    { value: "cabinet", label: "Cabinet", icon: Briefcase },
    { value: "clinique", label: "Clinique", icon: Hospital },
    { value: "hopital", label: "Hôpital", icon: Hospital },
    { value: "telephone", label: "Téléphone", icon: Phone },
  ];

  const regions = [
    "Abidjan",
    "Agnéby-Tiassa",
    "Bafing",
    "Bagoué",
    "Bélier",
    "Béré",
    "Bounkani",
    "Cavally",
    "Folon",
    "Gbêkê",
    "Gbôklé",
    "Gôh",
    "Gontougo",
    "Grands-Ponts",
    "Guémon",
    "Hambol",
    "Haut-Sassandra",
    "Iffou",
    "Indénié-Djuablin",
    "Kabadougou",
    "La Mé",
    "Lôh-Djiboua",
    "Marahoué",
    "Moronou",
    "N'Zi",
    "Nawa",
    "Poro",
    "San-Pédro",
    "Sud-Comoé",
    "Tchologo",
    "Tonkpi",
    "Worodougou",
    "Yamoussoukro"
  ].sort();

  const joursSemaineMap = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  const professionnelsFiltres = professionnels.filter(pro => {
    const matchSearch =
      pro.nom_complet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.ville?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.specialite?.toLowerCase().includes(searchQuery.toLowerCase()) || // Added specialite to search
      pro.structure_sante?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchSpecialite = specialiteFiltre === "toutes" || pro.specialite === specialiteFiltre;
    const matchRegion = regionFiltre === "toutes" || pro.region === regionFiltre;

    const matchTypeConsultation = typeConsultationFiltre === "tous" ||
      (pro.types_consultation_offerts && pro.types_consultation_offerts.includes(typeConsultationFiltre));

    const jourSelectionne = jourDispoFiltre ? joursSemaineMap[jourDispoFiltre.getDay()] : null;
    const matchJourDispo = !jourSelectionne ||
        (pro.disponibilites && pro.disponibilites.some(d => d.jour === jourSelectionne));

    // Filtres avancés
    const matchCMU = !filtresAvances.accepte_cmu || pro.accepte_cmu === true;
    
    const matchWeekend = !filtresAvances.disponible_weekend || 
      (pro.disponibilites && pro.disponibilites.some(d => 
        d.jour === 'Samedi' || d.jour === 'Dimanche'
      ));

    const matchLangues = !filtresAvances.langues || filtresAvances.langues.length === 0 ||
      (pro.langues && filtresAvances.langues.some(langue => pro.langues.includes(langue)));

    const matchAssurances = !filtresAvances.assurances || filtresAvances.assurances.length === 0 ||
      (pro.assurances_acceptees && filtresAvances.assurances.some(assurance => 
        pro.assurances_acceptees.includes(assurance)
      ));

    return matchSearch && matchSpecialite && matchRegion && matchTypeConsultation && 
           matchJourDispo && matchCMU && matchWeekend && matchLangues && matchAssurances;
  });

  const stats = {
    total_pros: professionnels.length,
    acceptent_cmu: professionnels.filter(p => p.accepte_cmu).length,
    mes_rdv: mesRendezVous.filter(r => r.statut !== 'termine' && r.statut !== 'annule').length
  };

  if (professionnelSelectionne) {
    return (
      <div className="min-h-full bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <DetailsProfessionnel
            professionnel={professionnelSelectionne}
            onClose={() => setProfessionnelSelectionne(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-teal-50 via-white to-cyan-50 p-4 md:p-8" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Card className="shadow-lg border-none overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 truncate">Professionnels</p>
                  <p className="text-2xl md:text-3xl font-bold text-teal-600">{stats.total_pros}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{professionnelsFiltres.length} après filtres</p>
                </div>
                <Stethoscope className="w-10 h-10 md:w-12 md:h-12 text-teal-200 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 truncate">Acceptent CMU</p>
                  <p className="text-2xl md:text-3xl font-bold text-green-600">{stats.acceptent_cmu}</p>
                </div>
                <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-200 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-none overflow-hidden">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-600 truncate">Mes RDV actifs</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600">{stats.mes_rdv}</p>
                </div>
                <Calendar className="w-10 h-10 md:w-12 md:h-12 text-blue-200 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Onglets */}
        <Tabs value={vue} onValueChange={setVue}>
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="recherche" className="flex items-center gap-2 py-3">
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="truncate text-xs md:text-sm">Trouver un professionnel</span>
            </TabsTrigger>
            <TabsTrigger value="mes-rdv" className="flex items-center gap-2 py-3">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              <span className="truncate text-xs md:text-sm">Mes rendez-vous ({stats.mes_rdv})</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Vue Recherche */}
        {vue === "recherche" && (
          <>
            {/* Barre de recherche principale */}
            <Card className="shadow-lg border-none">
              <CardContent className="p-4 md:p-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 flex-shrink-0" />
                  <Input
                    placeholder="Rechercher par nom, spécialité, ville..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12 text-base md:text-lg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Filtres de base */}
            <Card className="shadow-lg border-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Filter className="w-5 h-5 text-teal-600 flex-shrink-0" />
                  <span className="truncate">Filtres de base</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block truncate">Spécialité</label>
                    <select
                      value={specialiteFiltre}
                      onChange={(e) => setSpecialiteFiltre(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm md:text-base"
                    >
                      <option value="toutes">Toutes les spécialités</option>
                      {specialites.map(spec => (
                        <option key={spec.value} value={spec.value}>{spec.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block truncate">Région</label>
                    <select
                      value={regionFiltre}
                      onChange={(e) => setRegionFiltre(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm md:text-base"
                    >
                      <option value="toutes">Toutes les régions</option>
                      {regions.map(region => (
                        <option key={region} value={region}>{region}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block truncate">Mode de consultation</label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={typeConsultationFiltre === 'tous' ? 'default' : 'outline'}
                      onClick={() => setTypeConsultationFiltre('tous')}
                      size="sm"
                      className={`active:scale-95 transition-transform ${typeConsultationFiltre === 'tous' ? 'bg-teal-600' : ''}`}
                    >
                      Tous
                    </Button>
                    {typesConsultation.map(type => {
                      const Icon = type.icon;
                      return (
                        <Button
                          key={type.value}
                          variant={typeConsultationFiltre === type.value ? 'default' : 'outline'}
                          onClick={() => setTypeConsultationFiltre(type.value)}
                          size="sm"
                          className={`flex items-center gap-2 active:scale-95 transition-transform ${typeConsultationFiltre === type.value ? 'bg-teal-600' : ''}`}
                        >
                          <Icon className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate text-xs md:text-sm">{type.label}</span>
                        </Button>
                      )
                    })}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Jour de disponibilité</label>
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <CalendarComponent
                      mode="single"
                      selected={jourDispoFiltre}
                      onSelect={setJourDispoFiltre}
                      locale={fr}
                      className="rounded-md border"
                    />
                    {jourDispoFiltre && (
                      <div className="p-4 bg-teal-50 rounded-lg flex-1">
                        <p className="font-semibold text-teal-800">Date sélectionnée:</p>
                        <p className="text-lg text-teal-900">{format(jourDispoFiltre, "EEEE d MMMM yyyy", { locale: fr })}</p>
                        <Button variant="link" size="sm" className="p-0 h-auto text-teal-600" onClick={() => setJourDispoFiltre(null)}>
                          Effacer la sélection
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filtres avancés */}
            <FiltresAvances
              filtres={filtresAvances}
              onFiltresChange={setFiltresAvances}
            />

            {/* Liste des professionnels */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {professionnelsFiltres.map((pro) => (
                <Card
                  key={pro.id}
                  className="shadow-lg hover:shadow-xl transition-all cursor-pointer border-none active:scale-[0.98] overflow-hidden"
                  onClick={() => setProfessionnelSelectionne(pro)}
                >
                  <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                        {pro.photo ? (
                          <img src={pro.photo} alt={pro.nom_complet} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-xl md:text-2xl font-bold text-white">
                            {pro.nom_complet?.charAt(0) || "P"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base md:text-lg truncate">{pro.nom_complet}</CardTitle>
                        <Badge className="mt-1 bg-teal-100 text-teal-800 truncate max-w-full inline-block">
                          {pro.specialite?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 md:pt-6 space-y-3 md:space-y-4 p-4">
                    <div className="space-y-2 md:space-y-3">
                      {pro.ville && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{pro.ville}, {pro.region}</span>
                        </div>
                      )}

                      {pro.structure_sante && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                           <Briefcase className="w-4 h-4 mt-0.5 flex-shrink-0" />
                           <span className="truncate">{pro.structure_sante}</span>
                        </div>
                      )}

                      {pro.langues && pro.langues.length > 0 && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <Globe className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1 min-w-0">
                            {pro.langues.slice(0, 3).map((langue, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs truncate">
                                {langue}
                              </Badge>
                            ))}
                            {pro.langues.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{pro.langues.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {pro.assurances_acceptees && pro.assurances_acceptees.length > 0 && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="truncate">{pro.assurances_acceptees.length} assurance(s)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 gap-2">
                        {pro.accepte_cmu && (
                          <Badge className="bg-green-100 text-green-800 truncate">
                            <CheckCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                            CMU
                          </Badge>
                        )}

                        {pro.note_moyenne && (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{pro.note_moyenne}/5</span>
                            <span className="text-xs text-gray-500">({pro.nombre_avis})</span>
                          </div>
                        )}
                    </div>

                    <Button className="w-full bg-teal-600 hover:bg-teal-700 active:scale-95 transition-transform">
                      <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">Voir le profil</span>
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {professionnelsFiltres.length === 0 && !loadingPros && (
                <Card className="col-span-full shadow-lg">
                  <CardContent className="p-8 md:p-12 text-center">
                    <Stethoscope className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg md:text-xl font-semibold text-gray-600 mb-2 break-words">
                      Aucun professionnel trouvé
                    </h3>
                    <p className="text-gray-500 break-words">
                      Essayez de modifier vos critères de recherche
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Vue Mes rendez-vous */}
        {vue === "mes-rdv" && (
          <MesRendezVous
            rendezVous={mesRendezVous}
            professionnels={professionnels}
            currentUserEmail={user?.email}
            isSpecialist={isSpecialist}
          />
        )}
      </div>
    </div>
  );
}