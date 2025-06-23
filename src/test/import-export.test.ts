import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockInvoke } from './setup';
import { IMPORT_SOURCES, ImportSource, ImportResult } from '../types/import-export';

// Tests des types et constantes
describe('Import/Export Types', () => {
  it('devrait avoir tous les gestionnaires de mots de passe supportés', () => {
    expect(IMPORT_SOURCES).toHaveLength(8);
    
    const expectedSources = [
      'lastpass', 'bitwarden', '1password', 'chrome', 
      'firefox', 'safari', 'keepass', 'dashlane'
    ];
    
    expectedSources.forEach(source => {
      const found = IMPORT_SOURCES.find(s => s.id === source);
      expect(found).toBeDefined();
      expect(found?.name).toBeTruthy();
      expect(found?.supportedFormats.length).toBeGreaterThan(0);
    });
  });

  it('devrait avoir des formats de fichier valides pour chaque source', () => {
    IMPORT_SOURCES.forEach(source => {
      expect(source.supportedFormats).toContain('.csv');
      expect(source.icon).toBeTruthy();
      expect(source.description).toBeTruthy();
    });
  });

  it('devrait avoir des formats spéciaux pour certains gestionnaires', () => {
    const bitwarden = IMPORT_SOURCES.find(s => s.id === 'bitwarden');
    expect(bitwarden?.supportedFormats).toContain('.json');
    
    const onePassword = IMPORT_SOURCES.find(s => s.id === '1password');
    expect(onePassword?.supportedFormats).toContain('.1pux');
    
    const keepass = IMPORT_SOURCES.find(s => s.id === 'keepass');
    expect(keepass?.supportedFormats).toContain('.xml');
  });
});

// Tests des fonctions d'import
describe('Import Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait parser un fichier CSV LastPass', async () => {
    const csvContent = `url,username,password,extra,name,grouping,fav
https://example.com,user@test.com,password123,notes,Example Site,Work,0`;

    mockInvoke.mockResolvedValueOnce({
      success: true,
      imported: 1,
      skipped: 0,
      errors: [],
      warnings: [],
      duplicates: []
    });

    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke('parse_import_file', {
      content: csvContent,
      source: 'lastpass',
      filename: 'export.csv'
    }) as ImportResult;

    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
    expect(mockInvoke).toHaveBeenCalledWith('parse_import_file', {
      content: csvContent,
      source: 'lastpass',
      filename: 'export.csv'
    });
  });

  it('devrait parser un fichier JSON Bitwarden', async () => {
    const jsonContent = JSON.stringify({
      items: [{
        type: 1,
        name: "Example Site",
        login: {
          username: "user@test.com",
          password: "password123",
          uris: [{ uri: "https://example.com" }]
        },
        notes: "Test notes"
      }]
    });

    mockInvoke.mockResolvedValueOnce({
      success: true,
      imported: 1,
      skipped: 0,
      errors: [],
      warnings: [],
      duplicates: []
    });

    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke('parse_import_file', {
      content: jsonContent,
      source: 'bitwarden',
      filename: 'export.json'
    });

    expect(result.success).toBe(true);
    expect(result.imported).toBe(1);
  });

  it('devrait détecter les doublons', async () => {
    const existingPasswords = [
      { id: 1, site: 'example.com', username: 'user@test.com', password: 'old', created_at: '2023-01-01' }
    ];

    const importedPasswords = [
      { site: 'example.com', username: 'user@test.com', password: 'new123', notes: null, url: null, folder: null }
    ];

    mockInvoke.mockResolvedValueOnce([importedPasswords[0]]);

    const { invoke } = await import('@tauri-apps/api/core');
    const duplicates = await invoke('find_import_duplicates', {
      importedPasswords,
      existingPasswords
    });

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].site).toBe('example.com');
  });

  it('devrait valider les données importées', async () => {
    const invalidPasswords = [
      { site: '', username: 'user', password: 'pass', notes: null, url: null, folder: null },
      { site: 'test.com', username: '', password: 'pass', notes: null, url: null, folder: null },
      { site: 'test.com', username: 'user', password: '', notes: null, url: null, folder: null }
    ];

    mockInvoke.mockResolvedValueOnce({
      validPasswords: [],
      warnings: [
        'Mot de passe ignoré: site manquant',
        'Mot de passe ignoré: nom d\'utilisateur manquant',
        'Mot de passe ignoré: mot de passe manquant'
      ]
    });

    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke('validate_import_data', {
      passwords: invalidPasswords,
      options: {
        skipDuplicates: false,
        updateExisting: false,
        validateUrls: true,
        importNotes: true
      }
    });

    expect(result.warnings).toHaveLength(3);
    expect(result.validPasswords).toHaveLength(0);
  });
});

