import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download } from 'lucide-react';

const CSVImporter = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Veuillez sélectionner un fichier CSV valide');
      setFile(null);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    // Assume first line is header
    const headers = lines[0].split(';').map(h => h.trim().toLowerCase());
    
    const transactions = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(';').map(v => v.trim());
      
      // Try to find date, description, amount columns
      let date, description, amount;
      
      // Common French bank CSV formats
      headers.forEach((header, idx) => {
        if (header.includes('date')) date = values[idx];
        if (header.includes('libelle') || header.includes('description') || header.includes('motif')) {
          description = values[idx];
        }
        if (header.includes('montant') || header.includes('debit') || header.includes('credit')) {
          amount = values[idx];
        }
      });
      
      if (date && amount) {
        // Parse amount (handle French format with comma)
        let parsedAmount = parseFloat(amount.replace(',', '.').replace(/[^\d.-]/g, ''));
        
        if (!isNaN(parsedAmount)) {
          transactions.push({
            date: date,
            description: description || 'Transaction importée',
            amount: parsedAmount,
            category: 'Divers'
          });
        }
      }
    }
    
    return transactions;
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    setError(null);
    
    try {
      // Read file
      const text = await file.text();
      
      // Parse CSV
      const transactions = parseCSV(text);
      
      if (transactions.length === 0) {
        throw new Error('Aucune transaction valide trouvée dans le fichier CSV');
      }
      
      // Call parent callback with parsed transactions
      if (onImportComplete) {
        await onImportComplete(transactions);
      }
      
      setResult({
        success: true,
        count: transactions.length
      });
      
      // Reset after 3 seconds
      setTimeout(() => {
        setFile(null);
        setResult(null);
      }, 3000);
      
    } catch (err) {
      console.error('Erreur import CSV:', err);
      setError(err.message || 'Erreur lors de l\'import du fichier CSV');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `date;description;montant
2024-01-15;Supermarché;-45.80
2024-01-16;Salaire;2500.00
2024-01-17;Restaurant;-32.50`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-import.csv';
    a.click();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Import CSV</h2>
        <p className="text-gray-600">
          Importez vos transactions depuis un relevé bancaire au format CSV
        </p>
      </div>

      {!result && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <label className="flex flex-col items-center justify-center border-4 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload size={64} className="text-gray-400 mb-4" />
            <p className="text-xl font-semibold text-gray-700 mb-2">
              {file ? file.name : 'Cliquez pour uploader un fichier CSV'}
            </p>
            <p className="text-sm text-gray-500">
              Format CSV avec séparateur point-virgule (;)
            </p>
          </label>

          {error && (
            <div className="mt-4 bg-red-50 border-2 border-red-200 rounded-lg p-4 flex items-start space-x-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={24} />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {file && !error && (
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  setFile(null);
                  setError(null);
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Import en cours...</span>
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    <span>Importer</span>
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-8 border-t pt-6">
            <h3 className="font-semibold text-gray-900 mb-3">Format attendu</h3>
            <p className="text-sm text-gray-600 mb-3">
              Votre fichier CSV doit contenir au minimum les colonnes suivantes:
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>• <strong>date</strong>: Date de la transaction (format: YYYY-MM-DD ou DD/MM/YYYY)</li>
              <li>• <strong>description</strong> ou <strong>libelle</strong>: Description de la transaction</li>
              <li>• <strong>montant</strong>: Montant (négatif pour dépense, positif pour revenu)</li>
            </ul>
            <button
              onClick={downloadTemplate}
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-2"
            >
              <Download size={18} />
              <span>Télécharger un modèle CSV</span>
            </button>
          </div>
        </div>
      )}

      {result && result.success && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center">
            <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Import réussi!</h3>
            <p className="text-gray-600 mb-4">
              {result.count} transaction(s) ont été importées avec succès
            </p>
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 font-semibold"
            >
              Importer un autre fichier
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CSVImporter;
