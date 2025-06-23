import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HeroUIProvider } from '@heroui/react';
import ImportExportModal from '../components/ImportExportModal';

// Mock Tauri - définir mockInvoke avant le mock
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

// Mock des icônes Heroicons
vi.mock('@heroicons/react/24/outline', () => ({
  ArrowUpTrayIcon: () => <div data-testid="arrow-up-tray-icon" />,
  ArrowDownTrayIcon: () => <div data-testid="arrow-down-tray-icon" />,
  DocumentArrowUpIcon: () => <div data-testid="document-arrow-up-icon" />,
  ExclamationTriangleIcon: () => <div data-testid="exclamation-triangle-icon" />,
  CheckCircleIcon: () => <div data-testid="check-circle-icon" />,
  XCircleIcon: () => <div data-testid="x-circle-icon" />,
  InformationCircleIcon: () => <div data-testid="information-circle-icon" />,
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <HeroUIProvider>
      {component}
    </HeroUIProvider>
  );
};

describe('ImportExportModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onImportComplete: vi.fn(),
    existingPasswords: [
      { site: 'example.com', username: 'user@example.com', password: 'password123' }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait afficher le modal quand isOpen est true', () => {
    renderWithProvider(<ImportExportModal {...mockProps} />);
    
    expect(screen.getByText('Import / Export')).toBeDefined();
    expect(screen.getByText('Que souhaitez-vous faire ?')).toBeDefined();
  });

  it('ne devrait pas afficher le modal quand isOpen est false', () => {
    renderWithProvider(<ImportExportModal {...mockProps} isOpen={false} />);
    
    expect(screen.queryByText('Import / Export')).toBeNull();
  });

  it('devrait naviguer vers l\'étape import-source quand on clique sur Importer', async () => {
    renderWithProvider(<ImportExportModal {...mockProps} />);
    
    const importButton = screen.getByText('Importer');
    fireEvent.click(importButton);

    await waitFor(() => {
      expect(screen.getByText('Choisir la source')).toBeDefined();
    });
  });

  it('devrait afficher tous les gestionnaires supportés', async () => {
    renderWithProvider(<ImportExportModal {...mockProps} />);
    
    const importButton = screen.getByText('Importer');
    fireEvent.click(importButton);

    await waitFor(() => {
      // Chercher par le nom des gestionnaires dans les CardBody
      expect(screen.getByText('LastPass')).toBeDefined();
      expect(screen.getByText('Bitwarden')).toBeDefined();
      expect(screen.getByText('1Password')).toBeDefined();
      expect(screen.getByText('Google Chrome')).toBeDefined();
      expect(screen.getByText('Mozilla Firefox')).toBeDefined();
      expect(screen.getByText('Safari')).toBeDefined();
      expect(screen.getByText('KeePass')).toBeDefined();
      expect(screen.getByText('Dashlane')).toBeDefined();
    });
  });

  it('devrait passer à l\'étape export-options quand on clique sur Export', async () => {
    renderWithProvider(<ImportExportModal {...mockProps} />);
    
    const exportButton = screen.getByText('Exporter');
    fireEvent.click(exportButton);

    await waitFor(() => {
      // Utiliser getAllByText pour gérer les éléments multiples
      const exportOptionsElements = screen.getAllByText('Options d\'export');
      expect(exportOptionsElements.length).toBeGreaterThan(0);
    });
  });

  it('devrait gérer l\'export CSV', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValue('mocked,csv,content');
    
    renderWithProvider(<ImportExportModal {...mockProps} />);
    
    const exportButton = screen.getByText('Exporter');
    fireEvent.click(exportButton);

    await waitFor(() => {
      // Utiliser getAllByText pour gérer les éléments multiples
      const exportOptionsElements = screen.getAllByText('Options d\'export');
      expect(exportOptionsElements.length).toBeGreaterThan(0);
    });

    // Cliquer sur le bouton d'export dans la modal
    const confirmExportButton = screen.getByText('Exporter');
    fireEvent.click(confirmExportButton);

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('export_passwords_csv', expect.any(Object));
    });
  });
}); 