import React, { useState } from 'react';
import { TrendingUp, DollarSign, Calendar, Percent, PiggyBank, Target, Sparkles } from 'lucide-react';

const InvestmentProjectionSimple = () => {
  const [monthlyAmount, setMonthlyAmount] = useState(500);
  const [initialAmount, setInitialAmount] = useState(1000);
  const [years, setYears] = useState(20);
  const [annualReturn, setAnnualReturn] = useState(7);

  // Calcul en temps réel - recalcule à chaque changement
  const months = years * 12;
  const monthlyReturn = annualReturn / 100 / 12;
  
  // Calcul valeur finale
  let finalTotal = initialAmount;
  let finalInvested = initialAmount;

  for (let month = 1; month <= months; month++) {
    finalTotal += monthlyAmount;
    finalInvested += monthlyAmount;
    finalTotal = finalTotal * (1 + monthlyReturn);
  }

  const finalGains = finalTotal - finalInvested;
  const finalRoi = finalInvested > 0 ? ((finalTotal - finalInvested) / finalInvested * 100) : 0;

  const finalData = {
    total: finalTotal,
    invested: finalInvested,
    gains: finalGains,
    roi: finalRoi
  };

  // Calcul tableau année par année
  const yearlyData = [];
  let yearTotal = initialAmount;
  let yearInvested = initialAmount;

  yearlyData.push({
    year: 0,
    total: initialAmount,
    invested: initialAmount,
    gains: 0
  });

  for (let year = 1; year <= years; year++) {
    for (let month = 1; month <= 12; month++) {
      yearTotal += monthlyAmount;
      yearInvested += monthlyAmount;
      yearTotal = yearTotal * (1 + monthlyReturn);
    }
    
    yearlyData.push({
      year: year,
      total: yearTotal,
      invested: yearInvested,
      gains: yearTotal - yearInvested
    });
  }

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
          Calculez la croissance de votre patrimoine
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
              <input
                type="number"
                min="10"
                max="10000000"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Number(e.target.value) || 0)}
                className="text-xl font-bold text-indigo-600 border-2 border-indigo-300 rounded px-3 py-1 w-40 text-right"
              />
              <span className="text-lg font-bold text-indigo-600">€</span>
            </label>
            <input
              type="range"
              min="10"
              max="100000"
              step="100"
              value={Math.min(initialAmount, 100000)}
              onChange={(e) => setInitialAmount(Number(e.target.value))}
              className="w-full h-3 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10 €</span>
              <span>100 000 € (max slider: 100k, éditable jusqu'à 10M)</span>
            </div>
          </div>

          {/* Montant Mensuel */}
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span className="flex items-center">
                <DollarSign size={18} className="mr-2 text-green-600" />
                Versement Mensuel
              </span>
              <input
                type="number"
                min="10"
                max="10000"
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(Number(e.target.value) || 0)}
                className="text-xl font-bold text-green-600 border-2 border-green-300 rounded px-3 py-1 w-40 text-right"
              />
              <span className="text-lg font-bold text-green-600">€</span>
            </label>
            <input
              type="range"
              min="10"
              max="10000"
              step="50"
              value={Math.min(monthlyAmount, 10000)}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
              className="w-full h-3 bg-green-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10 €</span>
              <span>10 000 €</span>
            </div>
          </div>

          {/* Durée */}
          <div className="space-y-3">
            <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
              <span className="flex items-center">
                <Calendar size={18} className="mr-2 text-purple-600" />
                Durée d'Investissement
              </span>
              <input
                type="number"
                min="1"
                max="100"
                value={years}
                onChange={(e) => setYears(Number(e.target.value) || 1)}
                className="text-xl font-bold text-purple-600 border-2 border-purple-300 rounded px-3 py-1 w-32 text-right"
              />
              <span className="text-lg font-bold text-purple-600">{years === 1 ? 'an' : 'ans'}</span>
            </label>
            <input
              type="range"
              min="1"
              max="100"
              step="1"
              value={Math.min(years, 100)}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 an</span>
              <span>100 ans</span>
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
              onChange={(e) => setAnnualReturn(Number(e.target.value))}
              className="w-full h-3 bg-yellow-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>0%</span>
              <span>15%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Résultats - Cartes KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white p-6 rounded-2xl shadow-lg">
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

        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-lg">
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

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-2xl shadow-lg">
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

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium opacity-90">Rentabilité</div>
            <Target size={24} className="opacity-80" />
          </div>
          <div className="text-3xl font-bold">
            +{finalData.roi.toFixed(1)} %
          </div>
          <div className="mt-2 text-xs opacity-75">
            Retour sur investissement total
          </div>
        </div>
      </div>

      {/* Tableau d'évolution année par année */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          Évolution Année par Année
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Année
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Capital Investi
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Valeur Totale
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Plus-Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  ROI %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {yearlyData.map((data, idx) => {
                const roi = data.invested > 0 ? (data.gains / data.invested * 100) : 0;
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {data.year === 0 ? 'Début' : `An ${data.year}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                      {data.invested.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                      {data.total.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-yellow-600">
                      +{data.gains.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-600">
                      {roi.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
                {years >= 10 && yearlyData[10]
                  ? yearlyData[10].total.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €'
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

export default InvestmentProjectionSimple;
