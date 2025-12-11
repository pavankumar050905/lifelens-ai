export interface Part {
  name: string;
  search_query: string;
}

export interface HealthData {
  heightCm: string;
  weightKg: string;
  age?: string;
  sex?: string;
  activityLevel?: string;
}

export interface FoodDiagnosis {
  is_food: true;
  summary: string;
  calories_estimate: { value: number; unit: string; confidence: string };
  serving_size: string;
  macros: { carbs_g: number; protein_g: number; fat_g: number };
  estimated_daily_need: { value: number; unit: string; method: string };
  bmi: { value: number; category: string };
  nutrition_recommendation: string;
  follow_up_questions: string[];
  accessibility_hint: string;
}

export interface RepairDiagnosis {
  is_food: false;
  problem_summary: string;
  safety_level: 'low' | 'medium' | 'high';
  safety_warning?: string;
  estimated_cost: string;
  estimated_time_minutes: number;
  parts: Part[];
  steps: string[];
  accessibility_hint: string;
}

export type AnalysisResult = RepairDiagnosis | FoodDiagnosis;

export interface MealRecord {
  id: string;
  timestamp: number;
  name: string;
  calories: number;
  macros: {
    carbs: number;
    protein: number;
    fat: number;
  };
}

export interface Metrics {
  total_images_analyzed: number;
  total_food_items: number;
  total_repairs: number;
  average_calorie_reduction: number; // Storing avg calories for simplicity given context
  average_repair_cost: number;
  average_repair_time: number;
  safety_high_count: number;
  safety_low_medium_count: number;
}

export enum AppState {
  IDLE = 'IDLE',
  CHECKING_IMAGE = 'CHECKING_IMAGE', // Classification state
  COLLECTING_FOOD_DATA = 'COLLECTING_FOOD_DATA',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  TRACKER = 'TRACKER',
  DASHBOARD = 'DASHBOARD',
  ERROR = 'ERROR'
}