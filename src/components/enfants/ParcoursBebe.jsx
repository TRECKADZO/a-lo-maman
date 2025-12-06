import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Baby,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Sparkles,
  Clock,
  ChevronDown,
  Heart,
  Brain,
  Eye,
  Hand,
  Smile,
  ArrowLeft,
  Play
} from "lucide-react";
import { differenceInDays, addWeeks } from "date-fns";
import ArticleDetailBebe from "./ArticleDetailBebe";

// Fonction pour obtenir l'image selon la semaine
const getWeekImage = (week) => {
  // Définir les thèmes par groupe de semaines
  const weekGroups = [
    { max: 0, theme: 'newborn' },      // Naissance
    { max: 1, theme: 'parents_night' }, // Première semaine - parents la nuit
    { max: 2, theme: 'swaddled' },      // Emmailloté
    { max: 3, theme: 'awakening' },     // Éveil
    { max: 4, theme: 'social' },        // Premier mois - mamans café
    { max: 5, theme: 'discovery' },     // Découverte
    { max: 6, theme: 'bath' },          // Bain
    { max: 8, theme: 'play' },          // Jeu
  ];
  
  const normalizedWeek = week % 9;
  return normalizedWeek;
};

// Couleurs de fond par période
const PERIOD_COLORS = {
  newborn: "from-purple-200 via-pink-100 to-purple-200",
  week1: "from-blue-200 via-indigo-100 to-blue-200",
  week2: "from-teal-200 via-cyan-100 to-teal-200",
  week3: "from-green-200 via-emerald-100 to-green-200",
  week4: "from-amber-200 via-yellow-100 to-amber-200",
  month2: "from-pink-200 via-rose-100 to-pink-200",
  month3: "from-violet-200 via-purple-100 to-violet-200",
};

