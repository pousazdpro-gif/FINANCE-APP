import React, { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { transfersAPI } from '../services/api';

const TransferModal = ({ accounts, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    from_account_id: '',
    to_account_id: '',
    amount: 0,
    description: 'Transfert interne'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.from_account_id === formData.to_account_id) {
      alert('Les comptes source et destination doivent être différents');
      return;
    }

    setLoading(true);
    try {
      await transfersAPI.transfer(
        formData.from_account_id,
        formData.to_account_id,
        parseFloat(formData.amount),
        formData.description
      );
      alert('Transfert effectué avec succès !');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Erreur lors du transfert');
    } finally {
      setLoading(false);
    }
  };

  const fromAccount = accounts.find(a => a.id === formData.from_account_id);
  const toAccount = accounts.find(a => a.id === formData.to_account_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Transfert entre comptes</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* From Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Depuis le compte
            </label>
            <select
              value={formData.from_account_id}
              onChange={(e) => setFormData({ ...formData, from_account_id: e.target.value })}
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Sélectionner un compte source</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.current_balance.toFixed(2)} {account.currency}
                </option>
              ))}
            </select>
          </div>

          {/* Visual Arrow */}
          <div className="flex justify-center">
            <div className="bg-indigo-100 p-4 rounded-full">
              <ArrowRight size={32} className="text-indigo-600" />
            </div>
          </div>

          {/* To Account */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vers le compte
            </label>
            <select
              value={formData.to_account_id}
              onChange={(e) => setFormData({ ...formData, to_account_id: e.target.value })}
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Sélectionner un compte destination</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {account.current_balance.toFixed(2)} {account.currency}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 text-2xl font-bold"
              required
              min="0.01"
            />
            {fromAccount && (
              <p className="text-sm text-gray-500 mt-1">
                Solde disponible: {fromAccount.current_balance.toFixed(2)} {fromAccount.currency}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (optionnelle)
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Transfert interne"
            />
          </div>

          {/* Conversion Notice */}
          {fromAccount && toAccount && fromAccount.currency !== toAccount.currency && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Conversion automatique</strong>: {fromAccount.currency} → {toAccount.currency}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Le taux de change sera appliqué automatiquement
              </p>
            </div>
          )}

          {/* Submit */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold disabled:opacity-50"
            >
              {loading ? 'Transfert en cours...' : 'Effectuer le transfert'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;
