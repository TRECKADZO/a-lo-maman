import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Stethoscope,
  MessageSquare,
  Star,
  MapPin,
  CheckCircle,
  Loader2,
  X
} from 'lucide-react';

const specialiteLabels = {
  gynecologie: 'Gynécologue',
  pediatrie: 'Pédiatre',
  sage_femme: 'Sage-femme',
  medecin_generaliste: 'Médecin généraliste',
  infirmier: 'Infirmier(ère)',
  nutritionniste: 'Nutritionniste'
};

export default function NouveauMessage({ onClose, currentUserEmail }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialite, setSelectedSpecialite] = useState('toutes');
  const [creatingConversation, setCreatingConversation] = useState(false);
  const navigate = useNavigate();

  const { data: professionnels = [], isLoading } = useQuery({
    queryKey: ['professionnels'],
    queryFn: () => base44.entities.Professionnel.list(),
  });

  const handleStartConversation = async (proEmail) => {
    if (!currentUserEmail || !proEmail) return;

    setCreatingConversation(true);
    try {
      const participantEmails = [currentUserEmail, proEmail].sort();

      // Vérifier si une conversation existe déjà
      const existingConversations = await base44.entities.Conversation.filter({
        participant_emails: participantEmails
      });

      let conversationId;

      if (existingConversations.length > 0) {
        conversationId = existingConversations[0].id;
      } else {
        // Créer une nouvelle conversation
        const newConversation = await base44.entities.Conversation.create({
          participant_emails: participantEmails,
          last_message_content: 'Début de la conversation',
          last_message_date: new Date().toISOString()
        });
        conversationId = newConversation.id;
      }

      // Naviguer vers la messagerie avec cette conversation
      navigate(createPageUrl(`Messagerie?conversationId=${conversationId}`));
    } catch (error) {
      console.error('Erreur lors de la création de la conversation:', error);
      alert('Erreur lors du démarrage de la conversation');
    } finally {
      setCreatingConversation(false);
    }
  };

  const professionnelsFiltres = professionnels.filter(pro => {
    const matchSearch = 
      pro.nom_complet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.ville?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pro.specialite?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchSpecialite = selectedSpecialite === 'toutes' || pro.specialite === selectedSpecialite;

    return matchSearch && matchSpecialite;
  });

  const specialites = Object.keys(specialiteLabels);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <CardHeader className="border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
              <CardTitle className="text-xl">Nouveau message</CardTitle>
            </div>
          </div>
          
          {/* Recherche */}
          <div className="space-y-3 pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Rechercher un spécialiste par nom, ville, spécialité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtres spécialités */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedSpecialite === 'toutes' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSpecialite('toutes')}
                className={selectedSpecialite === 'toutes' ? 'bg-pink-600' : ''}
              >
                Tous
              </Button>
              {specialites.map((spec) => (
                <Button
                  key={spec}
                  variant={selectedSpecialite === spec ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSpecialite(spec)}
                  className={selectedSpecialite === spec ? 'bg-pink-600' : ''}
                >
                  {specialiteLabels[spec]}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>

        {/* Liste des spécialistes */}
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-pink-500" />
                <p className="text-sm text-gray-600 mt-2">Chargement des spécialistes...</p>
              </div>
            ) : professionnelsFiltres.length === 0 ? (
              <div className="p-12 text-center">
                <Stethoscope className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="font-semibold text-gray-800 mb-2">Aucun spécialiste trouvé</h3>
                <p className="text-sm text-gray-600">
                  Modifiez vos critères de recherche
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {professionnelsFiltres.map((pro) => (
                  <div
                    key={pro.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Photo */}
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {pro.photo ? (
                          <img
                            src={pro.photo}
                            alt={pro.nom_complet}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Stethoscope className="w-7 h-7 text-white" />
                        )}
                      </div>

                      {/* Informations */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {pro.nom_complet}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className="bg-teal-100 text-teal-800 text-xs">
                            {specialiteLabels[pro.specialite] || pro.specialite}
                          </Badge>
                          {pro.accepte_cmu && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              CMU
                            </Badge>
                          )}
                        </div>
                        {pro.ville && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{pro.ville}</span>
                          </div>
                        )}
                        {pro.note_moyenne && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{pro.note_moyenne}/5</span>
                          </div>
                        )}
                      </div>

                      {/* Bouton Message */}
                      <Button
                        onClick={() => handleStartConversation(pro.email)}
                        disabled={creatingConversation}
                        className="bg-pink-600 hover:bg-pink-700 flex-shrink-0"
                      >
                        {creatingConversation ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Message
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}