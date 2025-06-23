import { useState, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";
import { useDisclosure } from "@heroui/react";

// Composants
import Header from "./components/Header";
import PasswordList from "./components/PasswordList";
import AddPasswordModal from "./components/AddPasswordModal";
import PasswordGeneratorModal from "./components/PasswordGeneratorModal";

interface Password {
  id: number;
  site: string;
  username: string;
  password: string;
  created_at: string;
}

interface PasswordInput {
  site: string;
  username: string;
  password: string;
}

function App() {
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [db, setDb] = useState<Database | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modals avec useDisclosure pour une meilleure gestion
  const { 
    isOpen: isAddModalOpen, 
    onOpen: onAddModalOpen, 
    onClose: onAddModalClose 
  } = useDisclosure();
  
  const { 
    isOpen: isGeneratorModalOpen, 
    onOpen: onGeneratorModalOpen, 
    onClose: onGeneratorModalClose 
  } = useDisclosure();

  // Initialiser la base de données
  useEffect(() => {
    const initDB = async () => {
      try {
        console.log("🗄️ Initialisation de la base de données...");
        setIsLoading(true);
        const database = await Database.load("sqlite:passwords.db");
        console.log("✅ Base de données connectée");
        
        // Créer la table si elle n'existe pas
        console.log("🏗️ Création de la table si nécessaire...");
        await database.execute(`
          CREATE TABLE IF NOT EXISTS passwords (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            site TEXT NOT NULL,
            username TEXT NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        console.log("✅ Table créée/vérifiée");
        
        setDb(database);
        await loadPasswords(database);
        console.log("🎉 Initialisation terminée");
      } catch (error) {
        console.error("❌ Erreur lors de l'initialisation de la DB:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initDB();
  }, []);

  // Charger les mots de passe
  const loadPasswords = async (database: Database) => {
    try {
      console.log("📋 Chargement des mots de passe...");
      const result = await database.select<Password[]>("SELECT * FROM passwords ORDER BY created_at DESC");
      console.log("📊 Mots de passe récupérés:", result.length, "entrées");
      console.log("📄 Données:", result);
      setPasswords(result);
    } catch (error) {
      console.error("❌ Erreur lors du chargement des mots de passe:", error);
    }
  };

  // Ajouter un mot de passe
  const handleAddPassword = async (passwordData: PasswordInput) => {
    console.log("🔐 Tentative d'ajout de mot de passe:", passwordData);
    
    if (!db) {
      console.error("❌ Base de données non initialisée");
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("📝 Insertion en base de données...");
      
      await db.execute(
        "INSERT INTO passwords (site, username, password) VALUES (?, ?, ?)",
        [passwordData.site, passwordData.username, passwordData.password]
      );
      
      console.log("✅ Insertion réussie, rechargement des données...");
      await loadPasswords(db);
      console.log("🔄 Données rechargées, fermeture du modal");
      onAddModalClose();
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout du mot de passe:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Supprimer un mot de passe
  const handleDeletePassword = async (id: number) => {
    if (!db) return;
    
    try {
      setIsLoading(true);
      await db.execute("DELETE FROM passwords WHERE id = ?", [id]);
      await loadPasswords(db);
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Gestionnaires pour les boutons du header
  const handleOpenAddModal = () => {
    console.log("Opening add modal");
    onAddModalOpen();
  };

  const handleOpenGeneratorModal = () => {
    console.log("Opening generator modal");
    onGeneratorModalOpen();
  };

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header avec glassmorphism */}
      <Header 
        onAddPassword={handleOpenAddModal}
        onGeneratePassword={handleOpenGeneratorModal}
      />
      
      {/* Contenu principal */}
      <main className="relative z-10">
        <div className="container mx-auto px-6 py-12">
          {/* Indicateur de chargement */}
          {isLoading && (
            <div className="fixed top-4 right-4 z-50">
              <div className="glass rounded-full px-4 py-2 shadow-lg">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-700">Chargement...</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Liste des mots de passe */}
          <div className="max-w-6xl mx-auto">
            <PasswordList 
              passwords={passwords} 
              onDeletePassword={handleDeletePassword}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddPasswordModal
        isOpen={isAddModalOpen}
        onClose={onAddModalClose}
        onAddPassword={handleAddPassword}
      />
      
      <PasswordGeneratorModal
        isOpen={isGeneratorModalOpen}
        onClose={onGeneratorModalClose}
      />
      
      {/* Éléments décoratifs de fond */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 opacity-20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 opacity-10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}

export default App;
