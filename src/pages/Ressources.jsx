import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  BookOpen, Search, Heart, Clock, User, ChevronRight,
  Baby, Apple, Brain, Users, Sparkles, Home,
  CheckCircle, Circle, Star, Loader2, ArrowLeft,
  Video, FileText, HelpCircle
} from 'lucide-react';
import { differenceInMonths } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import AuthGuard from '@/components/auth/AuthGuard';
import VideoCard from '@/components/ressources/VideoCard';
import GuideCard from '@/components/ressources/GuideCard';
import FAQSection from '@/components/ressources/FAQSection';
import VideoPlayer from '@/components/ressources/VideoPlayer';

const CATEGORIES = [
  { id: 'all', label: 'Tout', icon: BookOpen },
  { id: 'grossesse', label: 'Grossesse', icon: Heart },
  { id: 'nouveau_ne', label: '0-3 mois', icon: Baby },
  { id: 'nourrisson', label: '3-12 mois', icon: Baby },
  { id: 'bambin', label: '1-3 ans', icon: Baby },
  { id: 'enfant', label: '3-8 ans', icon: Users },
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'sante_mentale', label: 'Bien-être', icon: Sparkles },
  { id: 'soins_quotidiens', label: 'Soins', icon: Home },
];

const AGE_FILTERS = [
  { id: 'tous', label: 'Tous âges' },
  { id: 'grossesse', label: 'Grossesse' },
  { id: '0-3_mois', label: '0-3 mois' },
  { id: '3-6_mois', label: '3-6 mois' },
  { id: '6-12_mois', label: '6-12 mois' },
  { id: '1-2_ans', label: '1-2 ans' },
  { id: '2-3_ans', label: '2-3 ans' },
  { id: '3-6_ans', label: '3-6 ans' },
];

const THEME_FILTERS = [
  { id: 'all', label: 'Tous' },
  { id: 'sommeil', label: 'Sommeil' },
  { id: 'alimentation', label: 'Alimentation' },
  { id: 'premiers_soins', label: 'Premiers soins' },
  { id: 'developpement', label: 'Développement' },
  { id: 'sante', label: 'Santé' },
  { id: 'securite', label: 'Sécurité' },
];

const DOMAINES_ACTIVITES = [
  { id: 'moteur', label: 'Motricité', color: 'bg-blue-100 text-blue-800' },
  { id: 'cognitif', label: 'Cognitif', color: 'bg-purple-100 text-purple-800' },
  { id: 'langage', label: 'Langage', color: 'bg-green-100 text-green-800' },
  { id: 'social', label: 'Social', color: 'bg-pink-100 text-pink-800' },
  { id: 'sensoriel', label: 'Sensoriel', color: 'bg-amber-100 text-amber-800' },
  { id: 'creativite', label: 'Créativité', color: 'bg-rose-100 text-rose-800' },
];

