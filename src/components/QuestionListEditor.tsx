"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MAX_QUESTION_OPTIONS,
  MIN_QUESTION_OPTIONS,
  createEmptyQuestion,
  isQuestionValid,
} from "@/lib/questionUtils";
import type { Question } from "@/types/quiz";
import { QuizAiQuestionBar } from "@/components/QuizAiQuestionBar";
import { QUIZ_SURFACE_CARD_CLASS } from "@/components/QuizQuestionCardHeader";

interface QuestionListEditorProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
  /** Quando false, oculta o bloco OpenRouter (ex.: quiz global com IA no topo). */
  showAiBar?: boolean;
}

export function QuestionListEditor({
  questions,
  onChange,
  showAiBar = true,
}: QuestionListEditorProps) {
  const updateQuestions = (updater: (current: Question[]) => Question[]) => {
    onChange(updater(questions));
  };

  const addQuestion = () => {
    updateQuestions((current) => [...current, createEmptyQuestion()]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    updateQuestions((current) => current.filter((_, i) => i !== index));
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;

    updateQuestions((current) => {
      const copy = [...current];
      [copy[index], copy[newIndex]] = [copy[newIndex], copy[index]];
      return copy;
    });
  };

  const updateQuestion = (index: number, updater: (question: Question) => Question) => {
    updateQuestions((current) => {
      const copy = [...current];
      copy[index] = updater(copy[index]);
      return copy;
    });
  };

  const addOption = (index: number) => {
    updateQuestion(index, (question) => {
      if (question.options.length >= MAX_QUESTION_OPTIONS) return question;
      return {
        ...question,
        options: [...question.options, ""],
      };
    });
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, (question) => {
      if (question.options.length <= MIN_QUESTION_OPTIONS) return question;

      const nextOptions = question.options.filter((_, index) => index !== optionIndex);
      let nextCorrectIndex = question.correctOptionIndex;

      if (optionIndex === question.correctOptionIndex) {
        nextCorrectIndex = 0;
      } else if (optionIndex < question.correctOptionIndex) {
        nextCorrectIndex -= 1;
      }

      return {
        ...question,
        options: nextOptions,
        correctOptionIndex: Math.max(0, nextCorrectIndex),
      };
    });
  };

  return (
    <div className="space-y-6">
      {showAiBar && (
        <QuizAiQuestionBar
          onAddQuestions={(generated) =>
            updateQuestions((current) => {
              const hasOnlyEmptyPlaceholder =
                current.length === 1 && !isQuestionValid(current[0]);
              return hasOnlyEmptyPlaceholder ? generated : [...current, ...generated];
            })
          }
        />
      )}

      {questions.map((question, questionIndex) => (
        <Card key={questionIndex} className={QUIZ_SURFACE_CARD_CLASS}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg">Pergunta {questionIndex + 1}</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => moveQuestion(questionIndex, "up")}
                disabled={questionIndex === 0}
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => moveQuestion(questionIndex, "down")}
                disabled={questionIndex === questions.length - 1}
              >
                ↓
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => removeQuestion(questionIndex)}
                disabled={questions.length <= 1}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Enunciado</label>
              <Input
                placeholder="Digite a pergunta..."
                value={question.text}
                onChange={(event) =>
                  updateQuestion(questionIndex, (current) => ({
                    ...current,
                    text: event.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <label className="block text-sm font-medium">
                  Alternativas (2 a 4, selecione a correta)
                </label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(questionIndex)}
                    disabled={question.options.length >= MAX_QUESTION_OPTIONS}
                  >
                    + Alternativa
                  </Button>
                </div>
              </div>

              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${questionIndex}`}
                    checked={question.correctOptionIndex === optionIndex}
                    onChange={() =>
                      updateQuestion(questionIndex, (current) => ({
                        ...current,
                        correctOptionIndex: optionIndex,
                      }))
                    }
                  />
                  <Input
                    placeholder={`Alternativa ${optionIndex + 1}`}
                    value={option}
                    onChange={(event) =>
                      updateQuestion(questionIndex, (current) => {
                        const options = [...current.options];
                        options[optionIndex] = event.target.value;
                        return { ...current, options };
                      })
                    }
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOption(questionIndex, optionIndex)}
                    disabled={question.options.length <= MIN_QUESTION_OPTIONS}
                  >
                    Remover
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addQuestion} className="w-full">
        + Adicionar Pergunta
      </Button>
    </div>
  );
}
