import React, { useState, useMemo } from 'react';
import { Download, Calendar, Filter, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const ReportsView = ({ transactions = [] }) => {
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];
    
    // Period filter
    const now = new Date();
    let periodStart = new Date();
    
    switch (period) {
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        periodStart.setMonth(now.getMonth() - 6);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
      case '2years':
        periodStart.setFullYear(now.getFullYear() - 2);
        break;
      case '3years':
        periodStart.setFullYear(now.getFullYear() - 3);
        break;
      case '5years':
        periodStart.setFullYear(now.getFullYear() - 5);
        break;
      case 'custom':
        if (startDate) periodStart = new Date(startDate);
        break;
      default:
        periodStart = new Date(0); // All time
    }
    
    filtered = filtered.filter(txn => {
      const txnDate = new Date(txn.date);
      if (period === 'custom' && endDate) {
        return txnDate >= periodStart && txnDate <= new Date(endDate);
      }
      return txnDate >= periodStart;
    });
    
    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(txn => txn.category === categoryFilter);
    }
    
    return filtered;
  }, [transactions, period, startDate, endDate, categoryFilter]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const byCategory = {};
    filteredTransactions.forEach(t => {
      if (!byCategory[t.category]) {
        byCategory[t.category] = { income: 0, expense: 0, count: 0 };
      }
      if (t.type === 'income') {
        byCategory[t.category].income += t.amount;
      } else {
        byCategory[t.category].expense += t.amount;
      }
      byCategory[t.category].count++;
    });
    
    return {
      income,
      expenses,
      balance: income - expenses,
      byCategory,
      count: filteredTransactions.length
    };
  }, [filteredTransactions]);

  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return ['all', ...Array.from(cats)];
  }, [transactions]);

  const exportToPDF = () => {
    // Simple text export for now
    let content = `RAPPORT FINANCIER\n`;
    content += `Période: ${period === 'custom' ? `${startDate} à ${endDate}` : period}\n`;
    content += `\n=== RÉSUMÉ ===\n`;
    content += `Revenus: ${stats.income.toFixed(2)} €\n`;
    content += `Dépenses: ${stats.expenses.toFixed(2)} €\n`;
    content += `Solde: ${stats.balance.toFixed(2)} €\n`;
    content += `Transactions: ${stats.count}\n`;
    content += `\n=== PAR CATÉGORIE ===\n`;
    Object.entries(stats.byCategory).forEach(([cat, data]) => {
      content += `${cat}: +${data.income.toFixed(2)}€ / -${data.expense.toFixed(2)}€ (${data.count})\n`;
    });
    content += `\n=== TRANSACTIONS ===\n`;
    filteredTransactions.forEach(txn => {
      content += `${new Date(txn.date).toLocaleDateString()} | ${txn.description} | ${txn.category} | ${txn.type === 'income' ? '+' : '-'}${txn.amount.toFixed(2)}€\n`;
    });
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport-${period}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rapports & Analyses</h2>
        <p className="text-gray-600">Analysez vos finances sur différentes périodes</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="inline mr-1" size={16} />
              Période
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              <option value="month">1 Mois</option>
              <option value="3months">3 Mois</option>
              <option value="6months">6 Mois (Semestre)</option>
              <option value="year">1 An</option>
              <option value="2years">2 Ans</option>
              <option value="3years">3 Ans</option>
              <option value="5years">5 Ans</option>
              <option value="all">Tout</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Filter className="inline mr-1" size={16} />
              Catégorie
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? 'Toutes' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Export */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export</label>
            <button
              onClick={exportToPDF}
              className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2"
            >
              <Download size={18} />
              <span>Exporter TXT</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range */}
        {period === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date début</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Transactions</div>
          <div className="text-3xl font-bold text-gray-900">{stats.count}</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Revenus</div>
          <div className="text-3xl font-bold text-green-600">+{stats.income.toFixed(2)} €</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Dépenses</div>
          <div className="text-3xl font-bold text-red-600">-{stats.expenses.toFixed(2)} €</div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="text-sm text-gray-500">Solde</div>
          <div className={`text-3xl font-bold ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.balance >= 0 ? '+' : ''}{stats.balance.toFixed(2)} €
          </div>
        </div>
      </div>

      {/* By Category */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Par Catégorie</h3>
        <div className="space-y-2">
          {Object.entries(stats.byCategory).map(([cat, data]) => (
            <div key={cat} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{cat}</div>
                <div className="text-sm text-gray-500">{data.count} transaction(s)</div>
              </div>
              <div className="text-right">
                <div className="text-green-600">+{data.income.toFixed(2)} €</div>
                <div className="text-red-600">-{data.expense.toFixed(2)} €</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Transactions ({filteredTransactions.length})</h3>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTransactions.map((txn, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 border-b">
              <div>
                <div className="font-medium">{txn.description}</div>
                <div className="text-sm text-gray-500">
                  {new Date(txn.date).toLocaleDateString()} • {txn.category}
                </div>
              </div>
              <div className={`font-bold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {txn.type === 'income' ? '+' : '-'}{txn.amount.toFixed(2)} €
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
