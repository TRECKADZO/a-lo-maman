import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Beaker, Pill, Stethoscope, Search, AlertTriangle,
  CheckCircle, Info
} from 'lucide-react';

export default function RechercheStandards({ onSelect, type = 'all' }) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('loinc');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const searchLOINC = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('codageStandards', {
        action: 'search_loinc',
        query
      });
      setResults(response.data.results);
    } catch (error) {
      console.error('LOINC search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchMedication = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('codageStandards', {
        action: 'search_medication',
        query
      });
      setResults(response.data.results);
    } catch (error) {
      console.error('Medication search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setResults([]);
    if (activeTab === 'loinc') {
      searchLOINC();
    } else if (activeTab === 'medication') {
      searchMedication();
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Beaker className="w-5 h-5 text-purple-600" />
          Standards Médicaux
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="loinc">
              <Beaker className="w-4 h-4 mr-2" />
              LOINC (Tests)
            </TabsTrigger>
            <TabsTrigger value="medication">
              <Pill className="w-4 h-4 mr-2" />
              ATC (Médicaments)
            </TabsTrigger>
          </TabsList>

          <TabsContent value="loinc" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Rechercher un test (ex: glucose, hémoglobine...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((item) => (
                <div
                  key={item.code}
                  onClick={() => onSelect && onSelect(item)}
                  className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-all hover:border-purple-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-bold bg-purple-100 text-purple-800 px-2 py-1 rounded">
                          {item.code}
                        </code>
                        <Badge variant="outline">{item.unit}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{item.display}</p>
                      {item.normalRange && (
                        <p className="text-xs text-gray-600 mt-1">
                          <Info className="w-3 h-3 inline mr-1" />
                          Normal: {item.normalRange}
                        </p>
                      )}
                    </div>
                    <Beaker className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="text-xs text-purple-800">
                <strong>LOINC</strong> : Logical Observation Identifiers Names and Codes
                <br />Standard pour l'identification des tests de laboratoire et observations cliniques
              </p>
            </div>
          </TabsContent>

          <TabsContent value="medication" className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Rechercher un médicament (ex: paracétamol...)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((item) => (
                <div
                  key={item.code}
                  onClick={() => onSelect && onSelect(item)}
                  className="p-3 border rounded-lg cursor-pointer hover:shadow-md transition-all hover:border-blue-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-xs font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {item.code}
                        </code>
                      </div>
                      <p className="text-sm font-semibold text-gray-800">{item.display}</p>
                      <p className="text-xs text-gray-600 mt-1">DCI: {item.dci}</p>
                      
                      <div className="flex gap-2 mt-2">
                        <Badge 
                          className={
                            item.grossesse === 'Autorisé' ? 'bg-green-100 text-green-800' :
                            item.grossesse === 'Recommandé' ? 'bg-blue-100 text-blue-800' :
                            item.grossesse === 'Précaution' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }
                        >
                          {item.grossesse === 'Autorisé' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {item.grossesse === 'Contre-indiqué' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          Grossesse: {item.grossesse}
                        </Badge>
                        <Badge 
                          variant="outline"
                          className={
                            item.allaitement === 'Autorisé' ? 'border-green-300 text-green-700' :
                            item.allaitement === 'Précaution' ? 'border-amber-300 text-amber-700' :
                            'border-red-300 text-red-700'
                          }
                        >
                          Allaitement: {item.allaitement}
                        </Badge>
                      </div>
                    </div>
                    <Pill className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>ATC</strong> : Anatomical Therapeutic Chemical Classification
                <br />Standard OMS pour l'identification et classification des médicaments
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}