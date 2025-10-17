import React, { useState } from 'react';
import { X, Link as LinkIcon } from 'lucide-react';

const LinkTransactionModal = ({ transaction, investments, debts, receivables, onClose, onLink }) => {
  const [entityType, setEntityType] = useState('investment'); // 'investment', 'debt', 'receivable'
  const [selectedEntityId, setSelectedEntityId] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedEntityId) {
      await onLink(transaction.id, selectedEntityId, entityType);
      onClose();
    }
  };

  // Get the appropriate list based on entity type
  const getEntityList = () => {
    switch (entityType) {
      case 'investment':
        return investments || [];
      case 'debt':
        return debts || [];
      case 'receivable':
        return receivables || [];
      default:
        return [];
    }
  };

  const entities = getEntityList();

  // Get entity label for display
  const getEntityLabel = (entity) => {
    if (entityType === 'investment') {
      return `${entity.name} (${entity.symbol || entity.type})`;
    } else if (entityType === 'debt') {
      return `${entity.name} - ${entity.creditor}`;
    } else if (entityType === 'receivable') {
      return `${entity.name} - ${entity.debtor}`;
    }
    return entity.name;
  };

  // Get header color based on entity type
  const getHeaderColor = () => {
    switch (entityType) {
      case 'investment':
        return 'from-indigo-600 to-purple-600';
      case 'debt':
        return 'from-red-600 to-rose-600';
      case 'receivable':
        return 'from-green-600 to-emerald-600';
      default:
        return 'from-indigo-600 to-purple-600';
    }
  };

  // Get info message based on entity type
  const getInfoMessage = () => {
    switch (entityType) {
      case 'investment':
        return 'Cette transaction sera liée à l\'investissement sélectionné. Le montant sera ajouté comme opération.';
      case 'debt':
        return 'Cette transaction sera liée à la dette sélectionnée. Le montant sera ajouté comme paiement.';
      case 'receivable':
        return 'Cette transaction sera liée à la créance sélectionnée. Le montant sera ajouté comme paiement reçu.';
      default:
        return '';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className={`bg-gradient-to-r ${getHeaderColor()} text-white p-6 rounded-t-xl`}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">Lier une Transaction</h2>
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
              Type d'entité
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setEntityType('investment');
                  setSelectedEntityId('');
                }}
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  entityType === 'investment'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Investissement
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntityType('debt');
                  setSelectedEntityId('');
                }}
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  entityType === 'debt'
                    ? 'border-red-600 bg-red-50 text-red-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Dette
              </button>
              <button
                type="button"
                onClick={() => {
                  setEntityType('receivable');
                  setSelectedEntityId('');
                }}
                className={`px-3 py-2 rounded-lg border-2 transition-all ${
                  entityType === 'receivable'
                    ? 'border-green-600 bg-green-50 text-green-700 font-semibold'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Créance
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner {entityType === 'investment' ? 'un investissement' : entityType === 'debt' ? 'une dette' : 'une créance'}
            </label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            >
              <option value="">-- Choisir --</option>
              {entities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {getEntityLabel(entity)}
                </option>
              ))}
            </select>
            {entities.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Aucun(e) {entityType === 'investment' ? 'investissement' : entityType === 'debt' ? 'dette' : 'créance'} disponible.
              </p>
            )}
          </div>

          {selectedEntityId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Info:</strong> {getInfoMessage()}
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
              disabled={!selectedEntityId}
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
