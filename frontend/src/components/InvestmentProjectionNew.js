import React, { useState, useMemo, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp, DollarSign, Calendar, Percent, PiggyBank, Target, Sparkles } from 'lucide-react';

const InvestmentProjectionNew = () => {
  const [monthlyAmount, setMonthlyAmount] = useState(500);
  const [initialAmount, setInitialAmount] = useState(1000);
  const [years, setYears] = useState(20);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [chartKey, setChartKey] = useState(0);

  // Force chart re-render when values change
  useEffect(() => {
    setChartKey(prev => prev + 1);
  }, [monthlyAmount, initialAmount, years, annualReturn]);

  const calculateProjection = useMemo(() => {
    const months = years * 12;
    const monthlyReturn = annualReturn / 100 / 12;
    
    let projections = [];
    let total = initialAmount;
    let invested = initialAmount;

    // Point de départ
    projections.push({
      month: 0,
      year: 0,
      total: initialAmount,
      invested: initialAmount,
      gains: 0
    });

    for (let month = 1; month <= months; month++) {
      // Ajouter l'investissement mensuel
      total += monthlyAmount;
      invested += monthlyAmount;
      
      // Appliquer les intérêts composés
      total = total * (1 + monthlyReturn);
      
      projections.push({
        month,
        year: month / 12,
        total: total,
        invested: invested,
        gains: total - invested
      });
    }

    return projections;
  }, [monthlyAmount, initialAmount, years, annualReturn]);

  // Filtrer les points pour affichage annuel
  const yearlyData = useMemo(() => {
    return calculateProjection.filter((_, idx) => idx % 12 === 0 || idx === calculateProjection.length - 1);
  }, [calculateProjection]);

  const chartData = useMemo(() => {
    return {
      labels: yearlyData.map(p => {
        const year = Math.floor(p.year);
        return year === 0 ? 'Début' : `An ${year}`;
      }),
      datasets: [
        {
          label: 'Valeur Totale',
          data: yearlyData.map(p => p.total),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(99, 102, 241)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Capital Investi',
          data: yearlyData.map(p => p.invested),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        },
        {
          label: 'Plus-Value',
          data: yearlyData.map(p => p.gains),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(245, 158, 11)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }
      ]
    };
  }, [yearlyData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 14,
            weight: 'bold'
          }
        }
      },
      title: {
        display: true,
        text: 'Évolution de Votre Patrimoine',
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const formatted = value.toLocaleString('fr-FR', { 
              style: 'currency', 
              currency: 'EUR',
              maximumFractionDigits: 0 
            });
            return `${context.dataset.label}: ${formatted}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 12
          },
          callback: function(value) {
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + 'M €';
            } else if (value >= 1000) {
              return (value / 1000).toFixed(0) + 'k €';
            }
            return value.toLocaleString('fr-FR') + ' €';
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 12
          }
        }
      }
    }
  };

  const finalData = calculateProjection[calculateProjection.length - 1];
  const roi = ((finalData.total - finalData.invested) / finalData.invested * 100);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* En-tête */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-4">
          <Sparkles className="text-white" size={32} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Simulateur d'Investissement
        </h1>
        <p className="text-lg text-gray-600">
          Visualisez la croissance de votre patrimoine en temps réel
        </p>
      </div>

      {/* Panneau de contrôles */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <PiggyBank className="mr-3 text-indigo-600" size={28} />
          Paramètres de Simulation
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Capital Initial */}
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span className="flex items-center">
                <Target size={18} className="mr-2 text-indigo-600" />
                Capital Initial
              </span>
              <span className="text-2xl font-bold text-indigo-600">
                {initialAmount.toLocaleString('fr-FR')} €
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="50000"
              step="100"
              value={initialAmount}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                console.log('Capital Initial changed to:', newValue);
                setInitialAmount(newValue);
              }}
              onInput={(e) => {
                const newValue = parseFloat(e.target.value);
                setInitialAmount(newValue);
              }}
              className="w-full h-3 bg-gradient-to-r from-indigo-200 to-indigo-400 rounded-lg appearance-none cursor-pointer slider"
              style={{ zIndex: 10, position: 'relative' }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 €</span>
              <span>50 000 €</span>
            </div>
          </div>

          {/* Montant Mensuel */}
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span className="flex items-center">
                <DollarSign size={18} className="mr-2 text-green-600" />
                Versement Mensuel
              </span>
              <span className="text-2xl font-bold text-green-600">
                {monthlyAmount.toLocaleString('fr-FR')} €
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={monthlyAmount}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                console.log('Versement Mensuel changed to:', newValue);
                setMonthlyAmount(newValue);
              }}
              onInput={(e) => {
                const newValue = parseFloat(e.target.value);
                setMonthlyAmount(newValue);
              }}
              className="w-full h-3 bg-gradient-to-r from-green-200 to-green-400 rounded-lg appearance-none cursor-pointer slider"
              style={{ zIndex: 10, position: 'relative' }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0 €</span>
              <span>5 000 €</span>
            </div>
          </div>

          {/* Durée */}
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span className="flex items-center">
                <Calendar size={18} className="mr-2 text-purple-600" />
                Durée d'Investissement
              </span>
              <span className="text-2xl font-bold text-purple-600">
                {years} {years === 1 ? 'an' : 'ans'}
              </span>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={years}
              onChange={(e) => {
                const newValue = parseInt(e.target.value);
                console.log('Durée changed to:', newValue);
                setYears(newValue);
              }}
              onInput={(e) => {
                const newValue = parseInt(e.target.value);
                setYears(newValue);
              }}
              className="w-full h-3 bg-gradient-to-r from-purple-200 to-purple-400 rounded-lg appearance-none cursor-pointer slider"
              style={{ zIndex: 10, position: 'relative' }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 an</span>
              <span>50 ans</span>
            </div>
          </div>

          {/* Rendement Annuel */}
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span className="flex items-center">
                <Percent size={18} className="mr-2 text-yellow-600" />
                Rendement Annuel
              </span>
              <span className="text-2xl font-bold text-yellow-600">
                {annualReturn.toFixed(1)} %
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={annualReturn}
              onChange={(e) => {
                const newValue = parseFloat(e.target.value);
                console.log('Rendement Annuel changed to:', newValue);
                setAnnualReturn(newValue);
              }}
              onInput={(e) => {
                const newValue = parseFloat(e.target.value);
                setAnnualReturn(newValue);
              }}
              className="w-full h-3 bg-gradient-to-r from-yellow-200 to-yellow-400 rounded-lg appearance-none cursor-pointer slider"
              style={{ zIndex: 10, position: 'relative' }}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>15%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Résultats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg transform transition-transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Capital Investi</div>
            <DollarSign size={24} className="opacity-80" />
          </div>
          <div className="text-3xl font-bold">
            {finalData.invested.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
          </div>
          <div className="mt-2 text-xs opacity-75">
            {initialAmount.toLocaleString('fr-FR')} € initial + {(monthlyAmount * 12 * years).toLocaleString('fr-FR')} € versé
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg transform transition-transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Valeur Finale</div>
            <TrendingUp size={24} className="opacity-80" />
          </div>
          <div className="text-3xl font-bold">
            {finalData.total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
          </div>
          <div className="mt-2 text-xs opacity-75">
            Après {years} {years === 1 ? 'an' : 'ans'} d'investissement
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-2xl shadow-lg transform transition-transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Plus-Value</div>
            <Sparkles size={24} className="opacity-80" />
          </div>
          <div className="text-3xl font-bold">
            +{finalData.gains.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
          </div>
          <div className="mt-2 text-xs opacity-75">
            Gains générés par les intérêts
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg transform transition-transform hover:scale-105">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Rentabilité</div>
            <Target size={24} className="opacity-80" />
          </div>
          <div className="text-3xl font-bold">
            +{roi.toFixed(1)} %
          </div>
          <div className="mt-2 text-xs opacity-75">
            Retour sur investissement total
          </div>
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <div style={{ height: '500px', position: 'relative' }}>
          {chartData && chartData.labels && chartData.labels.length > 0 ? (
            <Line key={chartKey} data={chartData} options={chartOptions} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
                <p>Chargement du graphique...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informations supplémentaires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Projection Annuelle
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex justify-between">
              <span>Investissement annuel:</span>
              <span className="font-semibold">{(monthlyAmount * 12).toLocaleString('fr-FR')} €</span>
            </div>
            <div className="flex justify-between">
              <span>Gains annuels (moyenne):</span>
              <span className="font-semibold">+{(finalData.gains / years).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</span>
            </div>
            <div className="flex justify-between">
              <span>Valeur à 10 ans:</span>
              <span className="font-semibold">
                {years >= 10 
                  ? calculateProjection[120]?.total.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <h3 className="font-bold text-amber-900 mb-3 flex items-center">
            <Sparkles className="mr-2" size={20} />
            Points Clés
          </h3>
          <ul className="space-y-2 text-sm text-amber-800">
            <li className="flex items-start">
              <span className="mr-2">💡</span>
              <span>Les intérêts composés amplifient vos gains au fil du temps</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">📈</span>
              <span>Un versement régulier augmente significativement votre patrimoine</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">⚠️</span>
              <span>Les performances passées ne garantissent pas les résultats futurs</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InvestmentProjectionNew;
