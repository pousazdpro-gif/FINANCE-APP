import React, { useState } from 'react';
import { X, Plus, Edit, Trash2, TrendingUp, TrendingDown, DollarSign, Calendar, Activity } from 'lucide-react';
import { Line } from 'react-chartjs-2';

const InvestmentDetailModal = ({ investment, onClose, onUpdate, onAddOperation, onUpdateOperation, onDeleteOperation }) => {
  const [activeTab, setActiveTab] = useState('operations');
  const [showOperationForm, setShowOperationForm] = useState(false);
  const [editingOperation, setEditingOperation] = useState(null);
  const [operationForm, setOperationForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'buy',
    quantity: 0,
    price: 0,
    fees: 0
  });

  // Calculate PRU (Prix de Revient Unitaire)
  const calculatePRU = () => {
    let totalCost = 0;
    let totalQuantity = 0;
    
    investment.operations?.forEach(op => {
      if (op.type === 'buy') {
        totalCost += op.total;
        totalQuantity += op.quantity;
      } else if (op.type === 'sell') {
        const avgCost = totalCost / totalQuantity;
        totalCost -= avgCost * op.quantity;
        totalQuantity -= op.quantity;
      }
    });
    
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  // Calculate metrics based on investment type
  const calculateMetrics = () => {
    const type = investment.type || 'stock';
    const pru = calculatePRU();
    const currentValue = investment.quantity * investment.current_price;
    const costBasis = investment.quantity * pru;
    
    // Common metrics
    let metrics = {
      pru,
      currentValue,
      costBasis,
      gain: currentValue - costBasis,
      gainPercent: costBasis > 0 ? ((currentValue - costBasis) / costBasis) * 100 : 0
    };
    
    // Type-specific calculations
    switch(type) {
      case 'crypto':
        // Crypto: PRU, Gains, DeFi yields
        const defiYields = investment.operations?.filter(op => op.type === 'dividend').reduce((sum, op) => sum + (op.total || 0), 0) || 0;
        metrics.defiYields = defiYields;
        metrics.totalReturn = metrics.gain + defiYields;
        metrics.totalReturnPercent = costBasis > 0 ? (metrics.totalReturn / costBasis) * 100 : 0;
        break;
        
      case 'stock':
        // Stock: PRU, Gains, Dividends
        const dividends = investment.operations?.filter(op => op.type === 'dividend').reduce((sum, op) => sum + (op.total || 0), 0) || 0;
        metrics.dividends = dividends;
        metrics.totalReturn = metrics.gain + dividends;
        metrics.totalReturnPercent = costBasis > 0 ? (metrics.totalReturn / costBasis) * 100 : 0;
        metrics.dividendYield = costBasis > 0 ? (dividends / costBasis) * 100 : 0;
        break;
        
      case 'real_estate':
      case 'commodity':
        // Immobilier / Matériel Passif: Total cost, maintenance, depreciation
        const maintenanceCosts = investment.monthly_costs ? investment.monthly_costs * 12 * ((Date.now() - new Date(investment.purchase_date || Date.now())) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
        metrics.maintenanceCosts = maintenanceCosts;
        metrics.totalCost = costBasis + maintenanceCosts;
        
        // Depreciation for commodity/passive material
        if (type === 'commodity' && investment.depreciation_rate) {
          const yearsOwned = (Date.now() - new Date(investment.purchase_date || Date.now())) / (365.25 * 24 * 60 * 60 * 1000);
          const depreciationAmount = costBasis * (investment.depreciation_rate / 100) * yearsOwned;
          metrics.depreciation = depreciationAmount;
          metrics.currentValue = Math.max(0, costBasis - depreciationAmount);
          metrics.gain = metrics.currentValue - costBasis;
        }
        break;
        
      case 'mining_rig':
        // Matériel Actif: Total cost, maintenance, mining rewards (dividends)
        const miningRewards = investment.operations?.filter(op => op.type === 'dividend').reduce((sum, op) => sum + (op.total || 0), 0) || 0;
        const miningMaintenanceCosts = investment.monthly_costs ? investment.monthly_costs * 12 * ((Date.now() - new Date(investment.purchase_date || Date.now())) / (365.25 * 24 * 60 * 60 * 1000)) : 0;
        metrics.miningRewards = miningRewards;
        metrics.maintenanceCosts = miningMaintenanceCosts;
        metrics.totalCost = costBasis + miningMaintenanceCosts;
        metrics.netProfit = miningRewards - miningMaintenanceCosts;
        metrics.roi = costBasis > 0 ? (metrics.netProfit / costBasis) * 100 : 0;
        break;
        
      case 'bond':
        // Obligation: Total invested, interest payments
        const interests = investment.operations?.filter(op => op.type === 'dividend').reduce((sum, op) => sum + (op.total || 0), 0) || 0;
        metrics.interests = interests;
        metrics.totalReturn = interests;
        metrics.yieldPercent = costBasis > 0 ? (interests / costBasis) * 100 : 0;
        break;
        
      case 'trading_account':
        // Trading Account: Balance evolution
        metrics.initialValue = investment.initial_value || 0;
        metrics.currentBalance = investment.current_price || 0;
        metrics.tradingGain = metrics.currentBalance - metrics.initialValue;
        metrics.tradingGainPercent = metrics.initialValue > 0 ? (metrics.tradingGain / metrics.initialValue) * 100 : 0;
        break;
        
      default:
        // Default: standard stock-like calculation
        break;
    }
    
    return metrics;
  };

  const metrics = calculateMetrics();

  const handleOperationSubmit = async (e) => {
    e.preventDefault();
    const operationData = {
      ...operationForm,
      date: new Date(operationForm.date).toISOString(),
      quantity: parseFloat(operationForm.quantity),
      price: parseFloat(operationForm.price),
      fees: parseFloat(operationForm.fees)
    };

    if (editingOperation !== null) {
      await onUpdateOperation(investment.id, editingOperation, operationData);
      setEditingOperation(null);
    } else {
      await onAddOperation(investment.id, operationData);
    }

    setOperationForm({
      date: new Date().toISOString().split('T')[0],
      type: 'buy',
      quantity: 0,
      price: 0,
      fees: 0
    });
    setShowOperationForm(false);
  };

  const handleEditOperation = (index, operation) => {
    setEditingOperation(index);
    setOperationForm({
      date: new Date(operation.date).toISOString().split('T')[0],
      type: operation.type,
      quantity: operation.quantity,
      price: operation.price,
      fees: operation.fees
    });
    setShowOperationForm(true);
  };

  const handleDeleteOperation = async (index) => {
    if (window.confirm('Supprimer cette opération ?')) {
      await onDeleteOperation(investment.id, index);
    }
  };

  // Prepare chart data
  const chartData = {
    labels: investment.operations?.map((op, idx) => `Op ${idx + 1}`) || [],
    datasets: [
      {
        label: 'Prix d\'achat',
        data: investment.operations?.map(op => op.price) || [],
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4
      },
      {
        label: 'Prix actuel',
        data: investment.operations?.map(() => investment.current_price) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderDash: [5, 5]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Évolution du Prix'
      }
    },
    scales: {
      y: {
        beginAtZero: false
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{investment.name}</h2>
              <p className="text-indigo-100">{investment.symbol} • {investment.type}</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
          
          {/* Key Metrics - Type Specific */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {/* Crypto */}
            {investment.type === 'crypto' && (
              <>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Valeur Actuelle</div>
                  <div className="text-xl font-bold">{metrics.currentValue.toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">PRU</div>
                  <div className="text-xl font-bold">{metrics.pru.toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Plus-Value</div>
                  <div className={`text-xl font-bold ${metrics.gain >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {metrics.gain.toFixed(2)} €
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">DeFi Yields</div>
                  <div className="text-xl font-bold text-green-200">{(metrics.defiYields || 0).toFixed(2)} €</div>
                </div>
              </>
            )}
            
            {/* Stock */}
            {investment.type === 'stock' && (
              <>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Valeur Actuelle</div>
                  <div className="text-xl font-bold">{metrics.currentValue.toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">PRU</div>
                  <div className="text-xl font-bold">{metrics.pru.toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Plus-Value</div>
                  <div className={`text-xl font-bold ${metrics.gain >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {metrics.gain.toFixed(2)} €
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Dividendes</div>
                  <div className="text-xl font-bold text-green-200">{(metrics.dividends || 0).toFixed(2)} €</div>
                </div>
              </>
            )}
            
            {/* Real Estate / Commodity (Matériel Passif) */}
            {(investment.type === 'real_estate' || investment.type === 'commodity') && (
              <>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Coût Total</div>
                  <div className="text-xl font-bold">{metrics.totalCost.toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Valeur Actuelle</div>
                  <div className="text-xl font-bold">{metrics.currentValue.toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Frais Entretien</div>
                  <div className="text-xl font-bold text-red-200">{(metrics.maintenanceCosts || 0).toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">{investment.type === 'commodity' ? 'Dépréciation' : 'Plus-Value'}</div>
                  <div className={`text-xl font-bold ${metrics.gain >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {metrics.gain.toFixed(2)} €
                  </div>
                </div>
              </>
            )}
            
            {/* Mining Rig (Matériel Actif) */}
            {investment.type === 'mining_rig' && (
              <>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Coût Total</div>
                  <div className="text-xl font-bold">{metrics.totalCost.toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Récompenses</div>
                  <div className="text-xl font-bold text-green-200">{(metrics.miningRewards || 0).toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Frais Entretien</div>
                  <div className="text-xl font-bold text-red-200">{(metrics.maintenanceCosts || 0).toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">ROI</div>
                  <div className={`text-xl font-bold ${(metrics.roi || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {(metrics.roi || 0).toFixed(2)}%
                  </div>
                </div>
              </>
            )}
            
            {/* Bond (Obligation) */}
            {investment.type === 'bond' && (
              <>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Montant Investi</div>
                  <div className="text-xl font-bold">{metrics.costBasis.toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Intérêts Reçus</div>
                  <div className="text-xl font-bold text-green-200">{(metrics.interests || 0).toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Rendement</div>
                  <div className="text-xl font-bold text-green-200">{(metrics.yieldPercent || 0).toFixed(2)}%</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Valeur Totale</div>
                  <div className="text-xl font-bold">{(metrics.costBasis + (metrics.interests || 0)).toFixed(2)} €</div>
                </div>
              </>
            )}
            
            {/* Trading Account */}
            {investment.type === 'trading_account' && (
              <>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Capital Initial</div>
                  <div className="text-xl font-bold">{(metrics.initialValue || 0).toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Solde Actuel</div>
                  <div className="text-xl font-bold">{(metrics.currentBalance || 0).toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Gain/Perte</div>
                  <div className={`text-xl font-bold ${(metrics.tradingGain || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {(metrics.tradingGain || 0).toFixed(2)} €
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Performance</div>
                  <div className={`text-xl font-bold ${(metrics.tradingGainPercent || 0) >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {(metrics.tradingGainPercent || 0).toFixed(2)}%
                  </div>
                </div>
              </>
            )}
            
            {/* Default: ETF or other */}
            {!['crypto', 'stock', 'real_estate', 'commodity', 'mining_rig', 'bond', 'trading_account'].includes(investment.type) && (
              <>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Valeur Actuelle</div>
                  <div className="text-xl font-bold">{metrics.currentValue.toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">PRU</div>
                  <div className="text-xl font-bold">{metrics.pru.toFixed(2)} €</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Plus-Value</div>
                  <div className={`text-xl font-bold ${metrics.gain >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {metrics.gain.toFixed(2)} €
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-3">
                  <div className="text-xs text-indigo-100">Rendement</div>
                  <div className={`text-xl font-bold ${metrics.gainPercent >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                    {metrics.gainPercent.toFixed(2)}%
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <div className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveTab('operations')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'operations'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Activity size={18} className="inline mr-2" />
              Opérations
            </button>
            <button
              onClick={() => setActiveTab('chart')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeTab === 'chart'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <TrendingUp size={18} className="inline mr-2" />
              Graphique
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'operations' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Historique des Opérations</h3>
                <button
                  onClick={() => {
                    setShowOperationForm(!showOperationForm);
                    setEditingOperation(null);
                    setOperationForm({
                      date: new Date().toISOString().split('T')[0],
                      type: 'buy',
                      quantity: 0,
                      price: 0,
                      fees: 0
                    });
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                >
                  <Plus size={18} />
                  <span>Nouvelle Opération</span>
                </button>
              </div>

              {showOperationForm && (
                <form onSubmit={handleOperationSubmit} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={operationForm.date}
                        onChange={(e) => setOperationForm({ ...operationForm, date: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={operationForm.type}
                        onChange={(e) => setOperationForm({ ...operationForm, type: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="buy">Achat</option>
                        <option value="sell">Vente</option>
                        <option value="dividend">Dividende</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantité</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={operationForm.quantity}
                        onChange={(e) => setOperationForm({ ...operationForm, quantity: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Prix Unitaire</label>
                      <input
                        type="number"
                        step="0.01"
                        value={operationForm.price}
                        onChange={(e) => setOperationForm({ ...operationForm, price: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Frais</label>
                      <input
                        type="number"
                        step="0.01"
                        value={operationForm.fees}
                        onChange={(e) => setOperationForm({ ...operationForm, fees: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                      {editingOperation !== null ? 'Modifier' : 'Ajouter'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowOperationForm(false);
                        setEditingOperation(null);
                      }}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-2">
                {investment.operations && investment.operations.length > 0 ? (
                  investment.operations.map((op, index) => (
                    <div key={index} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              op.type === 'buy' ? 'bg-green-100 text-green-800' :
                              op.type === 'sell' ? 'bg-red-100 text-red-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {op.type === 'buy' ? 'Achat' : op.type === 'sell' ? 'Vente' : 'Dividende'}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(op.date).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Quantité:</span>
                              <span className="ml-1 font-medium">{op.quantity}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Prix:</span>
                              <span className="ml-1 font-medium">{op.price.toFixed(2)} €</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Frais:</span>
                              <span className="ml-1 font-medium">{op.fees.toFixed(2)} €</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Total:</span>
                              <span className="ml-1 font-bold text-indigo-600">{op.total.toFixed(2)} €</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => handleEditOperation(index, op)}
                            className="text-gray-400 hover:text-indigo-600"
                            title="Modifier"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteOperation(index)}
                            className="text-gray-400 hover:text-red-600"
                            title="Supprimer"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    Aucune opération. Cliquez sur "Nouvelle Opération" pour commencer.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'chart' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Analyse Graphique</h3>
              {investment.operations && investment.operations.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Aucune donnée pour afficher le graphique. Ajoutez des opérations d'abord.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestmentDetailModal;
