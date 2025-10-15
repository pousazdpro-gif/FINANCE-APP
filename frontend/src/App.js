import { useState, useEffect } from "react";
import "@/App.css";
import { 
  PiggyBank, LayoutDashboard, Wallet, ArrowRightLeft, TrendingUp, 
  Target, CreditCard, FileText, ShoppingCart, Building2, Download, 
  Upload, Plus, Search, Bell, X, Edit, Trash2, Save, Tag, Settings, CheckSquare,
  Camera, BarChart3
} from "lucide-react";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { 
  accountsAPI, transactionsAPI, investmentsAPI, goalsAPI, debtsAPI, 
  receivablesAPI, productsAPI, shoppingListsAPI, bankConnectionsAPI, 
  dashboardAPI, dataAPI, categoriesAPI, searchAPI
} from './services/api';
import AuthButton from './components/AuthButton';
import LoginRequired from './components/LoginRequired';
import InvestmentDetailModal from './components/InvestmentDetailModal';
import GlobalSearch from './components/GlobalSearch';
import CategoryManager from './components/CategoryManager';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import SettingsPanel from './components/SettingsPanel';
import TransferModal from './components/TransferModal';
import OCRScanner from './components/OCRScanner';
import InvestmentProjection from './components/InvestmentProjection';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

