import React from "react";
import { Trophy, RefreshCw } from "lucide-react";
import type { Question } from "../types/quiz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface Props {
  questions: Question[];
  userAnswers: string[];
  onRestart: () => void;
  isHistoryView?: boolean;
}

export default function QuizResults({
  questions,
  userAnswers,
  onRestart,
  isHistoryView,
}: Props) {
  const score = questions.reduce(
    (acc, q, idx) => (q.correctAnswer === userAnswers[idx] ? acc + 1 : acc),
    0
  );

  const percentage = Math.round((score / questions.length) * 100);

  return (
    <Card className="">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Trophy className="w-12 h-12 text-yellow-500" />
        </div>
        <CardTitle className="text-2xl font-bold">
          {isHistoryView ? "Quiz Results" : "Quiz Complete!"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-8">
          <Progress value={percentage} className="w-full h-4 mb-2" />
          <p className="text-4xl font-bold text-primary">{percentage}%</p>
          <p className="text-muted-foreground">
            You got {score} out of {questions.length} questions correct
          </p>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <Card
              key={idx}
              className={
                q.correctAnswer === userAnswers[idx]
                  ? "border-green-500"
                  : "border-red-500"
              }
            >
              <CardContent className="p-4">
                <p className="font-medium mb-2">{q.question}</p>
                <p className="text-sm mb-1">
                  <span className="font-medium">Your answer:</span>{" "}
                  {userAnswers[idx]}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium">Correct answer:</span>{" "}
                  {q.correctAnswer}
                </p>
                <p className="text-sm text-muted-foreground">{q.explanation}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={onRestart} className="mt-8 w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          {isHistoryView ? "Back to History" : "Try Another Quiz"}
        </Button>
      </CardContent>
    </Card>
  );
}
