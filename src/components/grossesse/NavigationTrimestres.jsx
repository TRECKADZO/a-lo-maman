import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { 
  Heart, Baby, Users, Calendar,
  Stethoscope, Activity, Sparkles
} from 'lucide-react';

export default function NavigationTrimestres({ onSelectTrimestre, currentWeek }) {
  const getCurrentTrimestre = () => {
    if (currentWeek <= 14) return 1;
    if (currentWeek <= 28) return 2;
    return 3;
  };

  const trimestres = [
    {
      numero: 1,
      titre: '1er trimestre',
      soustitre: '0 à 14 semaines',
      description: 'Formation de l\'embryon et début du développement',
      image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600',
      color: 'from-pink-400 to-rose-500',
      bgColor: 'bg-pink-50',
      icon: Heart,
      points: [
        'Test de grossesse positif',
        'Premières échographies',
        'Nausées et fatigue',
        'Formation des organes vitaux'
      ]
    },
    {
      numero: 2,
      titre: '2e trimestre',
      soustitre: '15 à 28 semaines',
      description: 'Bébé grandit et vous commencez à sentir ses mouvements',
      image: 'https://images.unsplash.com/photo-1493666438817-866a91353ca9?w=600',
      color: 'from-purple-400 to-indigo-500',
      bgColor: 'bg-purple-50',
      icon: Baby,
      points: [
        'Premiers mouvements de bébé',
        'Échographie morphologique',
        'Ventre qui s\'arrondit',
        'Plus d\'énergie'
      ]
    },
    {
      numero: 3,
      titre: '3e trimestre',
      soustitre: '29 à 40 semaines',
      description: 'Bébé se prépare à naître, il prend du poids',
      image: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600',
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'bg-blue-50',
      icon: Users,
      points: [
        'Bébé se positionne',
        'Préparation à l\'accouchement',
        'Contractions préparatoires',
        'Valise de maternité'
      ]
    }
  ];

  const currentTrimestre = getCurrentTrimestre();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Votre grossesse trimestre par trimestre
        </h2>
        <p className="text-gray-600">
          Découvrez le développement de bébé et les changements de votre corps
        </p>
        {currentWeek && (
          <Badge className="mt-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            Vous êtes à {currentWeek} semaines - {currentTrimestre}er trimestre
          </Badge>
        )}
      </div>

      {/* Cards Trimestres */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {trimestres.map((trimestre, index) => {
          const Icon = trimestre.icon;
          const isActive = trimestre.numero === currentTrimestre;
          
          return (
            <motion.div
              key={trimestre.numero}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card 
                className={`cursor-pointer hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  isActive ? 'ring-2 ring-pink-500 shadow-lg' : ''
                }`}
                onClick={() => onSelectTrimestre(trimestre.numero)}
              >
                {/* Image avec overlay */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={trimestre.image} 
                    alt={trimestre.titre}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t ${trimestre.color} opacity-80`} />
                  
                  {/* Texte sur l'image */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-4">
                    <Icon className="w-10 h-10 mb-2" />
                    <h3 className="text-2xl font-bold">{trimestre.titre}</h3>
                    <p className="text-sm opacity-90">{trimestre.soustitre}</p>
                  </div>

                  {isActive && (
                    <Badge className="absolute top-3 right-3 bg-white text-pink-600">
                      En cours
                    </Badge>
                  )}
                </div>

                {/* Contenu */}
                <CardContent className={`p-4 ${trimestre.bgColor}`}>
                  <p className="text-sm text-gray-700 mb-3">
                    {trimestre.description}
                  </p>
                  
                  <div className="space-y-1.5">
                    {trimestre.points.map((point, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-gray-600">
                        <Sparkles className="w-3 h-3 mt-0.5 text-pink-500 flex-shrink-0" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Info supplémentaire */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white rounded-full">
              <Calendar className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Suivez semaine par semaine
              </h4>
              <p className="text-sm text-gray-600">
                Chaque semaine apporte son lot de changements ! Cliquez sur un trimestre 
                pour découvrir en détail le développement de votre bébé, les symptômes 
                courants et nos conseils d'experts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}