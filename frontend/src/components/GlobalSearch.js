import React, { useState, useEffect } from 'react';
import { Search, X, TrendingUp, Wallet, ArrowRightLeft, Target, ShoppingCart, Tag } from 'lucide-react';
import { searchAPI } from '../services/api';

const GlobalSearch = ({ onClose, onResultClick }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const response = await searchAPI.search(query);
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalResults = () => {
    if (!results) return 0;
    return Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'transactions': return <ArrowRightLeft size={16} className="text-blue-600" />;
      case 'investments': return <TrendingUp size={16} className="text-indigo-600" />;
      case 'accounts': return <Wallet size={16} className="text-green-600" />;
      case 'goals': return <Target size={16} className="text-purple-600" />;
      case 'products': return <ShoppingCart size={16} className="text-orange-600" />;
      case 'categories': return <Tag size={16} className="text-pink-600" />;
      default: return null;
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      transactions: 'Transactions',
      investments: 'Investissements',
      accounts: 'Comptes',
      goals: 'Objectifs',
      products: 'Produits',
      categories: 'Catégories'
    };
    return labels[type] || type;
  };

  const renderResult = (item, type) => {
    return (
      <div
        key={item.id}
        onClick={() => {
          onResultClick && onResultClick(type, item);
          onClose();
        }}
        className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
      >
        <div className="flex items-start space-x-3">
          <div className="mt-1">{getIcon(type)}</div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {item.name || item.description || item.symbol}
            </div>
            <div className="text-sm text-gray-500">
              {type === 'transactions' && (
                <span>{item.category} • {item.amount?.toFixed(2)} €</span>
              )}
              {type === 'investments' && (
                <span>{item.symbol} • {item.type}</span>
              )}
              {type === 'accounts' && (
                <span>{item.currency} • {item.current_balance?.toFixed(2)} €</span>
              )}
              {type === 'goals' && (
                <span>{item.current_amount?.toFixed(2)} / {item.target_amount?.toFixed(2)} €</span>
              )}
              {type === 'products' && (
                <span>{item.category} • {item.usual_price?.toFixed(2)} €</span>
              )}
              {type === 'categories' && (
                <span>{item.type}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 pt-20 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[70vh] overflow-hidden">
        {/* Search Input */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher dans toutes vos données..."
              className="w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          {query && (
            <div className="mt-2 text-sm text-gray-500">
              {loading ? 'Recherche...' : `${getTotalResults()} résultat(s)`}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 100px)' }}>
          {results && !loading && (
            <div>
              {Object.entries(results).map(([type, items]) => (
                items.length > 0 && (
                  <div key={type}>
                    <div className="bg-gray-50 px-4 py-2 font-medium text-sm text-gray-700 flex items-center space-x-2">
                      {getIcon(type)}
                      <span>{getTypeLabel(type)}</span>
                      <span className="text-gray-400">({items.length})</span>
                    </div>
                    <div>
                      {items.map(item => renderResult(item, type))}
                    </div>
                  </div>
                )
              ))}
              {getTotalResults() === 0 && (
                <div className="text-center py-12 text-gray-500">
                  Aucun résultat trouvé pour "{query}"
                </div>
              )}
            </div>
          )}
          {!results && !loading && query.length < 2 && (
            <div className="text-center py-12 text-gray-400">
              Tapez au moins 2 caractères pour rechercher...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
