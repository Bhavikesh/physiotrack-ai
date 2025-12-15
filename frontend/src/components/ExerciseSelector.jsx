/**
 * ExerciseSelector Component
 * Displays available exercises with cards
 */

import { useState, useEffect } from 'react';
import { api } from '../utils/apiClient';
import { Play, ChevronRight, Activity, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ExerciseSelector({ patientId }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const response = await api. exercises.list();
      setExercises(response.data);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ... new Set(exercises.map(e => e.category).filter(Boolean))];

  const filteredExercises = selectedCategory === 'all' 
    ? exercises 
    : exercises.filter(e => e.category === selectedCategory);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner':  return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-primary-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category. charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Exercise Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map(exercise => (
          <div
            key={exercise.exercise_id}
            className="card hover:shadow-xl transition-shadow cursor-pointer group"
            onClick={() => navigate(`/exercise/${exercise.exercise_code}`)}
          >
            {/* Thumbnail */}
            <div className="w-full h-48 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
              {exercise.thumbnail_url ?  (
                <img 
                  src={exercise.thumbnail_url} 
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Activity className="w-16 h-16 text-white opacity-50" />
              )}
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                <div className="bg-white rounded-full p-4 opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all">
                  <Play className="w-8 h-8 text-primary-600" />
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {exercise.name}
                </h3>
                {exercise.difficulty && (
                  <span className={`badge ${getDifficultyColor(exercise.difficulty)}`}>
                    {exercise.difficulty}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {exercise.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>{exercise.target_rom}° ROM</span>
                </div>
                <div className="flex items-center gap-1">
                  <Activity className="w-4 h-4" />
                  <span>{exercise.category || 'General'}</span>
                </div>
              </div>

              {/* Action Button */}
              <button className="w-full btn-primary flex items-center justify-center gap-2">
                Start Exercise
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredExercises.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No exercises found in this category</p>
        </div>
      )}
    </div>
  );
}