import React, { useState, useEffect } from 'react';
import { base44 } from "@/api/base44Client";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SmilePlus } from 'lucide-react';

const EMOJIS = ['👍', '❤️', '😂', '🙏', '🤗'];

export default function EmojiReactions({ reactions, onUpdate }) {
    const [currentUserEmail, setCurrentUserEmail] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await base44.auth.me();
                setCurrentUserEmail(user.email);
            } catch (error) {
                console.error("Utilisateur non connecté", error);
            }
        };
        fetchUser();
    }, []);

    const handleReaction = (emoji) => {
        if (!currentUserEmail) return;

        const newReactions = JSON.parse(JSON.stringify(reactions || {}));
        
        // Initialiser le tableau si l'émoji n'a pas encore de réactions
        if (!newReactions[emoji]) {
            newReactions[emoji] = [];
        }

        const userHasReacted = newReactions[emoji].includes(currentUserEmail);

        if (userHasReacted) {
            // Retirer la réaction de l'utilisateur
            newReactions[emoji] = newReactions[emoji].filter(email => email !== currentUserEmail);
            // Si plus personne n'a réagi avec cet émoji, le supprimer
            if (newReactions[emoji].length === 0) {
                delete newReactions[emoji];
            }
        } else {
            // Ajouter la réaction de l'utilisateur
            newReactions[emoji].push(currentUserEmail);
        }

        onUpdate(newReactions);
    };

    const sortedReactions = Object.entries(reactions || {})
        .filter(([, users]) => users.length > 0)
        .sort((a, b) => b[1].length - a[1].length);

    return (
        <div className="flex items-center gap-1">
            {/* Afficher les réactions existantes */}
            {sortedReactions.map(([emoji, users]) => (
                <Button
                    key={emoji}
                    variant="outline"
                    size="sm"
                    className={`h-8 px-2.5 rounded-full ${users.includes(currentUserEmail) ? 'bg-blue-100 border-blue-300' : ''}`}
                    onClick={() => handleReaction(emoji)}
                >
                    {emoji} <span className="ml-1.5 text-xs font-medium">{users.length}</span>
                </Button>
            ))}

            {/* Popover pour ajouter une réaction */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                        <SmilePlus className="w-4 h-4 text-gray-500" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-1">
                    <div className="flex gap-1">
                        {EMOJIS.map(emoji => (
                            <Button
                                key={emoji}
                                variant="ghost"
                                size="icon"
                                className="text-xl rounded-full"
                                onClick={() => handleReaction(emoji)}
                            >
                                {emoji}
                            </Button>
                        ))}
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}