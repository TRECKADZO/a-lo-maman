import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  MessageSquare,
  ThumbsUp,
  Award,
  Calendar,
  TrendingUp,
  Stethoscope,
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ProfilUtilisateurForum({ userEmail, onClose }) {
  const { data: user } = useQuery({
    queryKey: ['user_forum', userEmail],
    queryFn: async () => {
      // Get user info
      const users = await base44.entities.User.filter({ email: userEmail });
      return users[0];
    },
  });

  const { data: userProfile } = useQuery({
    queryKey: ['user_profile_forum', userEmail],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: userEmail });
      return profiles[0];
    },
  });

  const { data: profilPro } = useQuery({
    queryKey: ['profil_pro_forum', userEmail],
    queryFn: async () => {
      const profils = await base44.entities.Professionnel.filter({ email: userEmail });
      return profils[0];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ['messages_user_forum', userEmail],
    queryFn: async () => {
      const msgs = await base44.entities.MessageCommunaute.filter({ created_by: userEmail });
      return msgs;
    },
    initialData: [],
  });

  if (!user) return null;

  const specialites = ['gynecologie', 'pediatrie', 'sage_femme', 'medecin_generaliste', 'infirmier', 'nutritionniste'];
  const isSpecialist = userProfile?.type_compte && specialites.includes(userProfile.type_compte);

  // Calculer les statistiques
  const totalMessages = messages.length;
  const totalReponses = messages.reduce((acc, msg) => acc + (msg.reponses?.length || 0), 0);
  const totalUpvotes = messages.reduce((acc, msg) => acc + (msg.score_upvotes || 0), 0);
  
  // Calculer le badge
  const getBadge = () => {
    if (isSpecialist) return { text: 'Spécialiste Vérifié', color: 'bg-teal-100 text-teal-800', icon: CheckCircle };
    if (totalMessages + totalReponses > 50) return { text: 'Expert', color: 'bg-purple-100 text-purple-800', icon: Award };
    if (totalMessages + totalReponses > 20) return { text: 'Actif', color: 'bg-blue-100 text-blue-800', icon: TrendingUp };
    return { text: 'Nouveau', color: 'bg-gray-100 text-gray-800', icon: User };
  };

  const badge = getBadge();
  const BadgeIcon = badge.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Profil Communauté</CardTitle>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Profil */}
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profilPro?.photo} />
              <AvatarFallback className={isSpecialist ? 'bg-teal-100 text-teal-600' : 'bg-pink-100 text-pink-600'}>
                {user.full_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-800">{user.full_name}</h3>
              {isSpecialist && profilPro && (
                <p className="text-sm text-teal-600 flex items-center gap-1 mt-1">
                  <Stethoscope className="w-4 h-4" />
                  {profilPro.specialite} • {profilPro.structure_sante || 'Professionnel de santé'}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <Badge className={`${badge.color} flex items-center gap-1`}>
                  <BadgeIcon className="w-3 h-3" />
                  {badge.text}
                </Badge>
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Membre depuis {format(new Date(user.created_date), 'MMMM yyyy', { locale: fr })}
                </span>
              </div>
            </div>
          </div>

          {/* Bio spécialiste */}
          {isSpecialist && profilPro?.biographie && (
            <div className="p-4 bg-teal-50 rounded-lg">
              <p className="text-sm text-gray-700">{profilPro.biographie}</p>
            </div>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-4 text-center">
                <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-600">{totalMessages}</p>
                <p className="text-xs text-gray-600">Messages</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-violet-50">
              <CardContent className="p-4 text-center">
                <MessageSquare className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-purple-600">{totalReponses}</p>
                <p className="text-xs text-gray-600">Réponses</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-4 text-center">
                <ThumbsUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{totalUpvotes}</p>
                <p className="text-xs text-gray-600">Upvotes reçus</p>
              </CardContent>
            </Card>
          </div>

          {/* Expertises (pour spécialistes) */}
          {isSpecialist && profilPro?.certifications && profilPro.certifications.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-teal-600" />
                Domaines d'expertise
              </h4>
              <div className="flex flex-wrap gap-2">
                {profilPro.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline" className="bg-teal-50 text-teal-700">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Messages récents */}
          <div>
            <h4 className="font-semibold mb-3">Messages récents</h4>
            <div className="space-y-2">
              {messages.slice(0, 3).map((msg) => (
                <Card key={msg.id} className="bg-gray-50">
                  <CardContent className="p-3">
                    <p className="font-medium text-sm mb-1">{msg.sujet}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{format(new Date(msg.created_date), 'dd MMM yyyy', { locale: fr })}</span>
                      <span>•</span>
                      <span>{msg.reponses?.length || 0} réponses</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {msg.score_upvotes || 0}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}