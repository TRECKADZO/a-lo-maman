import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pill,
  Shield,
  Leaf,
  CheckCircle,
  XCircle,
  AlertTriangle,
  DollarSign,
  Clock,
  TrendingUp,
  Info
} from "lucide-react";
import { motion } from "framer-motion";

const categorieIcons = {
  hormonale: Pill,
  barriere: Shield,
  naturelle: Leaf,
  permanente: CheckCircle,
  urgence: AlertTriangle
};

const categorieColors = {
  hormonale: "from-rose-400 to-pink-500",
  barriere: "from-blue-400 to-cyan-500",
  naturelle: "from-green-400 to-emerald-500",
  permanente: "from-purple-400 to-violet-500",
  urgence: "from-orange-400 to-red-500"
};

export default function MethodesList({ methodes, isLoading }) {
  const [selectedMethode, setSelectedMethode] = useState(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {methodes.map((methode, index) => {
          const Icon = categorieIcons[methode.categorie] || Pill;
          const colorGradient = categorieColors[methode.categorie];

          return (
            <motion.div
              key={methode.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card 
                className="cursor-pointer hover:shadow-xl transition-all duration-300 border-none overflow-hidden group"
                onClick={() => setSelectedMethode(methode)}
              >
                <div className={`h-2 bg-gradient-to-r ${colorGradient}`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2 group-hover:text-rose-600 transition-colors">
                        {methode.nom}
                      </CardTitle>
                      <Badge variant="outline" className="text-xs">
                        {methode.categorie}
                      </Badge>
                    </div>
                    <div className={`w-12 h-12 bg-gradient-to-br ${colorGradient} rounded-full flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Efficacité</span>
                      <span className="font-semibold text-green-600">
                        {methode.efficacite_theorique}%
                      </span>
                    </div>
                    
                    {methode.frequence_utilisation && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        {methode.frequence_utilisation.replace(/_/g, ' ')}
                      </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                      {methode.sans_hormones && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Sans hormones
                        </Badge>
                      )}
                      {methode.protection_ist && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                          Protection IST
                        </Badge>
                      )}
                    </div>

                    {methode.prise_charge_cmu && (
                      <div className="flex items-center gap-2 text-sm bg-teal-50 p-2 rounded-lg">
                        <DollarSign className="w-4 h-4 text-teal-600" />
                        <span className="text-teal-700">
                          CMU: {methode.prise_charge_cmu}
                        </span>
                      </div>
                    )}

                    <Button 
                      variant="outline" 
                      className="w-full mt-2 group-hover:bg-rose-50 group-hover:border-rose-300"
                    >
                      <Info className="w-4 h-4 mr-2" />
                      Voir les détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Dialog détails méthode */}
      <Dialog open={!!selectedMethode} onOpenChange={() => setSelectedMethode(null)}>
        <DialogContent className="max-w-2xl">
          {selectedMethode && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-3">
                  {React.createElement(categorieIcons[selectedMethode.categorie] || Pill, {
                    className: "w-8 h-8 text-rose-600"
                  })}
                  {selectedMethode.nom}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Efficacité */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Efficacité théorique</p>
                    <p className="text-3xl font-bold text-green-700">
                      {selectedMethode.efficacite_theorique}%
                    </p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-1">Efficacité réelle</p>
                    <p className="text-3xl font-bold text-blue-700">
                      {selectedMethode.efficacite_reelle}%
                    </p>
                  </div>
                </div>

                {/* Description */}
                {selectedMethode.description && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Info className="w-5 h-5 text-rose-600" />
                      Description
                    </h3>
                    <p className="text-gray-700 leading-relaxed">
                      {selectedMethode.description}
                    </p>
                  </div>
                )}

                {/* Mode d'usage */}
                {selectedMethode.mode_usage && (
                  <div>
                    <h3 className="font-semibold mb-2">Mode d'usage</h3>
                    <p className="text-gray-700">{selectedMethode.mode_usage}</p>
                  </div>
                )}

                {/* Avantages */}
                {selectedMethode.avantages && selectedMethode.avantages.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-green-700">
                      <CheckCircle className="w-5 h-5" />
                      Avantages
                    </h3>
                    <ul className="space-y-2">
                      {selectedMethode.avantages.map((avantage, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{avantage}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Inconvénients */}
                {selectedMethode.inconvenients && selectedMethode.inconvenients.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
                      <AlertTriangle className="w-5 h-5" />
                      Inconvénients
                    </h3>
                    <ul className="space-y-2">
                      {selectedMethode.inconvenients.map((inconvenient, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-orange-600 mt-1 flex-shrink-0" />
                          <span className="text-gray-700">{inconvenient}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Contre-indications */}
                {selectedMethode.contre_indications && selectedMethode.contre_indications.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-700">
                      <AlertTriangle className="w-5 h-5" />
                      Contre-indications
                    </h3>
                    <ul className="space-y-2">
                      {selectedMethode.contre_indications.map((contre, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-600 mt-1 flex-shrink-0" />
                          <span className="text-red-900">{contre}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Coût et CMU */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedMethode.cout_mensuel && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm text-gray-600 mb-1">Coût mensuel</p>
                      <p className="text-xl font-bold text-purple-700">
                        {selectedMethode.cout_mensuel}
                      </p>
                    </div>
                  )}
                  {selectedMethode.prise_charge_cmu && (
                    <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                      <p className="text-sm text-gray-600 mb-1">Prise en charge CMU</p>
                      <p className="text-xl font-bold text-teal-700">
                        {selectedMethode.prise_charge_cmu}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}