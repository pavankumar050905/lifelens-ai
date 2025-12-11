import React from 'react';
import { FoodDiagnosis } from '../types';

interface Props {
  data: FoodDiagnosis;
  isHighContrast: boolean;
}

const FoodAnalysis: React.FC<Props> = ({ data, isHighContrast }) => {
  const cardBg = isHighContrast ? 'bg-gray-800 border-2 border-yellow-400' : 'bg-white shadow-md border border-gray-100';
  const textPrimary = isHighContrast ? 'text-yellow-400' : 'text-gray-900';
  const textSecondary = isHighContrast ? 'text-gray-300' : 'text-gray-600';
  
  // Helper for macro bars
  const renderMacro = (label: string, value: number, colorClass: string, total: number) => {
    const percentage = Math.min(100, (value / (total || 1)) * 100);
    return (
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className={isHighContrast ? 'text-white' : 'text-gray-700'}>{label}</span>
          <span className="font-bold">{value}g</span>
        </div>
        <div className={`w-full h-2 rounded-full ${isHighContrast ? 'bg-gray-700' : 'bg-gray-200'}`}>
          <div 
            className={`h-2 rounded-full ${colorClass}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const totalMacros = (data.macros.carbs_g + data.macros.protein_g + data.macros.fat_g);

  return (
    <div className="space-y-6">
      <div className={`${cardBg} p-6 rounded-2xl`}>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2 ${isHighContrast ? 'bg-yellow-400 text-black' : 'bg-green-100 text-green-800'}`}>
              Nutrition Analysis
            </span>
            <h2 className={`text-2xl font-bold ${textPrimary}`}>{data.summary}</h2>
            <p className={textSecondary}>{data.serving_size}</p>
          </div>
          
          <div className={`flex flex-col items-center justify-center p-4 rounded-xl min-w-[120px] ${isHighContrast ? 'bg-gray-700' : 'bg-green-50'}`}>
            <span className={`text-3xl font-bold ${isHighContrast ? 'text-white' : 'text-green-700'}`}>
              {data.calories_estimate.value}
            </span>
            <span className={`text-xs uppercase font-bold ${isHighContrast ? 'text-gray-300' : 'text-green-600'}`}>
              {data.calories_estimate.unit}
            </span>
            <span className="text-[10px] mt-1 opacity-70">
              Conf: {data.calories_estimate.confidence}
            </span>
          </div>
        </div>

        {/* Macros */}
        <div className="mb-6">
          <h3 className={`font-bold mb-3 ${textPrimary}`}>Macronutrients</h3>
          {renderMacro("Protein", data.macros.protein_g, "bg-blue-500", totalMacros)}
          {renderMacro("Carbs", data.macros.carbs_g, "bg-yellow-500", totalMacros)}
          {renderMacro("Fats", data.macros.fat_g, "bg-red-500", totalMacros)}
        </div>

        {/* Health Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className={`p-4 rounded-xl ${isHighContrast ? 'bg-gray-900 border border-gray-600' : 'bg-gray-50'}`}>
            <h4 className={`text-sm font-semibold uppercase mb-2 ${textSecondary}`}>Your BMI</h4>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${textPrimary}`}>{data.bmi.value}</span>
              <span className={`text-sm font-medium ${
                data.bmi.category.includes('Normal') ? 'text-green-600' : 'text-orange-500'
              }`}>
                ({data.bmi.category})
              </span>
            </div>
          </div>
          <div className={`p-4 rounded-xl ${isHighContrast ? 'bg-gray-900 border border-gray-600' : 'bg-gray-50'}`}>
            <h4 className={`text-sm font-semibold uppercase mb-2 ${textSecondary}`}>Est. Daily Need</h4>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${textPrimary}`}>{data.estimated_daily_need.value}</span>
              <span className={`text-sm ${textSecondary}`}>{data.estimated_daily_need.unit}</span>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className={`p-5 rounded-xl border-l-4 ${isHighContrast ? 'bg-gray-900 border-blue-400' : 'bg-blue-50 border-blue-500'}`}>
          <h3 className={`font-bold text-lg mb-2 ${textPrimary}`}>Recommendation</h3>
          <p className={`${textSecondary} leading-relaxed`}>{data.nutrition_recommendation}</p>
        </div>

        {/* Follow up */}
        {data.follow_up_questions && data.follow_up_questions.length > 0 && (
          <div className="mt-6">
            <h4 className={`text-sm font-bold uppercase mb-3 ${textSecondary}`}>Questions you might ask</h4>
            <ul className="space-y-2">
              {data.follow_up_questions.map((q, idx) => (
                <li key={idx} className={`flex items-center gap-2 text-sm ${textSecondary}`}>
                  <span className="text-blue-500">•</span> {q}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodAnalysis;
