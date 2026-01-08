import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Baby, 
  Heart, 
  Eye, 
  Ear, 
  Hand, 
  Footprints,
  Brain,
  Activity,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FETAL_DEVELOPMENT_DATA = [
  {
    month: 1,
    weeks: "1-4",
    title: "Embryon",
    size: "Grain de pavot",
    sizeValue: "2 mm",
    weight: "< 1 g",
    highlights: [
      "Petit embryon en formation",
      "Le cœur commence à battre",
      "Formation du tube neural"
    ],
    icon: Heart,
    color: "from-pink-400 to-rose-500",
    bgColor: "bg-pink-50",
    borderColor: "border-pink-200"
  },
  {
    month: 2,
    weeks: "5-8",
    title: "Formation des membres",
    size: "Haricot",
    sizeValue: "2.5 cm",
    weight: "2 g",
    highlights: [
      "Les bourgeons des membres se forment",
      "Les traits du visage se dessinent",
      "Les doigts et orteils apparaissent"
    ],
    icon: Hand,
    color: "from-orange-400 to-amber-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200"
  },
  {
    month: 3,
    weeks: "9-12",
    title: "Organes formés",
    size: "Citron vert",
    sizeValue: "7.5 cm",
    weight: "23 g",
    highlights: [
      "Tous les organes sont formés",
      "Les doigts et orteils sont distincts",
      "Le visage est reconnaissable"
    ],
    icon: Sparkles,
    color: "from-lime-400 to-green-500",
    bgColor: "bg-lime-50",
    borderColor: "border-lime-200"
  },
  {
    month: 4,
    weeks: "13-16",
    title: "Premiers mouvements",
    size: "Avocat",
    sizeValue: "14 cm",
    weight: "100 g",
    highlights: [
      "Bébé commence à bouger",
      "Les yeux sont sensibles à la lumière",
      "Les empreintes digitales se forment"
    ],
    icon: Activity,
    color: "from-teal-400 to-cyan-500",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200"
  },
  {
    month: 5,
    weeks: "17-20",
    title: "Perception des sons",
    size: "Banane",
    sizeValue: "25 cm",
    weight: "300 g",
    highlights: [
      "Bébé peut entendre les sons",
      "Coups de pied et hoquets",
      "Le vernix protège la peau"
    ],
    icon: Ear,
    color: "from-blue-400 to-indigo-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200"
  },
  {
    month: 6,
    weeks: "21-24",
    title: "Réflexes développés",
    size: "Papaye",
    sizeValue: "30 cm",
    weight: "600 g",
    highlights: [
      "Sourcils et cils visibles",
      "Réagit à la lumière",
      "Cycles de sommeil établis"
    ],
    icon: Eye,
    color: "from-violet-400 to-purple-500",
    bgColor: "bg-violet-50",
    borderColor: "border-violet-200"
  },
  {
    month: 7,
    weeks: "25-28",
    title: "Yeux ouverts",
    size: "Chou-fleur",
    sizeValue: "37 cm",
    weight: "1 kg",
    highlights: [
      "Les yeux s'ouvrent",
      "Sommeil paradoxal (rêves)",
      "Le cerveau se développe rapidement"
    ],
    icon: Brain,
    color: "from-fuchsia-400 to-pink-500",
    bgColor: "bg-fuchsia-50",
    borderColor: "border-fuchsia-200"
  },
  {
    month: 8,
    weeks: "29-32",
    title: "Prise de poids",
    size: "Melon",
    sizeValue: "42 cm",
    weight: "1.8 kg",
    highlights: [
      "Gain de poids important",
      "Coups de pied plus forts",
      "Se retourne tête en bas"
    ],
    icon: Footprints,
    color: "from-rose-400 to-red-500",
    bgColor: "bg-rose-50",
    borderColor: "border-rose-200"
  },
  {
    month: 9,
    weeks: "33-40",
    title: "Prêt à naître",
    size: "Pastèque",
    sizeValue: "50 cm",
    weight: "3-3.5 kg",
    highlights: [
      "Développement complet",
      "Prêt pour la naissance",
      "Poumons matures"
    ],
    icon: Baby,
    color: "from-amber-400 to-orange-500",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200"
  }
];

