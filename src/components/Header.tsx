import { Button } from "@heroui/react";
import { PlusIcon, KeyIcon, ShieldCheckIcon, FingerPrintIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { BiometricAuthModal } from "./BiometricAuthModal";
import { useBiometric } from "../hooks/useBiometric";

interface HeaderProps {
  onAddPassword: () => void;
  onGeneratePassword: () => void;
}

export default function Header({ onAddPassword, onGeneratePassword }: HeaderProps) {
  const [showBiometricAuth, setShowBiometricAuth] = useState(false);
  const { isAvailable } = useBiometric();

  const handleAddClick = () => {
    console.log("Add button clicked");
    onAddPassword();
  };

  const handleGenerateClick = () => {
    console.log("Generate button clicked");
    onGeneratePassword();
  };

  const handleBiometricTest = () => {
    setShowBiometricAuth(true);
  };

  const handleBiometricSuccess = () => {
    console.log("Authentification biométrique réussie !");
    // Ici vous pouvez ajouter la logique après authentification
  };

  return (
    <header className="relative overflow-hidden gradient-header text-white">
      {/* Formes décoratives */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-300 opacity-20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300 opacity-20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Logo avec effet moderne */}
            <div className="relative">
              <div className="glass rounded-2xl p-4 shadow-2xl">
                <div className="gradient-primary rounded-xl p-2">
                  <ShieldCheckIcon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            
            <div className="space-y-1">
              <h1 className="text-4xl font-bold text-white tracking-tight">
                VaultWord
              </h1>
              <p className="text-blue-100 text-sm font-medium tracking-wide">
                Gestionnaire de mots de passe sécurisé
              </p>
              <div className="flex items-center space-x-2 text-xs text-blue-200">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Chiffrement AES-256</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Bouton d'authentification biométrique */}
            {isAvailable && (
              <Button
                size="lg"
                className="glass text-white hover:bg-white hover:bg-opacity-20 hover:scale-105 transition-all duration-300 shadow-xl"
                startContent={<FingerPrintIcon className="h-5 w-5" />}
                onPress={handleBiometricTest}
              >
                <span className="font-semibold">Biométrie</span>
              </Button>
            )}
            
            <Button
              size="lg"
              className="glass text-white hover:bg-white hover:bg-opacity-20 hover:scale-105 transition-all duration-300 shadow-xl"
              startContent={<PlusIcon className="h-5 w-5" />}
              onPress={handleAddClick}
            >
              <span className="font-semibold">Ajouter</span>
            </Button>
            
            <Button
              size="lg"
              className="gradient-primary text-white hover:opacity-90 hover:scale-105 transition-all duration-300 shadow-xl border-0"
              startContent={<KeyIcon className="h-5 w-5" />}
              onPress={handleGenerateClick}
            >
              <span className="font-semibold">Générateur</span>
            </Button>
          </div>
        </div>
        
        {/* Indicateurs de statut */}
        <div className="mt-8 flex items-center justify-center space-x-8 text-sm text-blue-100">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
            <span>Stockage local sécurisé</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
            <span>Aucune donnée envoyée en ligne</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
            <span>Générateur cryptographique</span>
          </div>
        </div>
      </div>

      {/* Modal d'authentification biométrique */}
      <BiometricAuthModal
        isOpen={showBiometricAuth}
        onClose={() => setShowBiometricAuth(false)}
        onSuccess={handleBiometricSuccess}
        title="Test d'authentification biométrique"
        reason="Testez votre authentification biométrique"
        requireAuth={false}
      />
    </header>
  );
} 