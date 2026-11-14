import React, { useState } from 'react';
import {
  Sparkles,
  GraduationCap,
  Code2,
  Target,
  Users,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  Compass,
} from 'lucide-react';
import type { StudentProfile } from '../types/ncet';

interface OnboardingModalProps {
  isOpen: boolean;
  profile: StudentProfile;
  onClose: () => void;
  onSave: (updates: Partial<StudentProfile>) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSave,
}) => {
  const [step, setStep] = useState(1);
  const [department, setDepartment] = useState(profile.department || 'CSE');
  const [year, setYear] = useState(profile.year || '3rd Year');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    profile.skills.length > 0 ? profile.skills : ['ReactJS', 'Python', 'TypeScript']
  );
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    profile.careerGoals.length > 0
      ? profile.careerGoals
      : ['Find summer internships', 'Win hackathons', 'Build open-source projects']
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile.interests.length > 0
      ? profile.interests
      : ['AI & ML', 'Full-Stack Engineering', 'Competitive Programming']
  );

  if (!isOpen) return null;

  const techOptions = [
    'ReactJS',
    'Python',
    'TypeScript',
    'Node.js',
    'PyTorch',
    'FastAPI',
    'Docker',
    'C++',
    'Golang',
    'Flutter',
    'Solidity',
    'Figma',
    'Next.js',
    'PostgreSQL',
    'TensorFlow',
  ];

  const goalOptions = [
    'Find summer internships',
    'Win hackathons',
    'Build open-source projects',
    'Find project teammates',
    'Attend Bengaluru tech meetups',
    'Crack competitive programming',
    'Prepare for technical interviews',
    'Publish research papers',
  ];

  const interestOptions = [
    'AI & ML',
    'Full-Stack Engineering',
    'Cybersecurity',
    'Robotics & IoT',
    'Competitive Programming',
    'Cloud & DevOps',
    'Startups & Product',
    'Design & UI/UX',
    'Open Source',
  ];

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    if (list.includes(item)) {
      setList(list.filter((x) => x !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFinish = () => {
    onSave({
      department,
      year,
      skills: selectedSkills,
      careerGoals: selectedGoals,
      interests: selectedInterests,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-900 shadow-2xl">
        {/* Top Progress Bar */}
        <div className="h-1.5 w-full bg-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Personalize Your NCET CONNECT Experience
              </h2>
              <p className="text-[11px] text-slate-400">Step {step} of 4</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {/* STEP 1: Academic Profile */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <GraduationCap className="h-4 w-4" />
                <span>Academic Information</span>
              </div>
              <h3 className="text-base font-bold text-white">
                What department and year are you in?
              </h3>
              <p className="text-xs text-slate-400">
                This helps customize campus events, eligibility criteria, and academic notices.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Department</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="AIML">AI & Machine Learning (AIML)</option>
                    <option value="ISE">Information Science (ISE)</option>
                    <option value="ECE">Electronics & Comm (ECE)</option>
                    <option value="ME">Mechanical Engg (ME)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-slate-300 font-medium">Academic Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Skills & Technologies */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Code2 className="h-4 w-4" />
                <span>Tech Stack & Skills</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Select technologies you work with or want to learn
              </h3>
              <p className="text-xs text-slate-400">
                Powers your AI match score for hackathons, workshops, and internship recommendations.
              </p>

              <div className="flex flex-wrap gap-2 pt-2 max-h-56 overflow-y-auto">
                {techOptions.map((tech) => {
                  const selected = selectedSkills.includes(tech);
                  return (
                    <button
                      key={tech}
                      type="button"
                      onClick={() => toggleItem(selectedSkills, setSelectedSkills, tech)}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                        selected
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-sm'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {tech}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Career Goals */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Target className="h-4 w-4" />
                <span>Your Immediate Goals</span>
              </div>
              <h3 className="text-base font-bold text-white">
                What are you looking to achieve this semester?
              </h3>
              <p className="text-xs text-slate-400">
                We'll prioritize opportunities that directly align with your goals.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 max-h-56 overflow-y-auto">
                {goalOptions.map((goal) => {
                  const selected = selectedGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleItem(selectedGoals, setSelectedGoals, goal)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-left text-xs font-medium transition-all ${
                        selected
                          ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          selected
                            ? 'border-emerald-400 bg-emerald-500 text-black'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {selected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="truncate">{goal}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Community Circles */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <Users className="h-4 w-4" />
                <span>Campus Circles & Communities</span>
              </div>
              <h3 className="text-base font-bold text-white">
                Which student circles would you like to explore?
              </h3>
              <p className="text-xs text-slate-400">
                Connect with like-minded peers in student-led technical circles.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 max-h-56 overflow-y-auto">
                {interestOptions.map((circle) => {
                  const selected = selectedInterests.includes(circle);
                  return (
                    <button
                      key={circle}
                      type="button"
                      onClick={() => toggleItem(selectedInterests, setSelectedInterests, circle)}
                      className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all ${
                        selected
                          ? 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300 shadow-sm'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{circle}</span>
                        {selected && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-2">Active Circle</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/60 px-6 py-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-slate-400 hover:text-slate-200"
            >
              Skip for now
            </button>
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
            >
              Continue
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/50"
            >
              <Compass className="h-3.5 w-3.5" />
              Generate My Discovery Home
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