function App() {
  // State management
  const [currentView, setCurrentView] = useState('dashboard');
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [goals, setGoals] = useState([]);
  const [debts, setDebts] = useState([]);
  const [receivables, setReceivables] = useState([]);
  const [products, setProducts] = useState([]);
  const [shoppingLists, setShoppingLists] = useState([]);
  const [bankConnections, setBankConnections] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAddText, setQuickAddText] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalData, setModalData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showInvestmentDetail, setShowInvestmentDetail] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [categories, setCategories] = useState([]);

  // Load all data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [
        accountsRes, transactionsRes, investmentsRes, goalsRes, debtsRes,
        receivablesRes, productsRes, shoppingListsRes, bankConnectionsRes, 
        dashboardRes, categoriesRes
      ] = await Promise.all([
        accountsAPI.getAll(),
        transactionsAPI.getAll({ limit: 100 }),
        investmentsAPI.getAll(),
        goalsAPI.getAll(),
        debtsAPI.getAll(),
        receivablesAPI.getAll(),
        productsAPI.getAll(),
        shoppingListsAPI.getAll(),
        bankConnectionsAPI.getAll(),
        dashboardAPI.getSummary(),
        categoriesAPI.getAll()
      ]);

      setAccounts(accountsRes.data);
      setTransactions(transactionsRes.data);
      setInvestments(investmentsRes.data);
      setGoals(goalsRes.data);
      setDebts(debtsRes.data);
      setReceivables(receivablesRes.data);
      setProducts(productsRes.data);
      setShoppingLists(shoppingListsRes.data);
      setBankConnections(bankConnectionsRes.data);
      setDashboardData(dashboardRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Quick add handler
  const handleQuickAdd = async () => {
    const regex = /(\w+)\s+([\d.]+)/;
    const match = quickAddText.match(regex);
    if (match && accounts.length > 0) {
      const [, description, amount] = match;
      try {
        await transactionsAPI.create({
          account_id: accounts[0].id,
          type: 'expense',
          amount: parseFloat(amount),
          category: 'Général',
          description,
          date: new Date().toISOString(),
        });
        setQuickAddText('');
        loadAllData();
      } catch (error) {
        console.error('Error creating quick transaction:', error);
      }
    }
  };

  // Modal handlers
  const openModal = (type, data = {}) => {
    setModalType(type);
    setModalData(data);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalData({});
  };

  // Export/Import handlers
  const handleExport = async () => {
    try {
      const response = await dataAPI.exportAll();
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `financeapp-backup-${new Date().toISOString()}.json`;
      a.click();
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target.result);
          await dataAPI.importAll(data);
          loadAllData();
          alert('Données importées avec succès !');
        } catch (error) {
          console.error('Error importing data:', error);
          alert('Erreur lors de l\'importation');
        }
      };
      reader.readAsText(file);
    }
  };

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Résumé', icon: LayoutDashboard },
    { id: 'accounts', label: 'Comptes', icon: Wallet },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft },
    { id: 'investments', label: 'Investissements', icon: TrendingUp },
    { id: 'goals', label: 'Objectifs', icon: Target },
    { id: 'debts', label: 'Dettes', icon: CreditCard },
    { id: 'receivables', label: 'Créances', icon: FileText },
    { id: 'shopping', label: 'Achats', icon: ShoppingCart },
    { id: 'banks', label: 'Banques', icon: Building2 },
    { id: 'tasks', label: 'Tâches', icon: CheckSquare },
    { id: 'ocr', label: 'Scanner OCR', icon: Camera },
    { id: 'projection', label: 'Projection', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <LoginRequired>
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <PiggyBank className="text-indigo-600 mr-2" size={24} />
            FinanceApp
          </h1>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  currentView === item.id
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
                data-testid={`nav-${item.id}`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-200 space-y-2">
          <button
            onClick={handleExport}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
            data-testid="export-button"
          >
            <Download size={18} />
            <span>Exporter</span>
          </button>
          <label className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg flex items-center justify-center space-x-2 cursor-pointer">
            <Upload size={18} />
            <span>Importer</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
        </div>
        
        {/* Auth Button */}
        <AuthButton />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900 flex-shrink-0">
            {navItems.find(item => item.id === currentView)?.label || 'FinanceApp'}
          </h2>
          <div className="flex-grow min-w-0">
            <input
              type="text"
              value={quickAddText}
              onChange={(e) => setQuickAddText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleQuickAdd()}
              placeholder="Ajout rapide: Achats 54.25..."
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              data-testid="quick-add-input"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGlobalSearch(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Recherche globale"
            >
              <Search size={20} className="text-gray-600" />
            </button>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Gérer les catégories"
            >
              <Tag size={20} className="text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell size={20} className="text-gray-600" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500">Chargement...</div>
            </div>
          ) : (
            <>
              {currentView === 'dashboard' && <DashboardView data={dashboardData} accounts={accounts} transactions={transactions} />}
              {currentView === 'accounts' && <AccountsView accounts={accounts} openModal={openModal} setAccounts={setAccounts} onTransferClick={() => setShowTransferModal(true)} />}
              {currentView === 'transactions' && <TransactionsView transactions={transactions} accounts={accounts} openModal={openModal} setTransactions={setTransactions} />}
              {currentView === 'investments' && <InvestmentsView investments={investments} openModal={openModal} setInvestments={setInvestments} onViewDetail={(inv) => { setSelectedInvestment(inv); setShowInvestmentDetail(true); }} />}
              {currentView === 'goals' && <GoalsView goals={goals} openModal={openModal} setGoals={setGoals} />}
              {currentView === 'debts' && <DebtsView debts={debts} openModal={openModal} setDebts={setDebts} />}
              {currentView === 'receivables' && <ReceivablesView receivables={receivables} openModal={openModal} setReceivables={setReceivables} />}
              {currentView === 'shopping' && <ShoppingView products={products} shoppingLists={shoppingLists} openModal={openModal} setProducts={setProducts} setShoppingLists={setShoppingLists} />}
              {currentView === 'banks' && <BanksView bankConnections={bankConnections} accounts={accounts} openModal={openModal} setBankConnections={setBankConnections} />}
              {currentView === 'tasks' && <EisenhowerMatrix />}
              {currentView === 'ocr' && <OCRScanner onTransactionsExtracted={(txns) => {
                console.log('Transactions extracted:', txns);
                // TODO: Create transactions in batch
                loadAllData();
              }} />}
              {currentView === 'projection' && <InvestmentProjection />}
              {currentView === 'settings' && <SettingsPanel onClose={() => setCurrentView('dashboard')} onSave={(prefs) => {
                console.log('Preferences saved:', prefs);
                loadAllData();
              }} />}
            </>
          )}
        </div>
      </main>

      {/* Modals */}
      {showModal && (
        <Modal
          type={modalType}
          data={modalData}
          onClose={closeModal}
          onSave={loadAllData}
          accounts={accounts}
        />
      )}
      
      {showInvestmentDetail && selectedInvestment && (
        <InvestmentDetailModal
          investment={selectedInvestment}
          onClose={() => {
            setShowInvestmentDetail(false);
            setSelectedInvestment(null);
          }}
          onUpdate={async (id, data) => {
            await investmentsAPI.update(id, data);
            await loadAllData();
          }}
          onAddOperation={async (id, operation) => {
            await investmentsAPI.addOperation(id, operation);
            await loadAllData();
            const updated = await investmentsAPI.getAll();
            setSelectedInvestment(updated.data.find(inv => inv.id === id));
          }}
          onUpdateOperation={async (id, index, operation) => {
            await investmentsAPI.updateOperation(id, index, operation);
            await loadAllData();
            const updated = await investmentsAPI.getAll();
            setSelectedInvestment(updated.data.find(inv => inv.id === id));
          }}
          onDeleteOperation={async (id, index) => {
            await investmentsAPI.deleteOperation(id, index);
            await loadAllData();
            const updated = await investmentsAPI.getAll();
            setSelectedInvestment(updated.data.find(inv => inv.id === id));
          }}
        />
      )}
      
      {showGlobalSearch && (
        <GlobalSearch
          onClose={() => setShowGlobalSearch(false)}
          onResultClick={(type, item) => {
            // Handle navigation to the result
            console.log('Result clicked:', type, item);
          }}
        />
      )}
      
      {showCategoryManager && (
        <CategoryManager
          onClose={() => {
            setShowCategoryManager(false);
            loadAllData();
          }}
          onCategorySelect={(category) => {
            console.log('Category selected:', category);
          }}
        />
      )}
      
      {showTransferModal && (
        <TransferModal
          accounts={accounts}
          onClose={() => setShowTransferModal(false)}
          onSuccess={() => {
            loadAllData();
            setShowTransferModal(false);
          }}
        />
      )}
    </div>
    </LoginRequired>
  );
}

