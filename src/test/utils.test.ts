import { describe, it, expect } from 'vitest';
import { IMPORT_SOURCES } from '../types/import-export';

describe('Import/Export Utils', () => {
  describe('IMPORT_SOURCES', () => {
    it('devrait contenir tous les gestionnaires supportés', () => {
      expect(IMPORT_SOURCES).toHaveLength(8);
      
      const sourceIds = IMPORT_SOURCES.map(s => s.id);
      expect(sourceIds).toContain('lastpass');
      expect(sourceIds).toContain('bitwarden');
      expect(sourceIds).toContain('1password');
      expect(sourceIds).toContain('chrome');
      expect(sourceIds).toContain('firefox');
      expect(sourceIds).toContain('safari');
      expect(sourceIds).toContain('keepass');
      expect(sourceIds).toContain('dashlane');
    });

    it('devrait avoir des propriétés requises pour chaque source', () => {
      IMPORT_SOURCES.forEach(source => {
        expect(source.id).toBeTruthy();
        expect(source.name).toBeTruthy();
        expect(source.description).toBeTruthy();
        expect(source.icon).toBeTruthy();
        expect(Array.isArray(source.supportedFormats)).toBe(true);
        expect(source.supportedFormats.length).toBeGreaterThan(0);
      });
    });

    it('devrait avoir CSV comme format supporté pour tous', () => {
      IMPORT_SOURCES.forEach(source => {
        expect(source.supportedFormats).toContain('.csv');
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

    it('devrait avoir des icônes valides', () => {
      IMPORT_SOURCES.forEach(source => {
        // Vérifier que l'icône est une string non vide
        expect(typeof source.icon).toBe('string');
        expect(source.icon.length).toBeGreaterThan(0);
      });
    });

    it('devrait avoir des descriptions informatives', () => {
      IMPORT_SOURCES.forEach(source => {
        expect(source.description.length).toBeGreaterThan(10);
        expect(source.description).toContain('.csv');
      });
    });
  });

  describe('Validation des formats', () => {
    it('devrait valider les extensions de fichier', () => {
      const validExtensions = ['.csv', '.json', '.1pux', '.xml'];
      
      IMPORT_SOURCES.forEach(source => {
        source.supportedFormats.forEach(format => {
          expect(validExtensions.some(ext => ext === format)).toBe(true);
        });
      });
    });
  });
}); 