import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { HistoryIcon, X, ChevronRight, Award, Calendar } from "lucide-react";
import QuizResults from "../components/QuizResults";

// Assuming you have these components from your UI library
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface QuizHistory {
  id: string;
  topic: string;
  score: number;
  total_questions: number;
  created_at: string;
  questions: any[];
  answers: string[];
}

export default function History() {
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizHistory | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("quiz_history")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setHistory(data);
      }
      setLoading(false);
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-xl text-primary">
            Loading your learning journey...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <HistoryIcon className="mx-auto h-16 w-16 text-primary" />
          <h2 className="mt-2 text-4xl font-bold text-primary">
            Your Learning Journey
          </h2>
          <p className="mt-2 text-xl text-muted-foreground">
            Track your progress and revisit your quiz experiences
          </p>
        </div>

        {selectedQuiz ? (
          <Card className="mt-8 bg-gray-100">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl">{selectedQuiz.topic}</CardTitle>
                <CardDescription>
                  Completed on{" "}
                  {new Date(selectedQuiz.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={() => setSelectedQuiz(null)}>
                <X className="w-6 h-6" />
              </Button>
            </CardHeader>
            <CardContent>
              <QuizResults
                questions={selectedQuiz.questions}
                userAnswers={selectedQuiz.answers}
                onRestart={() => setSelectedQuiz(null)}
                isHistoryView={true}
              />
            </CardContent>
          </Card>
        ) : history.length === 0 ? (
          <Card className="text-center p-8">
            <CardContent>
              <HistoryIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                Your learning journey is about to begin!
              </p>
              <p className="mt-2 text-muted-foreground">
                Take your first quiz to see your progress here.
              </p>
              <Button className="mt-6" asChild>
                <a href="/quiz">Start a Quiz</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {history.map((quiz) => (
              <Card
                key={quiz.id}
                className="hover:shadow-lg bg-gray-100 transition-shadow cursor-pointer"
                onClick={() => setSelectedQuiz(quiz)}
              >
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span className="text-primary truncate">{quiz.topic}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center mt-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Award className="w-5 h-5 text-primary mr-2" />
                      <span className="font-semibold">Score:</span>
                    </div>
                    <span className="text-lg font-bold">
                      {quiz.score} / {quiz.total_questions}
                    </span>
                  </div>
                  <div className="mt-4 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(quiz.score / quiz.total_questions) * 100}%`,
                      }}
                    ></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
