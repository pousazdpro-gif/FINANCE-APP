import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, TrendingUp, Calendar, Target } from 'lucide-react';

const GoalDetailModal = ({ goal, onClose, onUpdate, onAddProgress }) => {
  const [showProgressForm, setShowProgressForm] = useState(false);
  const [progressAmount, setProgressAmount] = useState(0);

  const handleAddProgress = async (e) => {
    e.preventDefault();
    const newAmount = parseFloat(progressAmount);
    if (newAmount > 0) {
      // Extract current values with fallback
      const currentAmountValue = goal.currentAmount || goal.current_amount || 0;
      const targetAmountValue = goal.targetAmount || goal.target_amount || 0;
      
      // Create update payload with snake_case fields (what backend expects)
      const updatedGoal = {
        name: goal.name,
        target_amount: targetAmountValue,
        current_amount: currentAmountValue + newAmount,
        deadline: goal.deadline,
        category: goal.category || 'savings',
        color: goal.color || '#10b981'
      };
      
      await onUpdate(goal.id, updatedGoal);
      setProgressAmount(0);
      setShowProgressForm(false);
    }
  };

  // Safe values with defaults - handle both camelCase and snake_case
  const currentAmount = goal.currentAmount || goal.current_amount || 0;
  const targetAmount = goal.targetAmount || goal.target_amount || 0;
  const remainingAmount = targetAmount - currentAmount;
  const progressPercent = targetAmount > 0 ? (currentAmount / targetAmount * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{goal.name}</h2>
              <p className="text-green-100">{goal.category || 'Objectif'}</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
          
          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xs text-green-100">Objectif</div>
              <div className="text-xl font-bold">{targetAmount.toFixed(2)} €</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xs text-green-100">Actuel</div>
              <div className="text-xl font-bold">{currentAmount.toFixed(2)} €</div>
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg p-3">
              <div className="text-xs text-green-100">Restant</div>
              <div className="text-xl font-bold">{remainingAmount.toFixed(2)} €</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="bg-white bg-opacity-20 rounded-full h-3">
              <div 
                className="bg-white rounded-full h-3 transition-all"
                style={{ width: `${Math.min(progressPercent, 100)}%` }}
              />
            </div>
            <div className="text-sm mt-1">{Math.min(progressPercent, 100).toFixed(1)}% atteint</div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center space-x-2">
              <Target size={18} />
              <span>Détails</span>
            </h3>
            {goal.deadline && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar size={16} />
                <span>Échéance: {new Date(goal.deadline).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
            {goal.notes && (
              <div className="mt-2 text-sm text-gray-600">
                <strong>Notes:</strong> {goal.notes}
              </div>
            )}
          </div>

          {/* Add Progress Form */}
          {!showProgressForm && (
            <button
              onClick={() => setShowProgressForm(true)}
              className="w-full bg-green-50 border-2 border-dashed border-green-300 rounded-lg p-4 text-green-600 hover:bg-green-100 transition-colors flex items-center justify-center space-x-2"
            >
              <Plus size={20} />
              <span>Ajouter un progrès</span>
            </button>
          )}

          {showProgressForm && (
            <form onSubmit={handleAddProgress} className="bg-green-50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-green-800">Ajouter un progrès</h3>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Montant à ajouter</label>
                <input
                  type="number"
                  step="0.01"
                  value={progressAmount}
                  onChange={(e) => setProgressAmount(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Ex: 100"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                >
                  Ajouter
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProgressForm(false);
                    setProgressAmount(0);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          {/* Tips */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Conseils</h3>
            <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
              <li>Ajoutez régulièrement vos économies</li>
              <li>Fixez des étapes intermédiaires</li>
              <li>Ajustez votre objectif si nécessaire</li>
              {targetAmount > 0 && remainingAmount > 0 && (
                <li>
                  Il vous reste {remainingAmount.toFixed(2)} € pour atteindre votre objectif
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalDetailModal;
