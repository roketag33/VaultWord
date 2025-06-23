import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Slider,
  Checkbox,
  Input,
  Card,
  CardBody,
  Divider,
  Chip,
} from "@heroui/react";
import { 
  KeyIcon, 
  DocumentDuplicateIcon, 
  ArrowPathIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

interface PasswordGeneratorOptions {
  length: number;
  include_uppercase: boolean;
  include_lowercase: boolean;
  include_numbers: boolean;
  include_symbols: boolean;
}

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasswordGeneratorModal({ isOpen, onClose }: PasswordGeneratorModalProps) {
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    include_uppercase: true,
    include_lowercase: true,
    include_numbers: true,
    include_symbols: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePassword = async () => {
    setIsGenerating(true);
    try {
      const password = await invoke<string>("generate_password", { options });
      setGeneratedPassword(password);
    } catch (error) {
      console.error("Erreur lors de la génération:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword);
        // Toast notification pourrait être ajoutée ici
      } catch (err) {
        console.error('Erreur lors de la copie:', err);
      }
    }
  };

  const getPasswordStrength = () => {
    let score = 0;
    let feedback = [];

    if (options.length >= 12) score += 2;
    else if (options.length >= 8) score += 1;
    else feedback.push("Utilisez au moins 8 caractères");

    if (options.include_uppercase) score += 1;
    else feedback.push("Ajoutez des majuscules");

    if (options.include_lowercase) score += 1;
    else feedback.push("Ajoutez des minuscules");

    if (options.include_numbers) score += 1;
    else feedback.push("Ajoutez des chiffres");

    if (options.include_symbols) score += 2;
    else feedback.push("Ajoutez des symboles");

    if (score >= 6) return { level: "Fort", color: "success", icon: ShieldCheckIcon };
    if (score >= 4) return { level: "Moyen", color: "warning", icon: ExclamationTriangleIcon };
    return { level: "Faible", color: "danger", icon: ExclamationTriangleIcon };
  };

  const strength = getPasswordStrength();
  const hasAtLeastOneOption = options.include_uppercase || options.include_lowercase || 
                             options.include_numbers || options.include_symbols;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="3xl"
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
            <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-full p-2">
              <KeyIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Générateur de mots de passe</h2>
              <p className="text-sm text-gray-500 font-normal">
                Créez des mots de passe sécurisés et personnalisés
              </p>
            </div>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {/* Mot de passe généré */}
            {generatedPassword && (
              <Card className="bg-gradient-to-r from-gray-50 to-blue-50">
                <CardBody className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Mot de passe généré</span>
                      <Chip 
                        color={strength.color as any} 
                        variant="flat" 
                        startContent={<strength.icon className="h-3 w-3" />}
                        size="sm"
                      >
                        {strength.level}
                      </Chip>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        value={generatedPassword}
                        readOnly
                        variant="bordered"
                        classNames={{
                          input: "font-mono text-lg font-semibold text-gray-800",
                          inputWrapper: "bg-white border-2",
                        }}
                      />
                      <Button
                        isIconOnly
                        color="primary"
                        variant="solid"
                        onPress={copyToClipboard}
                        className="bg-gradient-to-r from-blue-500 to-purple-600"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Options de génération */}
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-3 block">
                  Longueur du mot de passe: {options.length} caractères
                </label>
                <Slider
                  size="lg"
                  step={1}
                  minValue={4}
                  maxValue={50}
                  value={options.length}
                  onChange={(value) => setOptions({ ...options, length: value as number })}
                  className="max-w-full"
                  classNames={{
                    track: "bg-gray-200",
                    filler: "bg-gradient-to-r from-blue-500 to-purple-600",
                    thumb: "bg-white border-2 border-blue-500",
                  }}
                />
              </div>

              <Divider />

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-4">Types de caractères</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Checkbox
                    isSelected={options.include_uppercase}
                    onValueChange={(checked) => setOptions({ ...options, include_uppercase: checked })}
                    color="primary"
                    size="lg"
                  >
                    <div className="ml-2">
                      <span className="font-medium">Majuscules</span>
                      <p className="text-xs text-gray-500">A, B, C, D...</p>
                    </div>
                  </Checkbox>

                  <Checkbox
                    isSelected={options.include_lowercase}
                    onValueChange={(checked) => setOptions({ ...options, include_lowercase: checked })}
                    color="primary"
                    size="lg"
                  >
                    <div className="ml-2">
                      <span className="font-medium">Minuscules</span>
                      <p className="text-xs text-gray-500">a, b, c, d...</p>
                    </div>
                  </Checkbox>

                  <Checkbox
                    isSelected={options.include_numbers}
                    onValueChange={(checked) => setOptions({ ...options, include_numbers: checked })}
                    color="primary"
                    size="lg"
                  >
                    <div className="ml-2">
                      <span className="font-medium">Chiffres</span>
                      <p className="text-xs text-gray-500">0, 1, 2, 3...</p>
                    </div>
                  </Checkbox>

                  <Checkbox
                    isSelected={options.include_symbols}
                    onValueChange={(checked) => setOptions({ ...options, include_symbols: checked })}
                    color="primary"
                    size="lg"
                  >
                    <div className="ml-2">
                      <span className="font-medium">Symboles</span>
                      <p className="text-xs text-gray-500">!, @, #, $...</p>
                    </div>
                  </Checkbox>
                </div>
              </div>

              {!hasAtLeastOneOption && (
                <Card className="bg-red-50 border border-red-200">
                  <CardBody className="p-4">
                    <div className="flex items-center space-x-2 text-red-700">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <span className="text-sm font-medium">
                        Sélectionnez au moins un type de caractère
                      </span>
                    </div>
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button 
            color="default" 
            variant="light" 
            onPress={onClose}
            size="lg"
          >
            Fermer
          </Button>
          <Button
            color="primary"
            onPress={generatePassword}
            isDisabled={!hasAtLeastOneOption}
            isLoading={isGenerating}
            startContent={!isGenerating && <ArrowPathIcon className="h-4 w-4" />}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-blue-600 text-white"
          >
            {isGenerating ? "Génération..." : "Générer un mot de passe"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 