import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Types pour les mocks globaux
declare global {
  var __TAURI__: any;
}

// Mock de l'API Tauri pour les tests
const mockInvoke = vi.fn();
const mockDialog = {
  save: vi.fn(),
};

// Mock global de Tauri
(globalThis as any).__TAURI__ = {
  core: {
    invoke: mockInvoke,
  },
  dialog: mockDialog,
};

// Mock des modules Tauri
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
  save: mockDialog.save,
}));

// Export des mocks pour utilisation dans les tests
export { mockInvoke, mockDialog }; 