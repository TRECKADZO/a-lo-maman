import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Star, Bug, Lightbulb, Heart } from 'lucide-react';
import { toast } from 'sonner';

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('improvement');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me().catch(() => null),
  });

  const submitFeedback = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.UserFeedback.create(data);
    },
    onSuccess: () => {
      resetForm();
      setOpen(false);
      setTimeout(() => {
        toast.success('Merci pour votre feedback !', {
          description: 'Votre avis a été envoyé avec succès'
        });
      }, 100);
    },
    onError: (error) => {
      console.error('Feedback error:', error);
      toast.error('Erreur lors de l\'envoi du feedback');
    }
  });

  const resetForm = () => {
    setFeedbackType('improvement');
    setRating(0);
    setTitle('');
    setDescription('');
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    
    if (!user) {
      toast.error('Veuillez vous connecter');
      return;
    }

    if (!title || !description) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    submitFeedback.mutate({
      user_email: user.email,
      feedback_type: feedbackType,
      page: window.location.pathname,
      rating: rating || undefined,
      title,
      description,
      device_info: {
        user_agent: navigator.userAgent,
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        platform: navigator.platform
      }
    });
  };

  const feedbackTypes = [
    { value: 'bug', label: 'Bug', icon: Bug, color: 'bg-red-100 text-red-800' },
    { value: 'improvement', label: 'Amélioration', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800' },
    { value: 'feature_request', label: 'Nouvelle fonctionnalité', icon: Star, color: 'bg-blue-100 text-blue-800' },
    { value: 'compliment', label: 'Compliment', icon: Heart, color: 'bg-pink-100 text-pink-800' }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed right-4 md:bottom-6 md:right-6 rounded-full shadow-lg z-40"
          style={{
            bottom: 'calc(10rem + env(safe-area-inset-bottom))'
          }}
          size="lg"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Votre avis compte !</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type de feedback */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Type de feedback <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {feedbackTypes.map(type => {
                const Icon = type.icon;
                const isSelected = feedbackType === type.value;
                
                const colorClasses = {
                  bug: isSelected ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50',
                  improvement: isSelected ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:border-yellow-300 hover:bg-yellow-50/50',
                  feature_request: isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50',
                  compliment: isSelected ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-300 hover:bg-pink-50/50'
                };
                
                const iconColors = {
                  bug: isSelected ? 'text-red-600' : 'text-gray-600',
                  improvement: isSelected ? 'text-yellow-600' : 'text-gray-600',
                  feature_request: isSelected ? 'text-blue-600' : 'text-gray-600',
                  compliment: isSelected ? 'text-pink-600' : 'text-gray-600'
                };
                
                return (
                  <button
                    key={type.value}
                    onClick={() => setFeedbackType(type.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${colorClasses[type.value]}`}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${iconColors[type.value]}`} />
                    <p className={`text-xs font-medium ${isSelected ? iconColors[type.value] : 'text-gray-700'}`}>{type.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="text-sm font-medium mb-2 block">Note globale (optionnel)</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Titre <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Résumé en quelques mots"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={!title && title !== '' ? 'border-red-300' : ''}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Décrivez votre suggestion ou problème en détail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className={!description && description !== '' ? 'border-red-300' : ''}
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!title || !description || submitFeedback.isPending}
            className="w-full"
          >
            {submitFeedback.isPending ? 'Envoi...' : 'Envoyer le feedback'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}