export default function DeveloppementFoetal({ currentWeek = 1 }) {
  const currentMonth = Math.min(Math.ceil(currentWeek / 4), 9);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [viewMode, setViewMode] = useState('current'); // 'current' ou 'timeline'

  const selectedData = FETAL_DEVELOPMENT_DATA[selectedMonth - 1];
  const Icon = selectedData.icon;

  const navigateMonth = (direction) => {
    if (direction === 'prev' && selectedMonth > 1) {
      setSelectedMonth(selectedMonth - 1);
    } else if (direction === 'next' && selectedMonth < 9) {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header avec titre et navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl">
            <Baby className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Développement de bébé</h3>
            <p className="text-xs text-gray-500">Mois {selectedMonth} sur 9</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className={viewMode === 'current' ? 'bg-pink-50' : ''}
            onClick={() => setViewMode('current')}
          >
            Détail
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={viewMode === 'timeline' ? 'bg-pink-50' : ''}
            onClick={() => setViewMode('timeline')}
          >
            Timeline
          </Button>
        </div>
      </div>

      {viewMode === 'current' ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedMonth}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`overflow-hidden border-2 ${selectedData.borderColor}`}>
              {/* Bandeau du mois */}
              <div className={`bg-gradient-to-r ${selectedData.color} p-4 text-white`}>
                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => navigateMonth('prev')}
                    disabled={selectedMonth === 1}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <div className="text-center">
                    <p className="text-white/80 text-sm">Mois {selectedMonth}</p>
                    <h4 className="text-xl font-bold">{selectedData.title}</h4>
                    <p className="text-white/80 text-sm">Semaines {selectedData.weeks}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={() => navigateMonth('next')}
                    disabled={selectedMonth === 9}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-4">
                {/* Illustration centrale */}
                <div className="flex justify-center mb-4">
                  <div className={`relative w-32 h-32 rounded-full ${selectedData.bgColor} flex items-center justify-center`}>
                    <div className={`absolute inset-2 rounded-full bg-gradient-to-br ${selectedData.color} opacity-20`} />
                    <div className="relative">
                      <Icon className={`w-16 h-16 text-transparent bg-gradient-to-br ${selectedData.color} bg-clip-text`} style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text' }} />
                      <div className={`w-16 h-16 bg-gradient-to-br ${selectedData.color} rounded-full opacity-30 absolute inset-0`} />
                      <Icon className={`w-16 h-16 absolute inset-0`} style={{ color: selectedData.color.includes('pink') ? '#ec4899' : selectedData.color.includes('orange') ? '#f97316' : selectedData.color.includes('lime') ? '#84cc16' : selectedData.color.includes('teal') ? '#14b8a6' : selectedData.color.includes('blue') ? '#3b82f6' : selectedData.color.includes('violet') ? '#8b5cf6' : selectedData.color.includes('fuchsia') ? '#d946ef' : selectedData.color.includes('rose') ? '#f43f5e' : '#f59e0b' }} />
                    </div>
                  </div>
                </div>

                {/* Taille et poids */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className={`${selectedData.bgColor} rounded-xl p-3 text-center`}>
                    <p className="text-xs text-gray-500 mb-1">Comparaison</p>
                    <p className="font-bold text-sm text-gray-800">{selectedData.size}</p>
                  </div>
                  <div className={`${selectedData.bgColor} rounded-xl p-3 text-center`}>
                    <p className="text-xs text-gray-500 mb-1">Taille</p>
                    <p className="font-bold text-sm text-gray-800">{selectedData.sizeValue}</p>
                  </div>
                  <div className={`${selectedData.bgColor} rounded-xl p-3 text-center`}>
                    <p className="text-xs text-gray-500 mb-1">Poids</p>
                    <p className="font-bold text-sm text-gray-800">{selectedData.weight}</p>
                  </div>
                </div>

                {/* Points clés */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Ce mois-ci
                  </p>
                  {selectedData.highlights.map((highlight, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-3 p-3 ${selectedData.bgColor} rounded-xl`}
                    >
                      <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${selectedData.color}`} />
                      <p className="text-sm text-gray-700">{highlight}</p>
                    </div>
                  ))}
                </div>

                {/* Badge mois actuel */}
                {selectedMonth === currentMonth && (
                  <div className="mt-4 flex justify-center">
                    <Badge className={`bg-gradient-to-r ${selectedData.color} text-white border-0`}>
                      <Sparkles className="w-3 h-3 mr-1" />
                      Vous êtes ici
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      ) : (
        /* Vue Timeline */
        <div className="space-y-3">
          {FETAL_DEVELOPMENT_DATA.map((data, idx) => {
            const MonthIcon = data.icon;
            const isCurrentMonth = idx + 1 === currentMonth;
            const isPast = idx + 1 < currentMonth;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  setSelectedMonth(idx + 1);
                  setViewMode('current');
                }}
                className="cursor-pointer"
              >
                <Card className={`overflow-hidden transition-all ${isCurrentMonth ? `border-2 ${data.borderColor} shadow-md` : 'border hover:shadow-sm'} ${isPast ? 'opacity-60' : ''}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${data.color} flex items-center justify-center flex-shrink-0`}>
                        <MonthIcon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">Mois {data.month}</p>
                          {isCurrentMonth && (
                            <Badge variant="secondary" className="text-xs">
                              Actuel
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{data.title}</p>
                        <p className="text-xs text-gray-400">Semaines {data.weeks}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">{data.sizeValue}</p>
                        <p className="text-xs text-gray-500">{data.weight}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Barre de progression des mois */}
      <div className="flex justify-center gap-1 mt-4">
        {FETAL_DEVELOPMENT_DATA.map((data, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedMonth(idx + 1)}
            className={`w-8 h-1.5 rounded-full transition-all ${
              idx + 1 === selectedMonth
                ? `bg-gradient-to-r ${data.color}`
                : idx + 1 < currentMonth
                ? 'bg-pink-200'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}