import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Languages,
  Loader2,
  CheckCircle,
  Info,
  Sparkles
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'baoule', name: 'Baoulé', flag: '🇨🇮' },
  { code: 'dioula', name: 'Dioula', flag: '🇨🇮' }
];

export default function RealTimeTranslation({ 
  sourceLanguage = 'fr',
  onTranslationChange,
  messages = []
}) {
  const [translationEnabled, setTranslationEnabled] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [translating, setTranslating] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState({});

  const translateMessage = async (text, fromLang, toLang) => {
    if (!text || fromLang === toLang) return text;

    try {
      setTranslating(true);
      
      // Utiliser l'IA pour la traduction
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following ${fromLang} text to ${toLang}. Return ONLY the translation, nothing else:

"${text}"`,
        response_json_schema: null
      });

      return result;
    } catch (error) {
      console.error('Erreur de traduction:', error);
      return text;
    } finally {
      setTranslating(false);
    }
  };

  useEffect(() => {
    if (translationEnabled && messages.length > 0) {
      // Traduire les nouveaux messages
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && !translatedMessages[lastMessage.id]) {
        translateMessage(lastMessage.content, sourceLanguage, targetLanguage).then(translated => {
          setTranslatedMessages(prev => ({
            ...prev,
            [lastMessage.id]: translated
          }));
        });
      }
    }
  }, [messages, translationEnabled, targetLanguage]);

  const toggleTranslation = () => {
    setTranslationEnabled(!translationEnabled);
    if (onTranslationChange) {
      onTranslationChange(!translationEnabled);
    }
  };

  return (
    <div className="space-y-3">
      {/* Translation Toggle */}
      <Card className={`border-2 transition-all ${translationEnabled ? 'border-purple-300 bg-purple-50' : 'border-gray-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${translationEnabled ? 'bg-purple-100' : 'bg-gray-100'}`}>
                <Languages className={`w-5 h-5 ${translationEnabled ? 'text-purple-600' : 'text-gray-600'}`} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Traduction en temps réel</p>
                <p className="text-xs text-gray-600">Alimentée par IA</p>
              </div>
            </div>
            
            <Button
              onClick={toggleTranslation}
              className={translationEnabled ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'}
            >
              {translationEnabled ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activée
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Activer
                </>
              )}
            </Button>
          </div>

          {/* Language Selection */}
          {translationEnabled && (
            <div className="space-y-3 pt-3 border-t border-purple-200">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-600 font-medium">Langue source</label>
                  <Select value={sourceLanguage} disabled>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-600 font-medium">Traduire vers</label>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                    <SelectTrigger className="bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.filter(l => l.code !== sourceLanguage).map(lang => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.flag} {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {translating && (
                <div className="flex items-center gap-2 text-xs text-purple-600">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Traduction en cours...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      {translationEnabled && (
        <Alert className="bg-purple-50 border-purple-200">
          <Info className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-purple-800 text-xs">
            <strong>Traduction IA active</strong> - Les messages sont traduits automatiquement. 
            La qualité peut varier selon les langues. Vérifiez toujours les informations médicales importantes.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}