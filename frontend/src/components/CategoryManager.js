import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, Save, X } from 'lucide-react';
import { categoriesAPI } from '../services/api';

const ICON_OPTIONS = ['tag', 'home', 'car', 'shopping-cart', 'coffee', 'utensils', 'plane', 'heart', 'gift', 'briefcase'];
const COLOR_OPTIONS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#64748b'];

const CategoryManager = ({ onClose, onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    icon: 'tag',
    color: '#6366f1',
    budget: '',
    subcategories: []
  });
  const [activeType, setActiveType] = useState('expense');
  const [newSubcategory, setNewSubcategory] = useState('');

  useEffect(() => {
    loadCategories();
  }, [activeType]);

  const loadCategories = async () => {
    try {
      const response = await categoriesAPI.getAll(activeType);
      setCategories(response.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        subcategories: formData.subcategories || []
      };

      if (editingCategory) {
        await categoriesAPI.update(editingCategory.id, data);
      } else {
        await categoriesAPI.create(data);
      }

      setFormData({
        name: '',
        type: 'expense',
        icon: 'tag',
        color: '#6366f1',
        budget: '',
        subcategories: []
      });
      setShowForm(false);
      setEditingCategory(null);
      setNewSubcategory('');
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleAddSubcategory = () => {
    if (newSubcategory.trim()) {
      setFormData({
        ...formData,
        subcategories: [...(formData.subcategories || []), newSubcategory.trim()]
      });
      setNewSubcategory('');
    }
  };

  const handleRemoveSubcategory = (index) => {
    setFormData({
      ...formData,
      subcategories: formData.subcategories.filter((_, i) => i !== index)
    });
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon || 'tag',
      color: category.color || '#6366f1',
      budget: category.budget || '',
      subcategories: category.subcategories || []
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Supprimer cette catégorie ?')) {
      try {
        await categoriesAPI.delete(id);
        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Erreur lors de la suppression');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Gestion des Catégories</h2>
              <p className="text-indigo-100 mt-1">Personnalisez vos catégories de transactions</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Type Tabs */}
        <div className="border-b bg-gray-50">
          <div className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveType('expense')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeType === 'expense'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Dépenses
            </button>
            <button
              onClick={() => setActiveType('income')}
              className={`py-3 px-4 font-medium border-b-2 transition-colors ${
                activeType === 'income'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Revenus
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="mb-4">
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingCategory(null);
                setFormData({
                  name: '',
                  type: activeType,
                  icon: 'tag',
                  color: '#6366f1',
                  budget: ''
                });
              }}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
            >
              <Plus size={18} />
              <span>Nouvelle Catégorie</span>
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg mb-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icône</label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {ICON_OPTIONS.map(icon => (
                      <option key={icon} value={icon}>{icon}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Couleur</label>
                  <div className="flex space-x-2">
                    {COLOR_OPTIONS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Mensuel (optionnel)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="100.00"
                />
              </div>

              <div className="flex space-x-2">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2">
                  <Save size={18} />
                  <span>{editingCategory ? 'Modifier' : 'Créer'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingCategory(null);
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {categories.map(category => (
              <div
                key={category.id}
                className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onCategorySelect && onCategorySelect(category)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3 flex-1">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color + '20' }}
                    >
                      <Tag size={20} style={{ color: category.color }} />
                    </div>
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.budget && (
                        <div className="text-sm text-gray-500">
                          Budget: {category.budget.toFixed(2)} €/mois
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-gray-400 hover:text-indigo-600"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="text-gray-400 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                Aucune catégorie. Cliquez sur "Nouvelle Catégorie" pour commencer.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
