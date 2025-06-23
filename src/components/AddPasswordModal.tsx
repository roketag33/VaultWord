import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Divider,
} from "@heroui/react";
import { 
  GlobeAltIcon, 
  UserIcon, 
  KeyIcon, 
  EyeIcon, 
  EyeSlashIcon 
} from "@heroicons/react/24/outline";

interface PasswordInput {
  site: string;
  username: string;
  password: string;
}

interface AddPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPassword: (password: PasswordInput) => void;
}

export default function AddPasswordModal({ isOpen, onClose, onAddPassword }: AddPasswordModalProps) {
  const [passwordInput, setPasswordInput] = useState<PasswordInput>({
    site: "",
    username: "",
    password: "",
  });
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!passwordInput.site || !passwordInput.username || !passwordInput.password) {
      return;
    }

    setIsLoading(true);
    try {
      await onAddPassword(passwordInput);
      setPasswordInput({ site: "", username: "", password: "" });
      setIsPasswordVisible(false);
      onClose();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPasswordInput({ site: "", username: "", password: "" });
    setIsPasswordVisible(false);
    onClose();
  };

  const isFormValid = passwordInput.site && passwordInput.username && passwordInput.password;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="2xl"
      classNames={{
        base: "bg-white",
        header: "border-b border-gray-200",
        body: "py-6",
        footer: "border-t border-gray-200",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 rounded-full p-2">
              <KeyIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Ajouter un mot de passe</h2>
              <p className="text-sm text-gray-500 font-normal">
                Stockez vos identifiants de manière sécurisée
              </p>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            <Input
              label="Site web ou service"
              placeholder="ex: github.com, gmail.com"
              value={passwordInput.site}
              onValueChange={(value) => setPasswordInput({ ...passwordInput, site: value })}
              startContent={<GlobeAltIcon className="h-4 w-4 text-gray-400" />}
              variant="bordered"
              size="lg"
              classNames={{
                input: "text-gray-700",
                label: "text-gray-600 font-medium",
              }}
            />

            <Input
              label="Nom d'utilisateur ou email"
              placeholder="ex: john.doe@email.com"
              value={passwordInput.username}
              onValueChange={(value) => setPasswordInput({ ...passwordInput, username: value })}
              startContent={<UserIcon className="h-4 w-4 text-gray-400" />}
              variant="bordered"
              size="lg"
              classNames={{
                input: "text-gray-700",
                label: "text-gray-600 font-medium",
              }}
            />

            <Input
              label="Mot de passe"
              placeholder="Entrez votre mot de passe"
              value={passwordInput.password}
              onValueChange={(value) => setPasswordInput({ ...passwordInput, password: value })}
              startContent={<KeyIcon className="h-4 w-4 text-gray-400" />}
              endContent={
                <button
                  className="focus:outline-none"
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  {isPasswordVisible ? (
                    <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              }
              type={isPasswordVisible ? "text" : "password"}
              variant="bordered"
              size="lg"
              classNames={{
                input: "text-gray-700 font-mono",
                label: "text-gray-600 font-medium",
              }}
            />

            <Divider />

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-1">
                  <KeyIcon className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Sécurité</h4>
                  <p className="text-sm text-blue-700">
                    Vos mots de passe sont chiffrés et stockés localement sur votre appareil. 
                    Ils ne sont jamais envoyés sur internet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button 
            color="default" 
            variant="light" 
            onPress={handleClose}
            size="lg"
          >
            Annuler
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={!isFormValid}
            isLoading={isLoading}
            size="lg"
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
          >
            {isLoading ? "Ajout en cours..." : "Ajouter le mot de passe"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 