// Types pour le système d'import/export

export interface ImportedPassword {
  site: string;
  username: string;
  password: string;
  notes?: string;
  url?: string;
  folder?: string;
  tags?: string[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
  duplicates: ImportedPassword[];
}

export interface ImportOptions {
  skipDuplicates: boolean;
  updateExisting: boolean;
  validateUrls: boolean;
  importNotes: boolean;
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'encrypted' | 'pdf';
  includeMetadata: boolean;
  passwordProtected: boolean;
  exportPassword?: string;
  selectedIds?: number[];
}

export interface ImportSource {
  id: string;
  name: string;
  description: string;
  supportedFormats: string[];
  icon: string;
  color: string;
}

export interface ParsedImportFile {
  source: ImportSource;
  passwords: ImportedPassword[];
  metadata?: {
    exportDate?: string;
    version?: string;
    totalEntries?: number;
  };
}

export interface ValidationWarning {
  type: 'duplicate' | 'invalid_url' | 'weak_password' | 'missing_field';
  message: string;
  password: ImportedPassword;
}

// Sources d'import supportées
export const IMPORT_SOURCES: ImportSource[] = [
  {
    id: 'lastpass',
    name: 'LastPass',
    description: 'Importer depuis LastPass (.csv)',
    supportedFormats: ['.csv'],
    icon: '🔐',
    color: 'red'
  },
  {
    id: 'bitwarden',
    name: 'Bitwarden',
    description: 'Importer depuis Bitwarden (.json, .csv)',
    supportedFormats: ['.json', '.csv'],
    icon: '🛡️',
    color: 'blue'
  },
  {
    id: '1password',
    name: '1Password',
    description: 'Importer depuis 1Password (.1pux, .csv)',
    supportedFormats: ['.1pux', '.csv'],
    icon: '🔑',
    color: 'indigo'
  },
  {
    id: 'chrome',
    name: 'Google Chrome',
    description: 'Importer depuis Chrome (.csv)',
    supportedFormats: ['.csv'],
    icon: '🌐',
    color: 'yellow'
  },
  {
    id: 'firefox',
    name: 'Mozilla Firefox',
    description: 'Importer depuis Firefox (.csv)',
    supportedFormats: ['.csv'],
    icon: '🦊',
    color: 'orange'
  },
  {
    id: 'safari',
    name: 'Safari',
    description: 'Importer depuis Safari (.csv)',
    supportedFormats: ['.csv'],
    icon: '🧭',
    color: 'blue'
  },
  {
    id: 'keepass',
    name: 'KeePass',
    description: 'Importer depuis KeePass (.xml, .csv)',
    supportedFormats: ['.xml', '.csv'],
    icon: '🔒',
    color: 'green'
  },
  {
    id: 'dashlane',
    name: 'Dashlane',
    description: 'Importer depuis Dashlane (.csv)',
    supportedFormats: ['.csv'],
    icon: '🎯',
    color: 'emerald'
  }
]; 