import { MealRecord, FoodDiagnosis, AnalysisResult, Metrics, RepairDiagnosis } from '../types';

const MEALS_KEY = 'fixit_meals';
const GOAL_KEY = 'fixit_daily_goal';
const METRICS_KEY = 'lifelens_metrics';

export const saveMeal = (diagnosis: FoodDiagnosis): MealRecord => {
  const meals = getMeals();
  
  const newMeal: MealRecord = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    timestamp: Date.now(),
    name: diagnosis.summary || 'Unknown Meal',
    calories: diagnosis.calories_estimate?.value || 0,
    macros: {
      carbs: diagnosis.macros?.carbs_g || 0,
      protein: diagnosis.macros?.protein_g || 0,
      fat: diagnosis.macros?.fat_g || 0,
    }
  };

  meals.push(newMeal);
  localStorage.setItem(MEALS_KEY, JSON.stringify(meals));
  return newMeal;
};

export const getMeals = (): MealRecord[] => {
  try {
    const stored = localStorage.getItem(MEALS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Error parsing meals", e);
    return [];
  }
};

export const saveDailyGoal = (calories: number) => {
  localStorage.setItem(GOAL_KEY, calories.toString());
};

export const getDailyGoal = (): number => {
  const stored = localStorage.getItem(GOAL_KEY);
  return stored ? parseInt(stored, 10) : 2000; // Default fallback
};

export const getTodaySummary = () => {
  const meals = getMeals();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayMeals = meals.filter(m => m.timestamp >= startOfDay.getTime());

  const total = todayMeals.reduce((acc, curr) => ({
    calories: acc.calories + curr.calories,
    macros: {
      carbs: acc.macros.carbs + curr.macros.carbs,
      protein: acc.macros.protein + curr.macros.protein,
      fat: acc.macros.fat + curr.macros.fat,
    }
  }), { calories: 0, macros: { carbs: 0, protein: 0, fat: 0 } });

  return total;
};

export const exportHistory = () => {
  const meals = getMeals();
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(meals, null, 2));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", "fixit_nutrition_history.json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
};

export const clearHistory = () => {
    localStorage.removeItem(MEALS_KEY);
    localStorage.removeItem(GOAL_KEY);
}

// --- METRICS DASHBOARD LOGIC ---

const DEFAULT_METRICS: Metrics = {
  total_images_analyzed: 0,
  total_food_items: 0,
  total_repairs: 0,
  average_calorie_reduction: 0,
  average_repair_cost: 0,
  average_repair_time: 0,
  safety_high_count: 0,
  safety_low_medium_count: 0
};

export const getMetrics = (): Metrics => {
  try {
    const stored = localStorage.getItem(METRICS_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_METRICS;
  } catch {
    return DEFAULT_METRICS;
  }
};

export const saveMetrics = (metrics: Metrics) => {
  localStorage.setItem(METRICS_KEY, JSON.stringify(metrics));
};

export const resetMetrics = () => {
  localStorage.removeItem(METRICS_KEY);
};

export const updateMetrics = (result: AnalysisResult) => {
  const m = getMetrics();
  m.total_images_analyzed += 1;

  if (result.is_food) {
    m.total_food_items += 1;
    // Calculate running average for calories
    const cals = result.calories_estimate?.value || 0;
    // Note: Interpreting "average_calorie_reduction" as Average Calories for this implementation 
    // since we don't have a "before" state to calculate reduction.
    m.average_calorie_reduction = 
      ((m.average_calorie_reduction * (m.total_food_items - 1)) + cals) / m.total_food_items;
  } else {
    // Explicitly cast to RepairDiagnosis for TypeScript narrowing
    const repairResult = result as RepairDiagnosis;

    m.total_repairs += 1;
    
    // Parse Cost
    let cost = 0;
    if (repairResult.estimated_cost) {
      const nums = repairResult.estimated_cost.match(/\d+/g);
      if (nums && nums.length > 0) cost = parseInt(nums[0], 10);
    }
    m.average_repair_cost = 
      ((m.average_repair_cost * (m.total_repairs - 1)) + cost) / m.total_repairs;

    // Time
    const time = repairResult.estimated_time_minutes || 0;
    m.average_repair_time = 
       ((m.average_repair_time * (m.total_repairs - 1)) + time) / m.total_repairs;
    
    // Safety
    if (repairResult.safety_level === 'high') {
      m.safety_high_count += 1;
    } else {
      m.safety_low_medium_count += 1;
    }
  }

  saveMetrics(m);
};