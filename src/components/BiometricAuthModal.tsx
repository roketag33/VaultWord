import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Spinner,
  Chip,
} from '@heroui/react';
import { useBiometric, BiometryType } from '../hooks/useBiometric';

interface BiometricAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  reason?: string;
  requireAuth?: boolean;
}

export const BiometricAuthModal: React.FC<BiometricAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Authentification requise',
  reason = 'Veuillez vous authentifier pour continuer',
  requireAuth = true,
}) => {
  const {
    isAvailable,
    biometricType,
    isLoading,
    isAuthenticating,
    error,
    getBiometricIcon,
    getBiometricLabel,
    authenticateWithBiometric,
  } = useBiometric();

  const [authAttempted, setAuthAttempted] = useState(false);

  const handleAuthenticate = async () => {
    try {
      setAuthAttempted(true);
      const result = await authenticateWithBiometric(reason);
      
      if (result.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error('Erreur authentification:', error);
    }
  };

  const handleClose = () => {
    if (!requireAuth || authAttempted) {
      onClose();
    }
  };

  const getBiometricInstructions = () => {
    switch (biometricType) {
      case BiometryType.TouchID:
        return 'Placez votre doigt sur le capteur Touch ID';
      case BiometryType.FaceID:
        return 'Regardez vers votre appareil pour Face ID';
      case BiometryType.Iris:
        return 'Regardez vers le capteur iris';
      default:
        return 'Suivez les instructions d\'authentification';
    }
  };

  if (isLoading) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose}
        placement="center"
        backdrop="blur"
        classNames={{
          backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
          base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
          header: "border-b-[1px] border-[#292f46]",
          body: "py-6",
          closeButton: "hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center space-y-4">
              <Spinner size="lg" color="primary" />
              <p className="text-center text-gray-300">
                Vérification des capacités biométriques...
              </p>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  if (!isAvailable) {
    return (
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose}
        placement="center"
        backdrop="blur"
        classNames={{
          backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
          base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
          header: "border-b-[1px] border-[#292f46]",
          body: "py-6",
          closeButton: "hover:bg-white/5 active:bg-white/10",
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h3 className="text-xl font-semibold text-white">Authentification non disponible</h3>
          </ModalHeader>
          <ModalBody>
            <div className="flex flex-col items-center space-y-4">
              <div className="text-6xl">❌</div>
              <div className="text-center space-y-2">
                <p className="text-gray-300">
                  L'authentification biométrique n'est pas disponible sur cet appareil.
                </p>
                {error && (
                  <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                    {error}
                  </p>
                )}
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="primary" 
              onPress={handleClose}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      placement="center"
      backdrop="blur"
      isDismissable={!requireAuth}
      hideCloseButton={requireAuth && !authAttempted}
      classNames={{
        backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
        base: "border-[#292f46] bg-[#19172c] dark:bg-[#19172c] text-[#a8b0d3]",
        header: "border-b-[1px] border-[#292f46]",
        body: "py-6",
        closeButton: "hover:bg-white/5 active:bg-white/10",
      }}
    >
      <ModalContent>
        <ModalHeader>
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getBiometricIcon()}</div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col items-center space-y-6">
            {/* Statut de l'authentification biométrique */}
            <Card className="w-full bg-gradient-to-br from-white/5 to-white/10 border border-white/10">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{getBiometricIcon()}</div>
                    <div>
                      <p className="font-medium text-white">{getBiometricLabel()}</p>
                      <p className="text-sm text-gray-400">Disponible</p>
                    </div>
                  </div>
                  <Chip 
                    color="success" 
                    variant="flat" 
                    size="sm"
                    className="bg-green-500/20 text-green-400"
                  >
                    Actif
                  </Chip>
                </div>
              </CardBody>
            </Card>

            {/* Instructions */}
            <div className="text-center space-y-2">
              <p className="text-gray-300">{reason}</p>
              <p className="text-sm text-gray-400">{getBiometricInstructions()}</p>
            </div>

            {/* Animation d'authentification */}
            {isAuthenticating && (
              <div className="flex flex-col items-center space-y-3">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-blue-500/30 rounded-full animate-pulse"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                  <div className="absolute inset-2 flex items-center justify-center text-2xl">
                    {getBiometricIcon()}
                  </div>
                </div>
                <p className="text-sm text-blue-400 animate-pulse">
                  Authentification en cours...
                </p>
              </div>
            )}

            {/* Erreur */}
            {error && !isAuthenticating && (
              <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="text-red-400">⚠️</div>
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <div className="flex space-x-3 w-full">
            {(!requireAuth || authAttempted) && (
              <Button 
                variant="flat" 
                onPress={handleClose}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300"
              >
                Annuler
              </Button>
            )}
            <Button 
              color="primary" 
              onPress={handleAuthenticate}
              isLoading={isAuthenticating}
              disabled={isAuthenticating}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium"
            >
              {isAuthenticating ? 'Authentification...' : `Utiliser ${getBiometricLabel()}`}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}; 