// Dashboard View Component
const DashboardView = ({ data, accounts, transactions }) => {
  if (!data) return <div>Chargement des données...</div>;

  const pieData = {
    labels: accounts.map(acc => acc.name),
    datasets: [{
      data: accounts.map(acc => acc.current_balance),
      backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    }],
  };

  const barData = {
    labels: ['Revenus', 'Dépenses'],
    datasets: [{
      label: 'Montant (€)',
      data: [data.monthly_income, data.monthly_expenses],
      backgroundColor: ['#10b981', '#ef4444'],
    }],
  };

  // Trends data
  const trendsData = data.trends ? {
    labels: data.trends.map(t => t.month),
    datasets: [
      {
        label: 'Revenus',
        data: data.trends.map(t => t.income),
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4
      },
      {
        label: 'Dépenses',
        data: data.trends.map(t => t.expenses),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      },
      {
        label: 'Épargne',
        data: data.trends.map(t => t.savings),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4
      }
    ]
  } : null;

  // Top categories
  const categoriesData = data.top_categories && data.top_categories.length > 0 ? {
    labels: data.top_categories.map(c => c.name),
    datasets: [{
      data: data.top_categories.map(c => c.amount),
      backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1'],
    }],
  } : null;

  return (
    <div className="space-y-6" data-testid="dashboard-view">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Valeur Nette" value={`${data.net_worth.toFixed(2)} €`} color="indigo" />
        <StatCard title="Solde Total" value={`${data.total_balance.toFixed(2)} €`} color="green" />
        <StatCard title="Investissements" value={`${data.total_investments.toFixed(2)} €`} color="blue" />
        <StatCard title="Dettes" value={`${data.total_debts.toFixed(2)} €`} color="red" />
      </div>

      {/* Investment Performance */}
      {data.total_invested > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Capital Investi</div>
            <div className="text-2xl font-bold mt-1">{data.total_invested.toFixed(2)} €</div>
          </div>
          <div className={`bg-gradient-to-r ${data.investment_gains >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'} text-white p-6 rounded-lg shadow-lg`}>
            <div className="text-sm opacity-90">Plus/Moins-Value</div>
            <div className="text-2xl font-bold mt-1">{data.investment_gains.toFixed(2)} €</div>
          </div>
          <div className={`bg-gradient-to-r ${data.investment_gains_percent >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'} text-white p-6 rounded-lg shadow-lg`}>
            <div className="text-sm opacity-90">Rendement</div>
            <div className="text-2xl font-bold mt-1">{data.investment_gains_percent.toFixed(2)} %</div>
          </div>
        </div>
      )}

      {/* Trends Line Chart */}
      {trendsData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Tendances sur 6 Mois</h3>
          <Line data={trendsData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Répartition des Comptes</h3>
          {accounts.length > 0 ? <Pie data={pieData} /> : <p className="text-gray-500">Aucune donnée</p>}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Catégories de Dépenses</h3>
          {categoriesData ? <Pie data={categoriesData} /> : <p className="text-gray-500">Aucune donnée</p>}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Transactions Récentes</h3>
        <div className="space-y-2">
          {transactions.slice(0, 5).map((txn, idx) => (
            <div key={idx} className="flex justify-between items-center py-2 border-b">
              <div>
                <span className="font-medium">{txn.description}</span>
                <span className="text-sm text-gray-500 ml-2">{txn.category}</span>
              </div>
              <span className={`font-semibold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {txn.type === 'income' ? '+' : '-'}{txn.amount.toFixed(2)} €
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, color }) => {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="text-sm font-medium text-gray-500 mb-1">{title}</div>
      <div className={`text-2xl font-bold ${colors[color]}`}>{value}</div>
    </div>
  );
};

// Accounts View Component
const AccountsView = ({ accounts, openModal, setAccounts, onTransferClick }) => {
  const handleDelete = async (id) => {
    if (window.confirm('Supprimer ce compte ?')) {
      try {
        await accountsAPI.delete(id);
        setAccounts(accounts.filter(acc => acc.id !== id));
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  return (
    <div data-testid="accounts-view">
      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => openModal('account')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          data-testid="add-account-button"
        >
          <Plus size={18} />
          <span>Nouveau Compte</span>
        </button>
        <button
          onClick={onTransferClick}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <ArrowRightLeft size={18} />
          <span>Transfert Interne</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div key={account.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{account.name}</h3>
                <p className="text-sm text-gray-500">{account.type}</p>
              </div>
              <div className="flex space-x-2">
                <button onClick={() => openModal('account', account)} className="text-gray-400 hover:text-gray-600">
                  <Edit size={18} />
                </button>
                <button onClick={() => handleDelete(account.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <div className="text-2xl font-bold text-indigo-600">
              {account.current_balance.toFixed(2)} {account.currency}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Transactions View Component
const TransactionsView = ({ transactions, accounts, openModal, setTransactions }) => {
  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette transaction ?')) {
      try {
        await transactionsAPI.delete(id);
        setTransactions(transactions.filter(txn => txn.id !== id));
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  return (
    <div data-testid="transactions-view">
      <div className="mb-4">
        <button
          onClick={() => openModal('transaction')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          data-testid="add-transaction-button"
        >
          <Plus size={18} />
          <span>Nouvelle Transaction</span>
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Montant</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((txn) => (
              <tr key={txn.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(txn.date).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{txn.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{txn.category}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${txn.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {txn.type === 'income' ? '+' : '-'}{txn.amount.toFixed(2)} €
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <button onClick={() => openModal('transaction', txn)} className="text-indigo-600 hover:text-indigo-900 mr-2">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(txn.id)} className="text-red-600 hover:text-red-900">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Investments, Goals, Debts, Receivables Views (Similar structure)
const InvestmentsView = ({ investments, openModal, setInvestments, onViewDetail }) => (
  <div data-testid="investments-view">
    <div className="mb-4">
      <button
        onClick={() => openModal('investment')}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        data-testid="add-investment-button"
      >
        <Plus size={18} />
        <span>Nouvel Investissement</span>
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {investments.map((inv) => {
        // Calculate simple metrics
        const totalValue = inv.quantity * inv.current_price;
        const operationsCount = inv.operations?.length || 0;
        
        return (
          <div 
            key={inv.id} 
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onViewDetail(inv)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="font-semibold text-lg">{inv.name}</div>
                <div className="text-sm text-gray-500">{inv.symbol} • {inv.type}</div>
                <div className="text-sm text-gray-600 mt-2">
                  Quantité: {inv.quantity} @ {inv.current_price.toFixed(2)} €
                </div>
                <div className="text-lg font-bold text-indigo-600 mt-2">
                  Valeur: {totalValue.toFixed(2)} €
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {operationsCount} opération(s)
                </div>
              </div>
              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => openModal('investment', inv)} 
                  className="text-gray-400 hover:text-indigo-600"
                  title="Modifier"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm('Supprimer cet investissement ?')) {
                      await investmentsAPI.delete(inv.id);
                      setInvestments(investments.filter(i => i.id !== inv.id));
                    }
                  }} 
                  className="text-gray-400 hover:text-red-600"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
      {investments.length === 0 && (
        <div className="col-span-full text-center py-12 text-gray-500">
          Aucun investissement. Cliquez sur "Nouvel Investissement" pour commencer.
        </div>
      )}
    </div>
  </div>
);

const GoalsView = ({ goals, openModal, setGoals }) => (
  <div data-testid="goals-view">
    <div className="mb-4">
      <button
        onClick={() => openModal('goal')}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
      >
        <Plus size={18} />
        <span>Nouvel Objectif</span>
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {goals.map((goal) => (
        <div key={goal.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="font-semibold text-lg">{goal.name}</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3 mb-2">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all" 
                  style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                {goal.current_amount.toFixed(2)} € / {goal.target_amount.toFixed(2)} €
              </div>
              <div className="text-sm font-semibold text-green-600 mt-1">
                {((goal.current_amount / goal.target_amount) * 100).toFixed(1)}% atteint
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => openModal('goal', goal)} 
                className="text-gray-400 hover:text-indigo-600"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={async () => {
                  if (window.confirm('Supprimer cet objectif ?')) {
                    await goalsAPI.delete(goal.id);
                    setGoals(goals.filter(g => g.id !== goal.id));
                  }
                }} 
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DebtsView = ({ debts, openModal, setDebts }) => (
  <div data-testid="debts-view">
    <div className="mb-4">
      <button
        onClick={() => openModal('debt')}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
      >
        <Plus size={18} />
        <span>Nouvelle Dette</span>
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {debts.map((debt) => (
        <div key={debt.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="font-semibold text-lg">{debt.name}</div>
              <div className="text-sm text-gray-500">Créancier: {debt.creditor}</div>
              <div className="text-sm text-gray-600 mt-2">
                Restant: <span className="font-bold text-red-600">{debt.remaining_amount.toFixed(2)} €</span>
              </div>
              <div className="text-sm text-gray-500">
                Total: {debt.total_amount.toFixed(2)} € | Taux: {debt.interest_rate}%
              </div>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => openModal('debt', debt)} 
                className="text-gray-400 hover:text-indigo-600"
              >
                <Edit size={18} />
              </button>
              <button 
                onClick={async () => {
                  if (window.confirm('Supprimer cette dette ?')) {
                    await debtsAPI.delete(debt.id);
                    setDebts(debts.filter(d => d.id !== debt.id));
                  }
                }} 
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ReceivablesView = ({ receivables, openModal, setReceivables }) => (
  <SimpleListView 
    items={receivables}
    title="Créances"
    onAdd={() => openModal('receivable')}
    onDelete={async (id) => {
      await receivablesAPI.delete(id);
      setReceivables(receivables.filter(r => r.id !== id));
    }}
    renderItem={(rec) => (
      <>
        <div className="font-semibold">{rec.name}</div>
        <div className="text-sm text-gray-500">Débiteur: {rec.debtor}</div>
        <div className="text-lg font-bold text-green-600">{rec.amount.toFixed(2)} €</div>
        {rec.is_paid && <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Payé</span>}
      </>
    )}
  />
);

// Shopping View Component
const ShoppingView = ({ products, shoppingLists, openModal, setProducts, setShoppingLists }) => {
  return (
    <div className="space-y-6" data-testid="shopping-view">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Produits</h3>
          <button
            onClick={() => openModal('product')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Nouveau Produit</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold">{product.name}</h4>
                  <p className="text-sm text-gray-500">{product.category}</p>
                  <p className="text-lg font-bold text-indigo-600 mt-2">
                    {product.current_price?.toFixed(2) || product.usual_price.toFixed(2)} €
                  </p>
                  {product.is_on_sale && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">PROMO</span>
                  )}
                </div>
                <button
                  onClick={async () => {
                    await productsAPI.delete(product.id);
                    setProducts(products.filter(p => p.id !== product.id));
                  }}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Listes d'Achats</h3>
          <button
            onClick={() => openModal('shoppingList')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <Plus size={18} />
            <span>Nouvelle Liste</span>
          </button>
        </div>
        <div className="space-y-4">
          {shoppingLists.map((list) => (
            <div key={list.id} className="bg-white p-4 rounded-lg shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold">{list.name}</h4>
                  <p className="text-sm text-gray-500">{list.items.length} produits</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={async () => {
                      const response = await shoppingListsAPI.download(list.id);
                      const blob = new Blob([response.data], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `liste-courses-${list.id}.txt`;
                      a.click();
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Download size={18} />
                  </button>
                  <button
                    onClick={async () => {
                      await shoppingListsAPI.delete(list.id);
                      setShoppingLists(shoppingLists.filter(l => l.id !== list.id));
                    }}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Banks View Component
const BanksView = ({ bankConnections, accounts, openModal, setBankConnections }) => {
  return (
    <div data-testid="banks-view">
      <div className="mb-4">
        <button
          onClick={() => openModal('bankConnection')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
        >
          <Plus size={18} />
          <span>Nouvelle Connexion</span>
        </button>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Connexions Bancaires</h3>
        <div className="space-y-4">
          {bankConnections.map((conn) => (
            <div key={conn.id} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <div className="font-semibold">{conn.bank_name}</div>
                <div className="text-sm text-gray-500">
                  Compte: {accounts.find(a => a.id === conn.account_id)?.name || 'N/A'}
                </div>
                <div className="text-xs text-gray-400">
                  Dernière sync: {conn.last_sync ? new Date(conn.last_sync).toLocaleString('fr-FR') : 'Jamais'}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={async () => {
                    await bankConnectionsAPI.sync(conn.id);
                    alert('Synchronisation lancée !');
                  }}
                  className="bg-blue-100 text-blue-600 px-3 py-1 rounded hover:bg-blue-200"
                >
                  Sync
                </button>
                <button
                  onClick={async () => {
                    await bankConnectionsAPI.delete(conn.id);
                    setBankConnections(bankConnections.filter(c => c.id !== conn.id));
                  }}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
          {bankConnections.length === 0 && (
            <p className="text-center text-gray-500 py-8">Aucune connexion bancaire configurée</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Simple List View Component (Reusable)
const SimpleListView = ({ items, title, onAdd, onDelete, renderItem }) => (
  <div>
    <div className="mb-4">
      <button
        onClick={onAdd}
        className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
      >
        <Plus size={18} />
        <span>Ajouter {title}</span>
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">{renderItem(item)}</div>
            <button onClick={() => onDelete(item.id)} className="text-red-600 hover:text-red-900">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Modal Component (Simplified - you'll need to expand this)
const Modal = ({ type, data, onClose, onSave, accounts }) => {
  const [formData, setFormData] = useState(data || {});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      switch (type) {
        case 'account':
          if (data.id) {
            await accountsAPI.update(data.id, formData);
          } else {
            await accountsAPI.create(formData);
          }
          break;
        case 'transaction':
          const transactionData = {
            ...formData,
            date: formData.date || new Date().toISOString()
          };
          if (data.id) {
            await transactionsAPI.update(data.id, transactionData);
          } else {
            await transactionsAPI.create(transactionData);
          }
          break;
        case 'investment':
          if (data.id) {
            await investmentsAPI.update(data.id, formData);
          } else {
            await investmentsAPI.create(formData);
          }
          break;
        case 'goal':
          if (data.id) {
            await goalsAPI.update(data.id, formData);
          } else {
            await goalsAPI.create(formData);
          }
          break;
        case 'debt':
          if (data.id) {
            await debtsAPI.update(data.id, formData);
          } else {
            await debtsAPI.create(formData);
          }
          break;
        case 'receivable':
          if (data.id) {
            await receivablesAPI.update(data.id, formData);
          } else {
            await receivablesAPI.create(formData);
          }
          break;
        case 'product':
          await productsAPI.create(formData);
          break;
        case 'shoppingList':
          await shoppingListsAPI.create(formData);
          break;
        case 'bankConnection':
          await bankConnectionsAPI.create(formData);
          break;
        default:
          break;
      }
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {data.id ? 'Modifier' : 'Ajouter'} {type}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {type === 'account' && (
            <>
              <input
                type="text"
                placeholder="Nom du compte"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                placeholder="Solde initial"
                value={formData.initial_balance || 0}
                onChange={(e) => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <select
                value={formData.currency || 'EUR'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </>
          )}
          {type === 'transaction' && (
            <>
              <select
                value={formData.account_id || ''}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Sélectionner un compte</option>
                {accounts && accounts.length > 0 ? (
                  accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency})</option>
                  ))
                ) : (
                  <option disabled>Aucun compte disponible</option>
                )}
              </select>
              {accounts && accounts.length === 0 && (
                <p className="text-sm text-red-600">⚠️ Créez d'abord un compte dans la section Comptes</p>
              )}
              <input
                type="date"
                placeholder="Date"
                value={formData.date ? new Date(formData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value).toISOString() })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                placeholder="Montant"
                value={formData.amount || 0}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <select
                value={formData.type || 'expense'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="expense">Dépense</option>
                <option value="income">Revenu</option>
              </select>
              <input
                type="text"
                placeholder="Catégorie"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </>
          )}
          {type === 'product' && (
            <>
              <input
                type="text"
                placeholder="Nom du produit"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Catégorie"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Prix habituel"
                value={formData.usual_price || 0}
                onChange={(e) => setFormData({ ...formData, usual_price: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_on_sale || false}
                  onChange={(e) => setFormData({ ...formData, is_on_sale: e.target.checked })}
                />
                <span>En promotion</span>
              </label>
            </>
          )}
          {type === 'shoppingList' && (
            <>
              <input
                type="text"
                placeholder="Nom de la liste"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </>
          )}
          {type === 'investment' && (
            <>
              <input
                type="text"
                placeholder="Nom de l'investissement"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Symbol (ex: BTC, AAPL)"
                value={formData.symbol || ''}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <select
                value={formData.type || 'stock'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="stock">Action</option>
                <option value="crypto">Crypto</option>
                <option value="etf">ETF</option>
                <option value="bond">Obligation</option>
              </select>
              <select
                value={formData.currency || 'EUR'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </select>
            </>
          )}
          {type === 'goal' && (
            <>
              <input
                type="text"
                placeholder="Nom de l'objectif"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Montant cible"
                value={formData.target_amount || 0}
                onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Montant actuel"
                value={formData.current_amount || 0}
                onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                placeholder="Date limite"
                value={formData.deadline ? formData.deadline.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                placeholder="Catégorie"
                value={formData.category || 'savings'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </>
          )}
          {type === 'debt' && (
            <>
              <input
                type="text"
                placeholder="Nom de la dette"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Créancier"
                value={formData.creditor || ''}
                onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Montant total"
                value={formData.total_amount || 0}
                onChange={(e) => setFormData({ ...formData, total_amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Montant restant"
                value={formData.remaining_amount || 0}
                onChange={(e) => setFormData({ ...formData, remaining_amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Taux d'intérêt (%)"
                value={formData.interest_rate || 0}
                onChange={(e) => setFormData({ ...formData, interest_rate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                placeholder="Date d'échéance"
                value={formData.due_date ? formData.due_date.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </>
          )}
          {type === 'receivable' && (
            <>
              <input
                type="text"
                placeholder="Nom de la créance"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="text"
                placeholder="Débiteur"
                value={formData.debtor || ''}
                onChange={(e) => setFormData({ ...formData, debtor: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Montant"
                value={formData.amount || 0}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="date"
                placeholder="Date d'échéance"
                value={formData.due_date ? formData.due_date.split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
                className="w-full px-3 py-2 border rounded-lg"
              />
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_paid || false}
                  onChange={(e) => setFormData({ ...formData, is_paid: e.target.checked })}
                />
                <span>Payé</span>
              </label>
            </>
          )}
          {type === 'bankConnection' && (
            <>
              <input
                type="text"
                placeholder="Nom de la banque"
                value={formData.bank_name || ''}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
              <select
                value={formData.account_id || ''}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Sélectionner un compte</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                ))}
              </select>
            </>
          )}
          <div className="flex space-x-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Save size={18} />
              <span>{loading ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
