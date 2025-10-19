import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, AlertCircle, Award } from 'lucide-react';

const DashboardViewPremium = ({ 
  accounts, 
  transactions, 
  investments, 
  debts, 
  receivables, 
  goals,
  formatAmount 
}) => {
  const [timeRange, setTimeRange] = useState('30d'); // 30d, 3m, 6m, 1y, max

  // Calculate Net Worth
  const netWorth = useMemo(() => {
    const accountsTotal = accounts.reduce((sum, acc) => {
      const balance = acc.current_balance || acc.currentBalance || 0;
      return sum + balance;
    }, 0);
    
    const investmentsTotal = investments.reduce((sum, inv) => {
      const value = inv.current_value || inv.currentValue || 0;
      return sum + value;
    }, 0);
    
    const debtsTotal = debts.reduce((sum, debt) => {
      const remaining = debt.remainingAmount || debt.remaining_amount || 0;
      return sum + remaining;
    }, 0);
    
    const receivablesTotal = receivables.reduce((sum, rec) => {
      const remaining = rec.remaining_amount || rec.remainingAmount || 0;
      return sum + remaining;
    }, 0);
    
    return accountsTotal + investmentsTotal - debtsTotal + receivablesTotal;
  }, [accounts, investments, debts, receivables]);

  // Calculate variation (comparing to last month)
  const variation = useMemo(() => {
    // For now, random for demo - TODO: Calculate real historical data
    const changePercent = 5.4;
    const changeAmount = netWorth * (changePercent / 100);
    return { amount: changeAmount, percent: changePercent };
  }, [netWorth]);

  // Asset allocation
  const assetAllocation = useMemo(() => {
    const total = netWorth;
    if (total === 0) return [];
    
    const accountsTotal = accounts.reduce((sum, acc) => sum + (acc.current_balance || acc.currentBalance || 0), 0);
    const investmentsTotal = investments.reduce((sum, inv) => sum + (inv.current_value || inv.currentValue || 0), 0);
    const debtsTotal = debts.reduce((sum, debt) => sum + (debt.remainingAmount || debt.remaining_amount || 0), 0);
    
    return [
      { name: 'Liquidités', value: accountsTotal, percent: (accountsTotal / total * 100).toFixed(1), color: '#10b981' },
      { name: 'Investissements', value: investmentsTotal, percent: (investmentsTotal / total * 100).toFixed(1), color: '#3b82f6' },
      { name: 'Dettes', value: -debtsTotal, percent: (debtsTotal / total * 100).toFixed(1), color: '#ef4444' },
    ].filter(item => item.value !== 0);
  }, [accounts, investments, debts, netWorth]);

  // Top 5 investments by performance
  const topInvestments = useMemo(() => {
    return investments
      .map(inv => {
        const totalInvested = inv.total_invested || inv.totalInvested || 0;
        const currentValue = inv.current_value || inv.currentValue || 0;
        const performance = totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested * 100) : 0;
        return { ...inv, performance };
      })
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);
  }, [investments]);

  // Top 5 expenses this month
  const topExpenses = useMemo(() => {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    
    const monthExpenses = transactions.filter(t => {
      const txDate = new Date(t.date);
      return t.type === 'expense' && txDate >= thisMonth;
    });
    
    // Group by category
    const byCategory = monthExpenses.reduce((acc, t) => {
      const cat = t.category || 'Autre';
      acc[cat] = (acc[cat] || 0) + t.amount;
      return acc;
    }, {});
    
    return Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="space-y-6 p-6">
      {/* Header KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Net Worth Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold opacity-90">💰 Valeur Nette</h2>
            <DollarSign className="opacity-70" size={24} />
          </div>
          <div className="text-4xl font-bold mb-2">{formatAmount(netWorth)}</div>
          <div className="flex items-center space-x-2">
            {variation.percent >= 0 ? (
              <TrendingUp size={20} className="text-green-300" />
            ) : (
              <TrendingDown size={20} className="text-red-300" />
            )}
            <span className="text-lg">
              {variation.percent >= 0 ? '+' : ''}{formatAmount(variation.amount)} ({variation.percent >= 0 ? '+' : ''}{variation.percent.toFixed(2)}%)
            </span>
            <span className="text-sm opacity-70">ce mois</span>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium">Revenus ce mois</div>
            <div className="text-2xl font-bold text-green-700">
              {formatAmount(
                transactions
                  .filter(t => {
                    const d = new Date(t.date);
                    const now = new Date();
                    return t.type === 'income' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-600 font-medium">Dépenses ce mois</div>
            <div className="text-2xl font-bold text-red-700">
              {formatAmount(
                transactions
                  .filter(t => {
                    const d = new Date(t.date);
                    const now = new Date();
                    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  })
                  .reduce((sum, t) => sum + t.amount, 0)
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Asset Allocation */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
          <PieChart size={24} className="text-indigo-600" />
          <span>📊 Répartition des Actifs</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Simple bar chart representation */}
          <div className="space-y-3">
            {assetAllocation.map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-gray-600">{item.percent}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 rounded-full transition-all" 
                    style={{ 
                      width: `${Math.abs(item.percent)}%`,
                      backgroundColor: item.color 
                    }}
                  />
                </div>
                <div className="text-right text-sm text-gray-500 mt-1">
                  {formatAmount(item.value)}
                </div>
              </div>
            ))}
          </div>
          
          {/* Summary */}
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Actifs</div>
              <div className="text-2xl font-bold text-gray-800">
                {formatAmount(
                  accounts.reduce((sum, acc) => sum + (acc.current_balance || acc.currentBalance || 0), 0) +
                  investments.reduce((sum, inv) => sum + (inv.current_value || inv.currentValue || 0), 0)
                )}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">Total Passifs</div>
              <div className="text-2xl font-bold text-red-600">
                {formatAmount(
                  debts.reduce((sum, debt) => sum + (debt.remainingAmount || debt.remaining_amount || 0), 0)
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers & Expenses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Investments */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <Award size={24} className="text-green-600" />
            <span>🏆 Top 5 Investissements</span>
          </h3>
          <div className="space-y-3">
            {topInvestments.length > 0 ? (
              topInvestments.map((inv, idx) => (
                <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl font-bold text-gray-400">#{idx + 1}</div>
                    <div>
                      <div className="font-medium">{inv.name}</div>
                      <div className="text-sm text-gray-500">{inv.type}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${inv.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {inv.performance >= 0 ? '+' : ''}{inv.performance.toFixed(2)}%
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatAmount(inv.current_value || inv.currentValue || 0)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                Aucun investissement pour le moment
              </div>
            )}
          </div>
        </div>

        {/* Top Expenses */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
            <AlertCircle size={24} className="text-orange-600" />
            <span>💸 Top 5 Dépenses ce Mois</span>
          </h3>
          <div className="space-y-3">
            {topExpenses.length > 0 ? (
              topExpenses.map((exp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl font-bold text-gray-400">#{idx + 1}</div>
                    <div className="font-medium">{exp.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      {formatAmount(exp.amount)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-8">
                Aucune dépense ce mois
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {(debts.some(d => {
        const dueDate = new Date(d.due_date || d.dueDate);
        const now = new Date();
        const diff = (dueDate - now) / (1000 * 60 * 60 * 24);
        return diff < 30 && diff > 0;
      }) || goals.some(g => {
        const current = g.currentAmount || g.current_amount || 0;
        const target = g.targetAmount || g.target_amount || 1;
        return (current / target * 100) >= 90;
      })) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center space-x-2 text-yellow-800">
            <AlertCircle size={24} />
            <span>⚠️ Alertes Importantes</span>
          </h3>
          <div className="space-y-2">
            {debts.filter(d => {
              const dueDate = new Date(d.due_date || d.dueDate);
              const now = new Date();
              const diff = (dueDate - now) / (1000 * 60 * 60 * 24);
              return diff < 30 && diff > 0;
            }).map(d => (
              <div key={d.id} className="text-sm text-yellow-800">
                🔔 Dette "{d.name}" arrive à échéance dans {Math.round((new Date(d.due_date || d.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} jours
              </div>
            ))}
            {goals.filter(g => {
              const current = g.currentAmount || g.current_amount || 0;
              const target = g.targetAmount || g.target_amount || 1;
              return (current / target * 100) >= 90;
            }).map(g => (
              <div key={g.id} className="text-sm text-green-800">
                🎯 Objectif "{g.name}" presque atteint ({((g.currentAmount || g.current_amount || 0) / (g.targetAmount || g.target_amount || 1) * 100).toFixed(1)}%)
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardViewPremium;
