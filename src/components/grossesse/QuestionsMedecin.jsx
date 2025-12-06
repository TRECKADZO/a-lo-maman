import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Stethoscope, Sparkles, Loader2, Copy, CheckCircle2, 
  Plus, MessageCircle, RefreshCw, Send, HelpCircle,
  ChevronDown, ChevronUp, Bot, AlertCircle
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { BottomSheet } from '@/components/ui/safe-area-view';

export default function QuestionsMedecin({ grossesse, semainesGrossesse, trimestre }) {
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const chatEndRef = useRef(null);

  // Récupérer les symptômes récents
  const symptomesRecents = React.useMemo(() => {
    const journal = grossesse?.symptomes_journal || [];
    const last7Days = journal.filter(e => {
      const diff = Math.floor((new Date() - new Date(e.date)) / (1000 * 60 * 60 * 24));
      return diff <= 7;
    });
    return [...new Set(last7Days.flatMap(e => e.symptomes || []))];
  }, [grossesse?.symptomes_journal]);

  const getSymptomeLabel = (id) => {
    const labels = {
      'nausees': 'Nausées', 'vomissements': 'Vomissements', 'fatigue': 'Fatigue',
      'maux_tete': 'Maux de tête', 'vertiges': 'Vertiges', 'douleurs_dos': 'Douleurs de dos',
      'brulures_estomac': 'Brûlures d\'estomac', 'constipation': 'Constipation',
      'insomnie': 'Insomnie', 'crampes': 'Crampes', 'oedemes': 'Œdèmes',
      'contractions': 'Contractions', 'saignements': 'Saignements',
      'douleurs_pelviennes': 'Douleurs pelviennes', 'essoufflement': 'Essoufflement',
      'humeur': 'Changements d\'humeur'
    };
    return labels[id] || id;
  };

  // Questions pour le médecin
  const { data: questions, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['questions_medecin', semainesGrossesse, symptomesRecents.join(',')],
    queryFn: async () => {
      const symptomesTexte = symptomesRecents.map(s => getSymptomeLabel(s)).join(', ');
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un assistant médical. Génère des questions pertinentes qu'une femme enceinte devrait poser à son médecin lors de sa prochaine consultation.

CONTEXTE:
- Semaine de grossesse: ${semainesGrossesse} SA
- Trimestre: ${trimestre}
- Symptômes récents notés: ${symptomesRecents.length > 0 ? symptomesTexte : 'aucun noté'}
- Nombre de consultations: ${grossesse?.consultations?.length || 0}
- Échographies effectuées: ${grossesse?.echographies?.length || 0}

Génère des questions organisées par catégorie, pertinentes pour ce stade de grossesse.
Inclus des questions spécifiques si des symptômes ont été notés.`,
        response_json_schema: {
          type: 'object',
          properties: {
            introduction: { type: 'string' },
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nom: { type: 'string' },
                  icone: { type: 'string' },
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        question: { type: 'string' },
                        contexte: { type: 'string' },
                        priorite: { type: 'string', enum: ['haute', 'moyenne', 'basse'] }
                      }
                    }
                  }
                }
              }
            },
            questions_symptomes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  symptome: { type: 'string' },
                  question: { type: 'string' }
                }
              }
            }
          }
        }
      });
      return response;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!grossesse,
  });

  // FAQ dynamique basée sur symptômes et trimestre
  const { data: faqData, isLoading: faqLoading } = useQuery({
    queryKey: ['faq_grossesse', trimestre, symptomesRecents.join(',')],
    queryFn: async () => {
      const symptomesTexte = symptomesRecents.map(s => getSymptomeLabel(s)).join(', ');
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un expert en santé maternelle. Génère une FAQ personnalisée pour une femme enceinte.

CONTEXTE:
- Semaine de grossesse: ${semainesGrossesse} SA
- Trimestre: ${trimestre}
- Symptômes actuels: ${symptomesRecents.length > 0 ? symptomesTexte : 'Aucun symptôme particulier'}

Génère les 10 questions les plus fréquentes et pertinentes pour ce profil, avec des réponses claires et rassurantes.
Adapte au contexte ivoirien si pertinent.
Inclus des questions spécifiques aux symptômes mentionnés.`,
        response_json_schema: {
          type: 'object',
          properties: {
            faq: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  reponse: { type: 'string' },
                  categorie: { type: 'string', enum: ['symptomes', 'alimentation', 'activite', 'bebe', 'preparation', 'urgences', 'general'] },
                  lie_symptome: { type: 'boolean' }
                }
              }
            }
          }
        }
      });
      return response;
    },
    staleTime: 1000 * 60 * 60 * 24,
    enabled: !!grossesse,
  });

  // Mutation pour le chat IA
  const askAIMutation = useMutation({
    mutationFn: async (question) => {
      const symptomesTexte = symptomesRecents.map(s => getSymptomeLabel(s)).join(', ');
      
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Tu es un assistant de santé maternelle bienveillant et compétent. Une femme enceinte te pose une question.

CONTEXTE MÉDICAL:
- Semaine de grossesse: ${semainesGrossesse} SA (Trimestre ${trimestre})
- Symptômes récents: ${symptomesRecents.length > 0 ? symptomesTexte : 'Aucun symptôme particulier'}
- Type de grossesse: ${grossesse?.type_grossesse || 'unique'}

HISTORIQUE DE CONVERSATION:
${chatHistory.slice(-4).map(m => `${m.role === 'user' ? 'Question' : 'Réponse'}: ${m.content}`).join('\n')}

QUESTION ACTUELLE:
${question}

INSTRUCTIONS:
- Réponds de manière claire, rassurante et adaptée au stade de grossesse
- Si la question concerne un symptôme d'urgence (saignements abondants, contractions régulières avant 37 SA, perte de liquide), conseille de consulter immédiatement
- Adapte au contexte ivoirien si pertinent (aliments locaux, pratiques culturelles)
- Sois empathique mais factuelle
- Si tu ne peux pas répondre de manière sûre, conseille de consulter un professionnel`,
        response_json_schema: {
          type: 'object',
          properties: {
            reponse: { type: 'string' },
            urgence: { type: 'boolean', description: 'true si la situation nécessite une consultation urgente' },
            conseil_supplementaire: { type: 'string' },
            consulter_si: { type: 'array', items: { type: 'string' }, description: 'Signes qui nécessiteraient de consulter' }
          }
        }
      });
      return response;
    },
    onSuccess: (data, question) => {
      setChatHistory(prev => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: data.reponse, urgence: data.urgence, conseil: data.conseil_supplementaire, consulter_si: data.consulter_si }
      ]);
      setUserMessage('');
    }
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = () => {
    if (userMessage.trim()) {
      askAIMutation.mutate(userMessage.trim());
    }
  };

  const toggleQuestion = (question) => {
    setSelectedQuestions(prev => 
      prev.includes(question) 
        ? prev.filter(q => q !== question)
        : [...prev, question]
    );
  };

  const copyToClipboard = async () => {
    const text = selectedQuestions.join('\n\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addCustomQuestion = () => {
    if (customQuestion.trim()) {
      setSelectedQuestions(prev => [...prev, customQuestion.trim()]);
      setCustomQuestion('');
      setShowAddModal(false);
    }
  };

  const getPrioriteColor = (priorite) => {
    switch (priorite) {
      case 'haute': return 'bg-red-100 text-red-800';
      case 'moyenne': return 'bg-amber-100 text-amber-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategorieColor = (cat) => {
    const colors = {
      'symptomes': 'bg-red-100 text-red-700',
      'alimentation': 'bg-green-100 text-green-700',
      'activite': 'bg-blue-100 text-blue-700',
      'bebe': 'bg-pink-100 text-pink-700',
      'preparation': 'bg-purple-100 text-purple-700',
      'urgences': 'bg-red-200 text-red-800',
      'general': 'bg-gray-100 text-gray-700'
    };
    return colors[cat] || colors.general;
  };

  if (isLoading) {
    return (
      <Card className="shadow-xl">
        <CardContent className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Préparation de vos questions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="chat">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="chat" className="text-xs sm:text-sm">
            <MessageCircle className="w-4 h-4 mr-1" />
            Poser une question
          </TabsTrigger>
          <TabsTrigger value="faq" className="text-xs sm:text-sm">
            <HelpCircle className="w-4 h-4 mr-1" />
            FAQ
          </TabsTrigger>
          <TabsTrigger value="medecin" className="text-xs sm:text-sm">
            <Stethoscope className="w-4 h-4 mr-1" />
            Pour le médecin
          </TabsTrigger>
        </TabsList>

        {/* Onglet Chat IA */}
        <TabsContent value="chat" className="mt-4">
          <Card className="shadow-xl">
            <CardHeader className="pb-2 bg-gradient-to-r from-indigo-50 to-purple-50">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                Assistant Grossesse IA
              </CardTitle>
              <p className="text-xs text-gray-500">Posez vos questions sur votre grossesse</p>
            </CardHeader>
            <CardContent className="p-4">
              {/* Zone de chat */}
              <div className="h-64 overflow-y-auto mb-4 space-y-3 p-2 bg-gray-50 rounded-lg">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="w-10 h-10 text-indigo-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">Posez-moi vos questions sur votre grossesse !</p>
                    <p className="text-xs text-gray-400 mt-1">Par exemple: "Est-ce normal d'avoir des nausées à {semainesGrossesse} SA ?"</p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-3 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-indigo-500 text-white rounded-br-sm' 
                          : 'bg-white border shadow-sm rounded-bl-sm'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        
                        {msg.role === 'assistant' && msg.urgence && (
                          <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-xs text-red-700 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Consultez rapidement un professionnel de santé
                            </p>
                          </div>
                        )}
                        
                        {msg.role === 'assistant' && msg.conseil && (
                          <p className="text-xs text-indigo-600 mt-2 italic">💡 {msg.conseil}</p>
                        )}
                        
                        {msg.role === 'assistant' && msg.consulter_si?.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-gray-500 font-medium">Consultez si:</p>
                            <ul className="text-xs text-gray-500 mt-1">
                              {msg.consulter_si.map((s, j) => (
                                <li key={j}>• {s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {askAIMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-white border shadow-sm p-3 rounded-2xl rounded-bl-sm">
                      <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Zone de saisie */}
              <div className="flex gap-2">
                <Input
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Posez votre question..."
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!userMessage.trim() || askAIMutation.isPending}
                  className="bg-gradient-to-r from-indigo-500 to-purple-500"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              {/* Suggestions rapides */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  `Est-ce normal à ${semainesGrossesse} SA ?`,
                  "Que puis-je manger ?",
                  "Quand dois-je m'inquiéter ?"
                ].map((suggestion, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => setUserMessage(suggestion)}
                    className="text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onglet FAQ */}
        <TabsContent value="faq" className="mt-4 space-y-3">
          <Card className="shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-amber-600" />
                <span className="font-semibold text-amber-900">Questions fréquentes</span>
                <Badge className="bg-amber-100 text-amber-800 ml-auto">
                  SA {semainesGrossesse}
                </Badge>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                Questions adaptées à votre stade de grossesse
                {symptomesRecents.length > 0 && ' et vos symptômes'}
              </p>
            </CardContent>
          </Card>

          {faqLoading ? (
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chargement des questions fréquentes...</p>
              </CardContent>
            </Card>
          ) : (
            faqData?.faq?.map((item, i) => (
              <Card 
                key={i} 
                className={`shadow-lg cursor-pointer transition-all ${
                  item.lie_symptome ? 'border-l-4 border-l-amber-500' : ''
                }`}
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <Badge className={`text-xs ${getCategorieColor(item.categorie)}`}>
                          {item.categorie}
                        </Badge>
                        {item.lie_symptome && (
                          <Badge className="text-xs bg-amber-100 text-amber-700">
                            Lié à vos symptômes
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900">{item.question}</h4>
                      
                      {expandedFaq === i && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm text-gray-700 leading-relaxed">{item.reponse}</p>
                        </div>
                      )}
                    </div>
                    {expandedFaq === i ? (
                      <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Onglet Questions pour le médecin */}
        <TabsContent value="medecin" className="mt-4 space-y-4">
          {/* Header */}
          <Card className="shadow-xl bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-teal-900">Questions pour votre médecin</h3>
                  <p className="text-sm text-teal-700">{questions?.introduction}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => refetch()}
                  disabled={isFetching}
                >
                  <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Questions sélectionnées */}
          {selectedQuestions.length > 0 && (
            <Card className="shadow-lg border-2 border-teal-500">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                    Ma liste ({selectedQuestions.length})
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={copyToClipboard}>
                    {copied ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? 'Copié !' : 'Copier'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {selectedQuestions.map((q, i) => (
                    <li key={i} className="flex items-start gap-2 p-2 bg-teal-50 rounded-lg">
                      <span className="text-teal-600 font-medium">{i + 1}.</span>
                      <span className="text-sm text-teal-800 flex-1">{q}</span>
                      <Button variant="ghost" size="sm" onClick={() => toggleQuestion(q)} className="h-6 w-6 p-0 text-red-500">×</Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Questions par symptômes */}
          {questions?.questions_symptomes?.length > 0 && (
            <Card className="shadow-lg bg-amber-50 border-amber-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-amber-800">📋 Questions basées sur vos symptômes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {questions.questions_symptomes.map((qs, i) => (
                  <div
                    key={i}
                    onClick={() => toggleQuestion(qs.question)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedQuestions.includes(qs.question)
                        ? 'bg-teal-100 border-2 border-teal-500'
                        : 'bg-white border border-amber-200 hover:border-teal-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={selectedQuestions.includes(qs.question)} />
                      <div>
                        <Badge className="bg-amber-100 text-amber-800 text-xs mb-1">{qs.symptome}</Badge>
                        <p className="text-sm">{qs.question}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Questions par catégorie */}
          {questions?.categories?.map((cat, catIndex) => (
            <Card key={catIndex} className="shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{cat.icone}</span>
                  {cat.nom}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cat.questions?.map((q, qIndex) => (
                  <div
                    key={qIndex}
                    onClick={() => toggleQuestion(q.question)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedQuestions.includes(q.question)
                        ? 'bg-teal-100 border-2 border-teal-500'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox checked={selectedQuestions.includes(q.question)} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium">{q.question}</p>
                          <Badge className={`text-xs ${getPrioriteColor(q.priorite)}`}>{q.priorite}</Badge>
                        </div>
                        {q.contexte && <p className="text-xs text-gray-500">{q.contexte}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}

          <Button variant="outline" onClick={() => setShowAddModal(true)} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter ma propre question
          </Button>
        </TabsContent>
      </Tabs>

      {/* Modal ajout question */}
      <BottomSheet isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Ajouter une question">
        <div className="p-6 space-y-4">
          <Textarea
            value={customQuestion}
            onChange={(e) => setCustomQuestion(e.target.value)}
            placeholder="Écrivez votre question ici..."
            rows={3}
          />
          <Button
            onClick={addCustomQuestion}
            disabled={!customQuestion.trim()}
            className="w-full bg-gradient-to-r from-teal-500 to-cyan-500"
          >
            Ajouter à ma liste
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}