// Données de développement par semaine
const DEVELOPPEMENT_DATA = {
  0: {
    titre: "Nouveau-né",
    sousTitre: "Les premiers jours",
    periode: "Naissance",
    bgColor: PERIOD_COLORS.newborn,
    developpement: {
      moteur: [
        "Réflexes de succion et de préhension présents",
        "Mouvements des bras et jambes non coordonnés",
        "Peut tourner la tête d'un côté à l'autre"
      ],
      sensoriel: [
        "Voit à 20-30 cm (distance du visage de maman)",
        "Reconnaît la voix de maman",
        "Sensible aux odeurs, notamment celle du lait maternel"
      ],
      social: [
        "Recherche le contact visuel",
        "Apaisé par le contact peau à peau",
        "Premiers pleurs de communication"
      ],
      conseils: [
        "Favorisez le peau à peau",
        "Parlez-lui doucement",
        "Répondez rapidement à ses pleurs"
      ]
    }
  },
  1: {
    titre: "Semaine 1",
    sousTitre: "Adaptation au monde",
    periode: "1 semaine",
    bgColor: PERIOD_COLORS.week1,
    developpement: {
      moteur: [
        "Réflexe de Moro encore très présent",
        "Peut soulever légèrement la tête sur le ventre",
        "Mains souvent fermées en poings"
      ],
      sensoriel: [
        "Suit des yeux un objet proche",
        "Réagit aux sons forts",
        "Préfère les contrastes (noir/blanc)"
      ],
      social: [
        "Reconnaît la voix de ses parents",
        "Temps d'éveil courts mais intenses",
        "Cycle de sommeil de 16-18h par jour"
      ],
      conseils: [
        "Établissez des routines douces",
        "Allaitez à la demande",
        "Évitez la sur-stimulation"
      ]
    }
  },
  2: {
    titre: "Semaine 2",
    sousTitre: "Premiers sourires réflexes",
    periode: "2 semaines",
    bgColor: PERIOD_COLORS.week2,
    developpement: {
      moteur: [
        "Mouvements plus fluides",
        "Peut tenir la tête quelques secondes",
        "Réflexe de marche automatique"
      ],
      sensoriel: [
        "Vision s'améliore progressivement",
        "Distingue les voix familières",
        "Sensible à la lumière"
      ],
      social: [
        "Premiers sourires réflexes (pendant le sommeil)",
        "Réagit à la présence de maman",
        "Pleurs plus différenciés"
      ],
      conseils: [
        "Continuez le peau à peau",
        "Montrez-lui des images contrastées",
        "Massez-le doucement"
      ]
    }
  },
  3: {
    titre: "Semaine 3",
    sousTitre: "Éveil grandissant",
    periode: "3 semaines",
    bgColor: PERIOD_COLORS.week3,
    developpement: {
      moteur: [
        "Meilleur contrôle de la tête",
        "Mouvements des membres plus coordonnés",
        "Peut s'étirer complètement"
      ],
      sensoriel: [
        "Suit des objets sur 90°",
        "Réagit à différentes textures",
        "Préfère les visages humains"
      ],
      social: [
        "Périodes d'éveil plus longues",
        "Reconnaît l'odeur de sa mère",
        "Premiers gazouillis"
      ],
      conseils: [
        "Proposez des jouets à fort contraste",
        "Parlez-lui pendant les soins",
        "Instaurez une routine du coucher"
      ]
    }
  },
  4: {
    titre: "Semaine 4",
    sousTitre: "Premier mois accompli !",
    periode: "1 mois",
    bgColor: PERIOD_COLORS.week4,
    developpement: {
      moteur: [
        "Tient sa tête plus longtemps",
        "Pousse avec ses jambes quand sur le dos",
        "Mains commencent à s'ouvrir"
      ],
      sensoriel: [
        "Suit des yeux sur 180°",
        "Distingue certaines couleurs",
        "Réagit aux sons doux"
      ],
      social: [
        "Premier vrai sourire social !",
        "Reconnaît les visages familiers",
        "Communication par regards"
      ],
      conseils: [
        "Célébrez le premier mois !",
        "Continuez les échanges visuels",
        "Commencez le tummy time"
      ]
    }
  },
  5: {
    titre: "Semaine 5",
    sousTitre: "Découverte du monde",
    periode: "5 semaines",
    bgColor: PERIOD_COLORS.month2,
    developpement: {
      moteur: [
        "Tient sa tête à 45° sur le ventre",
        "Commence à découvrir ses mains",
        "Mouvements plus intentionnels"
      ],
      sensoriel: [
        "Vision des couleurs s'améliore",
        "Suit les mouvements avec les yeux",
        "Reconnaît les voix de toute la famille"
      ],
      social: [
        "Sourires sociaux plus fréquents",
        "Gazouillis en réponse aux voix",
        "Montre de l'intérêt pour les visages"
      ],
      conseils: [
        "Augmentez le temps sur le ventre",
        "Chantez-lui des comptines",
        "Montrez-lui des objets colorés"
      ]
    }
  },
  6: {
    titre: "Semaine 6",
    sousTitre: "Premiers gazouillis",
    periode: "6 semaines",
    bgColor: PERIOD_COLORS.month2,
    developpement: {
      moteur: [
        "Contrôle de la tête amélioré",
        "Découvre ses pieds",
        "Mouvements de pédalage"
      ],
      sensoriel: [
        "Suit un objet en mouvement",
        "Réagit à différents tons de voix",
        "Explore les textures avec la bouche"
      ],
      social: [
        "Vocalise pour communiquer",
        "Sourires plus expressifs",
        "Aime les interactions sociales"
      ],
      conseils: [
        "Répondez à ses gazouillis",
        "Proposez différentes textures",
        "Lisez-lui des histoires courtes"
      ]
    }
  },
  7: {
    titre: "Semaine 7",
    sousTitre: "Exploration active",
    periode: "7 semaines",
    bgColor: PERIOD_COLORS.month2,
    developpement: {
      moteur: [
        "Soulève tête et poitrine sur le ventre",
        "Mains plus souvent ouvertes",
        "Commence à atteindre les objets"
      ],
      sensoriel: [
        "Vision de plus en plus nette",
        "Distingue les expressions faciales",
        "Aime les mobiles musicaux"
      ],
      social: [
        "Rires silencieux",
        "Reconnaît les routines",
        "Réagit différemment aux personnes"
      ],
      conseils: [
        "Installez un mobile au-dessus du lit",
        "Faites-lui écouter de la musique douce",
        "Jouez avec ses mains et pieds"
      ]
    }
  },
  8: {
    titre: "Semaine 8",
    sousTitre: "2 mois de bonheur !",
    periode: "2 mois",
    bgColor: PERIOD_COLORS.month2,
    developpement: {
      moteur: [
        "Tient sa tête droite plus longtemps",
        "S'appuie sur ses avant-bras",
        "Commence à tenir un hochet"
      ],
      sensoriel: [
        "Suit des objets dans toutes les directions",
        "Aime les miroirs",
        "Réagit à son prénom"
      ],
      social: [
        "Premiers vrais rires !",
        "Gazouille de plus en plus",
        "Imite certaines expressions"
      ],
      conseils: [
        "RDV vaccin des 2 mois",
        "Proposez un miroir incassable",
        "Jouez à coucou-caché"
      ]
    }
  }
};

