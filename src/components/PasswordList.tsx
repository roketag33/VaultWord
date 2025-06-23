import { useState } from "react";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { 
  EyeIcon, 
  EyeSlashIcon, 
  DocumentDuplicateIcon, 
  TrashIcon,
  GlobeAltIcon,
  UserIcon,
  KeyIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";

interface Password {
  id: number;
  site: string;
  username: string;
  password: string;
  created_at: string;
}

interface PasswordListProps {
  passwords: Password[];
  onDeletePassword: (id: number) => void;
}

export default function PasswordList({ passwords, onDeletePassword }: PasswordListProps) {
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  const togglePasswordVisibility = (id: number) => {
    const newVisible = new Set(visiblePasswords);
    if (newVisible.has(id)) {
      newVisible.delete(id);
    } else {
      newVisible.add(id);
    }
    setVisiblePasswords(newVisible);
  };

  const copyToClipboard = async (text: string, type: 'username' | 'password', id: number) => {
    try {
      await navigator.clipboard.writeText(text);
      const key = `${type}-${id}`;
      setCopiedItems(prev => new Set([...prev, key]));
      
      // Retirer l'indicateur de copie après 2 secondes
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
    }
  };

  if (passwords.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="relative mb-8">
          <div className="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto shadow-2xl">
            <div className="gradient-primary rounded-full w-16 h-16 flex items-center justify-center">
              <KeyIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
            <SparklesIcon className="h-3 w-3 text-white" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Aucun mot de passe stocké</h3>
        <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
          Commencez par ajouter votre premier mot de passe pour sécuriser vos comptes en ligne
        </p>
        
        <div className="bg-blue-50 rounded-2xl p-6 max-w-lg mx-auto border border-blue-100">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Chiffrement local</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Génération sécurisée</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>Accès rapide</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            Mots de passe stockés
          </h2>
          <p className="text-gray-500 mt-1">Gérez vos identifiants en toute sécurité</p>
        </div>
        <Chip 
          color="primary" 
          variant="flat" 
          size="lg"
          className="bg-blue-100 text-gray-700 font-semibold"
        >
          {passwords.length} {passwords.length === 1 ? 'mot de passe' : 'mots de passe'}
        </Chip>
      </div>
      
      <div className="grid gap-6">
        {passwords.map((password, index) => (
          <Card 
            key={password.id} 
            className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 bg-white shadow-lg"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards'
            }}
          >
            <CardBody className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 rounded-2xl p-3 group-hover:scale-110 transition-transform duration-300">
                      <GlobeAltIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 text-xl mb-1">{password.site}</h3>
                      <p className="text-sm text-gray-500">
                        Ajouté le {new Date(password.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Utilisateur</span>
                            <p className="font-semibold text-gray-800 truncate">{password.username}</p>
                          </div>
                        </div>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => copyToClipboard(password.username, 'username', password.id)}
                          className={`transition-all duration-200 ${
                            copiedItems.has(`username-${password.id}`) 
                              ? 'bg-green-100 text-green-600' 
                              : 'hover:bg-blue-100 text-gray-400 hover:text-blue-600'
                          }`}
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <KeyIcon className="h-4 w-4 text-gray-400" />
                          <div className="flex-1">
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">Mot de passe</span>
                            <p className="font-mono text-sm font-semibold text-gray-800">
                              {visiblePasswords.has(password.id) 
                                ? password.password 
                                : '•'.repeat(Math.min(password.password.length, 12))
                              }
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => togglePasswordVisibility(password.id)}
                            className="hover:bg-purple-100 text-gray-400 hover:text-purple-600 transition-all duration-200"
                          >
                            {visiblePasswords.has(password.id) ? (
                              <EyeSlashIcon className="h-4 w-4" />
                            ) : (
                              <EyeIcon className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            isIconOnly
                            size="sm"
                            variant="light"
                            onPress={() => copyToClipboard(password.password, 'password', password.id)}
                            className={`transition-all duration-200 ${
                              copiedItems.has(`password-${password.id}`) 
                                ? 'bg-green-100 text-green-600' 
                                : 'hover:bg-blue-100 text-gray-400 hover:text-blue-600'
                            }`}
                          >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-6">
                  <Button
                    isIconOnly
                    color="danger"
                    variant="light"
                    onPress={() => onDeletePassword(password.id)}
                    className="hover:bg-red-50 hover:scale-110 transition-all duration-200 opacity-60 group-hover:opacity-100"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
} 