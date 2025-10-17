import { useState, useEffect } from "react";
import "@/App.css";
import { 
  PiggyBank, LayoutDashboard, Wallet, ArrowRightLeft, TrendingUp, TrendingDown,
  Target, CreditCard, FileText, ShoppingCart, Building2, Download, 
  Upload, Plus, Search, Bell, X, Edit, Trash2, Save, Tag, Settings, CheckSquare,
  Camera, BarChart3, FileBarChart, Menu, Link as LinkIcon, DollarSign, Users, BarChart, Calendar
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { 
  accountsAPI, transactionsAPI, investmentsAPI, goalsAPI, debtsAPI, 
  receivablesAPI, productsAPI, shoppingListsAPI, bankConnectionsAPI, 
  dashboardAPI, dataAPI, categoriesAPI, searchAPI, preferencesAPI
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
import AdvancedOCRScanner from './components/AdvancedOCRScanner';
import GranularOCRScanner from './components/GranularOCRScanner';
import InvestmentProjection from './components/InvestmentProjectionSimple';
import DebtDetailModal from './components/DebtDetailModal';
import ReceivableDetailModal from './components/ReceivableDetailModal';
import ReportsView from './components/ReportsView';
import CSVImporter from './components/CSVImporter';
import LinkTransactionModal from './components/LinkTransactionModal';

// Register ChartJS components including Filler for fill option
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, Filler);

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
  const [preferredCurrency, setPreferredCurrency] = useState('EUR');
  
  // Helper to format amount with preferred currency
  const formatAmount = (amount) => {
    return `${(amount || 0).toFixed(2)} ${preferredCurrency}`;
  };
  const [loading, setLoading] = useState(false);
  const [showInvestmentDetail, setShowInvestmentDetail] = useState(false);
  const [selectedInvestment, setSelectedInvestment] = useState(null);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showDebtDetail, setShowDebtDetail] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [showReceivableDetail, setShowReceivableDetail] = useState(false);
  const [selectedReceivable, setSelectedReceivable] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCSVImporter, setShowCSVImporter] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [linkTransactionModal, setLinkTransactionModal] = useState({ show: false, transaction: null });

  // Load all data AFTER authentication is confirmed
  useEffect(() => {
    const handleAuthReady = (event) => {
      console.log('Auth ready event received:', event.detail);
      // Load data regardless of auth status
      // Backend will return appropriate data based on session
      loadAllData();
    };

    // Listen for auth-ready event from LoginRequired component
    window.addEventListener('auth-ready', handleAuthReady);

    return () => {
      window.removeEventListener('auth-ready', handleAuthReady);
    };
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Load user preferences first
      try {
        const prefsRes = await preferencesAPI.get();
        if (prefsRes.data && prefsRes.data.preferred_currency) {
          setPreferredCurrency(prefsRes.data.preferred_currency);
        }
      } catch (error) {
        console.log('Could not load preferences:', error);
      }
      
      const [
        accountsRes, transactionsRes, investmentsRes, goalsRes, debtsRes,
        receivablesRes, productsRes, shoppingListsRes, bankConnectionsRes, 
        dashboardRes, categoriesRes
      ] = await Promise.all([
        accountsAPI.getAll(),
        transactionsAPI.getAll({ limit: 10000 }),
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

  const handleLinkTransaction = async (transactionId, investmentId) => {
    try {
      // Find the transaction
      const transaction = transactions.find(t => t.id === transactionId);
      if (!transaction) return;

      // Find the investment
      const investment = investments.find(inv => inv.id === investmentId);
      if (!investment) return;

      // Create an operation for the investment based on the transaction
      const operation = {
        type: transaction.type === 'expense' ? 'buy' : 'sell',
        date: transaction.date,
        quantity: 1, // Default quantity, user can adjust later
        price: transaction.amount,
        total: transaction.amount,
        notes: `Lié à transaction: ${transaction.description}`
      };

      // Add operation to investment
      const updatedOperations = [...(investment.operations || []), operation];
      
      // Calculate new averages
      const buyOps = updatedOperations.filter(op => op.type === 'buy');
      const totalQuantity = buyOps.reduce((sum, op) => sum + op.quantity, 0);
      const totalCost = buyOps.reduce((sum, op) => sum + (op.total || op.quantity * op.price), 0);
      const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;

      // Update investment
      await investmentsAPI.update(investmentId, {
        ...investment,
        operations: updatedOperations,
        quantity: totalQuantity,
        average_price: averagePrice,
        current_price: averagePrice // Can be updated manually later
      });

      // Update transaction with link
      await transactionsAPI.update(transactionId, {
        ...transaction,
        linked_investment_id: investmentId
      });

      // Reload data
      await loadAllData();
      
      alert('Transaction liée avec succès!');
    } catch (error) {
      console.error('Error linking transaction:', error);
      alert('Erreur lors de la liaison');
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
    
    // Set default values for new transactions
    if (type === 'transaction' && !data.id) {
      setModalData({
        ...data,
        type: 'expense',
        tags: [],
        is_recurring: false,
        date: new Date().toISOString()
      });
    } else {
      setModalData(data);
    }
    
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
    { id: 'reports', label: 'Rapports', icon: FileBarChart },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <LoginRequired>
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 fixed lg:relative z-50 w-64 h-full bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out`}>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 flex items-center">
            <PiggyBank className="text-indigo-600 mr-2" size={24} />
            FinanceApp
          </h1>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
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
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-2xl font-bold text-gray-900 flex-shrink-0">
              {navItems.find(item => item.id === currentView)?.label || 'FinanceApp'}
            </h2>
          </div>
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
              onClick={() => setShowCSVImporter(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Importer CSV"
            >
              <Upload size={20} className="text-gray-600" />
            </button>
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
              {currentView === 'dashboard' && <DashboardView data={dashboardData} accounts={accounts} transactions={transactions} formatAmount={formatAmount} />}
              {currentView === 'accounts' && <AccountsView accounts={accounts} openModal={openModal} setAccounts={setAccounts} onTransferClick={() => setShowTransferModal(true)} />}
              {currentView === 'transactions' && <TransactionsView transactions={transactions} accounts={accounts} openModal={openModal} setTransactions={setTransactions} investments={investments} onLinkToInvestment={(txn) => setLinkTransactionModal({ show: true, transaction: txn })} formatAmount={formatAmount} />}
              {currentView === 'investments' && <InvestmentsView investments={investments} openModal={openModal} setInvestments={setInvestments} onViewDetail={(inv) => { setSelectedInvestment(inv); setShowInvestmentDetail(true); }} formatAmount={formatAmount} />}
              {currentView === 'goals' && <GoalsView goals={goals} openModal={openModal} setGoals={setGoals} />}
              {currentView === 'debts' && <DebtsView debts={debts} openModal={openModal} setDebts={setDebts} onViewDetail={(debt) => { setSelectedDebt(debt); setShowDebtDetail(true); }} />}
              {currentView === 'receivables' && <ReceivablesView receivables={receivables} openModal={openModal} setReceivables={setReceivables} onViewDetail={(rec) => { setSelectedReceivable(rec); setShowReceivableDetail(true); }} />}
              {currentView === 'shopping' && <ShoppingView products={products} shoppingLists={shoppingLists} openModal={openModal} setProducts={setProducts} setShoppingLists={setShoppingLists} />}
              {currentView === 'banks' && <BanksView bankConnections={bankConnections} accounts={accounts} openModal={openModal} setBankConnections={setBankConnections} />}
              {currentView === 'tasks' && <EisenhowerMatrix />}
              {currentView === 'ocr' && <GranularOCRScanner onTransactionsImported={async (txns) => {
                console.log('Importing transactions:', txns);
                // Importer toutes les transactions
                for (const txn of txns) {
                  try {
                    // Utiliser le premier compte disponible
                    const accountId = accounts.length > 0 ? accounts[0].id : null;
                    if (!accountId) {
                      alert('Veuillez créer un compte avant d\'importer des transactions');
                      break;
                    }
                    
                    await transactionsAPI.create({
                      ...txn,
                      account_id: accountId,
                      tags: txn.tags || [],
                      is_recurring: false
                    });
                  } catch (error) {
                    console.error('Erreur import transaction:', error);
                  }
                }
                alert(`${txns.length} transactions importées avec succès!`);
                loadAllData();
              }} />}
              {currentView === 'projection' && <InvestmentProjection />}
              {currentView === 'reports' && <ReportsView transactions={transactions} />}
              {currentView === 'settings' && <SettingsPanel onClose={() => setCurrentView('dashboard')} onSave={(prefs) => {
                console.log('Preferences saved:', prefs);
                if (prefs.preferred_currency) {
                  setPreferredCurrency(prefs.preferred_currency);
                }
                loadAllData();
                setCurrentView('dashboard');
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
          categories={categories}
          setCategories={setCategories}
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
      
      {showDebtDetail && selectedDebt && (
        <DebtDetailModal
          debt={selectedDebt}
          onClose={() => {
            setShowDebtDetail(false);
            setSelectedDebt(null);
          }}
          onUpdate={async (id, data) => {
            await debtsAPI.update(id, data);
            await loadAllData();
          }}
          onAddPayment={async (id, payment) => {
            await debtsAPI.addPayment(id, payment);
            await loadAllData();
            const updated = await debtsAPI.getAll();
            setSelectedDebt(updated.data.find(d => d.id === id));
          }}
          onUpdatePayment={async (id, index, payment) => {
            await debtsAPI.updatePayment(id, index, payment);
            await loadAllData();
            const updated = await debtsAPI.getAll();
            setSelectedDebt(updated.data.find(d => d.id === id));
          }}
          onDeletePayment={async (id, index) => {
            await debtsAPI.deletePayment(id, index);
            await loadAllData();
            const updated = await debtsAPI.getAll();
            setSelectedDebt(updated.data.find(d => d.id === id));
          }}
        />
      )}
      
      {showReceivableDetail && selectedReceivable && (
        <ReceivableDetailModal
          receivable={selectedReceivable}
          onClose={() => {
            setShowReceivableDetail(false);
            setSelectedReceivable(null);
          }}
          onUpdate={async (id, data) => {
            await receivablesAPI.update(id, data);
            await loadAllData();
          }}
          onAddPayment={async (id, payment) => {
            await receivablesAPI.addPayment(id, payment);
            await loadAllData();
            const updated = await receivablesAPI.getAll();
            setSelectedReceivable(updated.data.find(r => r.id === id));
          }}
          onUpdatePayment={async (id, index, payment) => {
            await receivablesAPI.updatePayment(id, index, payment);
            await loadAllData();
            const updated = await receivablesAPI.getAll();
            setSelectedReceivable(updated.data.find(r => r.id === id));
          }}
          onDeletePayment={async (id, index) => {
            await receivablesAPI.deletePayment(id, index);
            await loadAllData();
            const updated = await receivablesAPI.getAll();
            setSelectedReceivable(updated.data.find(r => r.id === id));
          }}
        />
      )}
      
      {/* CSV Importer Modal */}
      {showCSVImporter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setShowCSVImporter(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
            <div className="p-6">
              <CSVImporter
                onImportComplete={async (transactions) => {
                  // Import transactions to default account
                  const defaultAccount = accounts[0];
                  if (defaultAccount) {
                    for (const txn of transactions) {
                      await transactionsAPI.create({
                        account_id: defaultAccount.id,
                        type: txn.amount < 0 ? 'expense' : 'income',
                        amount: Math.abs(txn.amount),
                        category: txn.category,
                        description: txn.description,
                        date: new Date(txn.date).toISOString(),
                        tags: [],
                        is_recurring: false
                      });
                    }
                    await loadAllData();
                    setShowCSVImporter(false);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Link Transaction Modal */}
      {linkTransactionModal.show && (
        <LinkTransactionModal
          transaction={linkTransactionModal.transaction}
          investments={investments}
          onClose={() => setLinkTransactionModal({ show: false, transaction: null })}
          onLink={handleLinkTransaction}
        />
      )}
    </div>
    </LoginRequired>
  );
}

// Dashboard View Component
const DashboardView = ({ data, accounts, transactions, formatAmount }) => {
  if (!data) return <div>Chargement des données...</div>;

  const pieData = {
    labels: (accounts || []).map(acc => acc.name),
    datasets: [{
      data: (accounts || []).map(acc => acc.current_balance || 0),
      backgroundColor: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
    }],
  };

  const barData = {
    labels: ['Revenus', 'Dépenses'],
    datasets: [{
      label: 'Montant (€)',
      data: [(data.monthly_income || 0), (data.monthly_expenses || 0)],
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
        <StatCard title="Valeur Nette" value={formatAmount(data.net_worth)} color="indigo" />
        <StatCard title="Solde Total" value={formatAmount(data.total_balance)} color="green" />
        <StatCard title="Investissements" value={formatAmount(data.total_investments)} color="blue" />
        <StatCard title="Dettes" value={formatAmount(data.total_debts)} color="red" />
      </div>

      {/* Investment Performance */}
      {(data.total_invested || 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg shadow-lg">
            <div className="text-sm opacity-90">Capital Investi</div>
            <div className="text-2xl font-bold mt-1">{formatAmount(data.total_invested)}</div>
          </div>
          <div className={`bg-gradient-to-r ${(data.investment_gains || 0) >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'} text-white p-6 rounded-lg shadow-lg`}>
            <div className="text-sm opacity-90">Plus/Moins-Value</div>
            <div className="text-2xl font-bold mt-1">{formatAmount(data.investment_gains)}</div>
          </div>
          <div className={`bg-gradient-to-r ${(data.investment_gains_percent || 0) >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'} text-white p-6 rounded-lg shadow-lg`}>
            <div className="text-sm opacity-90">Rendement</div>
            <div className="text-2xl font-bold mt-1">{(data.investment_gains_percent || 0).toFixed(2)} %</div>
          </div>
        </div>
      )}

      {/* Trends Table (Simple) */}
      {data.trends && data.trends.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Tendances sur 6 Mois</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">Mois</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-green-600">Revenus</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-red-600">Dépenses</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-indigo-600">Économies</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.trends.map((trend, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 text-sm text-gray-900">{trend.month}</td>
                    <td className="px-4 py-2 text-sm text-right text-green-600 font-semibold">
                      +{formatAmount(trend.income)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-red-600 font-semibold">
                      -{formatAmount(trend.expenses)}
                    </td>
                    <td className="px-4 py-2 text-sm text-right text-indigo-600 font-semibold">
                      {formatAmount(trend.savings)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Répartition des Comptes</h3>
          {accounts.length > 0 ? (
            <div className="space-y-3">
              {accounts.map((account, idx) => {
                const total = accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
                const percentage = total > 0 ? ((account.current_balance || 0) / total * 100) : 0;
                const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                
                return (
                  <div key={account.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: colors[idx % colors.length] }}
                        ></div>
                        <span className="font-medium text-gray-900">{account.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-gray-900">
                          {formatAmount(account.current_balance)}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          backgroundColor: colors[idx % colors.length],
                          width: `${percentage}%`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 mt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total</span>
                  <span className="text-xl font-bold text-indigo-600">
                    {formatAmount(accounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0))}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucun compte créé</p>
          )}
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top Catégories de Dépenses</h3>
          {data.top_categories && data.top_categories.length > 0 ? (
            <div className="space-y-3">
              {data.top_categories.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ 
                        backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1'][idx % 5]
                      }}
                    ></div>
                    <span className="font-medium text-gray-900">{cat.name}</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    {formatAmount(cat.amount)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Aucune dépense enregistrée</p>
          )}
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
                {txn.type === 'income' ? '+' : '-'}{formatAmount(txn.amount)}
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
              {(account.current_balance || 0).toFixed(2)} {account.currency || 'EUR'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Transactions View Component
const TransactionsView = ({ transactions, accounts, openModal, setTransactions, investments, onLinkToInvestment, formatAmount }) => {
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
  
  // Calculate mini-dashboard stats
  const thisMonth = transactions.filter(t => {
    const txnDate = new Date(t.date);
    const now = new Date();
    return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear();
  });
  
  const income = thisMonth.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = thisMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expenses;

  return (
    <div data-testid="transactions-view">
      {/* Mini Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
          <div className="text-xs opacity-90">Total Transactions</div>
          <div className="text-2xl font-bold">{transactions.length}</div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg shadow">
          <div className="text-xs opacity-90">Revenus (ce mois)</div>
          <div className="text-2xl font-bold">+{formatAmount(income)}</div>
        </div>
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg shadow">
          <div className="text-xs opacity-90">Dépenses (ce mois)</div>
          <div className="text-2xl font-bold">-{formatAmount(expenses)}</div>
        </div>
        <div className={`bg-gradient-to-r ${balance >= 0 ? 'from-indigo-500 to-indigo-600' : 'from-orange-500 to-orange-600'} text-white p-4 rounded-lg shadow`}>
          <div className="text-xs opacity-90">Solde (ce mois)</div>
          <div className="text-2xl font-bold">{formatAmount(balance)}</div>
        </div>
      </div>
      
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
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => openModal('transaction', txn)} 
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Modifier"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => onLinkToInvestment(txn)} 
                      className="text-blue-600 hover:text-blue-900"
                      title="Lier à un investissement"
                    >
                      <LinkIcon size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(txn.id)} 
                      className="text-red-600 hover:text-red-900"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
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
const InvestmentsView = ({ investments, openModal, setInvestments, onViewDetail, formatAmount }) => {
  // Calculate portfolio stats
  const totalValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.current_price), 0);
  const totalInvested = investments.reduce((sum, inv) => {
    const invested = inv.operations?.filter(op => op.type === 'buy').reduce((s, op) => s + (op.total || op.quantity * op.price), 0) || 0;
    return sum + invested;
  }, 0);
  const totalGains = totalValue - totalInvested;
  const gainsPercent = totalInvested > 0 ? (totalGains / totalInvested) * 100 : 0;
  
  return (
  <div data-testid="investments-view">
    {/* Mini Dashboard */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-4 rounded-lg shadow">
        <div className="text-xs opacity-90">Total Investissements</div>
        <div className="text-2xl font-bold">{investments.length}</div>
      </div>
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow">
        <div className="text-xs opacity-90">Valeur Portfolio</div>
        <div className="text-2xl font-bold">{formatAmount(totalValue)}</div>
      </div>
      <div className={`bg-gradient-to-r ${(totalGains || 0) >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} text-white p-4 rounded-lg shadow`}>
        <div className="text-xs opacity-90">Plus/Moins-Value</div>
        <div className="text-2xl font-bold">{(totalGains || 0) >= 0 ? '+' : ''}{formatAmount(totalGains)}</div>
      </div>
      <div className={`bg-gradient-to-r ${(gainsPercent || 0) >= 0 ? 'from-purple-500 to-purple-600' : 'from-orange-500 to-orange-600'} text-white p-4 rounded-lg shadow`}>
        <div className="text-xs opacity-90">Performance</div>
        <div className="text-2xl font-bold">{(gainsPercent || 0) >= 0 ? '+' : ''}{(gainsPercent || 0).toFixed(2)} %</div>
      </div>
    </div>
    
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
        const operationsCount = inv.operations?.length || 0;
        const invType = inv.type || 'stock';
        
        // Fonction pour obtenir l'icône selon le type
        const getTypeIcon = (type) => {
          switch(type) {
            case 'crypto': return '₿';
            case 'stock': return '📈';
            case 'etf': return '📊';
            case 'bond': return '📜';
            case 'trading_account': return '💼';
            case 'real_estate': return '🏠';
            case 'mining_rig': return '⛏️';
            case 'commodity': return '📦';
            default: return '💰';
          }
        };
        
        return (
          <div 
            key={inv.id} 
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer border-l-4"
            style={{ borderLeftColor: invType === 'crypto' ? '#f59e0b' : invType === 'real_estate' ? '#10b981' : '#6366f1' }}
            onClick={() => onViewDetail(inv)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{getTypeIcon(invType)}</span>
                  <div>
                    <div className="font-semibold text-lg">{inv.name}</div>
                    <div className="text-xs text-gray-400">{inv.symbol}</div>
                  </div>
                </div>
                
                {/* Affichage adapté selon le type */}
                
                {/* Actions, Crypto, ETF, Obligations */}
                {['stock', 'crypto', 'etf', 'bond'].includes(invType) && (
                  <>
                    <div className="text-sm text-gray-600 mt-3">
                      <div className="flex justify-between">
                        <span>Quantité:</span>
                        <span className="font-medium">{inv.quantity?.toFixed(4) || 0}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>PRU:</span>
                        <span className="font-medium">{inv.average_price?.toFixed(2) || 0} €</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Prix actuel:</span>
                        <span className="font-medium">{inv.current_price?.toFixed(2) || 0} €</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-indigo-600 mt-3">
                      Valeur: {((inv.quantity || 0) * (inv.current_price || 0)).toFixed(2)} €
                    </div>
                  </>
                )}
                
                {/* Compte Trading */}
                {invType === 'trading_account' && (
                  <>
                    <div className="text-sm text-gray-600 mt-3">
                      <div className="flex justify-between">
                        <span>Capital initial:</span>
                        <span className="font-medium">{inv.initial_value?.toFixed(2) || 0} €</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Solde actuel:</span>
                        <span className="font-medium">{inv.current_price?.toFixed(2) || 0} €</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Performance:</span>
                        <span className={`font-medium ${(inv.current_price - inv.initial_value) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {inv.initial_value > 0 ? (((inv.current_price - inv.initial_value) / inv.initial_value) * 100).toFixed(2) : 0}%
                        </span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-indigo-600 mt-3">
                      Solde: {inv.current_price?.toFixed(2) || 0} €
                    </div>
                  </>
                )}
                
                {/* Immobilier */}
                {invType === 'real_estate' && (
                  <>
                    <div className="text-sm text-gray-600 mt-3">
                      <div className="flex justify-between">
                        <span>Coût acquisition:</span>
                        <span className="font-medium">{inv.initial_value?.toFixed(2) || 0} €</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Valeur actuelle:</span>
                        <span className="font-medium">{inv.current_price?.toFixed(2) || 0} €</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Frais mensuels:</span>
                        <span className="font-medium text-red-600">{inv.monthly_costs?.toFixed(2) || 0} €/mois</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-green-600 mt-3">
                      Valeur: {inv.current_price?.toFixed(2) || 0} €
                    </div>
                  </>
                )}
                
                {/* Matériel Passif */}
                {invType === 'commodity' && (
                  <>
                    <div className="text-sm text-gray-600 mt-3">
                      <div className="flex justify-between">
                        <span>Coût d'achat:</span>
                        <span className="font-medium">{inv.initial_value?.toFixed(2) || 0} €</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Valeur actuelle:</span>
                        <span className="font-medium">{inv.current_price?.toFixed(2) || 0} €</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Dépréciation:</span>
                        <span className="font-medium text-orange-600">{inv.depreciation_rate || 0}% / an</span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-indigo-600 mt-3">
                      Valeur: {inv.current_price?.toFixed(2) || 0} €
                    </div>
                  </>
                )}
                
                {/* Matériel Actif (Mining) */}
                {invType === 'mining_rig' && (
                  <>
                    <div className="text-sm text-gray-600 mt-3">
                      <div className="flex justify-between">
                        <span>Coût total:</span>
                        <span className="font-medium">{inv.initial_value?.toFixed(2) || 0} €</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Frais mensuels:</span>
                        <span className="font-medium text-red-600">{inv.monthly_costs?.toFixed(2) || 0} €/mois</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span>Récompenses:</span>
                        <span className="font-medium text-green-600">
                          {inv.operations?.filter(op => op.type === 'dividend').reduce((sum, op) => sum + (op.total || 0), 0).toFixed(2) || 0} €
                        </span>
                      </div>
                    </div>
                    <div className="text-lg font-bold text-indigo-600 mt-3">
                      ROI en cours...
                    </div>
                  </>
                )}
                
                <div className="text-xs text-gray-400 mt-2 flex items-center justify-between">
                  <span>{operationsCount} opération(s)</span>
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs font-medium">
                    {invType.replace('_', ' ')}
                  </span>
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
};

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
      {goals.map((goal) => {
        const currentAmount = goal.current_amount || 0;
        const targetAmount = goal.target_amount || 1; // Avoid division by zero
        const percentage = Math.min((currentAmount / targetAmount) * 100, 100);
        
        return (
        <div key={goal.id} className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="font-semibold text-lg">{goal.name}</div>
              <div className="w-full bg-gray-200 rounded-full h-3 mt-3 mb-2">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all" 
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="text-sm text-gray-600">
                {currentAmount.toFixed(2)} € / {targetAmount.toFixed(2)} €
              </div>
              <div className="text-sm font-semibold text-green-600 mt-1">
                {percentage.toFixed(1)}% atteint
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
        );
      })}
    </div>
  </div>
);

const DebtsView = ({ debts, openModal, setDebts, onViewDetail }) => (
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
      {debts.map((debt) => {
        const totalAmount = debt.total_amount || 0;
        const remainingAmount = debt.remaining_amount || totalAmount;
        const interestRate = debt.interest_rate || 0;
        const progressPercent = totalAmount > 0 ? ((totalAmount - remainingAmount) / totalAmount * 100) : 0;
        
        return (
          <div 
            key={debt.id} 
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onViewDetail(debt)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="font-semibold text-lg">{debt.name}</div>
                <div className="text-sm text-gray-500">Créancier: {debt.creditor}</div>
                <div className="text-sm text-gray-600 mt-2">
                  Restant: <span className="font-bold text-red-600">{remainingAmount.toFixed(2)} €</span>
                </div>
                <div className="text-sm text-gray-500">
                  Total: {totalAmount.toFixed(2)} € | Taux: {interestRate}%
                </div>
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-red-600 rounded-full h-2" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{progressPercent.toFixed(1)}% payé</div>
                </div>
              </div>
              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
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
        );
      })}
    </div>
  </div>
);

const ReceivablesView = ({ receivables, openModal, setReceivables, onViewDetail }) => (
  <div data-testid="receivables-view">
    <div className="mb-4">
      <button
        onClick={() => openModal('receivable')}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
      >
        <Plus size={18} />
        <span>Nouvelle Créance</span>
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {receivables.map((rec) => {
        const totalAmount = rec.total_amount || rec.amount || 0;
        const remainingAmount = rec.remaining_amount || totalAmount;
        const progressPercent = (totalAmount - remainingAmount) / totalAmount * 100;
        return (
          <div 
            key={rec.id} 
            className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => onViewDetail(rec)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="font-semibold text-lg">{rec.name}</div>
                <div className="text-sm text-gray-500">Débiteur: {rec.debtor}</div>
                <div className="text-sm text-gray-600 mt-2">
                  Restant: <span className="font-bold text-green-600">{remainingAmount.toFixed(2)} €</span>
                </div>
                <div className="text-sm text-gray-500">
                  Total: {totalAmount.toFixed(2)} €
                </div>
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 rounded-full h-2" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{progressPercent.toFixed(1)}% reçu</div>
                </div>
              </div>
              <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={() => openModal('receivable', rec)} 
                  className="text-gray-400 hover:text-indigo-600"
                >
                  <Edit size={18} />
                </button>
                <button 
                  onClick={async () => {
                    if (window.confirm('Supprimer cette créance ?')) {
                      await receivablesAPI.delete(rec.id);
                      setReceivables(receivables.filter(r => r.id !== rec.id));
                    }
                  }} 
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </div>
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
              <div className="flex justify-between items-start mb-3">
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
              
              {/* Quick Add to List */}
              {shoppingLists.length > 0 && (
                <div className="flex items-center space-x-2 mt-2">
                  <select 
                    id={`list-select-${product.id}`}
                    className="flex-1 text-sm px-2 py-1 border rounded"
                    defaultValue=""
                  >
                    <option value="" disabled>Choisir liste...</option>
                    {shoppingLists.map(list => (
                      <option key={list.id} value={list.id}>{list.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      const listId = document.getElementById(`list-select-${product.id}`).value;
                      if (listId) {
                        await shoppingListsAPI.addProduct(listId, product.id);
                        // Refresh lists
                        const updatedLists = await shoppingListsAPI.getAll();
                        setShoppingLists(updatedLists.data);
                        alert('Produit ajouté à la liste!');
                      }
                    }}
                    className="bg-green-600 text-white p-2 rounded hover:bg-green-700"
                    title="Ajouter à la liste"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
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
const Modal = ({ type, data, onClose, onSave, accounts, categories, setCategories }) => {
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
            date: formData.date || new Date().toISOString(),
            tags: formData.tags || [],
            is_recurring: formData.is_recurring || false
          };
          if (data.id) {
            await transactionsAPI.update(data.id, transactionData);
          } else {
            await transactionsAPI.create(transactionData);
            
            // Auto-add new category if it doesn't exist
            if (transactionData.category) {
              const categoryExists = categories.some(cat => 
                cat.name.toLowerCase() === transactionData.category.toLowerCase()
              );
              
              if (!categoryExists) {
                try {
                  await categoriesAPI.create({
                    name: transactionData.category,
                    type: transactionData.type || 'expense',
                    subcategories: []
                  });
                  // Reload categories
                  const updatedCategories = await categoriesAPI.getAll();
                  setCategories(updatedCategories.data);
                } catch (error) {
                  console.log('Category already exists or error creating:', error);
                }
              }
            }
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
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.detail || 'Erreur lors de la sauvegarde';
      alert(`Erreur: ${JSON.stringify(errorMessage)}`);
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
              
              <select
                value={formData.type || 'stock'}
                onChange={(e) => {
                  // Reset fields when type changes
                  setFormData({ 
                    ...formData, 
                    type: e.target.value,
                    quantity: 0,
                    average_price: 0,
                    current_price: 0,
                    initial_value: 0,
                    monthly_costs: 0,
                    depreciation_rate: 0
                  });
                }}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="stock">Action</option>
                <option value="crypto">Crypto</option>
                <option value="etf">ETF</option>
                <option value="bond">Obligation</option>
                <option value="trading_account">Compte Trading</option>
                <option value="real_estate">Immobilier</option>
                <option value="mining_rig">Matériel Actif (Mining)</option>
                <option value="commodity">Matériel Passif</option>
              </select>
              
              {/* Champs dynamiques selon le type */}
              
              {/* Pour Actions, Crypto, ETF, Obligation */}
              {['stock', 'crypto', 'etf', 'bond'].includes(formData.type || 'stock') && (
                <>
                  <input
                    type="text"
                    placeholder="Symbol (ex: BTC, AAPL)"
                    value={formData.symbol || ''}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Quantité possédée"
                    value={formData.quantity || 0}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Prix d'achat moyen par unité"
                    value={formData.average_price || 0}
                    onChange={(e) => setFormData({ ...formData, average_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Prix actuel par unité"
                    value={formData.current_price || 0}
                    onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </>
              )}
              
              {/* Pour Compte Trading */}
              {formData.type === 'trading_account' && (
                <>
                  <input
                    type="text"
                    placeholder="Nom du broker/plateforme"
                    value={formData.symbol || ''}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Capital initial du compte"
                    value={formData.initial_value || 0}
                    onChange={(e) => setFormData({ ...formData, initial_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Solde actuel du compte"
                    value={formData.current_price || 0}
                    onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </>
              )}
              
              {/* Pour Immobilier */}
              {formData.type === 'real_estate' && (
                <>
                  <input
                    type="text"
                    placeholder="Adresse du bien"
                    value={formData.symbol || ''}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Coût total d'acquisition"
                    value={formData.initial_value || 0}
                    onChange={(e) => setFormData({ ...formData, initial_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valeur actuelle estimée"
                    value={formData.current_price || 0}
                    onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Frais mensuels (taxes, entretien...)"
                    value={formData.monthly_costs || 0}
                    onChange={(e) => setFormData({ ...formData, monthly_costs: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="date"
                    placeholder="Date d'achat"
                    value={formData.purchase_date ? new Date(formData.purchase_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </>
              )}
              
              {/* Pour Matériel Passif */}
              {formData.type === 'commodity' && (
                <>
                  <input
                    type="text"
                    placeholder="Description du matériel"
                    value={formData.symbol || ''}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Coût d'achat"
                    value={formData.initial_value || 0}
                    onChange={(e) => setFormData({ ...formData, initial_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Valeur actuelle estimée"
                    value={formData.current_price || 0}
                    onChange={(e) => setFormData({ ...formData, current_price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Taux de dépréciation annuel (%)"
                    value={formData.depreciation_rate || 0}
                    onChange={(e) => setFormData({ ...formData, depreciation_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Frais d'entretien mensuels"
                    value={formData.monthly_costs || 0}
                    onChange={(e) => setFormData({ ...formData, monthly_costs: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="date"
                    placeholder="Date d'achat"
                    value={formData.purchase_date ? new Date(formData.purchase_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </>
              )}
              
              {/* Pour Matériel Actif (Mining) */}
              {formData.type === 'mining_rig' && (
                <>
                  <input
                    type="text"
                    placeholder="Modèle du matériel"
                    value={formData.symbol || ''}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Coût d'achat total"
                    value={formData.initial_value || 0}
                    onChange={(e) => setFormData({ ...formData, initial_value: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Frais mensuels (électricité, maintenance...)"
                    value={formData.monthly_costs || 0}
                    onChange={(e) => setFormData({ ...formData, monthly_costs: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="date"
                    placeholder="Date d'achat"
                    value={formData.purchase_date ? new Date(formData.purchase_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </>
              )}
              
              <select
                value={formData.currency || 'EUR'}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
                <option value="CHF">CHF</option>
                <option value="BTC">BTC</option>
              </select>
            </>
          )}
          {type === 'goal' && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Nom de l'objectif *
                  <span className="text-xs text-gray-500 ml-2">(Ex: Vacances 2025, Nouvelle voiture)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Vacances en Grèce"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  💰 Montant à atteindre * 
                  <span className="text-xs text-gray-500 ml-2">(Combien voulez-vous économiser?)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 5000"
                  value={formData.target_amount || ''}
                  onChange={(e) => setFormData({ ...formData, target_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg text-lg font-semibold"
                  required
                />
                <p className="text-xs text-gray-500">💡 Astuce: C'est votre objectif final</p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  ✅ Montant déjà économisé
                  <span className="text-xs text-gray-500 ml-2">(Combien avez-vous déjà?)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 1200"
                  value={formData.current_amount || 0}
                  onChange={(e) => setFormData({ ...formData, current_amount: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
                {formData.target_amount > 0 && (
                  <div className="text-xs bg-blue-50 p-2 rounded">
                    📊 Progression: {((formData.current_amount || 0) / formData.target_amount * 100).toFixed(1)}%
                    <br />
                    💵 Reste à économiser: {(formData.target_amount - (formData.current_amount || 0)).toFixed(2)} €
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  📅 Date limite (optionnel)
                </label>
                <input
                  type="date"
                  value={formData.deadline ? formData.deadline.split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  🏷️ Catégorie
                </label>
                <select
                  value={formData.category || 'savings'}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="savings">💰 Épargne</option>
                  <option value="travel">✈️ Voyage</option>
                  <option value="purchase">🛒 Achat</option>
                  <option value="emergency">🚨 Urgence</option>
                  <option value="investment">📈 Investissement</option>
                  <option value="other">📦 Autre</option>
                </select>
              </div>
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
