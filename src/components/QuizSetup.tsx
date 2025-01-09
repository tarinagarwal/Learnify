import React, { useState, useEffect } from "react";
import { Settings, Upload } from "lucide-react";
import type { QuizConfig } from "../types/quiz";
import { extractTextFromPdf } from "../utils/pdfExtractor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Props {
  onStart: (config: QuizConfig) => void;
  initialConfig?: QuizConfig;
}

export default function QuizSetup({ onStart, initialConfig }: Props) {
  const [topic, setTopic] = useState(initialConfig?.topic || "");
  const [difficulty, setDifficulty] = useState(
    initialConfig?.difficulty || "medium"
  );
  const [numQuestions, setNumQuestions] = useState(
    initialConfig?.numQuestions || 5
  );
  const [quizType, setQuizType] = useState<"topic" | "pdf">("topic");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedPdfContent = sessionStorage.getItem("pdfContent");
    const storedPdfName = sessionStorage.getItem("pdfName");
    const storedTopic = sessionStorage.getItem("quizTopic");

    if (storedPdfContent && storedPdfName) {
      setQuizType("pdf");
      onStart({
        topic: storedPdfName,
        difficulty,
        numQuestions,
        pdfContent: storedPdfContent,
      });
      sessionStorage.removeItem("pdfContent");
      sessionStorage.removeItem("pdfName");
      sessionStorage.removeItem("pdfUrl");
    } else if (storedTopic) {
      setTopic(storedTopic);
      sessionStorage.removeItem("quizTopic");
      sessionStorage.removeItem("quizContent");
    }
  }, []);

  const handlePdfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a valid PDF file");
      return;
    }

    try {
      setLoading(true);
      const fileUrl = URL.createObjectURL(file);
      setPdfFile(file);
      const pdfText = await extractTextFromPdf(file);
      onStart({
        topic: file.name,
        difficulty,
        numQuestions,
        pdfContent: pdfText,
      });
    } catch (error) {
      setError("Error processing PDF file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (quizType === "pdf" && pdfFile) {
        const pdfText = await extractTextFromPdf(pdfFile);
        onStart({
          topic: pdfFile.name,
          difficulty,
          numQuestions,
          pdfContent: pdfText,
        });
      } else {
        onStart({ topic, difficulty, numQuestions });
      }
    } catch (error) {
      setError("Error processing PDF file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className=""> 
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Quiz Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <RadioGroup
            defaultValue="topic"
            onValueChange={(value) => setQuizType(value as "topic" | "pdf")}
          >
            <div className="flex space-x-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="topic" id="topic" />
                <Label htmlFor="topic">By Topic</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">From PDF</Label>
              </div>
            </div>
          </RadioGroup>

          {error && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded">
              {error}
            </div>
          )}

          {quizType === "topic" ? (
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                type="text"
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                readOnly={!!initialConfig?.topic}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">Upload PDF</Label>
              <div className="flex items-center justify-center w-full">
                <Label
                  htmlFor="pdf-upload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF (MAX. 10MB)
                    </p>
                  </div>
                  <Input
                    id="pdf-upload"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handlePdfChange}
                    required={quizType === "pdf"}
                  />
                </Label>
              </div>
              {pdfFile && (
                <p className="text-sm text-muted-foreground">{pdfFile.name}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={difficulty} onValueChange={setDifficulty}>
              <SelectTrigger id="difficulty">
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="numQuestions">Number of Questions</Label>
            <Input
              type="number"
              id="numQuestions"
              min="1"
              max="10"
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || (quizType === "pdf" && !pdfFile)}
            className="w-full"
          >
            {loading ? "Processing..." : "Start Quiz"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