export default function Ressources() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategorie, setSelectedCategorie] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [activeTab, setActiveTab] = useState('articles');
  const [selectedActivite, setSelectedActivite] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [selectedAge, setSelectedAge] = useState('tous');
  const [selectedTheme, setSelectedTheme] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: articles, isLoading: loadingArticles } = useQuery({
    queryKey: ['articles'],
    queryFn: () => base44.entities.Article.list('-date_publication'),
  });

  const { data: articlesLus } = useQuery({
    queryKey: ['articles_lus'],
    queryFn: () => base44.entities.ArticleLu.filter({}),
    enabled: !!user,
  });

  const { data: activites, isLoading: loadingActivites } = useQuery({
    queryKey: ['activites_stimulation'],
    queryFn: () => base44.entities.ActiviteStimulation.list(),
  });

  const { data: ressources, isLoading: loadingRessources } = useQuery({
    queryKey: ['ressources'],
    queryFn: () => base44.entities.Ressource.list('-ordre'),
  });

  const { data: faqs, isLoading: loadingFaqs } = useQuery({
    queryKey: ['faqs'],
    queryFn: () => base44.entities.FAQ.list('ordre'),
  });

  const { data: enfants } = useQuery({
    queryKey: ['mes_enfants'],
    queryFn: () => base44.entities.EnfantCarnet.filter({}),
    enabled: !!user,
  });

  const { data: grossesse } = useQuery({
    queryKey: ['ma_grossesse'],
    queryFn: async () => {
      const grossesses = await base44.entities.SuiviGrossesse.filter({ grossesse_active: true });
      return grossesses[0] || null;
    },
    enabled: !!user,
  });

  const marquerLuMutation = useMutation({
    mutationFn: async (articleId) => {
      const existant = articlesLus?.find(a => a.article_id === articleId);
      if (!existant) {
        await base44.entities.ArticleLu.create({
          article_id: articleId,
          date_lecture: new Date().toISOString()
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles_lus'] }),
  });

  const toggleFavoriMutation = useMutation({
    mutationFn: async (articleId) => {
      const existant = articlesLus?.find(a => a.article_id === articleId);
      if (existant) {
        await base44.entities.ArticleLu.update(existant.id, { favoris: !existant.favoris });
      } else {
        await base44.entities.ArticleLu.create({
          article_id: articleId,
          date_lecture: new Date().toISOString(),
          favoris: true
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['articles_lus'] }),
  });

  const articlesLusIds = useMemo(() => 
    new Set(articlesLus?.map(a => a.article_id) || []),
  [articlesLus]);

  const articlesFavorisIds = useMemo(() => 
    new Set(articlesLus?.filter(a => a.favoris).map(a => a.article_id) || []),
  [articlesLus]);

  // Calculer l'âge du plus jeune enfant pour personnalisation
  const ageEnfantMois = useMemo(() => {
    if (!enfants?.length) return null;
    const ages = enfants.map(e => differenceInMonths(new Date(), new Date(e.date_naissance)));
    return Math.min(...ages);
  }, [enfants]);

  // Filtrer articles
  const articlesFiltres = useMemo(() => {
    if (!articles) return [];
    return articles.filter(article => {
      const matchSearch = !searchQuery || 
        article.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.resume?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        article.tags?.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchCategorie = selectedCategorie === 'all' || article.categorie === selectedCategorie;
      
      return matchSearch && matchCategorie;
    });
  }, [articles, searchQuery, selectedCategorie]);

  // Articles recommandés (basés sur âge enfant ou grossesse)
  const articlesRecommandes = useMemo(() => {
    if (!articles) return [];
    return articles.filter(article => {
      if (grossesse && article.categorie === 'grossesse') return true;
      if (ageEnfantMois !== null && article.age_cible) {
        const { min_mois, max_mois } = article.age_cible;
        if (min_mois !== undefined && max_mois !== undefined) {
          return ageEnfantMois >= min_mois && ageEnfantMois <= max_mois;
        }
      }
      return false;
    }).slice(0, 5);
  }, [articles, grossesse, ageEnfantMois]);

  // Activités filtrées par âge
  const activitesFiltrees = useMemo(() => {
    if (!activites) return [];
    if (ageEnfantMois === null) return activites;
    return activites.filter(a => 
      ageEnfantMois >= a.age_min_mois && ageEnfantMois <= a.age_max_mois
    );
  }, [activites, ageEnfantMois]);

  const articlesNonLus = articlesFiltres.filter(a => !articlesLusIds.has(a.id)).length;

  // Filtrer vidéos et guides
  const videos = useMemo(() => {
    if (!ressources) return [];
    return ressources.filter(r => {
      const isVideo = r.type === 'video';
      const matchAge = selectedAge === 'tous' || r.tranche_age === selectedAge || r.tranche_age === 'tous';
      const matchTheme = selectedTheme === 'all' || r.categorie === selectedTheme;
      const matchSearch = !searchQuery || 
        r.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return isVideo && matchAge && matchTheme && matchSearch;
    });
  }, [ressources, selectedAge, selectedTheme, searchQuery]);

  const guides = useMemo(() => {
    if (!ressources) return [];
    return ressources.filter(r => {
      const isPdf = r.type === 'pdf';
      const matchAge = selectedAge === 'tous' || r.tranche_age === selectedAge || r.tranche_age === 'tous';
      const matchTheme = selectedTheme === 'all' || r.categorie === selectedTheme;
      const matchSearch = !searchQuery || 
        r.titre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return isPdf && matchAge && matchTheme && matchSearch;
    });
  }, [ressources, selectedAge, selectedTheme, searchQuery]);

  const handleDownloadGuide = (guide) => {
    if (guide.url) {
      window.open(guide.url, '_blank');
    }
  };

  // Vue vidéo
  if (selectedVideo) {
    return (
      <AuthGuard>
        <VideoPlayer video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      </AuthGuard>
    );
  }

  if (selectedArticle) {
    return (
      <AuthGuard>
        <div className="min-h-full bg-gray-50 pb-20">
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="max-w-3xl mx-auto p-4 flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(null)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-bold truncate flex-1">{selectedArticle.titre}</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleFavoriMutation.mutate(selectedArticle.id)}
              >
                <Star className={`w-5 h-5 ${articlesFavorisIds.has(selectedArticle.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
              </Button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto p-4">
            {selectedArticle.image_url && (
              <img 
                src={selectedArticle.image_url} 
                alt={selectedArticle.titre}
                className="w-full h-48 object-cover rounded-xl mb-6"
              />
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge>{CATEGORIES.find(c => c.id === selectedArticle.categorie)?.label || selectedArticle.categorie}</Badge>
              {selectedArticle.temps_lecture && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedArticle.temps_lecture} min
                </Badge>
              )}
              {selectedArticle.valide_par_expert && (
                <Badge className="bg-green-100 text-green-800">✓ Validé par expert</Badge>
              )}
            </div>

            {selectedArticle.auteur && (
              <div className="flex items-center gap-3 mb-6 p-3 bg-gray-100 rounded-lg">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{selectedArticle.auteur.nom}</p>
                  <p className="text-xs text-gray-500">{selectedArticle.auteur.specialite}</p>
                </div>
              </div>
            )}

            <div className="prose prose-pink max-w-none">
              <ReactMarkdown>{selectedArticle.contenu}</ReactMarkdown>
            </div>

            {selectedArticle.tags?.length > 0 && (
              <div className="mt-8 pt-4 border-t">
                <p className="text-sm text-gray-500 mb-2">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (selectedActivite) {
    const domaine = DOMAINES_ACTIVITES.find(d => d.id === selectedActivite.domaine);
    return (
      <AuthGuard>
        <div className="min-h-full bg-gray-50 pb-20">
          <div className="bg-white border-b sticky top-0 z-10">
            <div className="max-w-3xl mx-auto p-4 flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setSelectedActivite(null)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="font-bold truncate flex-1">{selectedActivite.titre}</h1>
            </div>
          </div>

          <div className="max-w-3xl mx-auto p-4 space-y-6">
            {selectedActivite.image_url && (
              <img 
                src={selectedActivite.image_url} 
                alt={selectedActivite.titre}
                className="w-full h-48 object-cover rounded-xl"
              />
            )}

            <div className="flex flex-wrap gap-2">
              <Badge className={domaine?.color}>{domaine?.label}</Badge>
              <Badge variant="outline">{selectedActivite.age_min_mois}-{selectedActivite.age_max_mois} mois</Badge>
              {selectedActivite.duree_minutes && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {selectedActivite.duree_minutes} min
                </Badge>
              )}
              <Badge variant="outline">{selectedActivite.difficulte}</Badge>
            </div>

            <p className="text-gray-700">{selectedActivite.description}</p>

            {selectedActivite.materiel?.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Matériel nécessaire</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {selectedActivite.materiel.map((m, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Circle className="w-2 h-2 fill-pink-500 text-pink-500" />
                        {m}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Instructions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{selectedActivite.instructions}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {selectedActivite.benefices?.length > 0 && (
              <Card className="bg-green-50 border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-800">Bénéfices</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {selectedActivite.benefices.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-green-800">
                        <CheckCircle className="w-4 h-4" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-full bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 text-white p-6">
          <h1 className="text-2xl font-bold mb-2">Ressources</h1>
          <p className="text-pink-100 text-sm">Contenu expert adapté à votre situation</p>
          
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/90 text-gray-800"
            />
          </div>
        </div>

        <div className="max-w-4xl mx-auto p-4 space-y-6">
          {/* Filtre par âge global */}
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {AGE_FILTERS.map(age => (
              <Button
                key={age.id}
                size="sm"
                variant={selectedAge === age.id ? 'default' : 'outline'}
                onClick={() => setSelectedAge(age.id)}
                className={`flex-shrink-0 ${selectedAge === age.id ? 'bg-purple-500' : ''}`}
              >
                {age.label}
              </Button>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full h-auto">
              <TabsTrigger value="articles" className="flex flex-col items-center gap-1 py-2 text-xs">
                <BookOpen className="w-4 h-4" />
                Articles
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex flex-col items-center gap-1 py-2 text-xs">
                <Video className="w-4 h-4" />
                Vidéos
              </TabsTrigger>
              <TabsTrigger value="guides" className="flex flex-col items-center gap-1 py-2 text-xs">
                <FileText className="w-4 h-4" />
                Guides
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex flex-col items-center gap-1 py-2 text-xs">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="activites" className="flex flex-col items-center gap-1 py-2 text-xs">
                <Brain className="w-4 h-4" />
                Activités
              </TabsTrigger>
            </TabsList>

            <TabsContent value="articles" className="space-y-6 mt-4">
              {/* Catégories */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={cat.id}
                      variant={selectedCategorie === cat.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategorie(cat.id)}
                      className={`flex-shrink-0 ${selectedCategorie === cat.id ? 'bg-pink-500' : ''}`}
                    >
                      <Icon className="w-4 h-4 mr-1" />
                      {cat.label}
                    </Button>
                  );
                })}
              </div>

              {/* Articles recommandés */}
              {selectedCategorie === 'all' && articlesRecommandes.length > 0 && (
                <div>
                  <h2 className="font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Pour vous
                  </h2>
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {articlesRecommandes.map(article => (
                      <Card 
                        key={article.id}
                        className="flex-shrink-0 w-64 cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => {
                          setSelectedArticle(article);
                          marquerLuMutation.mutate(article.id);
                        }}
                      >
                        {article.image_url && (
                          <img src={article.image_url} alt="" className="h-28 w-full object-cover rounded-t-lg" />
                        )}
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-medium text-sm line-clamp-2">{article.titre}</h3>
                            {!articlesLusIds.has(article.id) && (
                              <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{article.resume}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Liste articles */}
              {loadingArticles ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                </div>
              ) : articlesFiltres.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun article trouvé</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {articlesFiltres.map(article => (
                    <Card 
                      key={article.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        setSelectedArticle(article);
                        marquerLuMutation.mutate(article.id);
                      }}
                    >
                      <CardContent className="p-4 flex gap-4">
                        {article.image_url && (
                          <img 
                            src={article.image_url} 
                            alt="" 
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <h3 className="font-medium line-clamp-2 flex-1">{article.titre}</h3>
                            {!articlesLusIds.has(article.id) && (
                              <div className="w-2 h-2 bg-pink-500 rounded-full flex-shrink-0 mt-2" title="Non lu" />
                            )}
                            {articlesFavorisIds.has(article.id) && (
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{article.resume}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {CATEGORIES.find(c => c.id === article.categorie)?.label}
                            </Badge>
                            {article.temps_lecture && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {article.temps_lecture} min
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 self-center" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Onglet Vidéos */}
            <TabsContent value="videos" className="space-y-4 mt-4">
              {/* Filtres thématiques */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {THEME_FILTERS.map(theme => (
                  <Button
                    key={theme.id}
                    size="sm"
                    variant={selectedTheme === theme.id ? 'default' : 'outline'}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`flex-shrink-0 ${selectedTheme === theme.id ? 'bg-pink-500' : ''}`}
                  >
                    {theme.label}
                  </Button>
                ))}
              </div>

              {loadingRessources ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                </div>
              ) : videos.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune vidéo disponible</p>
                    <p className="text-sm mt-1">Les vidéos d'experts arrivent bientôt !</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {videos.map(video => (
                    <VideoCard 
                      key={video.id}
                      video={video}
                      onClick={() => setSelectedVideo(video)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Onglet Guides PDF */}
            <TabsContent value="guides" className="space-y-4 mt-4">
              {/* Filtres thématiques */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {THEME_FILTERS.map(theme => (
                  <Button
                    key={theme.id}
                    size="sm"
                    variant={selectedTheme === theme.id ? 'default' : 'outline'}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`flex-shrink-0 ${selectedTheme === theme.id ? 'bg-pink-500' : ''}`}
                  >
                    {theme.label}
                  </Button>
                ))}
              </div>

              {loadingRessources ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                </div>
              ) : guides.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun guide disponible</p>
                    <p className="text-sm mt-1">Les guides téléchargeables arrivent bientôt !</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {guides.map(guide => (
                    <GuideCard 
                      key={guide.id}
                      guide={guide}
                      onDownload={handleDownloadGuide}
                      onPreview={(g) => window.open(g.url, '_blank')}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Onglet FAQ */}
            <TabsContent value="faq" className="mt-4">
              {loadingFaqs ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                </div>
              ) : (
                <FAQSection 
                  faqs={faqs || []}
                  selectedAge={selectedAge}
                />
              )}
            </TabsContent>

            <TabsContent value="activites" className="space-y-6 mt-4">
              {ageEnfantMois !== null && (
                <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-purple-800">
                      <Sparkles className="w-4 h-4 inline mr-1" />
                      Activités adaptées pour votre enfant de <strong>{ageEnfantMois} mois</strong>
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Domaines */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {DOMAINES_ACTIVITES.map(domaine => (
                  <Badge key={domaine.id} className={`${domaine.color} cursor-pointer`}>
                    {domaine.label}
                  </Badge>
                ))}
              </div>

              {loadingActivites ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                </div>
              ) : activitesFiltrees.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-gray-500">
                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune activité disponible</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {activitesFiltrees.map(activite => {
                    const domaine = DOMAINES_ACTIVITES.find(d => d.id === activite.domaine);
                    return (
                      <Card 
                        key={activite.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setSelectedActivite(activite)}
                      >
                        <CardContent className="p-4">
                          {activite.image_url && (
                            <img 
                              src={activite.image_url} 
                              alt="" 
                              className="w-full h-32 object-cover rounded-lg mb-3"
                            />
                          )}
                          <Badge className={`${domaine?.color} mb-2`}>{domaine?.label}</Badge>
                          <h3 className="font-medium">{activite.titre}</h3>
                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{activite.description}</p>
                          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
                            <span>{activite.age_min_mois}-{activite.age_max_mois} mois</span>
                            {activite.duree_minutes && (
                              <>
                                <span>•</span>
                                <span>{activite.duree_minutes} min</span>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AuthGuard>
  );
}