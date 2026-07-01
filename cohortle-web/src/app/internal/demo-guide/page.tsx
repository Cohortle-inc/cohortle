'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

const demoSteps = [
  {
    step: 1,
    title: 'Understand Their Programme',
    description: 'Start by learning about their current setup before showing anything.',
    questions: [
      'How many participants do you typically run per cohort?',
      'What does a typical week look like for your learners?',
      'How are you currently managing content delivery and communication?',
      "What's the biggest pain point you're trying to solve right now?",
    ],
  },
  {
    step: 2,
    title: 'Show How Cohortle Fits',
    description: "Map their specific context to Cohortle's features — don't give a generic tour.",
    questions: [
      "Based on what you've told me, here's how Cohortle would handle that\u2026",
      "Does this match how you'd want to structure your programme?",
      'What would you want to see first — the learner view or the convener dashboard?',
    ],
  },
  {
    step: 3,
    title: 'Walk Through the Platform',
    description: 'Live walkthrough focused on their use case. Keep it tight — 10\u201315 minutes max.',
    questions: [
      'Does this feel intuitive for your team to manage?',
      'How do you think your participants would respond to this interface?',
      "Is there anything you expected to see that you haven't?",
    ],
  },
  {
    step: 4,
    title: 'Position Benefits',
    description: 'Tie the platform back to their stated pain points and goals.',
    questions: [
      'You mentioned [pain point] — does this address that for you?',
      'What would it mean for your team if you could track progress this way?',
      "How does this compare to what you're doing today?",
    ],
  },
  {
    step: 5,
    title: 'Invite Partnership',
    description: 'Close with a clear, low-pressure next step.',
    questions: [
      "Does Cohortle feel like a good fit for where you're headed?",
      'What would you need to see to feel confident moving forward?',
      'Would you be open to starting with a pilot cohort?',
    ],
  },
];

/**
 * Internal demo guide page — auth-gated to convener/admin roles.
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */
export default function DemoGuidePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role !== 'administrator') {
        router.replace('/unauthorized');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) return null;
  if (user.role !== 'administrator') return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-12">
        <div className="mb-10">
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-[#391D65] text-white rounded mb-3">
            Internal
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Demo Script</h1>
          <p className="text-slate-600">
            A structured guide for delivering a consistent, high-quality Cohortle demo.
            Follow the steps in order — adapt the questions to the specific organisation.
          </p>
        </div>

        <div className="space-y-6">
          {demoSteps.map(({ step, title, description, questions }) => (
            <div
              key={step}
              className="bg-white rounded-xl border border-slate-200 p-6"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="h-9 w-9 rounded-full bg-[#391D65] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {step}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                  <p className="text-sm text-slate-500 mt-0.5">{description}</p>
                </div>
              </div>
              <ul className="space-y-2 pl-13">
                {questions.map((q, i) => (
                  <li key={i} className="flex gap-2 text-slate-700 text-sm">
                    <span className="text-[#391D65] font-bold flex-shrink-0">›</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
