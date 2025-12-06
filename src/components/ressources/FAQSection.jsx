import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronUp, Search, HelpCircle, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const CATEGORIE_LABELS = {
  grossesse: 'Grossesse',
  accouchement: 'Accouchement',
  allaitement: 'Allaitement',
  sommeil: 'Sommeil',
  alimentation: 'Alimentation',
  sante: 'Santé',
  developpement: 'Développement',
  comportement: 'Comportement',
  securite: 'Sécurité',
  vie_quotidienne: 'Vie quotidienne',
};

const AGE_LABELS = {
  grossesse: 'Grossesse',
  '0-3_mois': '0-3 mois',
  '3-6_mois': '3-6 mois',
  '6-12_mois': '6-12 mois',
  '1-2_ans': '1-2 ans',
  '2-3_ans': '2-3 ans',
  '3-6_ans': '3-6 ans',
  tous: 'Tous âges',
};

export default function FAQSection({ faqs = [], selectedAge, selectedCategorie }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [localCategorie, setLocalCategorie] = useState('all');

  const filteredFaqs = faqs.filter(faq => {
    const matchSearch = !searchQuery || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.reponse?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchCategorie = localCategorie === 'all' || faq.categorie === localCategorie;
    const matchAge = !selectedAge || selectedAge === 'tous' || 
      faq.tranche_age === selectedAge || faq.tranche_age === 'tous';
    
    return matchSearch && matchCategorie && matchAge;
  });

  const popularFaqs = filteredFaqs.filter(f => f.populaire);
  const otherFaqs = filteredFaqs.filter(f => !f.populaire);

  const categories = [...new Set(faqs.map(f => f.categorie))];

  return (
    <div className="space-y-4">
      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Rechercher une question..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtres catégories */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <Button
          size="sm"
          variant={localCategorie === 'all' ? 'default' : 'outline'}
          onClick={() => setLocalCategorie('all')}
          className={localCategorie === 'all' ? 'bg-pink-500' : ''}
        >
          Toutes
        </Button>
        {categories.map(cat => (
          <Button
            key={cat}
            size="sm"
            variant={localCategorie === cat ? 'default' : 'outline'}
            onClick={() => setLocalCategorie(cat)}
            className={`flex-shrink-0 ${localCategorie === cat ? 'bg-pink-500' : ''}`}
          >
            {CATEGORIE_LABELS[cat] || cat}
          </Button>
        ))}
      </div>

      {/* Questions populaires */}
      {popularFaqs.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            Questions populaires
          </h3>
          {popularFaqs.map(faq => (
            <FAQItem 
              key={faq.id} 
              faq={faq} 
              isExpanded={expandedId === faq.id}
              onToggle={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
            />
          ))}
        </div>
      )}

      {/* Autres questions */}
      {otherFaqs.length > 0 && (
        <div className="space-y-2">
          {popularFaqs.length > 0 && (
            <h3 className="font-semibold text-sm mt-4">Autres questions</h3>
          )}
          {otherFaqs.map(faq => (
            <FAQItem 
              key={faq.id} 
              faq={faq} 
              isExpanded={expandedId === faq.id}
              onToggle={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
            />
          ))}
        </div>
      )}

      {filteredFaqs.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Aucune question trouvée</p>
            <p className="text-sm mt-1">Essayez de modifier votre recherche</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function FAQItem({ faq, isExpanded, onToggle }) {
  return (
    <Card className={`transition-shadow ${isExpanded ? 'shadow-md ring-1 ring-pink-200' : ''}`}>
      <button 
        className="w-full text-left p-4 flex items-start gap-3"
        onClick={onToggle}
      >
        <HelpCircle className="w-5 h-5 text-pink-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{faq.question}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {CATEGORIE_LABELS[faq.categorie]}
            </Badge>
            {faq.tranche_age && faq.tranche_age !== 'tous' && (
              <Badge variant="outline" className="text-xs">
                {AGE_LABELS[faq.tranche_age]}
              </Badge>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      
      {isExpanded && (
        <CardContent className="pt-0 pb-4 px-4 border-t">
          <div className="prose prose-sm max-w-none mt-3 text-gray-700">
            <ReactMarkdown>{faq.reponse}</ReactMarkdown>
          </div>
          {faq.source && (
            <p className="text-xs text-gray-400 mt-3 italic">
              Source: {faq.source}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  );
}