'use client';

import { useState } from 'react';
import CalibratedQuestion, { AssessmentResult } from '@/components/assessment/CalibratedQuestion';
import { createClient } from '@/utils/supabase/client';

// FIXED: Defined specific types for the Modal props instead of 'any'
interface TrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  content: string;
  skillName: string;
}

// --- TRAINING MODAL COMPONENT ---
function TrainingModal({ isOpen, onClose, isLoading, content, skillName }: TrainingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 font-bold">✕</button>
        
        <h2 className="text-2xl font-extrabold text-blue-700 mb-2">Micro-Coaching</h2>
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">{skillName}</h3>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
            <p className="text-gray-500 animate-pulse">Analyzing your response with Claude AI...</p>
          </div>
        ) : (
          <div className="prose prose-blue text-gray-800 text-lg leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        )}

        {!isLoading && (
          <button onClick={onClose} className="mt-8 w-full py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200">
            Got it, thanks.
          </button>
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
  const [trainingContent, setTrainingContent] = useState("");
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
    setTrainingContent("");

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
      setTrainingContent(data.lesson || "Could not generate lesson.");
    } catch (e) {
      setTrainingContent("Error connecting to training engine.");
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
          content={trainingContent}
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