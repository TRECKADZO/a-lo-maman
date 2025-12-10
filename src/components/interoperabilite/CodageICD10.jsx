import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, FileText, AlertCircle, CheckCircle, Stethoscope
} from 'lucide-react';

export default function CodageICD10({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await base44.functions.invoke('codageStandards', {
        action: 'search_icd10',
        query
      });

      setResults(response.data.results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (code) => {
    setSelected(code);
    if (onSelect) {
      onSelect(code);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'grossesse': 'bg-pink-100 text-pink-800',
      'accouchement': 'bg-purple-100 text-purple-800',
      'nouveau_ne': 'bg-blue-100 text-blue-800',
      'pediatrie': 'bg-green-100 text-green-800',
      'symptome': 'bg-amber-100 text-amber-800',
      'nutrition': 'bg-orange-100 text-orange-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-red-600" />
          Codage ICD-10
        </CardTitle>
        <p className="text-sm text-gray-600">
          Classification internationale des maladies (10ème révision)
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Rechercher un diagnostic (ex: diabète, rougeole...)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {selected && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-900">Code sélectionné</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-lg">{selected.code}</p>
                <p className="text-sm text-gray-700">{selected.display}</p>
              </div>
              <Badge className={getCategoryColor(selected.category)}>
                {selected.category}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {results.map((item) => (
            <div
              key={item.code}
              onClick={() => handleSelect(item)}
              className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                selected?.code === item.code
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm font-bold bg-gray-100 px-2 py-1 rounded">
                      {item.code}
                    </code>
                    <Badge className={getCategoryColor(item.category)} variant="outline">
                      {item.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700">{item.display}</p>
                </div>
                <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </div>
          ))}

          {results.length === 0 && !loading && query && (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>Aucun résultat trouvé</p>
            </div>
          )}
        </div>

        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Catégories disponibles
          </h4>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-pink-100 text-pink-800">Grossesse</Badge>
            <Badge className="bg-purple-100 text-purple-800">Accouchement</Badge>
            <Badge className="bg-blue-100 text-blue-800">Nouveau-né</Badge>
            <Badge className="bg-green-100 text-green-800">Pédiatrie</Badge>
            <Badge className="bg-amber-100 text-amber-800">Symptômes</Badge>
            <Badge className="bg-orange-100 text-orange-800">Nutrition</Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}