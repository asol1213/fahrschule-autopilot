"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  ChevronRight,
  Sparkles,
  Info,
} from "lucide-react";
import type { Question } from "@/data/questions";

// Static constants — avoid recreating on every render
const difficultyColors = {
  easy: "text-green-400 bg-green-500/10 border-green-500/20",
  medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  hard: "text-red-400 bg-red-500/10 border-red-500/20",
} as const;

const difficultyLabels = {
  easy: "Leicht",
  medium: "Mittel",
  hard: "Schwer",
} as const;

interface QuestionCardProps {
  question: Question;
  onAnswer: (selectedAnswers: number[], question: Question) => void;
  onNext: () => void;
  onShowTutor: () => void;
  questionNumber: number;
  totalQuestions: number;
  /** If provided, the question was already answered — show result state immediately */
  previousAnswer?: { userAnswers: number[]; correct: boolean } | null;
}

export default function QuestionCard({
  question,
  onAnswer,
  onNext,
  onShowTutor,
  questionNumber,
  totalQuestions,
  previousAnswer,
}: QuestionCardProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(
    previousAnswer?.userAnswers ?? []
  );
  const [submitted, setSubmitted] = useState(!!previousAnswer);
  const [isCorrect, setIsCorrect] = useState(previousAnswer?.correct ?? false);

  // Reset state when question changes (key might not change in exam grid nav)
  // This pattern (setState during render based on changed props) is recommended by React:
  // https://react.dev/reference/react/useState#storing-information-from-previous-renders
  const [prevQuestionId, setPrevQuestionId] = useState(question.id);
  const [prevPreviousAnswer, setPrevPreviousAnswer] = useState(previousAnswer);
  if (prevQuestionId !== question.id || prevPreviousAnswer !== previousAnswer) {
    setPrevQuestionId(question.id);
    setPrevPreviousAnswer(previousAnswer);
    if (previousAnswer) {
      setSelectedAnswers(previousAnswer.userAnswers);
      setSubmitted(true);
      setIsCorrect(previousAnswer.correct);
    } else {
      setSelectedAnswers([]);
      setSubmitted(false);
      setIsCorrect(false);
    }
  }

  const multipleCorrect =
    question.answers.filter((a) => a.correct).length > 1;

  const handleToggle = (index: number) => {
    if (submitted) return;

    if (multipleCorrect) {
      setSelectedAnswers((prev) =>
        prev.includes(index)
          ? prev.filter((i) => i !== index)
          : [...prev, index]
      );
    } else {
      setSelectedAnswers([index]);
    }
  };

  const handleSubmit = useCallback(() => {
    if (selectedAnswers.length === 0 || submitted) return;

    const correctIndices = question.answers
      .map((a, i) => (a.correct ? i : -1))
      .filter((i) => i !== -1);

    const correct =
      selectedAnswers.length === correctIndices.length &&
      selectedAnswers.every((i) => correctIndices.includes(i));

    setIsCorrect(correct);
    setSubmitted(true);
    onAnswer(selectedAnswers, question);
  }, [selectedAnswers, submitted, question, onAnswer]);

  const handleNext = () => {
    setSelectedAnswers([]);
    setSubmitted(false);
    setIsCorrect(false);
    onNext();
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -30 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-border bg-surface/50 overflow-hidden"
      >
        {/* Question header */}
        <div className="px-5 sm:px-8 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${difficultyColors[question.difficulty]}`}
              >
                {difficultyLabels[question.difficulty]}
              </span>
              <span className="text-[11px] text-muted">
                {question.points} Punkt{question.points > 1 ? "e" : ""}
              </span>
            </div>
            {multipleCorrect && (
              <span className="text-[11px] text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                Mehrfachauswahl
              </span>
            )}
          </div>

          <h2 className="text-base sm:text-lg font-semibold leading-relaxed">
            {question.question}
          </h2>

          {/* Question image */}
          {question.image && (
            <div className="mt-4 rounded-xl overflow-hidden border border-border bg-surface-light">
              <Image
                src={question.image}
                alt="Verkehrssituation"
                width={600}
                height={400}
                className="w-full max-h-[300px] object-contain"
                unoptimized
                onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }}
              />
            </div>
          )}
        </div>

        {/* Answers */}
        <div className="px-5 sm:px-8 pb-2 space-y-2.5" role={multipleCorrect ? "group" : "radiogroup"} aria-label="Antwortmöglichkeiten">
          {question.answers.map((answer, index) => {
            const isSelected = selectedAnswers.includes(index);
            const isCorrectAnswer = answer.correct;

            let borderColor = "border-border";
            let bgColor = "bg-surface-light/50";
            let textColor = "text-foreground";

            if (submitted) {
              if (isCorrectAnswer) {
                borderColor = "border-green-500/50";
                bgColor = "bg-green-500/10";
                textColor = "text-green-300";
              } else if (isSelected && !isCorrectAnswer) {
                borderColor = "border-red-500/50";
                bgColor = "bg-red-500/10";
                textColor = "text-red-300";
              } else {
                bgColor = "bg-surface-light/30";
                textColor = "text-muted";
              }
            } else if (isSelected) {
              borderColor = "border-primary/50";
              bgColor = "bg-primary/10";
            }

            return (
              <motion.button
                key={index}
                onClick={() => handleToggle(index)}
                disabled={submitted}
                role={multipleCorrect ? "checkbox" : "radio"}
                aria-checked={isSelected}
                whileHover={!submitted ? { scale: 1.005 } : {}}
                whileTap={!submitted ? { scale: 0.995 } : {}}
                className={`w-full flex items-center gap-3 text-left p-3.5 sm:p-4 rounded-xl border ${borderColor} ${bgColor} ${textColor} transition-all duration-200 ${
                  !submitted
                    ? "hover:border-primary/30 hover:bg-surface-light cursor-pointer"
                    : "cursor-default"
                }`}
              >
                {/* Checkbox/Radio indicator */}
                <div
                  className={`shrink-0 w-5 h-5 ${multipleCorrect ? "rounded-md" : "rounded-full"} border-2 flex items-center justify-center transition-all ${
                    submitted && isCorrectAnswer
                      ? "border-green-500 bg-green-500"
                      : submitted && isSelected && !isCorrectAnswer
                        ? "border-red-500 bg-red-500"
                        : isSelected
                          ? "border-primary bg-primary"
                          : "border-border"
                  }`}
                >
                  {submitted && isCorrectAnswer && (
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  )}
                  {submitted && isSelected && !isCorrectAnswer && (
                    <XCircle className="h-3 w-3 text-white" />
                  )}
                  {!submitted && isSelected && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>

                <span className="text-sm leading-relaxed">{answer.text}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Explanation (after submit) */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 sm:px-8 py-4"
            >
              <div
                className={`rounded-xl p-4 border ${
                  isCorrect
                    ? "bg-green-500/5 border-green-500/20"
                    : "bg-orange-500/5 border-orange-500/20"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <Info
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      isCorrect ? "text-green-400" : "text-orange-400"
                    }`}
                  />
                  <div>
                    <p
                      className={`text-sm font-medium mb-1 ${
                        isCorrect ? "text-green-400" : "text-orange-400"
                      }`}
                    >
                      {isCorrect ? "Richtig!" : "Leider falsch"}
                    </p>
                    <p className="text-sm text-muted leading-relaxed">
                      {question.explanation}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="px-5 sm:px-8 pb-6 pt-2 flex items-center justify-between">
          {!submitted ? (
            <>
              <div />
              <button
                onClick={handleSubmit}
                disabled={selectedAnswers.length === 0}
                className={`inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-all ${
                  selectedAnswers.length > 0
                    ? "bg-primary text-white hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/25"
                    : "bg-surface-lighter text-muted cursor-not-allowed"
                }`}
              >
                Prüfen
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onShowTutor}
                className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-medium text-purple-400 hover:bg-purple-500/20 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">AI-Tutor fragen</span>
                <span className="sm:hidden">AI Tutor</span>
              </button>
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark transition-all"
              >
                {questionNumber < totalQuestions ? "Nächste Frage" : "Ergebnis"}
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
