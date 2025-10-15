import React, { useState, useEffect } from 'react';
import { Save, Globe, DollarSign, Calendar, Bell, Palette } from 'lucide-react';
import { preferencesAPI, categoriesAPI } from '../services/api';
import CategoryManager from './CategoryManager';

const SettingsPanel = ({ onClose, onSave }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await preferencesAPI.get();
      setPreferences(response.data);
    } catch (error) {
      console.error('Error loading preferences:', error);
      // Set defaults
      setPreferences({
        preferred_currency: 'EUR',
        date_format: 'DD/MM/YYYY',
        language: 'fr',
        dashboard_view: 'grid',
        enable_notifications: true,
        auto_categorize: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await preferencesAPI.update(preferences);
      alert('Paramètres enregistrés avec succès !');
      if (onSave) onSave(preferences);
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Chargement...</div>;
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-6">
        <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-gray-600">Personnalisez votre expérience FinanceApp</p>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="flex space-x-4 px-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Général
          </button>
          <button
            onClick={() => setActiveTab('display')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'display'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Affichage
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Catégories
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-4 font-medium border-b-2 transition-colors ${
              activeTab === 'notifications'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Notifications
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'general' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <DollarSign className="mr-2" size={20} />
                Devise Préférée
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Tous les montants du dashboard seront convertis dans cette devise
              </p>
              <select
                value={preferences.preferred_currency}
                onChange={(e) => setPreferences({ ...preferences, preferred_currency: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="CHF">CHF (Fr)</option>
                <option value="GBP">GBP (£)</option>
                <option value="BTC">BTC (₿)</option>
              </select>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="mr-2" size={20} />
                Format de Date
              </h3>
              <select
                value={preferences.date_format}
                onChange={(e) => setPreferences({ ...preferences, date_format: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="DD/MM/YYYY">JJ/MM/AAAA (15/10/2025)</option>
                <option value="MM/DD/YYYY">MM/JJ/AAAA (10/15/2025)</option>
                <option value="YYYY-MM-DD">AAAA-MM-JJ (2025-10-15)</option>
              </select>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Globe className="mr-2" size={20} />
                Langue
              </h3>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="de">Deutsch</option>
                <option value="es">Español</option>
              </select>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Catégorisation Automatique</h3>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={preferences.auto_categorize}
                  onChange={(e) => setPreferences({ ...preferences, auto_categorize: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <span className="text-gray-700">
                  Suggérer automatiquement des catégories pour les nouvelles transactions
                </span>
              </label>
            </div>
          </div>
        )}

        {activeTab === 'display' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Palette className="mr-2" size={20} />
                Vue du Dashboard
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPreferences({ ...preferences, dashboard_view: 'grid' })}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    preferences.dashboard_view === 'grid'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Grille</div>
                  <div className="text-sm text-gray-500">Vue en cartes</div>
                </button>
                <button
                  onClick={() => setPreferences({ ...preferences, dashboard_view: 'list' })}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    preferences.dashboard_view === 'list'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">Liste</div>
                  <div className="text-sm text-gray-500">Vue compacte</div>
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Thème</h3>
              <p className="text-gray-600 text-sm mb-4">Mode sombre à venir prochainement...</p>
              <div className="grid grid-cols-2 gap-4">
                <button className="p-4 border-2 border-indigo-600 bg-indigo-50 rounded-lg">
                  <div className="font-medium">Clair</div>
                  <div className="text-sm text-gray-500">Actuellement activé</div>
                </button>
                <button className="p-4 border-2 border-gray-200 rounded-lg opacity-50 cursor-not-allowed">
                  <div className="font-medium">Sombre</div>
                  <div className="text-sm text-gray-500">Bientôt disponible</div>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'categories' && (
          <div className="max-w-2xl">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Gestion des Catégories</h3>
              <p className="text-gray-600 mb-4">
                Créez et gérez vos catégories personnalisées pour organiser vos transactions
              </p>
              <button
                onClick={() => setShowCategoryManager(true)}
                className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700"
              >
                Ouvrir le gestionnaire de catégories
              </button>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="max-w-2xl space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Bell className="mr-2" size={20} />
                Notifications
              </h3>
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Activer les notifications</div>
                    <div className="text-sm text-gray-500">Recevoir des alertes importantes</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.enable_notifications}
                    onChange={(e) => setPreferences({ ...preferences, enable_notifications: e.target.checked })}
                    className="w-5 h-5 rounded"
                  />
                </label>

                {preferences.enable_notifications && (
                  <>
                    <div className="pl-4 space-y-3 border-l-2 border-gray-200">
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                        <span className="text-sm">Objectifs atteints</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                        <span className="text-sm">Budgets dépassés</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                        <span className="text-sm">Transactions inhabituelles</span>
                      </label>
                      <label className="flex items-center space-x-3">
                        <input type="checkbox" defaultChecked className="w-4 h-4 rounded" />
                        <span className="text-sm">Rappels de paiements</span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t p-6 flex justify-end space-x-4">
        <button
          onClick={onClose}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Fermer
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
        >
          <Save size={18} />
          <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
        </button>
      </div>

      {showCategoryManager && (
        <CategoryManager
          onClose={() => setShowCategoryManager(false)}
          onCategorySelect={() => {}}
        />
      )}
    </div>
  );
};

export default SettingsPanel;
