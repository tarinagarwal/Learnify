import React, { useState, useEffect } from "react";
import { Brain } from "lucide-react";
import QuizSetup from "./QuizSetup";
import QuizQuestion from "./QuizQuestion";
import QuizResults from "./QuizResults";
import { generateQuestions } from "../services/groq";
import { supabase } from "../lib/supabase";
import type { Question, QuizConfig } from "../types/quiz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Quiz() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);

  useEffect(() => {
    const storedTopic = sessionStorage.getItem("quizTopic");
    const storedContent = sessionStorage.getItem("quizContent");

    if (storedTopic) {
      setQuizConfig({
        topic: storedTopic,
        difficulty: "medium",
        numQuestions: 5,
        ...(storedContent && { pdfContent: storedContent }),
      });

      sessionStorage.removeItem("quizTopic");
      sessionStorage.removeItem("quizContent");
    }
  }, []);

  const handleStart = async (config: QuizConfig) => {
    setLoading(true);
    setError(null);
    setQuizConfig(config);

    try {
      const generatedQuestions = await generateQuestions(config);
      setQuestions(generatedQuestions);
      setCurrentQuestion(0);
      setUserAnswers([]);
    } catch (err) {
      setError("Failed to generate questions. Please try again.");
    }
    setLoading(false);
  };

  const handleAnswer = async (answer: string) => {
    const newAnswers = [...userAnswers, answer];
    setUserAnswers(newAnswers);

    if (currentQuestion === questions.length - 1) {
      const score = newAnswers.reduce(
        (acc, ans, idx) =>
          questions[idx].correctAnswer === ans ? acc + 1 : acc,
        0
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && quizConfig) {
        await supabase.from("quiz_history").insert({
          user_id: user.id,
          topic: quizConfig.topic,
          score,
          total_questions: questions.length,
          questions,
          answers: newAnswers,
        });
      }
    }

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handleRestart = () => {
    setQuestions([]);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setError(null);
    setQuizConfig(null);
  };

  return (
    <div className="min-h-screen bg-gray-200 container mx-auto py-12 px-4">
      <Card className="max-w-4xl mx-auto bg-gray-100">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold">Quiz Master</CardTitle>
          <p className="text-muted-foreground">
            Test your knowledge on any topic!
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">
                Generating your quiz...
              </p>
            </div>
          ) : error ? (
            <div className="text-center">
              <p className="text-destructive">{error}</p>
              <Button onClick={handleRestart} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : questions.length === 0 ? (
            <QuizSetup onStart={handleStart} />
          ) : userAnswers.length === questions.length ? (
            <QuizResults
              questions={questions}
              userAnswers={userAnswers}
              onRestart={handleRestart}
            />
          ) : (
            <QuizQuestion
              question={questions[currentQuestion]}
              onAnswer={handleAnswer}
              currentQuestion={currentQuestion}
              totalQuestions={questions.length}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
