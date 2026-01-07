'use client';

import { useState } from 'react';

export interface AssessmentResult {
  skillId: string;
  skillName: string;
  selfRating: number;
  isCorrect: boolean;
  calibrationStatus: string;
  trainingPath: string;
}

interface QuestionProps {
  skill: {
    id: string;
    name: string;
    category: string;
  };
  questionData: {
    text: string;
    options: { [key: string]: string };
    correct: string;
  };
  onComplete: (result: AssessmentResult) => void;
}

export default function CalibratedQuestion({ skill, questionData, onComplete }: QuestionProps) {
  const [step, setStep] = useState<'self-rate' | 'testing'>('self-rate');
  const [selfRating, setSelfRating] = useState(3);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const handleSelfRate = () => {
    setStep('testing');
  };

  const handleSubmit = (optionKey: string) => {
    setSelectedOption(optionKey);
    const isCorrect = optionKey === questionData.correct;

    // --- CALIBRATION LOGIC ---
    let calibrationStatus = 'aligned'; 
    let trainingPath = 'none';

    if (isCorrect) {
      if (selfRating <= 2) {
        calibrationStatus = 'underconfident'; // Imposter Syndrome
        trainingPath = 'confidence_boost';
      } else {
        calibrationStatus = 'aligned_expert';
        trainingPath = 'none';
      }
    } else {
      if (selfRating >= 4) {
        calibrationStatus = 'overconfident'; // Dunning-Kruger
        trainingPath = 'intensive_correction';
      } else {
        calibrationStatus = 'novice';
        trainingPath = 'standard_learning';
      }
    }

    setTimeout(() => {
      onComplete({
        skillId: skill.id,
        skillName: skill.name,
        selfRating,
        isCorrect,
        calibrationStatus,
        trainingPath
      });
      setStep('self-rate');
      setSelfRating(3);
      setSelectedOption(null);
    }, 1500);
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl overflow-hidden max-w-2xl mx-auto border border-gray-100 my-8">
      {/* Header */}
      <div className="bg-slate-50 p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
           {/* BRANDING: Royal Blue Text */}
           <h3 className="text-xs font-bold text-blue-700 uppercase tracking-wider">Skill Assessment</h3>
           <h2 className="text-2xl font-extrabold text-gray-900">{skill.name}</h2>
        </div>
        {/* BRANDING: Light Blue Circle with Royal Blue Text */}
        <div className="h-10 w-10 bg-blue-50 text-blue-700 rounded-full flex items-center justify-center font-bold">
            {skill.category ? skill.category.substring(0,1) : 'S'}
        </div>
      </div>

      <div className="p-8 min-h-[400px] flex flex-col justify-center">
        
        {/* PHASE 1: SELF RATING */}
        {step === 'self-rate' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="text-center">
                <p className="text-xl text-gray-700 font-medium">
                    How confident are you in your ability to handle <span className="font-bold text-gray-900">{skill.name}</span>?
                </p>
                <p className="text-sm text-gray-500 mt-2">Be honest—this helps us tailor your training.</p>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between px-2 text-xs font-bold text-gray-400 uppercase">
                    <span>Novice</span>
                    <span>Expert</span>
                </div>
                <input 
                  type="range" min="1" max="5" step="1"
                  value={selfRating} 
                  onChange={(e) => setSelfRating(parseInt(e.target.value))}
                  // BRANDING: Royal Blue Slider Accent
                  className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-700"
                />
                <div className="flex justify-center">
                    {/* BRANDING: Royal Blue Number */}
                    <span className="text-4xl font-bold text-blue-700">{selfRating}</span>
                    <span className="text-xl text-gray-400 font-medium pt-3">/5</span>
                </div>
            </div>

            {/* BRANDING: Royal Blue Button */}
            <button 
                onClick={handleSelfRate}
                className="w-full py-4 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-lg"
            >
                Start Challenge
            </button>
          </div>
        )}

        {/* PHASE 2: THE SCENARIO */}
        {step === 'testing' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* BRANDING: Gold (Amber) for Special Treatment/Scenario */}
            <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                <p className="text-xs text-amber-700 font-bold uppercase mb-1">Scenario</p>
                <p className="text-lg text-gray-800 italic">&quot;{questionData.text}&quot;</p>
            </div>

            <div className="grid gap-3">
                {Object.entries(questionData.options).map(([key, val]) => {
                    const isSelected = selectedOption === key;
                    const isCorrect = key === questionData.correct;
                    
                    // Logic for coloring the buttons after selection
                    let borderClass = "border-gray-200 hover:border-blue-300 hover:bg-blue-50";
                    if (selectedOption) {
                        if (isSelected && isCorrect) borderClass = "border-green-500 bg-green-50 ring-2 ring-green-500";
                        else if (isSelected && !isCorrect) borderClass = "border-red-500 bg-red-50 ring-2 ring-red-500";
                        else if (!isSelected && isCorrect) borderClass = "border-green-500 bg-green-50 opacity-50"; 
                        else borderClass = "opacity-25 grayscale";
                    }

                    return (
                        <button
                            key={key}
                            disabled={!!selectedOption}
                            onClick={() => handleSubmit(key)}
                            // FIXED: Added 'text-gray-900' to force black text on white background
                            className={`p-4 text-left border-2 rounded-xl transition-all duration-200 text-gray-900 ${borderClass}`}
                        >
                            <span className="font-bold mr-2 text-blue-700">{key}.</span> {val}
                        </button>
                    );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}