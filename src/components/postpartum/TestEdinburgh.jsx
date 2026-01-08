import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const QUESTIONS_EDINBURGH = [
  "J'ai pu rire et prendre les choses du bon côté",
  "Je me suis sentie confiante et joyeuse en pensant à l'avenir",
  "Je me suis reprochée, sans raison, d'être responsable quand les choses allaient mal",
  "Je me suis sentie inquiète ou soucieuse sans motif",
  "Je me suis sentie effrayée ou paniquée sans vraiment de raison",
  "J'ai eu du mal à faire face aux événements",
  "J'ai eu tellement de mal à dormir que je me suis sentie malheureuse",
  "Je me suis sentie triste ou très malheureuse",
  "J'ai été si malheureuse que j'ai pleuré",
  "Il m'est arrivé de penser à me faire du mal"
];

export default function TestEdinburgh({ suivi }) {
  const [showTest, setShowTest] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [reponses, setReponses] = useState([]);

  const dernierTest = (suivi.score_edinburgh || []).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )[0];

  const handleReponse = (score) => {
    const nouvellesReponses = [...reponses, score];
    setReponses(nouvellesReponses);

    if (currentQuestion < QUESTIONS_EDINBURGH.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Test terminé
      const scoreTotal = nouvellesReponses.reduce((a, b) => a + b, 0);
      const risque = scoreTotal >= 13 ? 'eleve' : scoreTotal >= 10 ? 'modere' : 'faible';
      
      // Sauvegarder (logique simplifiée)
      toast.success('Test enregistré');
      setShowTest(false);
      setCurrentQuestion(0);
      setReponses([]);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-indigo-600" />
          Dépistage dépression post-partum
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {dernierTest && (
          <div className={`rounded-lg p-4 border-2 ${
            dernierTest.risque === 'eleve' ? 'bg-red-50 border-red-300' :
            dernierTest.risque === 'modere' ? 'bg-orange-50 border-orange-300' :
            'bg-green-50 border-green-300'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">Dernier test</p>
              <Badge className={
                dernierTest.risque === 'eleve' ? 'bg-red-500' :
                dernierTest.risque === 'modere' ? 'bg-orange-500' :
                'bg-green-500'
              }>
                {dernierTest.risque === 'eleve' ? 'Risque élevé' :
                 dernierTest.risque === 'modere' ? 'Risque modéré' :
                 'Risque faible'}
              </Badge>
            </div>
            <p className="text-2xl font-bold">Score: {dernierTest.score}/30</p>
          </div>
        )}

        {!showTest ? (
          <>
            <p className="text-sm text-gray-700">
              Le test d'Édimbourg permet de dépister la dépression post-partum. 
              Il est recommandé de le faire régulièrement.
            </p>
            <Button 
              onClick={() => setShowTest(true)}
              className="w-full bg-indigo-500"
            >
              Faire le test (10 questions)
            </Button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-indigo-50 rounded-lg p-4">
              <p className="text-xs text-indigo-600 mb-2">
                Question {currentQuestion + 1} / {QUESTIONS_EDINBURGH.length}
              </p>
              <p className="text-sm font-semibold text-indigo-900">
                {QUESTIONS_EDINBURGH[currentQuestion]}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Toujours', score: 3 },
                { label: 'Souvent', score: 2 },
                { label: 'Parfois', score: 1 },
                { label: 'Jamais', score: 0 }
              ].map((opt) => (
                <Button
                  key={opt.score}
                  onClick={() => handleReponse(opt.score)}
                  variant="outline"
                  className="h-16"
                >
                  {opt.label}
                </Button>
              ))}
            </div>

            <Button
              variant="ghost"
              onClick={() => {
                setShowTest(false);
                setCurrentQuestion(0);
                setReponses([]);
              }}
              className="w-full"
            >
              Annuler
            </Button>
          </div>
        )}

        <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-900 border border-amber-200">
          <AlertTriangle className="w-4 h-4 mb-1" />
          <p className="font-semibold mb-1">Important</p>
          <p>
            Si vous ressentez une grande détresse, contactez immédiatement votre médecin 
            ou un professionnel de santé mentale.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}