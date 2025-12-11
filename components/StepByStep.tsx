import React, { useState, useEffect } from 'react';

interface StepByStepProps {
  steps: string[];
  isHighContrast: boolean;
}

const StepByStep: React.FC<StepByStepProps> = ({ steps, isHighContrast }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Reset when steps change
    setCurrentStep(0);
    setIsPlaying(false);
    window.speechSynthesis.cancel();
  }, [steps]);

  useEffect(() => {
    if (isPlaying) {
      speakStep(steps[currentStep]);
    } else {
      window.speechSynthesis.cancel();
    }
    // Cleanup on unmount
    return () => window.speechSynthesis.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isPlaying]); // Intentionally omitting 'steps' to prevent re-triggering on prop refresh if identity changes

  const speakStep = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      // Auto-play next step if we were already playing
      if (isPlaying) {
        // isPlaying effect will trigger speakStep
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const baseBtnClass = "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const btnClass = isHighContrast
    ? `${baseBtnClass} bg-yellow-400 text-black border-2 border-black hover:bg-yellow-500 focus:ring-yellow-500`
    : `${baseBtnClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
  
  const secondaryBtnClass = isHighContrast
    ? `${baseBtnClass} bg-white text-black border-2 border-black hover:bg-gray-100 focus:ring-black`
    : `${baseBtnClass} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500`;

  return (
    <div className={`mt-6 p-4 rounded-xl ${isHighContrast ? 'bg-black border-2 border-yellow-400' : 'bg-white shadow-lg border border-gray-100'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-bold ${isHighContrast ? 'text-yellow-400' : 'text-gray-900'}`}>
          Guided Repair Mode
        </h3>
        <span className={`text-sm font-medium ${isHighContrast ? 'text-yellow-400' : 'text-gray-500'}`}>
          Step {currentStep + 1} of {steps.length}
        </span>
      </div>

      <div className={`mb-6 min-h-[100px] flex items-center justify-center p-6 rounded-lg text-center ${isHighContrast ? 'bg-gray-900 border border-yellow-400' : 'bg-blue-50'}`}>
        <p className={`text-xl ${isHighContrast ? 'text-white font-bold' : 'text-gray-800'}`}>
          {steps[currentStep]}
        </p>
      </div>

      <div className="flex justify-between items-center gap-2">
        <button 
          onClick={handlePrev} 
          disabled={currentStep === 0}
          className={`${secondaryBtnClass} ${currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Previous step"
        >
          Previous
        </button>
        
        <button 
          onClick={togglePlay} 
          className={btnClass}
          aria-label={isPlaying ? "Pause voice guide" : "Play voice guide"}
        >
          {isPlaying ? (
             <span className="flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
               Pause
             </span>
          ) : (
            <span className="flex items-center gap-2">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
               Read Step
             </span>
          )}
        </button>

        <button 
          onClick={handleNext} 
          disabled={currentStep === steps.length - 1}
          className={`${secondaryBtnClass} ${currentStep === steps.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          aria-label="Next step"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default StepByStep;
