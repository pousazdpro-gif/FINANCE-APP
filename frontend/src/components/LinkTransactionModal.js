import React, { useState } from 'react';
import { X, Link as LinkIcon } from 'lucide-react';

const LinkTransactionModal = ({ transaction, investments, onClose, onLink }) => {
  const [selectedInvestmentId, setSelectedInvestmentId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedInvestmentId) {
      await onLink(transaction.id, selectedInvestmentId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Lier à un Investissement</h2>
              <p className="text-indigo-100 text-sm mt-1">
                Transaction: {transaction.description}
              </p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant de la transaction
            </label>
            <div className={`text-2xl font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toFixed(2)} €
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(transaction.date).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner un investissement
            </label>
            <select
              value={selectedInvestmentId}
              onChange={(e) => setSelectedInvestmentId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">-- Choisir un investissement --</option>
              {investments.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.name} ({inv.symbol || inv.type})
                </option>
              ))}
            </select>
          </div>

          {selectedInvestmentId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> Cette transaction sera liée à l'investissement sélectionné. 
                Le montant sera ajouté comme opération d'achat à l'investissement.
              </p>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 font-medium"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedInvestmentId}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <LinkIcon size={18} />
              <span>Lier</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LinkTransactionModal;
