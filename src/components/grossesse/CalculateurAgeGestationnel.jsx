import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Calculator, Calendar, Baby, Heart, Loader2, 
  CheckCircle2, Info, Sparkles
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CalculateurAgeGestationnel({ grossesse, onUpdate }) {
  const queryClient = useQueryClient();
  const [methode, setMethode] = useState('ddr');
  const [dateDDR, setDateDDR] = useState(grossesse?.date_derniere_regle || '');
  const [dateEcho, setDateEcho] = useState('');
  const [semainesEcho, setSemainesEcho] = useState('');
  const [joursEcho, setJoursEcho] = useState('');
  const [resultat, setResultat] = useState(null);

  // Calcul automatique à chaque changement
  useEffect(() => {
    calculerAge();
  }, [dateDDR, dateEcho, semainesEcho, joursEcho, methode]);

  const calculerAge = () => {
    const today = new Date();
    let ddr, dpa, semainesActuelles, joursRestants;

    if (methode === 'ddr' && dateDDR) {
      ddr = new Date(dateDDR);
      dpa = addDays(ddr, 280); // Règle de Naegele
      
      const joursDepuisDDR = differenceInDays(today, ddr);
      semainesActuelles = Math.floor(joursDepuisDDR / 7);
      joursRestants = joursDepuisDDR % 7;

    } else if (methode === 'echographie' && dateEcho && semainesEcho) {
      // Calcul basé sur l'échographie
      const echoDate = new Date(dateEcho);
      const semainesAEcho = parseInt(semainesEcho) || 0;
      const joursAEcho = parseInt(joursEcho) || 0;
      const joursGestationAEcho = (semainesAEcho * 7) + joursAEcho;

      // Calculer la DDR à partir de l'échographie
      ddr = addDays(echoDate, -joursGestationAEcho);
      dpa = addDays(ddr, 280);

      const joursDepuisDDR = differenceInDays(today, ddr);
      semainesActuelles = Math.floor(joursDepuisDDR / 7);
      joursRestants = joursDepuisDDR % 7;

    } else if (methode === 'combine' && dateDDR && dateEcho && semainesEcho) {
      // Méthode combinée (moyenne pondérée)
      const ddrFromDDR = new Date(dateDDR);
      
      const echoDate = new Date(dateEcho);
      const semainesAEcho = parseInt(semainesEcho) || 0;
      const joursAEcho = parseInt(joursEcho) || 0;
      const joursGestationAEcho = (semainesAEcho * 7) + joursAEcho;
      const ddrFromEcho = addDays(echoDate, -joursGestationAEcho);

      // Si différence < 7 jours, utiliser DDR, sinon échographie
      const diff = Math.abs(differenceInDays(ddrFromDDR, ddrFromEcho));
      if (diff <= 7) {
        ddr = ddrFromDDR;
      } else {
        // Utiliser l'échographie (plus précise au 1er trimestre)
        ddr = ddrFromEcho;
      }

      dpa = addDays(ddr, 280);
      const joursDepuisDDR = differenceInDays(today, ddr);
      semainesActuelles = Math.floor(joursDepuisDDR / 7);
      joursRestants = joursDepuisDDR % 7;

    } else {
      setResultat(null);
      return;
    }

    const trimestre = semainesActuelles < 14 ? 1 : semainesActuelles < 28 ? 2 : 3;
    const joursAvantAccouchement = differenceInDays(dpa, today);
    const semainesAvantAccouchement = Math.floor(joursAvantAccouchement / 7);
    const pourcentage = Math.min(100, Math.round((semainesActuelles / 40) * 100));

    // Calcul du mois de grossesse
    const moisGrossesse = Math.floor(semainesActuelles / 4);

    setResultat({
      ddr: ddr.toISOString().split('T')[0],
      dpa: dpa.toISOString().split('T')[0],
      semainesActuelles,
      joursRestants,
      trimestre,
      moisGrossesse,
      joursAvantAccouchement,
      semainesAvantAccouchement,
      pourcentage
    });
  };

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!resultat || !grossesse) return;
      
      return base44.entities.SuiviGrossesse.update(grossesse.id, {
        date_derniere_regle: resultat.ddr,
        date_accouchement_prevue: resultat.dpa
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      if (onUpdate) onUpdate(resultat);
    }
  });

  const getTrimestreInfo = (trimestre) => {
    switch (trimestre) {
      case 1:
        return { color: 'bg-pink-100 text-pink-800', label: '1er Trimestre', desc: 'Semaines 1-13' };
      case 2:
        return { color: 'bg-purple-100 text-purple-800', label: '2ème Trimestre', desc: 'Semaines 14-27' };
      case 3:
        return { color: 'bg-blue-100 text-blue-800', label: '3ème Trimestre', desc: 'Semaines 28-40' };
      default:
        return { color: 'bg-gray-100 text-gray-800', label: '-', desc: '' };
    }
  };

  return (
    <Card className="shadow-xl">
      <CardHeader className="bg-gradient-to-r from-pink-50 to-purple-50">
        <CardTitle className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          Calculateur d'âge gestationnel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Méthode de calcul */}
        <Tabs value={methode} onValueChange={setMethode}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ddr" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              DDR
            </TabsTrigger>
            <TabsTrigger value="echographie" className="text-xs">
              <Baby className="w-3 h-3 mr-1" />
              Échographie
            </TabsTrigger>
            <TabsTrigger value="combine" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              Combiné
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ddr" className="mt-4 space-y-4">
            <div className="p-3 bg-pink-50 rounded-lg border border-pink-200">
              <p className="text-sm text-pink-800">
                <Info className="w-4 h-4 inline mr-1" />
                Méthode basée sur le premier jour de vos dernières règles
              </p>
            </div>
            <div>
              <Label>Date des dernières règles (DDR)</Label>
              <Input
                type="date"
                value={dateDDR}
                onChange={(e) => setDateDDR(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>
          </TabsContent>

          <TabsContent value="echographie" className="mt-4 space-y-4">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800">
                <Info className="w-4 h-4 inline mr-1" />
                Plus précis au 1er trimestre - basé sur la datation échographique
              </p>
            </div>
            <div>
              <Label>Date de l'échographie</Label>
              <Input
                type="date"
                value={dateEcho}
                onChange={(e) => setDateEcho(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Semaines à l'échographie</Label>
                <Input
                  type="number"
                  min="0"
                  max="42"
                  value={semainesEcho}
                  onChange={(e) => setSemainesEcho(e.target.value)}
                  placeholder="SA"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Jours supplémentaires</Label>
                <Input
                  type="number"
                  min="0"
                  max="6"
                  value={joursEcho}
                  onChange={(e) => setJoursEcho(e.target.value)}
                  placeholder="0-6"
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="combine" className="mt-4 space-y-4">
            <div className="p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Méthode la plus précise - combine DDR et échographie
              </p>
            </div>
            <div>
              <Label>Date des dernières règles (DDR)</Label>
              <Input
                type="date"
                value={dateDDR}
                onChange={(e) => setDateDDR(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Date de l'échographie de datation</Label>
              <Input
                type="date"
                value={dateEcho}
                onChange={(e) => setDateEcho(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Semaines à l'échographie</Label>
                <Input
                  type="number"
                  min="0"
                  max="42"
                  value={semainesEcho}
                  onChange={(e) => setSemainesEcho(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Jours</Label>
                <Input
                  type="number"
                  min="0"
                  max="6"
                  value={joursEcho}
                  onChange={(e) => setJoursEcho(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Résultat */}
        {resultat && (
          <div className="space-y-4 pt-4 border-t">
            {/* Âge gestationnel actuel */}
            <div className="p-6 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl text-center">
              <p className="text-sm text-gray-600 mb-2">Âge gestationnel actuel</p>
              <p className="text-4xl font-bold text-gray-800">
                {resultat.semainesActuelles} SA + {resultat.joursRestants}j
              </p>
              <p className="text-lg text-gray-600 mt-2">
                {resultat.moisGrossesse} mois de grossesse
              </p>
              <Badge className={`mt-3 ${getTrimestreInfo(resultat.trimestre).color}`}>
                {getTrimestreInfo(resultat.trimestre).label}
              </Badge>
            </div>

            {/* DPA */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl text-center">
                <Calendar className="w-6 h-6 text-pink-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500">DDR calculée</p>
                <p className="font-semibold">
                  {format(new Date(resultat.ddr), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl text-center">
                <Heart className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Date prévue</p>
                <p className="font-bold text-rose-700">
                  {format(new Date(resultat.dpa), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>

            {/* Progression */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progression</span>
                <span className="font-semibold">{resultat.pourcentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 transition-all"
                  style={{ width: `${resultat.pourcentage}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">
                {resultat.semainesAvantAccouchement} semaines restantes ({resultat.joursAvantAccouchement} jours)
              </p>
            </div>

            {/* Bouton de mise à jour */}
            {grossesse && (
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Mettre à jour ma grossesse
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}