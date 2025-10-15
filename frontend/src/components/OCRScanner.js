import React, { useState } from 'react';
import { Upload, FileText, Camera, CheckCircle, XCircle } from 'lucide-react';
import { createWorker } from 'tesseract.js';

const OCRScanner = ({ onTransactionsExtracted }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState([]);
  const [ocrProgress, setOcrProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      
      // Preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    }
  };

  const extractTransactionsFromText = (text) => {
    // Patterns communs pour extraire des transactions de reçus/relevés
    const lines = text.split('\n').filter(line => line.trim());
    const transactions = [];
    
    // Patterns pour montants: 12.50 € ou €12.50 ou 12,50€
    const amountPattern = /(\d+[.,]\d{2})\s*€|€\s*(\d+[.,]\d{2})/g;
    
    // Patterns pour dates: DD/MM/YYYY ou DD-MM-YYYY
    const datePattern = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const amounts = [...line.matchAll(amountPattern)];
      
      if (amounts.length > 0) {
        // Extraire le montant
        let amountStr = amounts[0][1] || amounts[0][2];
        const amount = parseFloat(amountStr.replace(',', '.'));
        
        if (amount > 0) {
          // Chercher une date dans la ligne ou les lignes adjacentes
          let date = new Date();
          const dateMatch = line.match(datePattern) || 
                          (i > 0 ? lines[i-1].match(datePattern) : null);
          
          if (dateMatch) {
            const [, day, month, year] = dateMatch;
            const fullYear = year.length === 2 ? `20${year}` : year;
            date = new Date(`${fullYear}-${month}-${day}`);
          }
          
          // Description: prendre le texte avant le montant
          let description = line.replace(amountPattern, '').trim();
          if (!description && i > 0) {
            description = lines[i-1].trim();
          }
          description = description.substring(0, 50) || 'Transaction';
          
          // Catégorisation basique par mots-clés
          let category = 'Divers';
          const lowerDesc = description.toLowerCase();
          
          if (lowerDesc.match(/super|carrefour|lidl|aldi|casino|leclerc|auchan/)) {
            category = 'Alimentation';
          } else if (lowerDesc.match(/restaurant|cafe|bar|mcdo|burger|pizza/)) {
            category = 'Restaurants';
          } else if (lowerDesc.match(/essence|carburant|station|total|esso|bp/)) {
            category = 'Transport';
          } else if (lowerDesc.match(/pharmacie|medecin|docteur|hopital/)) {
            category = 'Santé';
          } else if (lowerDesc.match(/loyer|edf|gdf|eau|electricite|internet|mobile/)) {
            category = 'Logement';
          }
          
          transactions.push({
            description,
            amount,
            category,
            date: date.toISOString()
          });
        }
      }
    }
    
    return transactions;
  };

  const processOCR = async () => {
    if (!file) return;
    
    setProcessing(true);
    setOcrProgress(0);
    
    try {
      // Créer un worker Tesseract
      const worker = await createWorker('fra', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });
      
      // Faire l'OCR
      const { data: { text } } = await worker.recognize(preview);
      
      // Terminer le worker
      await worker.terminate();
      
      // Extraire les transactions du texte
      const transactions = extractTransactionsFromText(text);
      
      if (transactions.length === 0) {
        // Si aucune transaction trouvée, créer une transaction manuelle
        transactions.push({
          description: 'Transaction (OCR)',
          amount: 0,
          category: 'Divers',
          date: new Date().toISOString()
        });
      }
      
      setExtractedData(transactions);
    } catch (error) {
      console.error('Erreur OCR:', error);
      alert('Erreur lors de l\'OCR. Vérifiez la qualité de l\'image.');
    } finally {
      setProcessing(false);
      setOcrProgress(0);
    }
  };

  const createTransactions = () => {
    if (onTransactionsExtracted) {
      onTransactionsExtracted(extractedData);
    }
    alert(`${extractedData.length} transactions créées avec succès !`);
    // Reset
    setFile(null);
    setPreview(null);
    setExtractedData([]);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Scanner OCR</h2>
        <p className="text-gray-600">
          Importez vos tickets de caisse ou relevés bancaires PDF pour créer automatiquement des transactions
        </p>
      </div>

      {!file ? (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <label className="flex flex-col items-center justify-center border-4 border-dashed border-gray-300 rounded-xl p-12 cursor-pointer hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload size={64} className="text-gray-400 mb-4" />
            <p className="text-xl font-semibold text-gray-700 mb-2">
              Cliquez pour uploader un fichier
            </p>
            <p className="text-sm text-gray-500">
              Images (JPG, PNG) ou PDF • Max 10 MB
            </p>
          </label>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <Camera className="text-indigo-600 mb-2" size={32} />
              <h3 className="font-semibold text-gray-900">Tickets de caisse</h3>
              <p className="text-sm text-gray-600">Supermarché, restaurant, magasins</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <FileText className="text-green-600 mb-2" size={32} />
              <h3 className="font-semibold text-gray-900">Relevés bancaires</h3>
              <p className="text-sm text-gray-600">PDF de votre banque</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <CheckCircle className="text-purple-600 mb-2" size={32} />
              <h3 className="font-semibold text-gray-900">Extraction auto</h3>
              <p className="text-sm text-gray-600">Montants, dates, descriptions</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Aperçu du fichier</h3>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full rounded-lg border-2 border-gray-200"
                />
              )}
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => {
                    setFile(null);
                    setPreview(null);
                    setExtractedData([]);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
                <button
                  onClick={processOCR}
                  disabled={processing}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {processing ? 'Traitement...' : 'Scanner'}
                </button>
              </div>
            </div>

            {/* Results */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Transactions extraites ({extractedData.length})
              </h3>
              
              {processing && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-gray-600">Analyse en cours...</p>
                </div>
              )}

              {!processing && extractedData.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {extractedData.map((txn, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{txn.description}</div>
                          <div className="text-sm text-gray-500">{txn.category}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-red-600">-{txn.amount.toFixed(2)} €</div>
                          <div className="text-xs text-gray-400">
                            {new Date(txn.date).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!processing && extractedData.length > 0 && (
                <button
                  onClick={createTransactions}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-semibold mt-4"
                >
                  <CheckCircle className="inline mr-2" size={20} />
                  Créer {extractedData.length} transaction(s)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> L'OCR utilise Tesseract.js pour l'extraction de texte. 
          La précision dépend de la qualité de l'image. Vérifiez toujours les données extraites avant de créer les transactions.
        </p>
      </div>
    </div>
  );
};

export default OCRScanner;
