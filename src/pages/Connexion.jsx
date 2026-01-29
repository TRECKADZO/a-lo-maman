import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Heart,
  Mail,
  Lock,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from "lucide-react";

export default function Connexion() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const isAuthenticated = await base44.auth.isAuthenticated();
      
      if (!isAuthenticated) {
        throw new Error("Identifiants incorrects");
      }

      navigate(createPageUrl("Dashboard"));
    } catch (err) {
      console.error("Erreur de connexion:", err);
      setError("Email ou mot de passe incorrect. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex flex-col">
      {/* Header Mobile */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100 px-4 py-3">
        <Link to={createPageUrl("Intro")} className="inline-flex items-center gap-2 text-gray-700 font-medium active:scale-95 transition-transform">
          <ArrowLeft className="w-5 h-5" />
          Retour
        </Link>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 pb-32">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-[1.5rem] shadow-xl mb-4">
              <Heart className="w-10 h-10 text-white fill-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Connexion
            </h1>
            <p className="text-gray-600">
              Accédez à votre espace A'lo Maman
            </p>
          </div>

          {/* Formulaire */}
          <Card className="shadow-xl border-none">
            <CardContent className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold">Adresse email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="pl-11 h-12 text-base"
                      placeholder="votre@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-sm font-semibold">Mot de passe</Label>
                    <a href="#" className="text-sm text-pink-600 font-medium active:opacity-70">
                      Oublié ?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="pl-11 pr-11 h-12 text-base"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:scale-95"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-5 h-5 text-pink-600 rounded border-gray-300 focus:ring-2 focus:ring-pink-500"
                  />
                  <Label htmlFor="remember" className="cursor-pointer text-sm text-gray-700">
                    Se souvenir de moi
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-base font-semibold shadow-lg active:scale-95 transition-transform"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connexion...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Pas encore de compte ?{' '}
                  <Link to={createPageUrl("Inscription")} className="text-pink-600 font-semibold active:opacity-70">
                    Créer un compte
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Info CMU */}
          <div className="mt-6 p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-2xl border border-teal-200">
            <p className="text-sm text-teal-900 text-center">
              <strong>💡 Info :</strong> Compatible avec la CMU pour un accès facilité aux soins
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}