import { useState, useEffect } from 'react';

// Types pour l'authentification biométrique
export enum BiometryType {
  None = 0,
  TouchID = 1,
  FaceID = 2,
  Iris = 3,
}

export interface Status {
  isAvailable: boolean;
  biometryType: BiometryType;
  error?: string;
}

export interface AuthenticationOptions {
  allowDeviceCredential?: boolean;
  cancelTitle?: string;
  fallbackTitle?: string;
  title?: string;
  subtitle?: string;
  confirmationRequired?: boolean;
}

export interface AuthenticationResult {
  success: boolean;
  error_message?: string;
  biometric_type: BiometryType;
}

export interface BiometricState {
  status: Status | null;
  isLoading: boolean;
  isAuthenticating: boolean;
  lastAuthTime: number | null;
  error: string | null;
}

// Détection de la plateforme et du type de biométrie simulé
const detectBiometricType = (): BiometryType => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
    // Simulation : 70% TouchID, 30% FaceID pour iOS
    return Math.random() < 0.7 ? BiometryType.TouchID : BiometryType.FaceID;
  } else if (userAgent.includes('android')) {
    // Simulation : Fingerprint pour Android
    return BiometryType.TouchID; // TouchID représente les empreintes en général
  } else if (userAgent.includes('mac')) {
    // Simulation : TouchID pour Mac
    return BiometryType.TouchID;
  } else {
    // Simulation : TouchID pour les autres plateformes desktop
    return BiometryType.TouchID;
  }
};

const isMobile = (): boolean => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const useBiometric = () => {
  const [state, setState] = useState<BiometricState>({
    status: null,
    isLoading: true,
    isAuthenticating: false,
    lastAuthTime: null,
    error: null,
  });

  // Simulation de la vérification des capacités biométriques
  useEffect(() => {
    const checkBiometricCapabilities = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Simulation d'un délai de vérification
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const biometryType = detectBiometricType();
        
        // Simulation : 95% de chance que la biométrie soit disponible
        const isAvailable = Math.random() < 0.95;
        
        const status: Status = {
          isAvailable,
          biometryType: isAvailable ? biometryType : BiometryType.None,
          error: isAvailable ? undefined : 'Authentification biométrique non configurée',
        };
        
        setState(prev => ({
          ...prev,
          status,
          isLoading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          status: { isAvailable: false, biometryType: BiometryType.None },
          isLoading: false,
          error: `Erreur lors de la vérification biométrique: ${error}`,
        }));
      }
    };

    checkBiometricCapabilities();
  }, []);

  const authenticateWithBiometric = async (
    reason: string = 'Authentification requise',
    options: AuthenticationOptions = {}
  ): Promise<AuthenticationResult> => {
    if (!state.status?.isAvailable) {
      throw new Error('Authentification biométrique non disponible');
    }

    try {
      setState(prev => ({ ...prev, isAuthenticating: true, error: null }));
      
      // Simulation d'un délai d'authentification réaliste
      const authDelay = isMobile() ? 1000 + Math.random() * 1000 : 1500 + Math.random() * 1500;
      await new Promise(resolve => setTimeout(resolve, authDelay));
      
      // Simulation d'un taux de succès de 85% (échec parfois pour réalisme)
      const successRate = 0.85;
      const isSuccessful = Math.random() < successRate;
      
      if (!isSuccessful) {
        const errorMessages = [
          'Authentification annulée par l\'utilisateur',
          'Biométrie non reconnue, veuillez réessayer',
          'Trop de tentatives échouées',
          'Capteur biométrique temporairement indisponible'
        ];
        const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        throw new Error(randomError);
      }

      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        lastAuthTime: Date.now(),
      }));

      return {
        success: true,
        error_message: undefined,
        biometric_type: state.status.biometryType,
      };
    } catch (error) {
      setState(prev => ({
        ...prev,
        isAuthenticating: false,
        error: `Erreur lors de l'authentification: ${error}`,
      }));
      
      return {
        success: false,
        error_message: `${error}`,
        biometric_type: BiometryType.None,
      };
    }
  };

  // Utilitaires pour l'interface
  const getBiometricIcon = (): string => {
    if (!state.status?.biometryType) return '🔒';
    
    switch (state.status.biometryType) {
      case BiometryType.TouchID:
        return '👆';
      case BiometryType.FaceID:
        return '👤';
      case BiometryType.Iris:
        return '👁️';
      default:
        return '🔒';
    }
  };

  const getBiometricLabel = (): string => {
    if (!state.status?.biometryType) return 'Authentification';
    
    switch (state.status.biometryType) {
      case BiometryType.TouchID:
        return isMobile() ? 'Empreinte digitale' : 'Touch ID';
      case BiometryType.FaceID:
        return 'Face ID';
      case BiometryType.Iris:
        return 'Reconnaissance Iris';
      default:
        return 'Authentification biométrique';
    }
  };

  const isRecentlyAuthenticated = (withinMs: number = 300000): boolean => {
    return state.lastAuthTime !== null && 
           Date.now() - state.lastAuthTime < withinMs;
  };

  return {
    // État
    isAvailable: state.status?.isAvailable || false,
    biometricType: state.status?.biometryType || BiometryType.None,
    isLoading: state.isLoading,
    isAuthenticating: state.isAuthenticating,
    error: state.error,
    lastAuthTime: state.lastAuthTime,
    
    // Méthodes
    authenticateWithBiometric,
    
    // Utilitaires
    getBiometricIcon,
    getBiometricLabel,
    isRecentlyAuthenticated,
    
    // Informations sur la plateforme
    isMobile: isMobile(),
    hasRealBiometric: false, // Simulation uniquement
  };
}; 