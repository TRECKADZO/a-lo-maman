import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Search,
  Plus,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Stethoscope,
  Filter,
  TrendingUp
} from "lucide-react";

import PoserQuestion from "../components/questions/PoserQuestion";
import DetailQuestion from "../components/questions/DetailQuestion";
import RepondreQuestion from "../components/questions/RepondreQuestion";
import AuthGuard from "../components/auth/AuthGuard";

export default function QuestionsSpecialistes() {
  const [vue, setVue] = useState("toutes");
  const [questionSelectionnee, setQuestionSelectionnee] = useState(null);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categorieFiltre, setCategorieFiltre] = useState("toutes");

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: profilPro } = useQuery({
    queryKey: ['profil_professionnel', user?.email],
    queryFn: async () => {
      if (!user) return null;
      const profils = await base44.entities.Professionnel.filter({ email: user.email });
      return profils[0] || null;
    },
    enabled: !!user,
  });

  const isSpecialist = !!profilPro;

  const { data: questions = [], refetch } = useQuery({
    queryKey: ['questions_specialistes'],
    queryFn: () => base44.entities.QuestionSpecialiste.list('-created_date'),
    refetchInterval: 10000,
  });

  const categories = [
    { id: "toutes", label: "Toutes" },
    { id: "grossesse", label: "Grossesse" },
    { id: "accouchement", label: "Accouchement" },
    { id: "postpartum", label: "Post-Partum" },
    { id: "allaitement", label: "Allaitement" },
    { id: "pediatrie", label: "Pédiatrie" },
    { id: "nutrition", label: "Nutrition" },
    { id: "vaccination", label: "Vaccination" },
    { id: "contraception", label: "Contraception" },
    { id: "developpement", label: "Développement" },
    { id: "sante_generale", label: "Santé Générale" }
  ];

  const questionsFiltrees = questions.filter(q => {
    const matchSearch = q.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       q.question?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategorie = categorieFiltre === "toutes" || q.categorie === categorieFiltre;
    
    let matchVue = true;
    if (vue === "mes_questions") {
      matchVue = q.auteur_email === user?.email;
    } else if (vue === "mes_reponses" && isSpecialist) {
      matchVue = q.reponses?.some(r => r.professionnel_id === profilPro?.id);
    } else if (vue === "sans_reponse") {
      matchVue = !q.reponses || q.reponses.length === 0;
    } else if (vue === "urgentes") {
      matchVue = q.urgence === "urgente" || q.urgence === "importante";
    }
    
    return matchSearch && matchCategorie && matchVue;
  });

  const stats = {
    total: questions.length,
    en_attente: questions.filter(q => q.statut === "en_attente").length,
    repondues: questions.filter(q => q.statut === "repondue" || q.statut === "resolue").length,
    mes_questions: questions.filter(q => q.auteur_email === user?.email).length,
  };

  const getUrgenceBadge = (urgence) => {
    const config = {
      urgente: { color: "bg-red-100 text-red-800", icon: AlertCircle },
      importante: { color: "bg-orange-100 text-orange-800", icon: AlertCircle },
      normale: { color: "bg-gray-100 text-gray-800", icon: Clock },
    };
    const { color, icon: Icon } = config[urgence] || config.normale;
    return (
      <Badge className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {urgence?.charAt(0).toUpperCase() + urgence?.slice(1)}
      </Badge>
    );
  };

  const getStatutBadge = (question) => {
    if (question.statut === "resolue") {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Résolue</Badge>;
    }
    if (question.reponses?.length > 0) {
      return <Badge className="bg-blue-100 text-blue-800"><MessageSquare className="w-3 h-3 mr-1" />{question.reponses.length} réponse(s)</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Sans réponse</Badge>;
  };

  if (questionSelectionnee) {
    return (
      <AuthGuard>
        <DetailQuestion
          question={questionSelectionnee}
          onBack={() => {
            setQuestionSelectionnee(null);
            refetch();
          }}
          isSpecialist={isSpecialist}
          profilPro={profilPro}
          currentUser={user}
        />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-full bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Stethoscope className="w-8 h-8 text-purple-600" />
                Questions aux Spécialistes
              </h1>
              <p className="text-gray-600 mt-1">Posez vos questions et obtenez des réponses d'experts</p>
            </div>
            <Button onClick={() => setAfficherFormulaire(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Poser une question
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-none shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Sans réponse</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.en_attente}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Répondues</p>
                    <p className="text-2xl font-bold text-green-600">{stats.repondues}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Mes questions</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.mes_questions}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres et recherche */}
          <Card className="border-none shadow-lg">
            <CardContent className="p-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Rechercher une question..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={categorieFiltre}
                  onChange={(e) => setCategorieFiltre(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm"
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Onglets */}
          <Tabs value={vue} onValueChange={setVue}>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
              <TabsTrigger value="toutes">Toutes</TabsTrigger>
              <TabsTrigger value="sans_reponse">Sans réponse</TabsTrigger>
              <TabsTrigger value="urgentes">Urgentes</TabsTrigger>
              <TabsTrigger value="mes_questions">Mes questions</TabsTrigger>
              {isSpecialist && <TabsTrigger value="mes_reponses">Mes réponses</TabsTrigger>}
            </TabsList>
          </Tabs>

          {/* Liste des questions */}
          <div className="space-y-4">
            {questionsFiltrees.map((question) => (
              <Card
                key={question.id}
                className="border-none shadow-lg hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setQuestionSelectionnee(question)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg mb-2">{question.titre}</CardTitle>
                      <p className="text-gray-600 text-sm line-clamp-2">{question.question}</p>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {getUrgenceBadge(question.urgence)}
                      {getStatutBadge(question)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{categories.find(c => c.id === question.categorie)?.label}</Badge>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {question.nombre_vues || 0}
                      </span>
                      <span>Par {question.anonyme ? "Anonyme" : question.auteur_nom}</span>
                    </div>
                    <span>{new Date(question.created_date).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {questionsFiltrees.length === 0 && (
              <Card className="border-none shadow-lg">
                <CardContent className="p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">Aucune question trouvée</h3>
                  <p className="text-gray-500">Soyez le premier à poser une question !</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {afficherFormulaire && (
          <PoserQuestion
            onClose={() => setAfficherFormulaire(false)}
            onSuccess={() => {
              setAfficherFormulaire(false);
              refetch();
            }}
            user={user}
          />
        )}
      </div>
    </AuthGuard>
  );
}