import { useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Progress,
  Divider,
  Chip,
  Select,
  SelectItem,
  Checkbox,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Alert,
} from "@heroui/react";
import { 
  ArrowUpTrayIcon,
  ArrowDownTrayIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { IMPORT_SOURCES, ImportedPassword, ImportResult, ImportOptions, ExportOptions } from "../types/import-export";

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (count: number) => void;
  existingPasswords?: any[];
}

type ModalStep = 'choice' | 'import-source' | 'import-file' | 'import-preview' | 'import-result' | 'export-options' | 'export-result';

export default function ImportExportModal({ 
  isOpen, 
  onClose, 
  onImportComplete,
  existingPasswords = []
}: ImportExportModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('choice');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [importedPasswords, setImportedPasswords] = useState<ImportedPassword[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    skipDuplicates: true,
    updateExisting: false,
    validateUrls: true,
    importNotes: true,
  });
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeMetadata: true,
    passwordProtected: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const content = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      
      console.log("📁 Fichier sélectionné:", file.name, "Extension:", extension);
      
      const passwords = await invoke<ImportedPassword[]>('parse_import_file', {
        content,
        source: selectedSource,
        fileExtension: extension
      });

      console.log("✅ Mots de passe parsés:", passwords.length);
      
      // Valider les données
      const warnings = await invoke<string[]>('validate_import_data', { passwords });
      
      setImportedPasswords(passwords);
      setImportWarnings(warnings);
      setCurrentStep('import-preview');
    } catch (error) {
      console.error("❌ Erreur lors de l'import:", error);
      alert(`Erreur lors de l'import: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportConfirm = async () => {
    if (!importedPasswords.length) return;

    setIsLoading(true);
    try {
      // Simuler l'import dans la base de données
      // En réalité, cela devrait utiliser une commande Tauri pour insérer en base
      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const password of importedPasswords) {
        try {
          // Vérifier les doublons si l'option est activée
          if (importOptions.skipDuplicates) {
            const isDuplicate = existingPasswords.some(existing => 
              existing.site.toLowerCase() === password.site.toLowerCase() &&
              existing.username.toLowerCase() === password.username.toLowerCase()
            );
            
            if (isDuplicate) {
              skipped++;
              continue;
            }
          }

          // Simuler l'insertion (à remplacer par un appel à la base de données)
          await new Promise(resolve => setTimeout(resolve, 50));
          imported++;
        } catch (error) {
          errors.push(`Erreur pour ${password.site}: ${error}`);
        }
      }

      const result: ImportResult = {
        success: true,
        imported,
        skipped,
        errors,
        warnings: importWarnings,
        duplicates: []
      };

      setImportResult(result);
      setCurrentStep('import-result');
      
      if (onImportComplete) {
        onImportComplete(imported);
      }
    } catch (error) {
      console.error("❌ Erreur lors de l'import:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsLoading(true);
    try {
      // Convertir les mots de passe existants au format ImportedPassword
      const passwordsToExport: ImportedPassword[] = existingPasswords.map(p => ({
        site: p.site,
        username: p.username,
        password: p.password,
        notes: undefined,
        url: undefined,
        folder: undefined,
      }));

      let exportContent: string;
      let filename: string;
      let mimeType: string;

      switch (exportOptions.format) {
        case 'csv':
          exportContent = await invoke<string>('export_passwords_csv', {
            passwords: passwordsToExport,
            includeMetadata: exportOptions.includeMetadata
          });
          filename = `vaultword-export-${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        
        case 'json':
          exportContent = await invoke<string>('export_passwords_json', {
            passwords: passwordsToExport
          });
          filename = `vaultword-export-${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        
        default:
          throw new Error('Format d\'export non supporté');
      }

      // Utiliser l'API Tauri pour sauvegarder le fichier
      const savedPath = await invoke<string>('save_export_file', {
        content: exportContent,
        filename: filename
      });
      
      console.log('✅ Fichier sauvegardé à:', savedPath);

      setCurrentStep('export-result');
    } catch (error) {
      console.error("❌ Erreur lors de l'export:", error);
      alert(`Erreur lors de l'export: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetModal = () => {
    setCurrentStep('choice');
    setSelectedSource('');
    setImportedPasswords([]);
    setImportWarnings([]);
    setImportResult(null);
    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'choice':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Que souhaitez-vous faire ?
              </h3>
              <p className="text-gray-600">
                Importez vos mots de passe depuis un autre gestionnaire ou exportez vos données actuelles
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                isPressable
                onPress={() => setCurrentStep('import-source')}
                className="hover:shadow-lg transition-shadow"
              >
                <CardBody className="text-center p-8">
                  <ArrowUpTrayIcon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-800 mb-2">Importer</h4>
                  <p className="text-sm text-gray-600">
                    Importez vos mots de passe depuis LastPass, Bitwarden, Chrome, etc.
                  </p>
                </CardBody>
              </Card>
              
              <Card 
                isPressable
                onPress={() => setCurrentStep('export-options')}
                className="hover:shadow-lg transition-shadow"
              >
                <CardBody className="text-center p-8">
                  <ArrowDownTrayIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h4 className="font-semibold text-gray-800 mb-2">Exporter</h4>
                  <p className="text-sm text-gray-600">
                    Exportez vos mots de passe pour sauvegarde ou migration
                  </p>
                </CardBody>
              </Card>
            </div>
          </div>
        );

      case 'import-source':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Choisissez votre gestionnaire actuel
              </h3>
              <p className="text-gray-600">
                Sélectionnez la source depuis laquelle vous souhaitez importer
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {IMPORT_SOURCES.map((source) => (
                <Card 
                  key={source.id}
                  isPressable
                  onPress={() => setSelectedSource(source.id)}
                  className={`hover:shadow-lg transition-all ${
                    selectedSource === source.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <CardBody className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{source.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800">{source.name}</h4>
                        <p className="text-sm text-gray-600">{source.description}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {source.supportedFormats.map((format) => (
                            <Chip key={format} size="sm" variant="flat" color="primary">
                              {format}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'import-file':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Sélectionnez votre fichier d'export
              </h3>
              <p className="text-gray-600">
                Choisissez le fichier exporté depuis {IMPORT_SOURCES.find(s => s.id === selectedSource)?.name}
              </p>
            </div>
            
            <Card className="border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
              <CardBody className="text-center p-12">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.json,.1pux,.xml"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <DocumentArrowUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <Button
                  color="primary"
                  variant="flat"
                  onPress={() => fileInputRef.current?.click()}
                  isLoading={isLoading}
                  size="lg"
                >
                  {isLoading ? "Analyse en cours..." : "Choisir un fichier"}
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Formats supportés: {IMPORT_SOURCES.find(s => s.id === selectedSource)?.supportedFormats.join(', ')}
                </p>
              </CardBody>
            </Card>
          </div>
        );

      case 'import-preview':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Aperçu de l'import
                </h3>
                <p className="text-gray-600">
                  {importedPasswords.length} mots de passe trouvés
                </p>
              </div>
              <Chip color="primary" variant="flat" size="lg">
                {importedPasswords.length} entrées
              </Chip>
            </div>

            {importWarnings.length > 0 && (
              <Alert color="warning" variant="flat">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <div>
                  <p className="font-medium">Avertissements détectés</p>
                  <ul className="text-sm mt-1 space-y-1">
                    {importWarnings.slice(0, 3).map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                    {importWarnings.length > 3 && (
                      <li>• ... et {importWarnings.length - 3} autres</li>
                    )}
                  </ul>
                </div>
              </Alert>
            )}

            <div className="space-y-4">
              <h4 className="font-medium text-gray-800">Options d'import</h4>
              <div className="space-y-3">
                <Checkbox 
                  isSelected={importOptions.skipDuplicates}
                  onValueChange={(checked) => setImportOptions({...importOptions, skipDuplicates: checked})}
                >
                  Ignorer les doublons
                </Checkbox>
                <Checkbox 
                  isSelected={importOptions.validateUrls}
                  onValueChange={(checked) => setImportOptions({...importOptions, validateUrls: checked})}
                >
                  Valider les URLs
                </Checkbox>
                <Checkbox 
                  isSelected={importOptions.importNotes}
                  onValueChange={(checked) => setImportOptions({...importOptions, importNotes: checked})}
                >
                  Importer les notes
                </Checkbox>
              </div>
            </div>

            <div className="max-h-64 overflow-auto">
              <Table aria-label="Aperçu des mots de passe">
                <TableHeader>
                  <TableColumn>Site</TableColumn>
                  <TableColumn>Utilisateur</TableColumn>
                  <TableColumn>Mot de passe</TableColumn>
                </TableHeader>
                <TableBody>
                  {importedPasswords.slice(0, 10).map((password, index) => (
                    <TableRow key={index}>
                      <TableCell>{password.site}</TableCell>
                      <TableCell>{password.username}</TableCell>
                      <TableCell>{'•'.repeat(Math.min(password.password.length, 8))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {importedPasswords.length > 10 && (
                <p className="text-sm text-gray-500 text-center mt-2">
                  ... et {importedPasswords.length - 10} autres entrées
                </p>
              )}
            </div>
          </div>
        );

      case 'import-result':
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircleIcon className="h-16 w-16 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Import terminé avec succès !
              </h3>
              <p className="text-gray-600">
                Vos mots de passe ont été importés dans VaultWord
              </p>
            </div>

            {importResult && (
              <div className="bg-green-50 rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-green-800">Importés:</span>
                    <span className="ml-2 text-green-600">{importResult.imported}</span>
                  </div>
                  <div>
                    <span className="font-medium text-orange-800">Ignorés:</span>
                    <span className="ml-2 text-orange-600">{importResult.skipped}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 'export-options':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Options d'export
              </h3>
              <p className="text-gray-600">
                Configurez votre export de {existingPasswords.length} mots de passe
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format d'export
                </label>
                <Select
                  selectedKeys={[exportOptions.format]}
                  onSelectionChange={(keys) => {
                    const format = Array.from(keys)[0] as 'csv' | 'json';
                    setExportOptions({...exportOptions, format});
                  }}
                >
                  <SelectItem key="csv">CSV (Compatible Excel)</SelectItem>
                  <SelectItem key="json">JSON (Format VaultWord)</SelectItem>
                </Select>
              </div>

              <div className="space-y-3">
                <Checkbox 
                  isSelected={exportOptions.includeMetadata}
                  onValueChange={(checked) => setExportOptions({...exportOptions, includeMetadata: checked})}
                >
                  Inclure les métadonnées (dates, notes)
                </Checkbox>
                <Checkbox 
                  isSelected={exportOptions.passwordProtected}
                  onValueChange={(checked) => setExportOptions({...exportOptions, passwordProtected: checked})}
                  isDisabled
                >
                  Protection par mot de passe (bientôt disponible)
                </Checkbox>
              </div>
            </div>

            <Alert color="primary" variant="flat">
              <InformationCircleIcon className="h-5 w-5" />
              <div>
                <p className="font-medium">Sécurité</p>
                <p className="text-sm">
                  Le fichier exporté contiendra vos mots de passe en clair. 
                  Stockez-le dans un endroit sécurisé et supprimez-le après utilisation.
                </p>
              </div>
            </Alert>
          </div>
        );

      case 'export-result':
        return (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircleIcon className="h-16 w-16 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Export terminé avec succès !
              </h3>
              <p className="text-gray-600">
                Votre fichier a été téléchargé
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <p className="text-sm text-green-800">
                <strong>{existingPasswords.length}</strong> mots de passe exportés au format <strong>{exportOptions.format.toUpperCase()}</strong>
              </p>
            </div>

            <Alert color="warning" variant="flat">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <div>
                <p className="font-medium">Rappel de sécurité</p>
                <p className="text-sm">
                  N'oubliez pas de supprimer le fichier exporté une fois que vous n'en avez plus besoin.
                </p>
              </div>
            </Alert>
          </div>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (currentStep) {
      case 'choice': return 'Import / Export';
      case 'import-source': return 'Choisir la source';
      case 'import-file': return 'Sélectionner le fichier';
      case 'import-preview': return 'Aperçu de l\'import';
      case 'import-result': return 'Import terminé';
      case 'export-options': return 'Options d\'export';
      case 'export-result': return 'Export terminé';
      default: return 'Import / Export';
    }
  };

  const getStepProgress = () => {
    const steps = {
      'choice': 0,
      'import-source': 1,
      'import-file': 2,
      'import-preview': 3,
      'import-result': 4,
      'export-options': 1,
      'export-result': 2,
    };
    return steps[currentStep] || 0;
  };

  const getMaxSteps = () => {
    return currentStep.startsWith('import') ? 4 : 2;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-white",
        header: "border-b border-gray-200",
        body: "py-6",
        footer: "border-t border-gray-200",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {getModalTitle()}
            </h2>
            {currentStep !== 'choice' && (
              <Progress 
                value={(getStepProgress() / getMaxSteps()) * 100} 
                className="w-32"
                color="primary"
                size="sm"
              />
            )}
          </div>
        </ModalHeader>
        
        <ModalBody>
          {renderStepContent()}
        </ModalBody>

        <ModalFooter>
          <div className="flex justify-between w-full">
            <Button 
              variant="light" 
              onPress={() => {
                if (currentStep === 'choice') {
                  handleClose();
                } else if (currentStep === 'import-source') {
                  setCurrentStep('choice');
                } else if (currentStep === 'import-file') {
                  setCurrentStep('import-source');
                } else if (currentStep === 'import-preview') {
                  setCurrentStep('import-file');
                } else if (currentStep === 'export-options') {
                  setCurrentStep('choice');
                } else {
                  handleClose();
                }
              }}
            >
              {currentStep === 'choice' || currentStep.includes('result') ? 'Fermer' : 'Retour'}
            </Button>
            
            <div className="flex space-x-2">
              {currentStep === 'import-source' && (
                <Button
                  color="primary"
                  onPress={() => setCurrentStep('import-file')}
                  isDisabled={!selectedSource}
                >
                  Continuer
                </Button>
              )}
              
              {currentStep === 'import-preview' && (
                <Button
                  color="primary"
                  onPress={handleImportConfirm}
                  isLoading={isLoading}
                >
                  {isLoading ? 'Import en cours...' : `Importer ${importedPasswords.length} mots de passe`}
                </Button>
              )}
              
              {currentStep === 'export-options' && (
                <Button
                  color="primary"
                  onPress={handleExport}
                  isLoading={isLoading}
                >
                  {isLoading ? 'Export en cours...' : 'Exporter'}
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 