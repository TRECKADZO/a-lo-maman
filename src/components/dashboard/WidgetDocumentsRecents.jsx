import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, FolderOpen, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function WidgetDocumentsRecents({ documents, enfants, onRemove }) {
  const documentsRecents = documents?.slice(0, 5) || [];

  const getEnfantNom = (docEnfantId) => {
    if (!docEnfantId) return null;
    const enfant = enfants?.find(e => e.id === docEnfantId);
    return enfant?.prenom;
  };

  return (
    <Card className="shadow-xl border-none overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Documents récents
          </h3>
          <Badge className="bg-green-600 text-white">{documentsRecents.length}</Badge>
        </div>

        <div className="space-y-3">
          {documentsRecents.length > 0 ? (
            <>
              {documentsRecents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl p-3 shadow-sm">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{doc.titre}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(doc.date_document || doc.created_date), 'dd MMM yyyy', { locale: fr })}
                      </p>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {doc.type_document && (
                          <Badge variant="outline" className="text-xs">{doc.type_document}</Badge>
                        )}
                        {getEnfantNom(doc.enfant_id) && (
                          <Badge variant="secondary" className="text-xs">{getEnfantNom(doc.enfant_id)}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full">
                <Link to={createPageUrl('MesDocuments')}>
                  Tous les documents
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-3">Aucun document</p>
              <Button asChild size="sm">
                <Link to={createPageUrl('MesDocuments')}>
                  Ajouter un document
                </Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}