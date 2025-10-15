import React, { useState, useEffect } from 'react';
import { Plus, X, Edit, Trash2, CheckCircle, Circle, Calendar, DollarSign } from 'lucide-react';
import { tasksAPI } from '../services/api';

const EisenhowerMatrix = () => {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedQuadrant, setSelectedQuadrant] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    estimated_cost: '',
    priority: 3,
    due_date: '',
    tags: []
  });

  const quadrants = [
    { id: null, name: 'À CLASSER', color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700', special: true },
    { id: 'urgent_important', name: 'FAIRE (Urgent & Important)', color: 'bg-red-50 border-red-200', textColor: 'text-red-700' },
    { id: 'not_urgent_important', name: 'PLANIFIER (Important)', color: 'bg-blue-50 border-blue-200', textColor: 'text-blue-700' },
    { id: 'urgent_not_important', name: 'DÉLÉGUER (Urgent)', color: 'bg-yellow-50 border-yellow-200', textColor: 'text-yellow-700' },
    { id: 'not_urgent_not_important', name: 'ÉLIMINER', color: 'bg-gray-50 border-gray-200', textColor: 'text-gray-700' }
  ];

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getAll();
      setTasks(response.data);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        quadrant: selectedQuadrant,
        estimated_cost: formData.estimated_cost ? parseFloat(formData.estimated_cost) : null,
        due_date: formData.due_date ? new Date(formData.due_date).toISOString() : null
      };

      if (editingTask) {
        await tasksAPI.update(editingTask.id, data);
      } else {
        await tasksAPI.create(data);
      }

      setFormData({ title: '', description: '', estimated_cost: '', priority: 3, due_date: '', tags: [] });
      setShowForm(false);
      setEditingTask(null);
      setSelectedQuadrant(null);
      loadTasks();
    } catch (error) {
      console.error('Error saving task:', error);
      alert('Erreur lors de la sauvegarde');
    }
  };

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, quadrant) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    try {
      await tasksAPI.moveQuadrant(taskId, quadrant);
      loadTasks();
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };

  const toggleComplete = async (taskId) => {
    try {
      await tasksAPI.toggleComplete(taskId);
      loadTasks();
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    if (window.confirm('Supprimer cette tâche ?')) {
      try {
        await tasksAPI.delete(taskId);
        loadTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const getTasksByQuadrant = (quadrantId) => {
    if (quadrantId === null) {
      // "À classer" - tasks without quadrant
      return tasks.filter(t => !t.quadrant);
    }
    return tasks.filter(t => t.quadrant === quadrantId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Matrice d'Eisenhower</h2>
        <p className="text-gray-600">Priorisez vos tâches et dépenses</p>
      </div>

      <div className="grid grid-cols-3 gap-4 flex-1">
        {quadrants.map((quadrant) => {
          const quadrantTasks = getTasksByQuadrant(quadrant.id);
          
          return (
            <div
              key={quadrant.id}
              className={`${quadrant.color} border-2 rounded-xl p-4 flex flex-col`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, quadrant.id)}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-bold ${quadrant.textColor}`}>{quadrant.name}</h3>
                <button
                  onClick={() => {
                    setSelectedQuadrant(quadrant.id);
                    setShowForm(true);
                    setEditingTask(null);
                  }}
                  className={`p-2 hover:bg-white rounded-lg ${quadrant.textColor}`}
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="space-y-2 flex-1 overflow-y-auto">
                {quadrantTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={`bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move ${
                      task.completed ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 flex-1">
                        <button
                          onClick={() => toggleComplete(task.id)}
                          className="mt-1 flex-shrink-0"
                        >
                          {task.completed ? (
                            <CheckCircle size={18} className="text-green-600" />
                          ) : (
                            <Circle size={18} className="text-gray-400" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${task.completed ? 'line-through' : ''}`}>
                            {task.title}
                          </div>
                          {task.description && (
                            <div className="text-xs text-gray-500 mt-1">{task.description}</div>
                          )}
                          <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                            {task.estimated_cost && (
                              <div className="flex items-center space-x-1">
                                <DollarSign size={12} />
                                <span>{task.estimated_cost.toFixed(2)} €</span>
                              </div>
                            )}
                            {task.due_date && (
                              <div className="flex items-center space-x-1">
                                <Calendar size={12} />
                                <span>{new Date(task.due_date).toLocaleDateString('fr-FR')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1 ml-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTask(task);
                            setFormData({
                              title: task.title,
                              description: task.description || '',
                              estimated_cost: task.estimated_cost || '',
                              priority: task.priority,
                              due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '',
                              tags: task.tags || []
                            });
                            setSelectedQuadrant(task.quadrant);
                            setShowForm(true);
                          }}
                          className="text-gray-400 hover:text-indigo-600"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {quadrantTasks.length === 0 && (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    Glissez-déposez ou ajoutez des tâches ici
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editingTask ? 'Modifier la tâche' : 'Nouvelle tâche'}
              </h3>
              <button onClick={() => {
                setShowForm(false);
                setEditingTask(null);
              }}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Coût estimé (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.estimated_cost}
                    onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Date limite</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priorité (0-5)</label>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600">{formData.priority}</div>
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                >
                  {editingTask ? 'Modifier' : 'Créer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingTask(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EisenhowerMatrix;
