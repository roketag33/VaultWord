import { Button } from "@heroui/react";
import { 
  PlusIcon, 
  KeyIcon, 
  ShieldCheckIcon, 
  FingerPrintIcon,
  ArrowsRightLeftIcon 
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { BiometricAuthModal } from "./BiometricAuthModal";
import { useBiometric } from "../hooks/useBiometric";

interface HeaderProps {
  onAddPassword: () => void;
  onGeneratePassword: () => void;
  onImportExport: () => void;
}

export default function Header({ onAddPassword, onGeneratePassword, onImportExport }: HeaderProps) {
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState(false);
  const { isAvailable } = useBiometric();

  const handleBiometricSuccess = () => {
    console.log("Authentification biométrique réussie !");
    // Ici vous pouvez ajouter la logique après authentification réussie
  };

  return (
    <>
      <header className="glass-card rounded-2xl p-6 mb-8 shadow-xl border border-white/20">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-3 shadow-lg">
              <ShieldCheckIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">VaultWord</h1>
              <p className="text-gray-600">Gestionnaire de mots de passe sécurisé</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button
              color="primary"
              variant="flat"
              startContent={<PlusIcon className="h-4 w-4" />}
              onPress={onAddPassword}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors"
            >
              Ajouter
            </Button>
            
            <Button
              color="secondary"
              variant="flat"
              startContent={<KeyIcon className="h-4 w-4" />}
              onPress={onGeneratePassword}
              className="bg-purple-100 hover:bg-purple-200 text-purple-700 transition-colors"
            >
              Générer
            </Button>

            <Button
              color="success"
              variant="flat"
              startContent={<ArrowsRightLeftIcon className="h-4 w-4" />}
              onPress={onImportExport}
              className="bg-green-100 hover:bg-green-200 text-green-700 transition-colors"
            >
              Import/Export
            </Button>
            
            {isAvailable && (
              <Button
                color="warning"
                variant="flat"
                startContent={<FingerPrintIcon className="h-4 w-4" />}
                onPress={() => setIsBiometricModalOpen(true)}
                className="bg-orange-100 hover:bg-orange-200 text-orange-700 transition-colors"
              >
                Biométrie
              </Button>
            )}
          </div>
        </div>
      </header>

      <BiometricAuthModal 
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        onSuccess={handleBiometricSuccess}
        title="Test d'authentification biométrique"
        reason="Testez votre authentification biométrique"
        requireAuth={false}
      />
    </>
  );
} 