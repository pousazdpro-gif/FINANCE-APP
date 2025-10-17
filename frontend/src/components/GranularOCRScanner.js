import React, { useState } from 'react';
import { Upload, FileText, Link2, Unlink } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

const GranularOCRScanner = ({ onTransactionsImported }) => {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [lines, setLines] = useState([]); // Tableau de lignes, chaque ligne contient des cellules
  const [selectedCells, setSelectedCells] = useState([]); // { lineIndex, cellIndex }
  const [linkedGroups, setLinkedGroups] = useState([]); // Groupes de cellules liées

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLines([]);
      setSelectedCells([]);
      setLinkedGroups([]);
    }
  };

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    let allLines = [];
    
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      const pageLines = pageText.split('\n').filter(line => line.trim());
      allLines = allLines.concat(pageLines);
    }
    
    return allLines;
  };

  const processFile = async () => {
    if (!file) return;
    
    setProcessing(true);
    
    try {
      let textLines = [];
      
      if (file.type === 'application/pdf') {
        textLines = await extractTextFromPDF(file);
      } else {
        alert('Pour l\'instant, seuls les PDF sont supportés. Images bientôt disponibles.');
        setProcessing(false);
        return;
      }
      
      // Découper chaque ligne en cellules (séparées par espaces multiples ou tabulations)
      const parsedLines = textLines.map((line, lineIndex) => {
        // Séparer par espaces multiples (2 espaces ou plus)
        const cells = line
          .split(/\s{2,}|\t/)
          .map(cell => cell.trim())
          .filter(cell => cell.length > 0)
          .map((cell, cellIndex) => ({
            lineIndex,
            cellIndex,
            content: cell,
            id: `${lineIndex}-${cellIndex}`,
            type: detectCellType(cell)
          }));
        
        return {
          lineIndex,
          rawText: line,
          cells
        };
      }).filter(line => line.cells.length > 0);
      
      setLines(parsedLines);
      
    } catch (error) {
      console.error('Erreur traitement:', error);
      alert('Erreur lors du traitement du fichier.');
    } finally {
      setProcessing(false);
    }
  };

  const detectCellType = (content) => {
    // Détecter le type de cellule
    if (/^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$/.test(content)) return 'date';
    if (/^[-]?\d+[.,]\d{2}$/.test(content)) return 'amount';
    if (/^[€$£]\s*\d+/.test(content) || /\d+\s*[€$£]$/.test(content)) return 'amount';
    if (content.length < 4 && /^\d+$/.test(content)) return 'number';
    return 'text';
  };

  const toggleCellSelection = (lineIndex, cellIndex) => {
    const cellId = `${lineIndex}-${cellIndex}`;
    setSelectedCells(prev => {
      const exists = prev.find(c => c.id === cellId);
      if (exists) {
        return prev.filter(c => c.id !== cellId);
      } else {
        return [...prev, { lineIndex, cellIndex, id: cellId }];
      }
    });
  };

  const linkSelectedCells = () => {
    if (selectedCells.length < 2) {
      alert('Sélectionnez au moins 2 cellules à lier');
      return;
    }
    
    // Créer un nouveau groupe
    const group = {
      id: Date.now(),
      cells: [...selectedCells],
      combinedText: selectedCells
        .map(sel => {
          const line = lines[sel.lineIndex];
          const cell = line.cells[sel.cellIndex];
          return cell.content;
        })
        .join(' ')
    };
    
    setLinkedGroups(prev => [...prev, group]);
    setSelectedCells([]);
  };

  const unlinkGroup = (groupId) => {
    setLinkedGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const isCellInGroup = (lineIndex, cellIndex) => {
    const cellId = `${lineIndex}-${cellIndex}`;
    return linkedGroups.some(group => 
      group.cells.some(c => c.id === cellId)
    );
  };

  const getCellColor = (lineIndex, cellIndex, type) => {
    const cellId = `${lineIndex}-${cellIndex}`;
    const isSelected = selectedCells.some(c => c.id === cellId);
    const inGroup = isCellInGroup(lineIndex, cellIndex);
    
    if (isSelected) return 'bg-blue-200 border-blue-500';
    if (inGroup) return 'bg-green-100 border-green-500';
    if (type === 'date') return 'bg-purple-50 border-purple-300';
    if (type === 'amount') return 'bg-yellow-50 border-yellow-300';
    return 'bg-white border-gray-300';
  };

  const createTransactionsFromGroups = () => {
    // Logique simple: chercher date + description + montant dans chaque groupe
    const transactions = linkedGroups.map(group => {
      const texts = group.cells.map(sel => {
        const line = lines[sel.lineIndex];
        const cell = line.cells[sel.cellIndex];
        return { content: cell.content, type: cell.type };
      });
      
      const date = texts.find(t => t.type === 'date')?.content || new Date().toISOString().split('T')[0];
      const amounts = texts.filter(t => t.type === 'amount').map(t => {
        const num = parseFloat(t.content.replace(',', '.').replace(/[^\d.-]/g, ''));
        return isNaN(num) ? 0 : num;
      });
      const description = texts.filter(t => t.type === 'text').map(t => t.content).join(' ') || 'Transaction';
      
      const amount = amounts[0] || 0;
      
      return {
        date: date.includes('/') ? date.split('/').reverse().join('-') : date,
        description,
        amount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        category: 'Import OCR'
      };
    });
    
    if (transactions.length === 0) {
      alert('Aucune transaction créée. Liez des cellules ensemble pour former des transactions.');
      return;
    }
    
    onTransactionsImported(transactions);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Scanner Granulaire - Contrôle Total
        </h2>

        {/* Upload */}
        <div className="mb-6">
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-indigo-500">
            <Upload className="w-10 h-10 mb-3 text-gray-400" />
            <p className="text-sm text-gray-500">PDF uniquement (relevés bancaires, tickets)</p>
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
            />
          </label>
          
          {file && (
            <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <button
                onClick={processFile}
                disabled={processing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {processing ? 'Analyse...' : 'Analyser'}
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        {lines.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">Mode d'emploi:</h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li><strong>Cliquez sur les cellules</strong> pour les sélectionner (bleu)</li>
              <li><strong>Cliquez "Lier cellules"</strong> pour créer un groupe (vert)</li>
              <li>Un groupe = 1 transaction (date + description + montant)</li>
              <li><strong>Cliquez "Créer Transactions"</strong> quand prêt</li>
            </ol>
            <div className="mt-3 flex gap-4 text-xs">
              <span className="flex items-center"><span className="w-4 h-4 bg-purple-100 border border-purple-300 mr-1"></span> = Date</span>
              <span className="flex items-center"><span className="w-4 h-4 bg-yellow-100 border border-yellow-300 mr-1"></span> = Montant</span>
              <span className="flex items-center"><span className="w-4 h-4 bg-white border border-gray-300 mr-1"></span> = Texte</span>
            </div>
          </div>
        )}

        {/* Actions */}
        {lines.length > 0 && (
          <div className="mb-6 flex gap-3">
            <button
              onClick={linkSelectedCells}
              disabled={selectedCells.length < 2}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 flex items-center"
            >
              <Link2 className="mr-2" size={18} />
              Lier cellules sélectionnées ({selectedCells.length})
            </button>
            <button
              onClick={createTransactionsFromGroups}
              disabled={linkedGroups.length === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
            >
              Créer Transactions ({linkedGroups.length})
            </button>
          </div>
        )}

        {/* Groupes liés */}
        {linkedGroups.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-bold text-green-900 mb-3">Groupes liés ({linkedGroups.length}):</h3>
            <div className="space-y-2">
              {linkedGroups.map(group => (
                <div key={group.id} className="flex items-center justify-between p-2 bg-white rounded border border-green-300">
                  <span className="text-sm font-mono">{group.combinedText}</span>
                  <button
                    onClick={() => unlinkGroup(group.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Unlink size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tableau des cellules */}
        {lines.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-auto max-h-96">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700 w-12">Ligne</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-700">Cellules (cliquez pour sélectionner)</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line) => (
                  <tr key={line.lineIndex} className="border-t border-gray-200">
                    <td className="px-2 py-2 text-xs text-gray-500 align-top">
                      {line.lineIndex + 1}
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex flex-wrap gap-2">
                        {line.cells.map((cell) => (
                          <button
                            key={cell.id}
                            onClick={() => toggleCellSelection(line.lineIndex, cell.cellIndex)}
                            className={`px-3 py-1 text-sm border-2 rounded transition-colors ${getCellColor(line.lineIndex, cell.cellIndex, cell.type)}`}
                          >
                            {cell.content}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default GranularOCRScanner;
