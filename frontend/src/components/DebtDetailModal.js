import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, DollarSign, Calendar } from 'lucide-react';
import { debtsAPI } from '../services/api';

const DebtDetailModal = ({ debt, onClose, onUpdate, onAddPayment, onUpdatePayment, onDeletePayment }) => {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    notes: ''
  });

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const paymentData = {
      ...paymentForm,
      date: new Date(paymentForm.date).toISOString(),
      amount: parseFloat(paymentForm.amount)
    };

    if (editingPayment !== null) {
      await onUpdatePayment(debt.id, editingPayment, paymentData);
      setEditingPayment(null);
    } else {
      await onAddPayment(debt.id, paymentData);
    }

    setPaymentForm({ date: new Date().toISOString().split('T')[0], amount: 0, notes: '' });
    setShowPaymentForm(false);
  };

  const handleEditPayment = (index, payment) => {
    setEditingPayment(index);
    setPaymentForm({
      date: new Date(payment.date).toISOString().split('T')[0],
      amount: payment.amount,
      notes: payment.notes || ''
    });
    setShowPaymentForm(true);
  };

  const handleDeletePayment = async (index) => {
    if (window.confirm('Supprimer ce paiement ?')) {
      await onDeletePayment(debt.id, index);
    }
  };

  // Safe values with defaults - handle both camelCase and snake_case
  const totalAmount = debt.totalAmount || debt.total_amount || 0;
  const remainingAmount = debt.remainingAmount || debt.remaining_amount || totalAmount;
  const paidAmount = totalAmount - remainingAmount;
  const progressPercent = totalAmount > 0 ? (paidAmount / totalAmount * 100) : 0;
  const interestRate = debt.interestRate || debt.interest_rate || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{debt.name}</h2>
              <p className="text-red-100">Dette auprès de {debt.creditor}</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
          
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xs text-red-100">Montant Total</div>
              <div className="text-xl font-bold">{totalAmount.toFixed(2)} €</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xs text-red-100">Restant</div>
              <div className="text-xl font-bold">{remainingAmount.toFixed(2)} €</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xs text-red-100">Payé</div>
              <div className="text-xl font-bold">{paidAmount.toFixed(2)} €</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xs text-red-100">Taux d'intérêt</div>
              <div className="text-xl font-bold">{interestRate}%</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-white bg-opacity-20 rounded-full h-3">
              <div 
                className="bg-white rounded-full h-3 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Historique des Paiements</h3>
            <button
              onClick={() => {
                setShowPaymentForm(!showPaymentForm);
                setEditingPayment(null);
                setPaymentForm({ date: new Date().toISOString().split('T')[0], amount: 0, notes: '' });
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Nouveau Paiement</span>
            </button>
          </div>

          {showPaymentForm && (
            <form onSubmit={handlePaymentSubmit} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Optionnel"
                />
              </div>
              <div className="flex space-x-2">
                <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  {editingPayment !== null ? 'Modifier' : 'Ajouter'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentForm(false);
                    setEditingPayment(null);
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {debt.payments && debt.payments.length > 0 ? (
              debt.payments.map((payment, index) => (
                <div key={index} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <DollarSign size={16} className="text-red-600" />
                        <span className="font-bold text-lg text-red-600">
                          {payment.amount.toFixed(2)} €
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(payment.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      {payment.notes && (
                        <div className="text-sm text-gray-600 mt-1">{payment.notes}</div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleEditPayment(index, payment)}
                        className="text-gray-400 hover:text-indigo-600"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(index)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-500">
                Aucun paiement enregistré. Cliquez sur "Nouveau Paiement" pour commencer.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtDetailModal;
