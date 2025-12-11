import React, { useState, useEffect } from 'react';
import { getMeals, getDailyGoal, getTodaySummary, exportHistory, clearHistory } from '../services/storageService';
import { MealRecord } from '../types';

interface NutritionTrackerProps {
  isHighContrast: boolean;
  onClose: () => void;
}

const NutritionTracker: React.FC<NutritionTrackerProps> = ({ isHighContrast, onClose }) => {
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [goal, setGoal] = useState(2000);
  const [todaySummary, setTodaySummary] = useState({ calories: 0, macros: { carbs: 0, protein: 0, fat: 0 } });

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setMeals(getMeals().sort((a, b) => b.timestamp - a.timestamp));
    setGoal(getDailyGoal());
    setTodaySummary(getTodaySummary());
  };

  const handleDeleteHistory = () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
        clearHistory();
        refreshData();
    }
  }

  const progressPercent = Math.min(100, (todaySummary.calories / goal) * 100);
  const remaining = Math.max(0, goal - todaySummary.calories);
  
  const bgClass = isHighContrast ? 'bg-gray-900 border-2 border-yellow-400' : 'bg-white shadow-xl rounded-2xl border border-gray-100';
  const textClass = isHighContrast ? 'text-yellow-400' : 'text-gray-900';
  const textSec = isHighContrast ? 'text-gray-300' : 'text-gray-600';

  return (
    <div className={`${bgClass} p-6 md:p-8`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${textClass}`}>Daily Nutrition Tracker</h2>
        <button 
            onClick={onClose}
            className={`p-2 rounded-full ${isHighContrast ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {/* SUMMARY CARD */}
      <div className={`p-6 rounded-xl mb-8 ${isHighContrast ? 'bg-black border border-gray-600' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
         <div className="flex justify-between items-end mb-2">
            <div>
                <p className={`text-sm font-bold uppercase ${isHighContrast ? 'text-gray-400' : 'text-blue-600'}`}>Calories Today</p>
                <p className={`text-3xl font-bold ${textClass}`}>
                    {todaySummary.calories} <span className="text-lg font-normal opacity-70">/ {goal}</span>
                </p>
            </div>
            <div className="text-right">
                <p className={`text-sm ${textSec}`}>Remaining</p>
                <p className={`text-xl font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>{remaining} kcal</p>
            </div>
         </div>

         {/* Progress Bar */}
         <div className={`w-full h-4 rounded-full mb-4 ${isHighContrast ? 'bg-gray-800' : 'bg-white/60'}`}>
            <div 
                className={`h-4 rounded-full transition-all duration-1000 ${
                    progressPercent > 100 ? 'bg-red-500' : isHighContrast ? 'bg-yellow-400' : 'bg-blue-500'
                }`}
                style={{ width: `${progressPercent}%` }}
            ></div>
         </div>

         {/* Macro Summary */}
         <div className="grid grid-cols-3 gap-2 text-center">
            <div className={`p-2 rounded-lg ${isHighContrast ? 'bg-gray-800' : 'bg-white/60'}`}>
                <p className={`text-xs ${textSec}`}>Carbs</p>
                <p className={`font-bold ${textClass}`}>{todaySummary.macros.carbs}g</p>
            </div>
            <div className={`p-2 rounded-lg ${isHighContrast ? 'bg-gray-800' : 'bg-white/60'}`}>
                <p className={`text-xs ${textSec}`}>Protein</p>
                <p className={`font-bold ${textClass}`}>{todaySummary.macros.protein}g</p>
            </div>
            <div className={`p-2 rounded-lg ${isHighContrast ? 'bg-gray-800' : 'bg-white/60'}`}>
                <p className={`text-xs ${textSec}`}>Fat</p>
                <p className={`font-bold ${textClass}`}>{todaySummary.macros.fat}g</p>
            </div>
         </div>
      </div>

      {/* HISTORY LIST */}
      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className={`text-lg font-bold ${textClass}`}>History</h3>
            <div className="flex gap-2">
                <button 
                    onClick={exportHistory}
                    className={`text-sm px-3 py-1.5 rounded-lg border font-medium ${isHighContrast ? 'border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                    Export JSON
                </button>
                {meals.length > 0 && (
                    <button 
                        onClick={handleDeleteHistory}
                        className="text-sm px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                    >
                        Clear
                    </button>
                )}
            </div>
        </div>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {meals.length === 0 ? (
                <p className={`text-center py-8 italic ${textSec}`}>No meals recorded yet.</p>
            ) : (
                meals.map((meal) => (
                    <div key={meal.id} className={`p-4 rounded-lg flex justify-between items-center ${isHighContrast ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100 hover:bg-gray-50'}`}>
                        <div>
                            <p className={`font-bold ${textClass}`}>{meal.name}</p>
                            <p className={`text-xs ${textSec}`}>{new Date(meal.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className={`font-bold ${textClass}`}>{meal.calories} kcal</p>
                            <p className={`text-xs ${textSec}`}>
                                C:{meal.macros.carbs} P:{meal.macros.protein} F:{meal.macros.fat}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};

export default NutritionTracker;
