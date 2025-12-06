import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { differenceInMonths } from "date-fns";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function ComparaisonCroissance({ enfants }) {
  // Préparer les données pour un graphique temporel
  const preparerDonneesCroissance = () => {
    const alleMesures = [];
    
    enfants.forEach((enfant, enfantIndex) => {
      const mesures = enfant.mesures_croissance || [];
      
      // Ajouter la mesure de naissance
      if (enfant.poids_naissance) {
        alleMesures.push({
          enfant: enfant.prenom,
          ageMois: 0,
          poids: enfant.poids_naissance,
          taille: enfant.taille_naissance,
          couleur: COLORS[enfantIndex % COLORS.length]
        });
      }
      
      // Ajouter toutes les autres mesures
      mesures.forEach(mesure => {
        const ageMois = differenceInMonths(new Date(mesure.date), new Date(enfant.date_naissance));
        alleMesures.push({
          enfant: enfant.prenom,
          ageMois,
          poids: mesure.poids,
          taille: mesure.taille,
          couleur: COLORS[enfantIndex % COLORS.length]
        });
      });
    });
    
    // Grouper par âge en mois
    const groupeParAge = {};
    alleMesures.forEach(mesure => {
      if (!groupeParAge[mesure.ageMois]) {
        groupeParAge[mesure.ageMois] = { ageMois: mesure.ageMois };
      }
      groupeParAge[mesure.ageMois][`${mesure.enfant}_poids`] = mesure.poids;
      groupeParAge[mesure.ageMois][`${mesure.enfant}_taille`] = mesure.taille;
    });
    
    return Object.values(groupeParAge).sort((a, b) => a.ageMois - b.ageMois);
  };

  const donneesCroissance = preparerDonneesCroissance();

  if (donneesCroissance.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Évolution comparative du poids</CardTitle>
          <p className="text-sm text-gray-600">
            Comparaison de la croissance en poids entre vos enfants
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={donneesCroissance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="ageMois" 
                label={{ value: 'Âge (mois)', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis label={{ value: 'Poids (kg)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {enfants.map((enfant, index) => (
                <Line
                  key={enfant.id}
                  type="monotone"
                  dataKey={`${enfant.prenom}_poids`}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  name={enfant.prenom}
                  dot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Évolution comparative de la taille</CardTitle>
          <p className="text-sm text-gray-600">
            Comparaison de la croissance en taille entre vos enfants
          </p>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={donneesCroissance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="ageMois" 
                label={{ value: 'Âge (mois)', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis label={{ value: 'Taille (cm)', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Legend />
              {enfants.map((enfant, index) => (
                <Line
                  key={enfant.id}
                  type="monotone"
                  dataKey={`${enfant.prenom}_taille`}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  name={enfant.prenom}
                  dot={{ r: 4 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}