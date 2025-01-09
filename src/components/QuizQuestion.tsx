import React from "react";
import type { Question } from "../types/quiz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Props {
  question: Question;
  onAnswer: (answer: string) => void;
  currentQuestion: number;
  totalQuestions: number;
}

export default function QuizQuestion({
  question,
  onAnswer,
  currentQuestion,
  totalQuestions,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          {question.question}
        </CardTitle>
        <Progress
          value={((currentQuestion + 1) / totalQuestions) * 100}
          className="mt-2"
        />
        <p className="text-sm text-muted-foreground mt-2">
          Question {currentQuestion + 1} of {totalQuestions}
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <Button
              key={index}
              onClick={() => onAnswer(option)}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4"
            >
              {option}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
