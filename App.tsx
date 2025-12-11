import React, { useState, useRef } from 'react';
import { analyzeImage, classifyImage } from './services/geminiService';
import { saveMeal, saveDailyGoal, updateMetrics } from './services/storageService';
import { AnalysisResult, AppState, HealthData, FoodDiagnosis, RepairDiagnosis } from './types';
import VoiceRecorder from './components/VoiceRecorder';
import StepByStep from './components/StepByStep';
import FoodAnalysis from './components/FoodAnalysis';
import NutritionTracker from './components/NutritionTracker';
import Dashboard from './components/Dashboard';

// --- OFFLINE DEMO DATA ---
// 50x50 Base64 Placeholders to prevent network calls during preload
const DEMO_REPAIR_IMG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAyADIDAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiigAooooAKKKKACiiigAooooAKKKKACiiigD/2Q=="; 
const DEMO_FOOD_IMG = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAAyADIDAREAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiigAooooAKKKKACiiigAooooAKKKKACiiigD/2Q==";

const DEMO_SCENARIOS = [
  {
    type: 'repair',
    image: DEMO_REPAIR_IMG,
    description: "The cable is frayed and not charging.",
    result: {
      is_food: false,
      problem_summary: "Frayed charging cable insulation exposing internal wires.",
      safety_level: 'medium',
      safety_warning: "Risk of short circuit or minor shock. Do not plug in while repairing.",
      estimated_cost: "$5 - $15",
      estimated_time_minutes: 15,
      parts: [{ name: "Electrical Tape", search_query: "electrical tape black" }, { name: "Heat Shrink Tubing", search_query: "heat shrink tubing kit" }],
      steps: [
        "Unplug the cable immediately.",
        "Clean the frayed area gently with a dry cloth.",
        "Wrap the exposed wires tightly with electrical tape.",
        "Alternatively, slide heat shrink tubing over the damage and apply heat."
      ],
      accessibility_hint: "Visible damage to white cable. Wires exposed near the connector."
    } as RepairDiagnosis
  },
  {
    type: 'food',
    image: DEMO_FOOD_IMG,
    description: "Salad with grilled chicken and dressing.",
    healthContext: { heightCm: '175', weightKg: '75', age: '30', sex: 'Male', activityLevel: 'Moderate' },
    result: {
      is_food: true,
      summary: "Grilled Chicken Salad with Vinaigrette",
      calories_estimate: { value: 450, unit: "kcal", confidence: "high" },
      serving_size: "1 bowl (approx 350g)",
      macros: { carbs_g: 15, protein_g: 40, fat_g: 22 },
      estimated_daily_need: { value: 2400, unit: "kcal", method: "Mifflin-St Jeor" },
      bmi: { value: 24.5, category: "Normal weight" },
      nutrition_recommendation: "Excellent balanced meal. High protein from chicken and healthy fats from dressing.",
      follow_up_questions: ["Is the dressing creamy or oil-based?", "Did you add croutons?"],
      accessibility_hint: "Bowl of mixed greens topped with sliced grilled chicken."
    } as FoodDiagnosis
  },
  {
    type: 'accessibility',
    image: DEMO_REPAIR_IMG,
    description: "Guide me step by step (Voice Mode)",
    result: {
      is_food: false,
      problem_summary: "Frayed charging cable (Voice Demo)",
      safety_level: 'low',
      estimated_cost: "$5",
      estimated_time_minutes: 10,
      parts: [{ name: "Electrical Tape", search_query: "electrical tape" }],
      steps: [
        "Unplug cable.",
        "Wrap with tape.",
        "Test connection."
      ],
      accessibility_hint: "Voice mode active. Reading steps aloud."
    } as RepairDiagnosis
  }
];

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  
  // Health Data State
  const [healthData, setHealthData] = useState<HealthData>({
    heightCm: '', weightKg: '', age: '', sex: '', activityLevel: 'Moderate'
  });
  
  const [diagnosis, setDiagnosis] = useState<AnalysisResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [demoBanner, setDemoBanner] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const demoCancelledRef = useRef(false);

  const fileToGenerativePart = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      
      setErrorMsg(null);
      setAppState(AppState.CHECKING_IMAGE);

      try {
        const base64 = await fileToGenerativePart(file);
        const isFood = await classifyImage(base64);
        
        if (isFood) {
          setAppState(AppState.COLLECTING_FOOD_DATA);
        } else {
          setAppState(AppState.IDLE);
        }
      } catch (err) {
        console.error("Classification error", err);
        setAppState(AppState.IDLE);
      }
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setDescription(prev => prev ? `${prev} ${text}` : text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile && !isDemoRunning) {
      setErrorMsg("Please upload an image first.");
      return;
    }

    setAppState(AppState.ANALYZING);
    setErrorMsg(null);

    try {
      let base64Image = '';
      if (imageFile) {
        base64Image = await fileToGenerativePart(imageFile);
      } else if (imagePreview) {
        base64Image = imagePreview.split(',')[1];
      }

      const isFoodMode = appState === AppState.COLLECTING_FOOD_DATA;
      const dataToSend = isFoodMode ? healthData : undefined;

      const result = await analyzeImage(base64Image, description, dataToSend);
      
      updateMetrics(result); // Update Dashboard
      
      setDiagnosis(result);
      setAppState(AppState.RESULTS);
      
      if (result.is_food) {
          saveMeal(result);
          if (result.estimated_daily_need?.value) {
              saveDailyGoal(result.estimated_daily_need.value);
          }
      }

      // Voice output implicitly handled
      if (result.accessibility_hint) {
         let summary = "";
         if (result.is_food) {
            summary = (result as FoodDiagnosis).summary;
         } else {
            summary = (result as RepairDiagnosis).problem_summary;
         }
         const utterance = new SpeechSynthesisUtterance(`Analysis complete. ${result.accessibility_hint}. Result: ${summary}`);
         window.speechSynthesis.speak(utterance);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Could not analyze the image. Please try again.");
      setAppState(AppState.ERROR);
    }
  };

  const preloadImages = async () => {
    const promises = DEMO_SCENARIOS.map(s => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = s.image;
        img.onload = resolve;
        img.onerror = resolve; // Continue even if error
      });
    });
    await Promise.all(promises);
  };

  const runDemoMode = async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    demoCancelledRef.current = false;
    setDemoBanner("Preloading demo assets...");
    
    await preloadImages();
    if (demoCancelledRef.current) return cleanupDemo();

    for (let i = 0; i < DEMO_SCENARIOS.length; i++) {
        const scenario = DEMO_SCENARIOS[i];
        if (demoCancelledRef.current) break;

        // Reset for next scenario
        setDemoBanner(`Running Demo Scenario ${i + 1} of 3: ${scenario.type.toUpperCase()}`);
        setAppState(AppState.IDLE);
        setImageFile(null);
        setImagePreview(scenario.image);
        setDescription(scenario.description);
        setDiagnosis(null);
        setHealthData({ heightCm: '', weightKg: '', age: '', sex: '', activityLevel: 'Moderate' });
        
        await new Promise(r => setTimeout(r, 800)); // Simulate UI pacing
        if (demoCancelledRef.current) break;

        // Simulate Classification
        setAppState(AppState.CHECKING_IMAGE);
        await new Promise(r => setTimeout(r, 600));
        if (demoCancelledRef.current) break;

        // Handle specific states based on type
        if (scenario.type === 'food') {
            setAppState(AppState.COLLECTING_FOOD_DATA);
            if (scenario.healthContext) {
                 setHealthData(scenario.healthContext);
            }
            await new Promise(r => setTimeout(r, 800));
        } else {
            setAppState(AppState.IDLE);
        }
        if (demoCancelledRef.current) break;

        // Simulate Analysis
        setAppState(AppState.ANALYZING);
        await new Promise(r => setTimeout(r, 1000));
        if (demoCancelledRef.current) break;

        // Show Results (NO API CALL - Deterministic)
        setDiagnosis(scenario.result);
        setAppState(AppState.RESULTS);
        
        // Voice readout for accessibility demo
        if (scenario.type === 'accessibility' || scenario.type === 'repair') {
             const u = new SpeechSynthesisUtterance(`Demo Result: ${(scenario.result as RepairDiagnosis).problem_summary}`);
             window.speechSynthesis.speak(u);
        }

        // Wait for user to read before next scenario
        if (i < DEMO_SCENARIOS.length - 1) {
             await new Promise(r => setTimeout(r, 4000));
        }
    }

    if (!demoCancelledRef.current) {
        setDemoBanner("Demo sequence complete.");
        setIsDemoRunning(false);
    } else {
        cleanupDemo();
    }
  };

  const stopDemo = () => {
      if (window.confirm("Stop the demo sequence?")) {
        demoCancelledRef.current = true;
        window.speechSynthesis.cancel();
        cleanupDemo();
      }
  };

  const cleanupDemo = () => {
      setIsDemoRunning(false);
      setDemoBanner("Demo cancelled.");
      handleReset();
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setImageFile(null);
    setImagePreview(null);
    setDescription('');
    setHealthData({ heightCm: '', weightKg: '', age: '', sex: '', activityLevel: 'Moderate' });
    setDiagnosis(null);
    setErrorMsg(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // FORCE DARK MODE STYLES
  const bgClass = 'bg-gray-950 text-gray-100';
  const cardClass = 'bg-gray-900 border border-gray-800 shadow-2xl rounded-2xl';
  const textClass = 'text-white';
  const labelClass = 'text-gray-400 font-bold text-sm uppercase tracking-wide';
  const inputClass = 'bg-gray-800 border-gray-700 text-white p-3 text-lg focus:ring-blue-500 rounded-lg placeholder-gray-500 focus:outline-none focus:border-blue-500';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${bgClass} pb-12`}>
      {/* Header */}
      <header className="sticky top-0 z-50 px-6 py-4 shadow-lg backdrop-blur-lg bg-gray-950/90 border-b border-gray-800">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3 group" role="button" onClick={() => !isDemoRunning && setAppState(AppState.IDLE)}>
             <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] group-hover:scale-105 transition-transform">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
             </div>
             <h1 className="text-xl font-bold tracking-tight cursor-pointer text-white">LifeLens AI</h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {isDemoRunning ? (
                <button 
                    onClick={stopDemo} 
                    className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-1.5 rounded-lg text-sm font-bold animate-pulse hover:bg-red-500 hover:text-white transition-colors"
                >
                    Stop Demo
                </button>
            ) : (
                <button 
                    onClick={runDemoMode}
                    className="hidden md:block bg-purple-500/10 border border-purple-500/50 text-purple-400 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-purple-500 hover:text-white transition-colors"
                >
                    Run Demo
                </button>
            )}

            <button
                onClick={() => !isDemoRunning && setAppState(AppState.DASHBOARD)}
                className="text-sm font-medium hover:text-blue-400 text-gray-400 transition-colors"
            >
                Dashboard
            </button>

            <button
                onClick={() => !isDemoRunning && setAppState(AppState.TRACKER)}
                className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <span>Log</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        
        {/* Banner */}
        {demoBanner && (
           <div className="mb-6 p-4 bg-purple-900/30 border border-purple-500/30 text-purple-200 rounded-xl flex justify-between items-center shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-3">
                 {isDemoRunning && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span></span>}
                 <span className="font-bold tracking-wide">{demoBanner}</span>
              </div>
              {!isDemoRunning && <button onClick={() => setDemoBanner(null)} className="text-sm underline hover:text-white">Dismiss</button>}
           </div>
        )}

        {/* VIEW: DASHBOARD */}
        {appState === AppState.DASHBOARD && (
            <Dashboard onClose={() => setAppState(AppState.IDLE)} />
        )}

        {/* VIEW: NUTRITION TRACKER */}
        {appState === AppState.TRACKER && (
             <NutritionTracker 
                isHighContrast={false} 
                onClose={() => setAppState(diagnosis ? AppState.RESULTS : AppState.IDLE)} 
             />
        )}

        {/* VIEW: INPUT FORMS */}
        {(appState === AppState.IDLE || appState === AppState.COLLECTING_FOOD_DATA || appState === AppState.CHECKING_IMAGE || appState === AppState.ERROR || appState === AppState.ANALYZING) && (
          <div className={`${cardClass} p-6 md:p-8 transition-all duration-500 animate-fade-in`}>
            
            {/* Title */}
            <div className="text-center mb-8">
              {appState === AppState.COLLECTING_FOOD_DATA ? (
                 <>
                   <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-2 bg-green-900/50 text-green-400 border border-green-800">Food Detected</span>
                   <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">Let's check your nutrition</h2>
                   <p className="text-gray-400">Please provide details for accurate analysis.</p>
                 </>
              ) : (
                <>
                  <h2 className="text-2xl md:text-3xl font-bold mb-3 text-white">What needs help?</h2>
                  <p className="text-gray-400">Upload a photo of a broken item OR a meal.</p>
                </>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Image Upload Area */}
              <div className="space-y-2">
                <label className={labelClass}>
                  1. Upload Photo <span className="text-red-500">*</span>
                </label>
                <div 
                  onClick={() => !isDemoRunning && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors relative bg-gray-900 border-gray-700 hover:border-blue-500 hover:bg-gray-800 ${
                    isDemoRunning ? 'cursor-not-allowed opacity-80' : ''
                  }`}
                >
                  {appState === AppState.CHECKING_IMAGE && (
                    <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center backdrop-blur-sm rounded-xl z-10">
                       <div className="flex items-center gap-2 font-bold text-blue-400">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          Scanning image type...
                       </div>
                    </div>
                  )}

                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-64 rounded-lg object-contain shadow-sm" />
                  ) : (
                    <>
                      <svg className="w-12 h-12 mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-gray-500">Tap to select image</span>
                    </>
                  )}
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                    className="hidden"
                    aria-label="Upload image input"
                    disabled={isDemoRunning}
                  />
                </div>
              </div>

              {/* DYNAMIC FORM: HEALTH DATA */}
              {appState === AppState.COLLECTING_FOOD_DATA && (
                <div className="space-y-4 animate-fade-in-down">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`${labelClass} block mb-1`}>Height (cm) <span className="text-red-500">*</span></label>
                        <input 
                          type="number" 
                          required 
                          value={healthData.heightCm}
                          onChange={e => setHealthData({...healthData, heightCm: e.target.value})}
                          className={`w-full ${inputClass}`}
                          placeholder="175"
                          readOnly={isDemoRunning}
                        />
                      </div>
                      <div>
                        <label className={`${labelClass} block mb-1`}>Weight (kg) <span className="text-red-500">*</span></label>
                        <input 
                          type="number" 
                          required 
                          value={healthData.weightKg}
                          onChange={e => setHealthData({...healthData, weightKg: e.target.value})}
                          className={`w-full ${inputClass}`}
                          placeholder="70"
                          readOnly={isDemoRunning}
                        />
                      </div>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className={`${labelClass} block mb-1`}>Age</label>
                        <input 
                          type="number" 
                          value={healthData.age}
                          onChange={e => setHealthData({...healthData, age: e.target.value})}
                          className={`w-full ${inputClass}`}
                          placeholder="30"
                          readOnly={isDemoRunning}
                        />
                      </div>
                      <div>
                        <label className={`${labelClass} block mb-1`}>Sex</label>
                        <select 
                          value={healthData.sex}
                          onChange={e => setHealthData({...healthData, sex: e.target.value})}
                          className={`w-full ${inputClass}`}
                          disabled={isDemoRunning}
                        >
                          <option value="">-</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      <div>
                        <label className={`${labelClass} block mb-1`}>Activity</label>
                        <select 
                          value={healthData.activityLevel}
                          onChange={e => setHealthData({...healthData, activityLevel: e.target.value})}
                          className={`w-full ${inputClass}`}
                          disabled={isDemoRunning}
                        >
                          <option value="Sedentary">Sedentary</option>
                          <option value="Light">Light</option>
                          <option value="Moderate">Moderate</option>
                          <option value="Active">Active</option>
                        </select>
                      </div>
                   </div>
                </div>
              )}

              {/* Description & Voice */}
              <div className="space-y-2">
                <label className={labelClass}>
                  {appState === AppState.COLLECTING_FOOD_DATA ? 'Add Notes (Optional)' : '2. Describe the problem (Optional)'}
                </label>
                <div className="relative">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={appState === AppState.COLLECTING_FOOD_DATA ? "E.g. It includes extra cheese..." : "E.g., It's making a loud rattling noise..."}
                    rows={3}
                    className={`block w-full shadow-sm ${inputClass}`}
                    readOnly={isDemoRunning}
                  />
                  <div className="absolute right-3 bottom-3">
                     <VoiceRecorder onTranscription={handleVoiceTranscription} isHighContrast={false} />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-4 rounded-lg bg-red-900/30 text-red-300 border border-red-800 flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={appState === AppState.ANALYZING || appState === AppState.CHECKING_IMAGE || isDemoRunning}
                className={`w-full py-4 px-6 rounded-xl font-bold text-lg shadow-lg transform transition-all active:scale-[0.98] ${
                  (appState === AppState.ANALYZING || appState === AppState.CHECKING_IMAGE || isDemoRunning)
                    ? 'opacity-75 cursor-wait'
                    : ''
                } bg-blue-600 text-white hover:bg-blue-500 hover:shadow-blue-500/20`}
              >
                {appState === AppState.ANALYZING ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Analyzing...
                  </span>
                ) : isDemoRunning ? 'Running Demo...' : (appState === AppState.COLLECTING_FOOD_DATA ? 'Analyze Meal' : 'Diagnose & Fix')}
              </button>
            </form>
          </div>
        )}

        {/* RESULTS SECTION */}
        {appState === AppState.RESULTS && diagnosis && (
          <div className="space-y-6">
            
            {/* --- FOOD RESULTS --- */}
            {diagnosis.is_food && (
              <>
                <FoodAnalysis data={diagnosis} isHighContrast={false} />
                <div className="flex justify-center mt-4">
                    <button 
                        onClick={() => setAppState(AppState.TRACKER)}
                        className="text-sm font-semibold underline text-blue-400 hover:text-blue-300"
                    >
                        View Daily Nutrition Log &rarr;
                    </button>
                </div>
              </>
            )}

            {/* --- REPAIR RESULTS --- */}
            {!diagnosis.is_food && (
            <div className={`${cardClass} p-6 md:p-8 overflow-hidden`}>
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h2 className="text-2xl font-bold mb-2 text-white">Diagnosis Result</h2>
                    <p className="text-lg text-gray-300">{diagnosis.problem_summary}</p>
                 </div>
                 <button onClick={handlePrint} className="no-print p-2 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400" title="Print Plan">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                 </button>
              </div>

              {/* Safety Warning */}
              {diagnosis.safety_level === 'high' && (
                <div className="p-4 rounded-lg border-l-4 mb-6 bg-red-900/40 border-red-500 text-red-200">
                  <div className="flex items-start gap-3">
                    <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    <div>
                      <h3 className="font-bold text-lg">SAFETY WARNING</h3>
                      <p>{diagnosis.safety_warning}</p>
                      <p className="mt-2 text-sm font-semibold">Please contact a professional.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <p className="text-sm text-blue-400 font-semibold">Est. Cost</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{diagnosis.estimated_cost}</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-800 border border-gray-700">
                  <p className="text-sm text-purple-400 font-semibold">Est. Time</p>
                  <p className="text-xl md:text-2xl font-bold text-white">{diagnosis.estimated_time_minutes} mins</p>
                </div>
              </div>

              {/* Parts */}
              {diagnosis.parts && diagnosis.parts.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-bold text-lg mb-3 text-white">Recommended Parts</h3>
                  <div className="space-y-3">
                    {diagnosis.parts.map((part, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-800 border border-gray-700">
                        <span className="font-medium text-gray-200">{part.name}</span>
                        <a 
                          href={`https://www.google.com/search?tbm=shop&q=${encodeURIComponent(part.search_query)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm px-3 py-1.5 rounded-md font-medium transition-colors bg-blue-900/50 text-blue-300 hover:bg-blue-800 border border-blue-800"
                        >
                          Find Online &rarr;
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Steps (Only if safety isn't high) */}
              {diagnosis.safety_level !== 'high' && diagnosis.steps && diagnosis.steps.length > 0 && (
                <StepByStep steps={diagnosis.steps} isHighContrast={false} />
              )}
            </div>
            )}

            <button
              onClick={handleReset}
              className="w-full py-4 rounded-xl font-bold text-lg shadow-md no-print bg-white text-gray-900 hover:bg-gray-100 transition-colors"
            >
              Start New Analysis
            </button>
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-12 text-center py-6 text-sm no-print text-gray-600">
         <p>LifeLens AI — Powered by Gemini 3 Pro</p>
         <p className="mt-1">Use at your own risk. Always consult a professional for dangerous repairs.</p>
      </footer>
    </div>
  );
};

export default App;