import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Baby, ArrowRight, Sparkles, FileText, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function NaissanceCTA({ className = '', variant = 'full' }) {
  if (variant === 'compact') {
    return (
      <Link to={createPageUrl('DeclarationNaissance')}>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={className}
        >
          <Card className="border-2 border-pink-200 shadow-lg bg-gradient-to-br from-pink-50 via-white to-rose-50 cursor-pointer hover:shadow-xl transition-all">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                  <Baby className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1">Déclarer une naissance</h3>
                  <p className="text-xs text-gray-600">En quelques clics, obtenez l'acte</p>
                </div>
                <ArrowRight className="w-5 h-5 text-pink-500 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Link>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="border-2 border-pink-200 shadow-xl bg-gradient-to-br from-pink-50 via-white to-purple-50 overflow-hidden">
        {/* Header avec badge */}
        <div className="bg-gradient-to-r from-pink-500 to-rose-600 p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">Nouveau service</span>
            </div>
            <h2 className="text-2xl font-bold mb-1">Mon bébé est né ! 🎉</h2>
            <p className="text-white/90 text-sm">Déclarez sa naissance facilement</p>
          </div>
        </div>

        <CardContent className="p-6">
          {/* Bénéfices */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-pink-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Déclaration simplifiée</p>
                <p className="text-xs text-gray-600">Formulaire en ligne en 5 minutes</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Dans les 60 jours</p>
                <p className="text-xs text-gray-600">Respectez le délai légal ivoirien</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Baby className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Carnet médical inclus</p>
                <p className="text-xs text-gray-600">Création automatique après déclaration</p>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Link to={createPageUrl('DeclarationNaissance')}>
            <Button className="w-full h-14 bg-gradient-to-r from-pink-500 to-rose-600 text-lg shadow-lg hover:shadow-xl transition-all">
              Déclarer la naissance
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>

          <p className="text-xs text-gray-500 text-center mt-3">
            100% gratuit • Sécurisé • Conforme à la réglementation ONECI
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}