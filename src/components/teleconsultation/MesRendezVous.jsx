import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import GestionRendezVous from './GestionRendezVous';

export default function MesRendezVous({ rendezVous, professionnels, currentUserEmail, isSpecialist }) {
  // Récupérer tous les professionnels pour avoir les noms
  const { data: allProfessionnels = [] } = useQuery({
    queryKey: ['professionnels'],
    queryFn: () => base44.entities.Professionnel.list(),
    initialData: professionnels || [],
  });

  if (!rendezVous || rendezVous.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">
            Aucun rendez-vous
          </h3>
          <p className="text-gray-500">
            Vous n'avez pas encore de rendez-vous planifié
          </p>
        </CardContent>
      </Card>
    );
  }

  // Enrichir les RDV avec les infos du professionnel
  const rendezVousEnrichis = rendezVous.map(rdv => {
    const pro = allProfessionnels.find(p => p.id === rdv.professionnel_id);
    return {
      ...rdv,
      professionnel_nom: pro?.nom_complet || rdv.professionnel_email || 'Professionnel',
      professionnel_specialite: pro?.specialite || '',
      professionnel_photo: pro?.photo || '',
    };
  });

  const rdvAVenir = rendezVousEnrichis.filter(rdv => 
    new Date(rdv.date_rdv) >= new Date() && rdv.statut !== 'annule'
  );

  const rdvPasses = rendezVousEnrichis.filter(rdv => 
    new Date(rdv.date_rdv) < new Date() || rdv.statut === 'termine'
  );

  const rdvAnnules = rendezVousEnrichis.filter(rdv => rdv.statut === 'annule');

  return (
    <div className="space-y-6">
      {/* RDV à venir */}
      {rdvAVenir.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Rendez-vous à venir</h3>
          <div className="space-y-3">
            {rdvAVenir.map(rdv => (
              <GestionRendezVous
                key={rdv.id}
                rdv={rdv}
                currentUserEmail={currentUserEmail}
                isSpecialist={isSpecialist}
              />
            ))}
          </div>
        </div>
      )}

      {/* RDV passés */}
      {rdvPasses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Rendez-vous passés</h3>
          <div className="space-y-3">
            {rdvPasses.map(rdv => (
              <GestionRendezVous
                key={rdv.id}
                rdv={rdv}
                currentUserEmail={currentUserEmail}
                isSpecialist={isSpecialist}
              />
            ))}
          </div>
        </div>
      )}

      {/* RDV annulés */}
      {rdvAnnules.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 text-red-600">Rendez-vous annulés</h3>
          <div className="space-y-3">
            {rdvAnnules.map(rdv => (
              <GestionRendezVous
                key={rdv.id}
                rdv={rdv}
                currentUserEmail={currentUserEmail}
                isSpecialist={isSpecialist}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}