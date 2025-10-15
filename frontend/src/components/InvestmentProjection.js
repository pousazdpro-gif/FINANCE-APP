import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp, DollarSign, Calendar, Percent } from 'lucide-react';

const InvestmentProjection = () => {
  const [monthlyAmount, setMonthlyAmount] = useState(100);
  const [years, setYears] = useState(10);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [viewMode, setViewMode] = useState('monthly'); // monthly or yearly

  const calculateProjection = useMemo(() => {
    const months = years * 12;
    const monthlyReturn = annualReturn / 100 / 12;
    
    let projections = [];
    let total = 0;
    let invested = 0;

    for (let month = 0; month <= months; month++) {
      if (month > 0) {
        total = (total + monthlyAmount) * (1 + monthlyReturn);
        invested += monthlyAmount;
      }
      
      projections.push({
        month,
        year: month / 12,
        total: total,
        invested: invested,
        gains: total - invested
      });
    }

    return projections;
  }, [monthlyAmount, years, annualReturn]);

  const chartData = useMemo(() => {
    const dataPoints = viewMode === 'yearly' 
      ? calculateProjection.filter((_, idx) => idx % 12 === 0)
      : calculateProjection;

    return {
      labels: dataPoints.map(p => 
        viewMode === 'yearly' ? `An ${Math.floor(p.year)}` : `M${p.month}`
      ),
      datasets: [
        {
          label: 'Valeur Totale',
          data: dataPoints.map(p => p.total),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Capital Investi',
          data: dataPoints.map(p => p.invested),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }, [calculateProjection, viewMode]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Projection de Croissance'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': ' + context.parsed.y.toFixed(2) + ' €';
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return value.toLocaleString('fr-FR') + ' €';
          }
        }
      }
    }
  };

  const finalData = calculateProjection[calculateProjection.length - 1];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Projection d'Investissement</h2>
        <p className="text-gray-600">
          Visualisez la croissance de votre patrimoine avec des investissements réguliers
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monthly Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <DollarSign size={16} className="mr-1" />
              Montant Mensuel
            </label>
            <input
              type="number"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xl font-bold"
              min="1"
              step="10"
            />
            <input
              type="range"
              min="10"
              max="5000"
              step="10"
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(parseFloat(e.target.value))}
              className="w-full mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">10 € - 5000 €</p>
          </div>

          {/* Years */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Calendar size={16} className="mr-1" />
              Durée (Années)
            </label>
            <input
              type="number"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xl font-bold"
              min="1"
              max="100"
            />
            <input
              type="range"
              min="1"
              max="100"
              value={years}
              onChange={(e) => setYears(parseInt(e.target.value))}
              className="w-full mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">1 - 100 ans</p>
          </div>

          {/* Annual Return */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Percent size={16} className="mr-1" />
              Rendement Annuel
            </label>
            <input
              type="number"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-indigo-500 text-xl font-bold"
              min="0"
              max="30"
              step="0.5"
            />
            <input
              type="range"
              min="0"
              max="30"
              step="0.5"
              value={annualReturn}
              onChange={(e) => setAnnualReturn(parseFloat(e.target.value))}
              className="w-full mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">0% - 30%</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="mt-4 flex justify-center space-x-2">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'monthly' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Vue Mensuelle
          </button>
          <button
            onClick={() => setViewMode('yearly')}
            className={`px-4 py-2 rounded-lg font-medium ${
              viewMode === 'yearly' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Vue Annuelle
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg">
          <div className="text-sm opacity-90">Capital Investi</div>
          <div className="text-3xl font-bold mt-2">
            {finalData.invested.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="text-sm opacity-90">Valeur Finale</div>
          <div className="text-3xl font-bold mt-2">
            {finalData.total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="text-sm opacity-90">Plus-Value</div>
          <div className="text-3xl font-bold mt-2">
            {finalData.gains.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
          <div className="text-sm opacity-90">Multiplicateur</div>
          <div className="text-3xl font-bold mt-2">
            x{(finalData.total / finalData.invested).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-lg p-6" style={{ height: '500px' }}>
        <Line data={chartData} options={chartOptions} />
      </div>

      {/* Info */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Cette projection est basée sur un rendement constant de {annualReturn}% par an avec des versements réguliers de {monthlyAmount} € par mois. 
          Les performances passées ne garantissent pas les résultats futurs. Les marchés financiers sont volatils.
        </p>
      </div>
    </div>
  );
};

export default InvestmentProjection;