// Fonction pour obtenir les données de la semaine
const getWeekData = (weekNumber) => {
  if (DEVELOPPEMENT_DATA[weekNumber]) {
    return DEVELOPPEMENT_DATA[weekNumber];
  }
  
  const mois = Math.floor(weekNumber / 4);
  const colorKeys = Object.values(PERIOD_COLORS);
  return {
    titre: `Semaine ${weekNumber}`,
    sousTitre: mois > 0 ? `${mois} mois et ${weekNumber % 4} semaines` : `${weekNumber} semaines`,
    periode: `${weekNumber} sem.`,
    bgColor: colorKeys[weekNumber % colorKeys.length],
    developpement: {
      moteur: ["Développement moteur en cours", "Observez ses progrès quotidiens"],
      sensoriel: ["Éveil sensoriel continu", "Stimulez-le avec douceur"],
      social: ["Interactions sociales grandissantes", "Jouez régulièrement avec lui"],
      conseils: ["Continuez vos routines", "Profitez de chaque instant"]
    }
  };
};

export default function ParcoursBebe({ enfant, onRetour }) {
  const scrollRef = useRef(null);
  const [activeSection, setActiveSection] = useState('developpement'); // 'developpement' ou 'articles'
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState('moteur');

  const ageEnJours = differenceInDays(new Date(), new Date(enfant.date_naissance));
  const ageEnSemaines = Math.floor(ageEnJours / 7);
  const currentWeek = ageEnSemaines;
  const totalWeeks = Math.max(52, currentWeek + 4);

  const [displayedWeek, setDisplayedWeek] = useState(currentWeek);
  const weekData = getWeekData(displayedWeek);

  const weekStartDate = addWeeks(new Date(enfant.date_naissance), displayedWeek);
  const weekEndDate = addWeeks(weekStartDate, 1);

  // Récupérer les intérêts et historique de lecture
  const { data: articlesLus = [] } = useQuery({
    queryKey: ['articles_lus_enfant', enfant.id],
    queryFn: () => base44.entities.ArticleLu.filter({ enfant_id: enfant.id }),
  });

  const { data: interetsParent = [] } = useQuery({
    queryKey: ['interets_parent', enfant.id],
    queryFn: () => base44.entities.InteretParent.filter({ enfant_id: enfant.id }),
  });

  // Calculer les catégories préférées basées sur l'historique
  const categoriesPreferees = React.useMemo(() => {
    const scores = {};
    articlesLus.forEach(al => {
      if (al.categorie) {
        scores[al.categorie] = (scores[al.categorie] || 0) + 1;
      }
      al.tags?.forEach(tag => {
        scores[tag] = (scores[tag] || 0) + 0.5;
      });
    });
    interetsParent.forEach(ip => {
      scores[ip.categorie] = (scores[ip.categorie] || 0) + ip.score;
    });
    return Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
  }, [articlesLus, interetsParent]);

  // Jalons de développement récents de l'enfant
  const jalonsRecents = React.useMemo(() => {
    if (!enfant.jalons_developpement) return [];
    return enfant.jalons_developpement
      .filter(j => j.statut === 'en_cours' || j.statut === 'atteint')
      .slice(0, 5);
  }, [enfant.jalons_developpement]);

  const { data: articles = [], isLoading: loadingArticles } = useQuery({
    queryKey: ['articles_personnalises', displayedWeek, categoriesPreferees, jalonsRecents],
    queryFn: async () => {
      const categorie = displayedWeek < 4 ? 'nouveau_ne' : displayedWeek < 12 ? 'nourrisson' : 'bambin';
      const allArticles = await base44.entities.Article.filter({ categorie });
      
      // Scorer les articles basé sur les intérêts
      const articlesScores = allArticles.map(article => {
        let score = 0;
        
        // Boost si correspond aux catégories préférées
        categoriesPreferees.forEach((cat, idx) => {
          if (article.categorie?.includes(cat) || article.tags?.includes(cat)) {
            score += (5 - idx); // Plus le rang est élevé, plus le score est important
          }
        });
        
        // Boost si correspond aux jalons en cours
        jalonsRecents.forEach(jalon => {
          if (article.tags?.some(t => jalon.categorie?.includes(t) || jalon.jalon?.toLowerCase().includes(t))) {
            score += 3;
          }
        });
        
        // Pénalité si déjà lu
        if (articlesLus.some(al => al.article_id === article.id)) {
          score -= 10;
        }
        
        // Boost si épinglé ou validé par expert
        if (article.epingle) score += 2;
        if (article.valide_par_expert) score += 1;
        
        return { ...article, score };
      });
      
      // Trier par score et retourner les meilleurs
      return articlesScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    },
  });

  const { data: ressources = [] } = useQuery({
    queryKey: ['ressources_personnalisees', displayedWeek, categoriesPreferees],
    queryFn: async () => {
      const tranche = displayedWeek < 4 ? '0-3_mois' : displayedWeek < 12 ? '3-6_mois' : '6-12_mois';
      const allRessources = await base44.entities.Ressource.filter({ tranche_age: tranche });
      
      // Scorer les ressources basé sur les intérêts
      const ressourcesScores = allRessources.map(res => {
        let score = 0;
        categoriesPreferees.forEach((cat, idx) => {
          if (res.categorie === cat || res.tags?.includes(cat)) {
            score += (5 - idx);
          }
        });
        if (res.epingle) score += 2;
        return { ...res, score };
      });
      
      return ressourcesScores
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
    },
  });

  const { data: activites = [] } = useQuery({
    queryKey: ['activites_personnalisees', displayedWeek, jalonsRecents],
    queryFn: async () => {
      const ageMois = Math.floor(displayedWeek / 4);
      const allActivites = await base44.entities.ActiviteStimulation.filter({});
      
      // Filtrer par âge et scorer
      return allActivites
        .filter(a => ageMois >= a.age_min_mois && ageMois <= a.age_max_mois)
        .map(activite => {
          let score = 0;
          // Boost si correspond aux jalons en cours
          jalonsRecents.forEach(jalon => {
            if (activite.domaine === jalon.categorie?.split('_')[0]) {
              score += 3;
            }
          });
          // Boost si correspond aux intérêts
          categoriesPreferees.forEach((cat, idx) => {
            if (activite.domaine === cat) score += (5 - idx);
          });
          return { ...activite, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
    },
  });

  // Tracker les lectures pour améliorer les recommandations
  const trackArticleLu = async (article) => {
    try {
      await base44.entities.ArticleLu.create({
        article_id: article.id,
        date_lecture: new Date().toISOString(),
        categorie: article.categorie,
        tags: article.tags,
        enfant_id: enfant.id
      });
      
      // Mettre à jour les intérêts
      const existingInteret = interetsParent.find(i => i.categorie === article.categorie);
      if (existingInteret) {
        await base44.entities.InteretParent.update(existingInteret.id, {
          score: existingInteret.score + 1,
          derniere_visite: new Date().toISOString()
        });
      } else if (article.categorie) {
        await base44.entities.InteretParent.create({
          enfant_id: enfant.id,
          categorie: article.categorie,
          score: 1,
          derniere_visite: new Date().toISOString()
        });
      }
    } catch (e) {
      console.log('Track error:', e);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      const itemWidth = 56;
      const scrollPosition = displayedWeek * itemWidth - (window.innerWidth / 2) + (itemWidth / 2);
      scrollRef.current.scrollTo({ left: Math.max(0, scrollPosition), behavior: 'smooth' });
    }
  }, [displayedWeek]);

  const navigateWeek = (direction) => {
    const newWeek = displayedWeek + direction;
    if (newWeek >= 0 && newWeek <= totalWeeks) {
      setDisplayedWeek(newWeek);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'moteur': return <Hand className="w-4 h-4" />;
      case 'sensoriel': return <Eye className="w-4 h-4" />;
      case 'social': return <Smile className="w-4 h-4" />;
      case 'conseils': return <Heart className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'moteur': return 'from-blue-500 to-cyan-500';
      case 'sensoriel': return 'from-purple-500 to-violet-500';
      case 'social': return 'from-pink-500 to-rose-500';
      case 'conseils': return 'from-amber-500 to-orange-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const weeks = Array.from({ length: totalWeeks + 1 }, (_, i) => i);

  // Composant d'illustration style Naître et Grandir
  const WeekIllustration = ({ week }) => {
    const normalizedWeek = week % 9;
    
    // Style Naître et Grandir : illustrations douces, personnages simples, couleurs pastels
    const illustrations = {
      0: ( // Nouveau-né dans les bras
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Fond doux */}
          <div className="absolute inset-0 bg-gradient-to-b from-rose-100/50 to-transparent" />
          {/* Maman tenant bébé */}
          <div className="relative">
            {/* Corps maman */}
            <div className="w-28 h-36 bg-pink-300 rounded-t-[60px] relative">
              {/* Tête maman */}
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-20 h-20 bg-amber-400 rounded-full">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-18 h-10 bg-gray-800 rounded-t-full" style={{width: '70px'}} />
                <div className="absolute top-10 left-4 w-2 h-1 bg-gray-700 rounded-full" />
                <div className="absolute top-10 right-4 w-2 h-1 bg-gray-700 rounded-full" />
                <div className="absolute top-14 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-rose-400 rounded-full" />
              </div>
              {/* Bébé dans les bras */}
              <div className="absolute top-8 left-1/2 -translate-x-1/2 w-16 h-20 bg-yellow-100 rounded-[40%] shadow-md">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-amber-300 rounded-full">
                  <div className="absolute top-4 left-2 w-1.5 h-0.5 bg-gray-600 rounded-full" />
                  <div className="absolute top-4 right-2 w-1.5 h-0.5 bg-gray-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      1: ( // Bébé qui dort
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Lit/Berceau */}
          <div className="relative">
            <div className="w-40 h-24 bg-blue-100 rounded-2xl border-4 border-blue-200 relative">
              {/* Couverture */}
              <div className="absolute bottom-0 left-2 right-2 h-16 bg-blue-200 rounded-t-xl" />
              {/* Bébé */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-14 bg-amber-300 rounded-full">
                <div className="absolute top-5 left-3 w-2 h-0.5 bg-gray-600 rounded-full" />
                <div className="absolute top-5 right-3 w-2 h-0.5 bg-gray-600 rounded-full" />
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-2 h-1 bg-rose-300 rounded-full" />
              </div>
            </div>
            {/* Étoiles/Lune */}
            <div className="absolute -top-6 -right-4 w-8 h-8 bg-yellow-200 rounded-full opacity-60" />
            <div className="absolute -top-4 -left-2 w-3 h-3 bg-yellow-100 rotate-45" />
          </div>
        </div>
      ),
      2: ( // Allaitement/Biberon
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            {/* Maman assise */}
            <div className="w-24 h-28 bg-teal-300 rounded-t-[50px] relative">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-16 h-16 bg-amber-500 rounded-full">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-8 bg-gray-900 rounded-t-full" />
                <div className="absolute top-8 left-3 w-2 h-1 bg-gray-700 rounded-full" />
                <div className="absolute top-8 right-3 w-2 h-1 bg-gray-700 rounded-full" />
                <div className="absolute top-11 left-1/2 -translate-x-1/2 w-3 h-1 bg-rose-400 rounded-full" />
              </div>
              {/* Bébé */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-14 h-16 bg-pink-100 rounded-[35%] shadow">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-9 h-9 bg-amber-300 rounded-full">
                  <div className="absolute top-4 left-2 w-1 h-0.5 bg-gray-600 rounded-full" />
                  <div className="absolute top-4 right-2 w-1 h-0.5 bg-gray-600 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      3: ( // Tummy time
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Tapis */}
          <div className="w-48 h-28 bg-gradient-to-r from-green-100 via-yellow-100 to-pink-100 rounded-xl relative shadow-lg">
            {/* Bébé sur le ventre */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2">
              <div className="w-20 h-12 bg-purple-200 rounded-xl relative">
                {/* Tête levée */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-400 rounded-full">
                  <div className="absolute top-5 left-2 w-2 h-2 bg-white rounded-full">
                    <div className="w-1 h-1 bg-gray-800 rounded-full mt-0.5 ml-0.5" />
                  </div>
                  <div className="absolute top-5 right-2 w-2 h-2 bg-white rounded-full">
                    <div className="w-1 h-1 bg-gray-800 rounded-full mt-0.5 ml-0.5" />
                  </div>
                  <div className="absolute top-9 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-rose-400 rounded-full" />
                </div>
              </div>
            </div>
            {/* Jouets */}
            <div className="absolute bottom-2 left-4 w-5 h-5 bg-red-300 rounded-full" />
            <div className="absolute bottom-2 right-4 w-5 h-5 bg-blue-300 rounded" />
          </div>
        </div>
      ),
      4: ( // Bébé souriant
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            <div className="w-28 h-28 bg-amber-400 rounded-full shadow-xl">
              {/* Cheveux */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-24 h-10 bg-gray-800 rounded-t-full" />
              {/* Yeux souriants */}
              <div className="absolute top-10 left-5 w-4 h-2 bg-gray-800 rounded-t-full" />
              <div className="absolute top-10 right-5 w-4 h-2 bg-gray-800 rounded-t-full" />
              {/* Grand sourire */}
              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-10 h-4 bg-white rounded-b-full border-2 border-gray-800" />
            </div>
            {/* Joues roses */}
            <div className="absolute top-14 left-2 w-4 h-3 bg-rose-300 rounded-full opacity-60" />
            <div className="absolute top-14 right-2 w-4 h-3 bg-rose-300 rounded-full opacity-60" />
          </div>
        </div>
      ),
      5: ( // Parent jouant avec bébé
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="flex items-end gap-4">
            {/* Parent */}
            <div className="relative">
              <div className="w-20 h-24 bg-blue-400 rounded-t-[40px]">
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-14 h-14 bg-amber-500 rounded-full">
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-6 bg-gray-800 rounded-t-full" />
                  <div className="absolute top-7 left-3 w-2 h-1 bg-gray-700 rounded-full" />
                  <div className="absolute top-7 right-3 w-2 h-1 bg-gray-700 rounded-full" />
                </div>
              </div>
            </div>
            {/* Bébé */}
            <div className="w-14 h-16 bg-yellow-200 rounded-[30%] relative shadow">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-10 bg-amber-300 rounded-full">
                <div className="absolute top-4 left-2 w-2 h-2 bg-white rounded-full">
                  <div className="w-1 h-1 bg-gray-800 rounded-full mt-0.5 ml-0.5" />
                </div>
                <div className="absolute top-4 right-2 w-2 h-2 bg-white rounded-full">
                  <div className="w-1 h-1 bg-gray-800 rounded-full mt-0.5 ml-0.5" />
                </div>
                <div className="absolute top-7 left-1/2 -translate-x-1/2 w-2 h-1 bg-rose-400 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      ),
      6: ( // Bain
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            {/* Baignoire */}
            <div className="w-36 h-20 bg-white rounded-b-[40px] border-4 border-gray-200 relative overflow-hidden shadow-lg">
              <div className="absolute bottom-0 left-0 right-0 h-14 bg-cyan-200" />
              {/* Bulles */}
              <div className="absolute top-2 left-4 w-3 h-3 bg-white rounded-full opacity-80" />
              <div className="absolute top-4 right-6 w-2 h-2 bg-white rounded-full opacity-80" />
              {/* Bébé */}
              <div className="absolute top-1 left-1/2 -translate-x-1/2 w-12 h-12 bg-amber-400 rounded-full">
                <div className="absolute top-4 left-2 w-2 h-2 bg-white rounded-full">
                  <div className="w-1 h-1 bg-gray-800 rounded-full mt-0.5 ml-0.5" />
                </div>
                <div className="absolute top-4 right-2 w-2 h-2 bg-white rounded-full">
                  <div className="w-1 h-1 bg-gray-800 rounded-full mt-0.5 ml-0.5" />
                </div>
                <div className="absolute top-8 left-1/2 -translate-x-1/2 w-4 h-2 bg-rose-400 rounded-b-full" />
              </div>
            </div>
            {/* Canard */}
            <div className="absolute -right-4 top-2 w-6 h-6 bg-yellow-400 rounded-full" />
          </div>
        </div>
      ),
      7: ( // Découverte mains/pieds
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            {/* Bébé allongé */}
            <div className="w-32 h-20 bg-pink-200 rounded-[40%] relative shadow">
              {/* Tête */}
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-amber-400 rounded-full">
                <div className="absolute top-5 left-3 w-2 h-2 bg-white rounded-full">
                  <div className="w-1 h-1 bg-gray-800 rounded-full mt-0.5 ml-0.5" />
                </div>
                <div className="absolute top-5 right-3 w-2 h-2 bg-white rounded-full">
                  <div className="w-1 h-1 bg-gray-800 rounded-full mt-0.5 ml-0.5" />
                </div>
              </div>
              {/* Pieds levés */}
              <div className="absolute -right-2 top-0 w-5 h-5 bg-amber-300 rounded-full" />
              <div className="absolute -right-1 top-6 w-5 h-5 bg-amber-300 rounded-full" />
            </div>
          </div>
        </div>
      ),
      8: ( // 2 mois - Gazouillis
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-amber-400 rounded-full shadow-xl">
              {/* Cheveux */}
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-20 h-8 bg-gray-800 rounded-t-full" />
              {/* Yeux grands ouverts */}
              <div className="absolute top-8 left-4 w-4 h-4 bg-white rounded-full">
                <div className="w-2 h-2 bg-gray-800 rounded-full mt-1 ml-1" />
              </div>
              <div className="absolute top-8 right-4 w-4 h-4 bg-white rounded-full">
                <div className="w-2 h-2 bg-gray-800 rounded-full mt-1 ml-1" />
              </div>
              {/* Bouche ouverte (gazouillis) */}
              <div className="absolute top-16 left-1/2 -translate-x-1/2 w-6 h-4 bg-rose-400 rounded-full" />
            </div>
            {/* Notes de musique */}
            <div className="absolute -top-4 -right-4 text-purple-400 text-xl">♪</div>
            <div className="absolute -top-2 right-2 text-pink-400 text-sm">♫</div>
            {/* Joues */}
            <div className="absolute top-12 left-1 w-3 h-2 bg-rose-300 rounded-full opacity-60" />
            <div className="absolute top-12 right-1 w-3 h-2 bg-rose-300 rounded-full opacity-60" />
          </div>
        </div>
      ),
    };

    return illustrations[normalizedWeek] || illustrations[0];
  };

  // Labels des catégories
  const categoryLabels = {
    moteur: 'Motricité',
    sensoriel: 'Sens',
    social: 'Social',
    conseils: 'Conseils'
  };

  return (
    <>
      <div className="h-screen flex flex-col bg-white overflow-hidden">
        {/* Header natif avec safe area */}
        <div 
          className="flex-shrink-0 z-20 bg-white border-b"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center justify-between p-4">
            <button 
              onClick={onRetour} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center overflow-hidden shadow-md">
                {enfant.photo ? (
                  <img src={enfant.photo} alt={enfant.prenom} className="w-full h-full object-cover" />
                ) : (
                  <Baby className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-center">
                <span className="font-bold text-gray-900">{enfant.prenom}</span>
                <p className="text-[10px] text-gray-500">{weekData.periode}</p>
              </div>
            </div>

            <div className="w-10" /> {/* Spacer */}
          </div>

          {/* Slider des semaines - style natif */}
          <div className="pb-3">
            <div 
              ref={scrollRef}
              className="flex overflow-x-auto scrollbar-hide px-4 gap-2 snap-x snap-mandatory"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {weeks.map((week) => (
                <button
                  key={week}
                  onClick={() => setDisplayedWeek(week)}
                  className={`flex-shrink-0 snap-center flex flex-col items-center w-11 py-2 rounded-2xl transition-all active:scale-95 ${
                    displayedWeek === week 
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg' 
                      : week === currentWeek
                      ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300'
                      : week < currentWeek
                      ? 'bg-gray-50 text-gray-700'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  <span className="text-[8px] opacity-70 font-medium">{week === 0 ? 'né' : 'sem'}</span>
                  <span className="font-bold text-sm">{week}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto bg-gray-50" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Illustration compacte */}
          <div className="relative">
            <div className={`w-full h-48 bg-gradient-to-br ${weekData.bgColor} relative overflow-hidden`}>
              <div className="absolute inset-0 flex items-center justify-center scale-75">
                <WeekIllustration week={displayedWeek} />
              </div>
              
              {/* Navigation */}
              <button 
                onClick={() => navigateWeek(-1)}
                disabled={displayedWeek === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center disabled:opacity-30 shadow-lg active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button 
                onClick={() => navigateWeek(1)}
                disabled={displayedWeek >= totalWeeks}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center disabled:opacity-30 shadow-lg active:scale-95 transition-transform"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>

              {/* Info semaine */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm rounded-full px-4 py-1.5 shadow-lg">
                <p className="text-xs font-medium text-gray-800">
                  {weekData.titre} · {weekData.sousTitre}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs développement / articles */}
          <div className="sticky top-0 z-10 bg-white border-b px-4 py-2">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSection('developpement')}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                  activeSection === 'developpement'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Brain className="w-4 h-4 inline mr-1.5" />
                Développement
              </button>
              <button
                onClick={() => setActiveSection('articles')}
                className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] ${
                  activeSection === 'articles'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <BookOpen className="w-4 h-4 inline mr-1.5" />
                Articles
                {articles?.length > 0 && (
                  <Badge className="ml-1.5 bg-white/20 text-white text-[10px] px-1.5">{articles.length}</Badge>
                )}
              </button>
            </div>
          </div>

          {/* Section Développement */}
          {activeSection === 'developpement' && (
            <div className="p-4 space-y-3 pb-24">
              {/* Catégories en accordion */}
              {Object.entries(weekData.developpement).map(([category, items]) => (
                <motion.div 
                  key={category}
                  layout
                  className="bg-white rounded-2xl shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                    className={`w-full p-4 flex items-center justify-between active:bg-gray-50 transition-colors ${
                      expandedCategory === category ? `bg-gradient-to-r ${getCategoryColor(category)} text-white` : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        expandedCategory === category ? 'bg-white/20' : `bg-gradient-to-br ${getCategoryColor(category)}`
                      }`}>
                        <span className={expandedCategory === category ? '' : 'text-white'}>
                          {getCategoryIcon(category)}
                        </span>
                      </div>
                      <div className="text-left">
                        <h3 className={`font-bold ${expandedCategory === category ? 'text-white' : 'text-gray-900'}`}>
                          {categoryLabels[category]}
                        </h3>
                        <p className={`text-xs ${expandedCategory === category ? 'text-white/70' : 'text-gray-500'}`}>
                          {items.length} points
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${
                      expandedCategory === category ? 'rotate-180 text-white' : 'text-gray-400'
                    }`} />
                  </button>
                  
                  <AnimatePresence>
                    {expandedCategory === category && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 space-y-3">
                          {items.map((item, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex items-start gap-3"
                            >
                              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${getCategoryColor(category)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                <span className="text-white text-[10px] font-bold">{idx + 1}</span>
                              </div>
                              <p className="text-gray-700 text-sm leading-relaxed flex-1">{item}</p>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}

          {/* Section Articles */}
          {activeSection === 'articles' && (
            <div className="p-4 space-y-4 pb-24">
              {/* Recommandations personnalisées */}
              {categoriesPreferees.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold text-purple-800">Pour vous</span>
                  </div>
                  <p className="text-xs text-purple-600">
                    Contenu adapté à vos centres d'intérêt : {categoriesPreferees.slice(0, 3).join(', ')}
                  </p>
                </div>
              )}

              {/* Activités recommandées basées sur les jalons */}
              {activites?.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Hand className="w-4 h-4 text-blue-500" />
                    Activités suggérées
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {activites.map((activite) => (
                      <div 
                        key={activite.id}
                        className="flex-shrink-0 w-36 bg-white rounded-2xl shadow-sm p-3 active:scale-[0.98] transition-transform"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getCategoryColor(activite.domaine || 'moteur')} flex items-center justify-center mb-2`}>
                          {getCategoryIcon(activite.domaine || 'moteur')}
                        </div>
                        <h4 className="font-semibold text-xs text-gray-900 line-clamp-2">{activite.titre}</h4>
                        <p className="text-[10px] text-gray-500 mt-1">{activite.duree_minutes || 10} min</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vidéos experts */}
              {ressources?.filter(r => r.type === 'video').length > 0 && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Play className="w-4 h-4 text-pink-500" />
                    Vidéos d'experts
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {ressources.filter(r => r.type === 'video').map((video) => (
                      <div 
                        key={video.id}
                        className="flex-shrink-0 w-44 bg-white rounded-2xl shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
                      >
                        <div className="h-24 bg-gradient-to-br from-purple-400 to-pink-500 relative flex items-center justify-center">
                          {video.image_url ? (
                            <img src={video.image_url} alt="" className="w-full h-full object-cover" />
                          ) : null}
                          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center">
                              <Play className="w-4 h-4 text-pink-600 ml-0.5" />
                            </div>
                          </div>
                          {video.duree_minutes && (
                            <Badge className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px]">
                              {video.duree_minutes} min
                            </Badge>
                          )}
                        </div>
                        <div className="p-2.5">
                          <h4 className="font-semibold text-xs text-gray-900 line-clamp-2">{video.titre}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Articles */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  Articles de la semaine
                </h3>
                
                {loadingArticles ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                        <div className="flex gap-3">
                          <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : articles?.length > 0 ? (
                  <div className="space-y-3">
                    {articles.map((article) => (
                      <motion.div
                        key={article.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          trackArticleLu(article);
                          setSelectedArticle(article);
                        }}
                        className="bg-white rounded-2xl shadow-sm overflow-hidden active:bg-gray-50 cursor-pointer"
                      >
                        <div className="p-4 flex gap-4">
                          {article.image_url ? (
                            <img 
                              src={article.image_url} 
                              alt={article.titre}
                              className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                              <BookOpen className="w-8 h-8 text-pink-300" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <Badge className="bg-pink-100 text-pink-700 text-[10px] mb-1.5">
                              {article.categorie?.replace('_', ' ')}
                            </Badge>
                            <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">
                              {article.titre}
                            </h4>
                            <p className="text-xs text-gray-500 line-clamp-2">
                              {article.resume}
                            </p>
                            {article.temps_lecture && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                <Clock className="w-3 h-3" />
                                {article.temps_lecture} min de lecture
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0 self-center" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl p-8 text-center">
                    <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-700 mb-1">Pas encore d'articles</h3>
                    <p className="text-sm text-gray-500">
                      Les articles pour cette semaine arrivent bientôt !
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Article Detail - Vue native plein écran */}
      <AnimatePresence>
        {selectedArticle && (
          <ArticleDetailBebe 
            article={selectedArticle} 
            onBack={() => setSelectedArticle(null)} 
          />
        )}
      </AnimatePresence>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}