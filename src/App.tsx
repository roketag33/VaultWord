import { useState, useEffect } from "react";
import Database from "@tauri-apps/plugin-sql";
import { useDisclosure } from "@heroui/react";

// Composants
import Header from "./components/Header";
import PasswordList from "./components/PasswordList";
import AddPasswordModal from "./components/AddPasswordModal";
import PasswordGeneratorModal from "./components/PasswordGeneratorModal";
import ImportExportModal from "./components/ImportExportModal";

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

  const { 
    isOpen: isImportExportModalOpen, 
    onOpen: onImportExportModalOpen, 
    onClose: onImportExportModalClose 
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

  // Gestionnaire pour l'import réussi
  const handleImportComplete = async (importedCount: number) => {
    console.log(`✅ Import terminé: ${importedCount} mots de passe importés`);
    // Recharger la liste des mots de passe
    if (db) {
      await loadPasswords(db);
    }
    onImportExportModalClose();
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

  const handleOpenImportExportModal = () => {
    console.log("Opening import/export modal");
    onImportExportModalOpen();
  };

  if (isLoading && passwords.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Chargement de VaultWord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <Header 
          onAddPassword={handleOpenAddModal}
          onGeneratePassword={handleOpenGeneratorModal}
          onImportExport={handleOpenImportExportModal}
        />
        
        <main>
          <PasswordList 
            passwords={passwords}
            onDeletePassword={handleDeletePassword}
          />
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

        <ImportExportModal
          isOpen={isImportExportModalOpen}
          onClose={onImportExportModalClose}
          onImportComplete={handleImportComplete}
          existingPasswords={passwords}
        />
      </div>
    </div>
  );
}

export default App;