// Tests des fonctions d'export
describe('Export Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait exporter en format CSV', async () => {
    const passwords = [
      { id: 1, site: 'example.com', username: 'user@test.com', password: 'password123', created_at: '2023-01-01' }
    ];

    const expectedCsv = `site,username,password,created_at
example.com,user@test.com,password123,2023-01-01`;

    mockInvoke.mockResolvedValueOnce(expectedCsv);

    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke('export_passwords_csv', {
      passwords,
      includeMetadata: true
    });

    expect(result).toBe(expectedCsv);
    expect(mockInvoke).toHaveBeenCalledWith('export_passwords_csv', {
      passwords,
      includeMetadata: true
    });
  });

  it('devrait exporter en format JSON', async () => {
    const passwords = [
      { id: 1, site: 'example.com', username: 'user@test.com', password: 'password123', created_at: '2023-01-01' }
    ];

    const expectedJson = JSON.stringify({
      exportedAt: expect.any(String),
      version: '1.0',
      passwords: passwords
    }, null, 2);

    mockInvoke.mockResolvedValueOnce(expectedJson);

    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke('export_passwords_json', {
      passwords,
      includeMetadata: true
    });

    expect(result).toBeTruthy();
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('devrait sauvegarder un fichier exporté', async () => {
    const content = 'test,content,here';
    const filename = 'passwords.csv';
    const expectedPath = '/Users/test/Documents/passwords.csv';

    mockInvoke.mockResolvedValueOnce(expectedPath);

    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke('save_export_file', {
      content,
      filename
    });

    expect(result).toBe(expectedPath);
    expect(mockInvoke).toHaveBeenCalledWith('save_export_file', {
      content,
      filename
    });
  });
});

// Tests d'intégration
describe('Import/Export Integration', () => {
  it('devrait gérer un workflow complet d\'import', async () => {
    const csvContent = `url,username,password,extra,name,grouping,fav
https://example.com,user@test.com,password123,notes,Example Site,Work,0
https://test.com,test@user.com,test456,,Test Site,,0`;

    // Mock de la séquence d'appels
    mockInvoke
      .mockResolvedValueOnce({ // parse_import_file
        success: true,
        imported: 2,
        skipped: 0,
        errors: [],
        warnings: [],
        duplicates: []
      })
      .mockResolvedValueOnce({ // validate_import_data
        validPasswords: [
          { site: 'example.com', username: 'user@test.com', password: 'password123', notes: 'notes', url: 'https://example.com', folder: 'Work' },
          { site: 'test.com', username: 'test@user.com', password: 'test456', notes: null, url: 'https://test.com', folder: null }
        ],
        warnings: []
      })
      .mockResolvedValueOnce([]); // find_import_duplicates

    const { invoke } = await import('@tauri-apps/api/core');
    
    // 1. Parser le fichier
    const parseResult = await invoke('parse_import_file', {
      content: csvContent,
      source: 'lastpass',
      filename: 'export.csv'
    });

    // 2. Valider les données
    const validationResult = await invoke('validate_import_data', {
      passwords: parseResult.passwords || [],
      options: { skipDuplicates: true, updateExisting: false, validateUrls: true, importNotes: true }
    });

    // 3. Vérifier les doublons
    const duplicates = await invoke('find_import_duplicates', {
      importedPasswords: validationResult.validPasswords,
      existingPasswords: []
    });

    expect(parseResult.success).toBe(true);
    expect(parseResult.imported).toBe(2);
    expect(validationResult.validPasswords).toHaveLength(2);
    expect(duplicates).toHaveLength(0);
  });

  it('devrait gérer les erreurs de parsing', async () => {
    const invalidContent = 'contenu invalide';

    mockInvoke.mockResolvedValueOnce({
      success: false,
      imported: 0,
      skipped: 0,
      errors: ['Format de fichier non reconnu'],
      warnings: [],
      duplicates: []
    });

    const { invoke } = await import('@tauri-apps/api/core');
    const result = await invoke('parse_import_file', {
      content: invalidContent,
      source: 'lastpass',
      filename: 'invalid.txt'
    });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Format de fichier non reconnu');
  });
}); 