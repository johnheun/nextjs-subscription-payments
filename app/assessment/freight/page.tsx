'use client';

import { useState } from 'react';
// Import the type we defined in the component
import CalibratedQuestion, { AssessmentResult } from '@/components/assessment/CalibratedQuestion';
import { createClient } from '@/utils/supabase/client';

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
  // FIXED: Explicitly use the AssessmentResult type array
  const [results, setResults] = useState<AssessmentResult[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const supabase = createClient();

  // FIXED: Explicitly type the incoming data
  const handleQuestionComplete = async (resultData: AssessmentResult) => {
    const newResults = [...results, resultData];
    setResults(newResults);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        await supabase.from('assessment_results').insert({
            user_id: user.id,
            skill_id: resultData.skillId,
            self_rating: resultData.selfRating,
            is_correct: resultData.isCorrect,
            calibration_status: resultData.calibrationStatus
        });
    }

    if (currentIndex + 1 < FREIGHT_DATA.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (isFinished) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-10 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-6">Assessment Complete</h1>
          <div className="space-y-4 text-left">
            {results.map((res, idx) => (
              <div key={idx} className="flex justify-between p-4 border rounded-xl bg-slate-50">
                <div>
                    <span className="font-bold block">{res.skillName}</span>
                    <span className={`text-xs uppercase font-bold px-2 py-1 rounded ${
                        res.calibrationStatus === 'overconfident' ? 'bg-red-100 text-red-700' : 
                        res.calibrationStatus === 'aligned_expert' ? 'bg-green-100 text-green-700' : 'bg-gray-200'
                    }`}>
                        {res.calibrationStatus}
                    </span>
                </div>
                {res.trainingPath !== 'none' && (
                    <button className="text-sm bg-indigo-600 text-white px-3 py-1 rounded">
                        Fix Gap
                    </button>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => window.location.href = '/dashboard'} className="mt-8 text-indigo-600 font-bold hover:underline">
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