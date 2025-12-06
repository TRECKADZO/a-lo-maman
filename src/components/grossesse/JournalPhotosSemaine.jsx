import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Camera,
  Plus,
  Image,
  FileText,
  Heart,
  Smile,
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  X,
  Edit,
  Trash2,
  Baby
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { BottomSheet } from '@/components/ui/safe-area-view';

const HUMEURS = [
  { value: 'tres_bien', emoji: '😊', label: 'Très bien' },
  { value: 'bien', emoji: '🙂', label: 'Bien' },
  { value: 'fatiguee', emoji: '😴', label: 'Fatiguée' },
  { value: 'stresse', emoji: '😰', label: 'Stressée' },
  { value: 'emotionnelle', emoji: '🥺', label: 'Émotionnelle' },
  { value: 'heureuse', emoji: '🥰', label: 'Heureuse' },
];

export default function JournalPhotosSemaine({ grossesse, semainesGrossesse }) {
  const [showAjouter, setShowAjouter] = useState(false);
  const [selectedSemaine, setSelectedSemaine] = useState(semainesGrossesse);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [viewPhoto, setViewPhoto] = useState(null);
  const queryClient = useQueryClient();

  const [nouvelleEntree, setNouvelleEntree] = useState({
    semaine: semainesGrossesse,
    date: new Date().toISOString().split('T')[0],
    photo_url: '',
    titre: '',
    notes: '',
    humeur: '',
    poids: '',
    moments_forts: ''
  });

  // Récupérer les entrées du journal
  const journalSemaines = grossesse.journal_semaines || [];

  // Trier par semaine
  const entreesTriees = [...journalSemaines].sort((a, b) => b.semaine - a.semaine);

  // Entrée pour la semaine sélectionnée
  const entreeSelectionnee = journalSemaines.find(e => e.semaine === selectedSemaine);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNouvelleEntree({ ...nouvelleEntree, photo_url: file_url });
    } catch (error) {
      alert('Erreur lors du téléchargement de la photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const ajouterEntreeMutation = useMutation({
    mutationFn: async (data) => {
      const entreeExistante = journalSemaines.findIndex(e => e.semaine === data.semaine);
      
      let nouveauJournal;
      if (entreeExistante >= 0) {
        // Mettre à jour l'entrée existante
        nouveauJournal = [...journalSemaines];
        nouveauJournal[entreeExistante] = {
          ...nouveauJournal[entreeExistante],
          ...data,
          updated_at: new Date().toISOString()
        };
      } else {
        // Nouvelle entrée
        nouveauJournal = [...journalSemaines, {
          ...data,
          created_at: new Date().toISOString()
        }];
      }

      return base44.entities.SuiviGrossesse.update(grossesse.id, {
        journal_semaines: nouveauJournal
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
      setShowAjouter(false);
      setNouvelleEntree({
        semaine: semainesGrossesse,
        date: new Date().toISOString().split('T')[0],
        photo_url: '',
        titre: '',
        notes: '',
        humeur: '',
        poids: '',
        moments_forts: ''
      });
    }
  });

  const supprimerEntreeMutation = useMutation({
    mutationFn: async (semaine) => {
      const nouveauJournal = journalSemaines.filter(e => e.semaine !== semaine);
      return base44.entities.SuiviGrossesse.update(grossesse.id, {
        journal_semaines: nouveauJournal
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grossesse_active'] });
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    ajouterEntreeMutation.mutate(nouvelleEntree);
  };

  const naviguerSemaine = (direction) => {
    const nouvelleSemaine = selectedSemaine + direction;
    if (nouvelleSemaine >= 1 && nouvelleSemaine <= 42) {
      setSelectedSemaine(nouvelleSemaine);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header avec navigation */}
      <Card className="shadow-lg bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Journal Photo</h2>
                <p className="text-sm text-gray-600">
                  {entreesTriees.length} entrée{entreesTriees.length > 1 ? 's' : ''} enregistrée{entreesTriees.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                setNouvelleEntree({
                  ...nouvelleEntree,
                  semaine: semainesGrossesse
                });
                setShowAjouter(true);
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Ajouter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Navigation par semaine */}
      <Card className="shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => naviguerSemaine(-1)}
              disabled={selectedSemaine <= 1}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">Semaine {selectedSemaine}</p>
              <p className="text-sm text-gray-500">
                {selectedSemaine === semainesGrossesse ? '(Semaine actuelle)' : ''}
              </p>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => naviguerSemaine(1)}
              disabled={selectedSemaine >= 42}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Indicateurs de semaines avec entrées */}
          <div className="flex justify-center gap-1 mt-4 flex-wrap">
            {Array.from({ length: Math.min(semainesGrossesse + 2, 42) }).map((_, i) => {
              const semaine = i + 1;
              const hasEntree = journalSemaines.some(e => e.semaine === semaine);
              const isCurrent = semaine === selectedSemaine;
              
              return (
                <button
                  key={semaine}
                  onClick={() => setSelectedSemaine(semaine)}
                  className={`w-6 h-6 rounded-full text-xs font-medium transition-all ${
                    isCurrent
                      ? 'bg-pink-500 text-white scale-110'
                      : hasEntree
                        ? 'bg-purple-200 text-purple-800'
                        : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {semaine}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contenu de la semaine sélectionnée */}
      {entreeSelectionnee ? (
        <Card className="shadow-lg overflow-hidden">
          {entreeSelectionnee.photo_url && (
            <div 
              className="relative h-64 md:h-80 cursor-pointer"
              onClick={() => setViewPhoto(entreeSelectionnee.photo_url)}
            >
              <img
                src={entreeSelectionnee.photo_url}
                alt={`Semaine ${entreeSelectionnee.semaine}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                <Badge className="bg-black/60 text-white text-lg px-4 py-2">
                  Semaine {entreeSelectionnee.semaine}
                </Badge>
                {entreeSelectionnee.humeur && (
                  <span className="text-3xl">
                    {HUMEURS.find(h => h.value === entreeSelectionnee.humeur)?.emoji}
                  </span>
                )}
              </div>
            </div>
          )}

          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {entreeSelectionnee.titre || `Ma semaine ${entreeSelectionnee.semaine}`}
                </h3>
                <p className="text-sm text-gray-500">
                  {format(new Date(entreeSelectionnee.date), 'EEEE dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setNouvelleEntree(entreeSelectionnee);
                    setShowAjouter(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => {
                    if (confirm('Supprimer cette entrée ?')) {
                      supprimerEntreeMutation.mutate(entreeSelectionnee.semaine);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {entreeSelectionnee.humeur && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-purple-50 rounded-lg">
                <Smile className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Humeur :</span>
                <span className="text-2xl">
                  {HUMEURS.find(h => h.value === entreeSelectionnee.humeur)?.emoji}
                </span>
                <span>{HUMEURS.find(h => h.value === entreeSelectionnee.humeur)?.label}</span>
              </div>
            )}

            {entreeSelectionnee.poids && (
              <div className="flex items-center gap-2 mb-4 p-3 bg-pink-50 rounded-lg">
                <Baby className="w-5 h-5 text-pink-500" />
                <span className="font-medium">Poids :</span>
                <span>{entreeSelectionnee.poids} kg</span>
              </div>
            )}

            {entreeSelectionnee.notes && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Notes
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                  {entreeSelectionnee.notes}
                </p>
              </div>
            )}

            {entreeSelectionnee.moments_forts && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" />
                  Moments forts
                </h4>
                <p className="text-gray-700 whitespace-pre-wrap bg-red-50 p-4 rounded-lg">
                  {entreeSelectionnee.moments_forts}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardContent className="p-12 text-center">
            <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              Aucune entrée pour la semaine {selectedSemaine}
            </h3>
            <p className="text-gray-500 mb-4">
              Immortalisez cette semaine avec une photo et vos notes
            </p>
            <Button
              onClick={() => {
                setNouvelleEntree({
                  ...nouvelleEntree,
                  semaine: selectedSemaine
                });
                setShowAjouter(true);
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <Camera className="w-4 h-4 mr-2" />
              Ajouter une entrée
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Galerie des photos */}
      {entreesTriees.filter(e => e.photo_url).length > 0 && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-purple-500" />
              Ma galerie de grossesse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {entreesTriees
                .filter(e => e.photo_url)
                .map((entree, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => setSelectedSemaine(entree.semaine)}
                  >
                    <img
                      src={entree.photo_url}
                      alt={`Semaine ${entree.semaine}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Badge className="absolute bottom-2 left-2 bg-black/60 text-white text-xs">
                      S{entree.semaine}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal ajout */}
      <BottomSheet
        isOpen={showAjouter}
        onClose={() => setShowAjouter(false)}
        title={`Journal - Semaine ${nouvelleEntree.semaine}`}
        fullHeight
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto" style={{ maxHeight: '80vh' }}>
          {/* Photo */}
          <div className="space-y-2">
            <Label>Photo du ventre (optionnel)</Label>
            {nouvelleEntree.photo_url ? (
              <div className="relative">
                <img
                  src={nouvelleEntree.photo_url}
                  alt="Aperçu"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => setNouvelleEntree({ ...nouvelleEntree, photo_url: '' })}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-pink-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {uploadingPhoto ? (
                  <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Cliquez pour ajouter une photo</span>
                  </>
                )}
              </label>
            )}
          </div>

          {/* Titre */}
          <div className="space-y-2">
            <Label>Titre (optionnel)</Label>
            <Input
              value={nouvelleEntree.titre}
              onChange={(e) => setNouvelleEntree({ ...nouvelleEntree, titre: e.target.value })}
              placeholder={`Ma semaine ${nouvelleEntree.semaine}`}
            />
          </div>

          {/* Humeur */}
          <div className="space-y-2">
            <Label>Comment vous sentez-vous ?</Label>
            <div className="flex flex-wrap gap-2">
              {HUMEURS.map((humeur) => (
                <button
                  key={humeur.value}
                  type="button"
                  onClick={() => setNouvelleEntree({ ...nouvelleEntree, humeur: humeur.value })}
                  className={`px-4 py-2 rounded-full border-2 transition-all flex items-center gap-2 ${
                    nouvelleEntree.humeur === humeur.value
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-pink-300'
                  }`}
                >
                  <span className="text-xl">{humeur.emoji}</span>
                  <span className="text-sm">{humeur.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Poids */}
          <div className="space-y-2">
            <Label>Poids actuel (kg)</Label>
            <Input
              type="number"
              step="0.1"
              value={nouvelleEntree.poids}
              onChange={(e) => setNouvelleEntree({ ...nouvelleEntree, poids: e.target.value })}
              placeholder="Ex: 65.5"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes & réflexions</Label>
            <Textarea
              value={nouvelleEntree.notes}
              onChange={(e) => setNouvelleEntree({ ...nouvelleEntree, notes: e.target.value })}
              rows={4}
              placeholder="Comment s'est passée cette semaine ? Vos pensées, sensations..."
            />
          </div>

          {/* Moments forts */}
          <div className="space-y-2">
            <Label>Moments forts de la semaine</Label>
            <Textarea
              value={nouvelleEntree.moments_forts}
              onChange={(e) => setNouvelleEntree({ ...nouvelleEntree, moments_forts: e.target.value })}
              rows={3}
              placeholder="Premier coup de pied ressenti, échographie, annonce à la famille..."
            />
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAjouter(false)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={ajouterEntreeMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
            >
              {ajouterEntreeMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Enregistrer'
              )}
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* Visionneuse photo plein écran */}
      {viewPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setViewPhoto(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white"
            onClick={() => setViewPhoto(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={viewPhoto}
            alt="Photo"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}