import React, { useState } from 'react';
import { Upload, FileText, Check, X, Download, Trash2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

// Configuration du worker PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const AdvancedOCRScanner = ({ onTransactionsImported }) => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [extractedLines, setExtractedLines] = useState([]);
  const [selectedLines, setSelectedLines] = useState([]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setExtractedLines([]);
      setSelectedLines([]);
    }
  };

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let fullText = '';
    
    // Extraire le texte de chaque page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  const parseTransactionLine = (line) => {
    // Patterns pour extraire les données
    const datePattern = /(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/;
    const amountPattern = /[-]?\d+[.,]\d{2}/g;
    
    const dateMatch = line.match(datePattern);
    const amounts = line.match(amountPattern) || [];
    
    let date = null;
    if (dateMatch) {
      const [_, day, month, year] = dateMatch;
      const fullYear = year.length === 2 ? `20${year}` : year;
      date = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Extraire description (texte entre date et montants)
    let description = line;
    if (dateMatch) {
      description = line.substring(dateMatch.index + dateMatch[0].length).trim();
    }
    
    // Nettoyer la description des montants
    amounts.forEach(amount => {
      description = description.replace(amount, '').trim();
    });
    
    // Convertir les montants
    const parsedAmounts = amounts.map(a => parseFloat(a.replace(',', '.')));
    
    return {
      rawLine: line,
      date: date || new Date().toISOString().split('T')[0],
      description: description || 'Transaction',
      debit: parsedAmounts.find(a => a < 0) || 0,
      credit: parsedAmounts.find(a => a > 0) || 0,
      amount: parsedAmounts[0] || 0,
      balance: parsedAmounts[parsedAmounts.length - 1] || 0
    };
  };

  const processFile = async () => {
    if (!file) return;
    
    setProcessing(true);
    
    try {
      let text = '';
      
      // Extraire le texte selon le type de fichier
      if (file.type === 'application/pdf') {
        text = await extractTextFromPDF(file);
      } else if (file.type.startsWith('image/')) {
        // Pour les images, on pourrait utiliser Tesseract.js
        alert('Pour les images, veuillez utiliser l\'ancien scanner OCR. Ce scanner est optimisé pour les PDF.');
        setProcessing(false);
        return;
      } else {
        alert('Format de fichier non supporté. Utilisez un PDF ou une image.');
        setProcessing(false);
        return;
      }
      
      // Diviser en lignes et filtrer les lignes vides
      const lines = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 10); // Ignorer les lignes trop courtes
      
      // Parser chaque ligne
      const parsed = lines
        .map((line, index) => ({
          id: index,
          ...parseTransactionLine(line)
        }))
        .filter(item => {
          // Garder seulement les lignes qui ressemblent à des transactions
          const hasDate = item.date !== new Date().toISOString().split('T')[0];
          const hasAmount = item.amount !== 0 || item.debit !== 0 || item.credit !== 0;
          return hasDate || hasAmount;
        });
      
      setExtractedLines(parsed);
      // Tout sélectionner par défaut
      setSelectedLines(parsed.map(p => p.id));
      
    } catch (error) {
      console.error('Erreur lors du traitement:', error);
      alert('Erreur lors du traitement du fichier. Vérifiez le format.');
    } finally {
      setProcessing(false);
    }
  };

  const toggleLine = (id) => {
    setSelectedLines(prev => 
      prev.includes(id) 
        ? prev.filter(lineId => lineId !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedLines.length === extractedLines.length) {
      setSelectedLines([]);
    } else {
      setSelectedLines(extractedLines.map(line => line.id));
    }
  };

  const importSelected = () => {
    const selectedTransactions = extractedLines
      .filter(line => selectedLines.includes(line.id))
      .map(line => ({
        date: line.date + 'T00:00:00.000Z',
        description: line.description,
        amount: Math.abs(line.amount || line.debit || line.credit),
        type: (line.amount < 0 || line.debit < 0) ? 'expense' : 'income',
        category: 'Import',
        tags: []
      }));
    
    if (selectedTransactions.length === 0) {
      alert('Veuillez sélectionner au moins une transaction');
      return;
    }
    
    onTransactionsImported(selectedTransactions);
    
    // Reset
    setFile(null);
    setExtractedLines([]);
    setSelectedLines([]);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <FileText className="mr-3 text-indigo-600" size={28} />
          Scanner Avancé de Documents
        </h2>

        {/* Upload */}
        <div className="mb-6">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500 transition">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <Upload className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Cliquez pour uploader</span> ou glissez-déposez
              </p>
              <p className="text-xs text-gray-500">
                PDF (relevés bancaires, tickets) ou Images
              </p>
            </div>
            <input
              type="file"
              className="hidden"
              accept=".pdf,image/*"
              onChange={handleFileChange}
            />
          </label>
          
          {file && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="text-indigo-600 mr-3" size={24} />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
              <button
                onClick={processFile}
                disabled={processing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {processing ? 'Traitement...' : 'Analyser'}
              </button>
            </div>
          )}
        </div>

        {/* Résultats */}
        {extractedLines.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                {extractedLines.length} transactions détectées
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={toggleAll}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {selectedLines.length === extractedLines.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <button
                  onClick={importSelected}
                  disabled={selectedLines.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center"
                >
                  <Download className="mr-2" size={16} />
                  Importer ({selectedLines.length})
                </button>
              </div>
            </div>

            {/* Tableau des transactions */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                        <input
                          type="checkbox"
                          checked={selectedLines.length === extractedLines.length}
                          onChange={toggleAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Débit</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Crédit</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {extractedLines.map((line) => (
                      <tr
                        key={line.id}
                        className={`hover:bg-gray-50 ${selectedLines.includes(line.id) ? 'bg-indigo-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedLines.includes(line.id)}
                            onChange={() => toggleLine(line.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{line.date}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-md truncate">
                          {line.description}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          {line.debit !== 0 ? `${line.debit.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          {line.credit !== 0 ? `${line.credit.toFixed(2)} €` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold">
                          {line.amount.toFixed(2)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                💡 <strong>Conseil:</strong> Vérifiez les données extraites et désélectionnez les lignes incorrectes avant d'importer.
                Les transactions seront créées avec la catégorie "Import" que vous pourrez modifier ensuite.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedOCRScanner;
