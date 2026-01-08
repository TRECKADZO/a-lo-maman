import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { BottomSheet } from "@/components/ui/safe-area-view";
import { GripVertical, Settings, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function PersonnaliserNavigation({ preferences, navigationItems, onClose }) {
  const queryClient = useQueryClient();
  
  // Initialiser avec l'ordre actuel ou créer un ordre par défaut
  const initNavPerso = () => {
    if (preferences?.navigation_personnalisee && preferences.navigation_personnalisee.length > 0) {
      return preferences.navigation_personnalisee;
    }
    
    return navigationItems.map((item, index) => ({
      page: item.url.split('?')[0].split('/').pop(),
      ordre: index,
      visible: true,
      favori: false
    }));
  };

  const [navPerso, setNavPerso] = useState(initNavPerso());

  const toggleVisible = (page) => {
    setNavPerso(navPerso.map(n => 
      n.page === page ? { ...n, visible: !n.visible } : n
    ));
  };

  const toggleFavori = (page) => {
    setNavPerso(navPerso.map(n => 
      n.page === page ? { ...n, favori: !n.favori } : n
    ));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(navPerso);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Mettre à jour les ordres
    const updated = items.map((item, index) => ({ ...item, ordre: index }));
    setNavPerso(updated);
  };

  const sauvegarderMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      
      if (preferences) {
        await base44.entities.PreferencesDashboard.update(preferences.id, {
          navigation_personnalisee: navPerso
        });
      } else {
        await base44.entities.PreferencesDashboard.create({
          user_email: user.email,
          navigation_personnalisee: navPerso
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences_nav'] });
      toast.success('Navigation personnalisée enregistrée');
      onClose();
    }
  });

  const getItemLabel = (page) => {
    const item = navigationItems.find(i => i.url.split('?')[0].split('/').pop() === page);
    return item?.title || page;
  };

  const getItemIcon = (page) => {
    const item = navigationItems.find(i => i.url.split('?')[0].split('/').pop() === page);
    return item?.icon;
  };

  return (
    <BottomSheet isOpen={true} onClose={onClose} title="Personnaliser la navigation" fullHeight>
      <div className="p-6 space-y-6 pb-32">
        <p className="text-sm text-gray-600">
          Organisez vos sections préférées. Glissez pour réorganiser, décochez pour masquer.
        </p>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="navigation">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {navPerso.map((item, index) => {
                  const Icon = getItemIcon(item.page);
                  
                  return (
                    <Draggable key={item.page} draggableId={item.page} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white border-2 rounded-xl p-4 transition-all ${
                            snapshot.isDragging ? 'shadow-2xl border-blue-400' : 
                            item.visible ? 'border-gray-200' : 'border-gray-100 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-5 h-5 text-gray-400" />
                            </div>

                            <Checkbox
                              checked={item.visible}
                              onCheckedChange={() => toggleVisible(item.page)}
                            />

                            <div className="flex items-center gap-2 flex-1">
                              {Icon && <Icon className="w-5 h-5 text-gray-600" />}
                              <span className={`font-medium ${item.visible ? 'text-gray-900' : 'text-gray-400'}`}>
                                {getItemLabel(item.page)}
                              </span>
                            </div>

                            <button
                              onClick={() => toggleFavori(item.page)}
                              className="p-1"
                            >
                              <Star 
                                className={`w-5 h-5 ${
                                  item.favori 
                                    ? 'fill-yellow-400 text-yellow-400' 
                                    : 'text-gray-300'
                                }`}
                              />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="bg-blue-50 rounded-xl p-4">
          <p className="text-xs text-blue-900">
            💡 Les favoris (★) apparaîtront en haut de votre navigation
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={() => sauvegarderMutation.mutate()}
            disabled={sauvegarderMutation.isPending}
            className="flex-1 bg-pink-600 hover:bg-pink-700"
          >
            {sauvegarderMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Settings className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}