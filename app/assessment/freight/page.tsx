'use client';

import { useState } from 'react';
import CalibratedQuestion, { AssessmentResult } from '@/components/assessment/CalibratedQuestion';
import { createClient } from '@/utils/supabase/client';

// Define the shape of the Simulation Data
interface SimulationData {
  setup: string;
  customer_dialogue: string;
  options: { id: string; text: string; feedback: string }[];
  correct_option_id: string;
}

interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  simulation: SimulationData | null;
  skillName: string;
}

// --- INTERACTIVE SIMULATION MODAL ---
function TrainingModal({ isOpen, onClose, isLoading, simulation, skillName }: TrainingModalProps) {
  const [selectedResponse, setSelectedResponse] = useState<string | null>(null);

  if (!isOpen) return null;

  // Reset state when closing/opening (simple implementation)
  const handleOptionClick = (id: string) => {
    setSelectedResponse(id);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 animate-in fade-in backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl relative border border-gray-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold">✕</button>
        
        <div className="mb-6">
            <h2 className="text-xl font-extrabold text-blue-700">Micro-Simulation</h2>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">{skillName}</h3>
        </div>

        {isLoading ? (
          <div className="py-20 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-500 animate-pulse font-medium">Building scenario...</p>
          </div>
        ) : simulation ? (
          <div className="space-y-6">
            {/* 1. SCENARIO SETUP */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 text-sm text-slate-600 italic">
                {simulation.setup}
            </div>

            {/* 2. CUSTOMER DIALOGUE (The "Challenge") */}
            <div className="flex gap-4 items-start">
                <div className="h-10 w-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs shrink-0">
                    CUST
                </div>
                <div className="bg-red-50 p-4 rounded-r-xl rounded-bl-xl text-gray-900 font-medium border border-red-100 shadow-sm">
                    {/* FIXED: Used HTML entities for quotes to satisfy linter */}
                    &quot;{simulation.customer_dialogue}&quot;
                </div>
            </div>

            {/* 3. USER OPTIONS */}
            <div className="space-y-3 pl-14">
                {simulation.options.map((opt) => {
                    const isSelected = selectedResponse === opt.id;
                    const isCorrect = opt.id === simulation.correct_option_id;
                    
                    // Styling logic for feedback state
                    let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all hover:bg-slate-50 border-slate-200";
                    
                    if (selectedResponse) {
                        if (isSelected && isCorrect) btnClass = "w-full text-left p-4 rounded-xl border-2 bg-green-50 border-green-500 ring-1 ring-green-500";
                        else if (isSelected && !isCorrect) btnClass = "w-full text-left p-4 rounded-xl border-2 bg-red-50 border-red-500 ring-1 ring-red-500";
                        else if (!isSelected && isCorrect) btnClass = "w-full text-left p-4 rounded-xl border-2 bg-green-50 border-green-500 opacity-60";
                        else btnClass = "w-full text-left p-4 rounded-xl border-2 border-slate-100 opacity-40 grayscale";
                    }

                    return (
                        <div key={opt.id}>
                            <button 
                                disabled={!!selectedResponse}
                                onClick={() => handleOptionClick(opt.id)}
                                className={btnClass}
                            >
                                <span className="font-bold mr-2 text-slate-400">{opt.id}.</span> 
                                <span className="text-gray-800">{opt.text}</span>
                            </button>
                            
                            {/* FEEDBACK REVEAL */}
                            {selectedResponse && (isSelected || (isCorrect && !isSelected)) && (
                                <div className={`mt-2 text-sm p-2 rounded ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                                    <strong>Feedback:</strong> {opt.feedback}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedResponse && (
                <button onClick={onClose} className="mt-4 w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black">
                    Continue
                </button>
            )}

          </div>
        ) : (
             <div className="text-red-500 text-center py-10">Failed to load simulation.</div>
        )}
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
const FREIGHT_DATA = [
  {
    id: 'SK-FB-01', name: 'Cold Calling', category: 'Sales',
    question: {
        text: "You call a Shipping Manager who says 'We treat our incumbents like family.' What is the best door-opener?",
        options: {
            A: "Ask if their family ever misses appointments.",
            B: "Pivot: 'I don't want to replace them, just be your backup when they are overbooked.'",
            C: "Offer to beat their rates by 20% immediately.",
            D: "Hang up and try the next lead."
        },
        correct: "B"
    }
  },
  {
    id: 'SK-FB-02', name: 'Rate Negotiation', category: 'Sales',
    question: {
        text: "Spot Market is tight. A carrier wants $3,000 for a $2,500 load. You have $400 margin. The customer is TQL (Time Sensitive).",
        options: {
            A: "Pay the $3,000 and take the loss to save the relationship.",
            B: "Cancel the load and tell the customer no trucks are available.",
            C: "Counter at $2,700, sell the 'easy pickup', and call 5 more carriers.",
            D: "Tell the carrier he is crazy and hang up."
        },
        correct: "C"
    }
  }
];

export default function FreightAssessmentPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingTraining, setLoadingTraining] = useState(false);
  const [simulationData, setSimulationData] = useState<SimulationData | null>(null);
  const [currentTrainingSkill, setCurrentTrainingSkill] = useState("");

  const supabase = createClient();

  const handleQuestionComplete = async (resultData: AssessmentResult) => {
    const newResults = [...results, resultData];
    setResults(newResults);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: any = {
            user_id: user.id,
            skill_id: resultData.skillId,
            self_rating: resultData.selfRating,
            is_correct: resultData.isCorrect,
            calibration_status: resultData.calibrationStatus
        };
        await supabase.from('assessment_results').insert(payload);
    }

    if (currentIndex + 1 < FREIGHT_DATA.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleFixGap = async (result: AssessmentResult) => {
    setIsModalOpen(true);
    setLoadingTraining(true);
    setCurrentTrainingSkill(result.skillName);
    setSimulationData(null); // Reset previous data

    try {
      const response = await fetch('/api/generate-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillName: result.skillName,
          userLevel: result.selfRating,
          mistakeContext: result.calibrationStatus
        })
      });
      
      const data = await response.json();
      
      if (data.error) {
        console.error("Simulation Error:", data.message);
      } else {
        setSimulationData(data);
      }

    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Unknown connection error";
      console.error("Connection Error:", errorMessage);
    } finally {
      setLoadingTraining(false);
    }
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <TrainingModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          isLoading={loadingTraining}
          simulation={simulationData}
          skillName={currentTrainingSkill}
        />

        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Assessment Complete</h1>
          <div className="space-y-4 text-left">
            {results.map((res, idx) => (
              <div key={idx} className="flex justify-between p-4 border rounded-xl bg-slate-50">
                <div>
                    <span className="font-bold block text-gray-900">{res.skillName}</span>
                    <span className={`text-xs uppercase font-bold px-2 py-1 rounded ${
                        res.calibrationStatus === 'overconfident' ? 'bg-red-100 text-red-700' : 
                        res.calibrationStatus === 'aligned_expert' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                        {res.calibrationStatus}
                    </span>
                </div>
                {res.trainingPath !== 'none' && (
                    <button 
                      onClick={() => handleFixGap(res)}
                      className="text-sm bg-blue-700 text-white px-3 py-1 rounded hover:bg-blue-800 transition-all shadow-sm"
                    >
                        Fix Gap
                    </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => window.location.href = '/dashboard'} className="mt-8 w-full py-3 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-800 transition-all shadow-md">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentSkill = FREIGHT_DATA[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
        <div className="max-w-2xl mx-auto mb-8 text-center">
            <h1 className="text-3xl font-extrabold text-slate-900">Freight Brokerage Assessment</h1>
            <p className="text-slate-500 mt-2">Question {currentIndex + 1} of {FREIGHT_DATA.length}</p>
        </div>

        <CalibratedQuestion 
            key={currentSkill.id} 
            skill={currentSkill}
            questionData={currentSkill.question}
            onComplete={handleQuestionComplete}
        />
    </div>
  );
}