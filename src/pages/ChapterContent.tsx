import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Brain, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Chapter, Course } from "../types/course";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ChapterContent() {
  const { courseId, chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [courseId, chapterId]);

  const fetchContent = async () => {
    try {
      const { data: chapterData, error: chapterError } = await supabase
        .from("chapters")
        .select("*")
        .eq("id", chapterId)
        .single();

      if (chapterError) throw chapterError;

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;

      setChapter(chapterData);
      setCourse(courseData);
    } catch (error) {
      console.error("Error fetching content:", error);
      navigate("/courses");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuiz = () => {
    sessionStorage.setItem("quizTopic", chapter?.title || "");
    sessionStorage.setItem("quizContent", chapter?.content || "");
    navigate("/quiz");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-xl text-primary">
            Loading Chapter Content...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(`/courses`)}
            className="inline-flex items-center text-primary hover:text-primary/80"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
          <Button
            onClick={handleGenerateQuiz}
            className="inline-flex items-center"
          >
            <Brain className="h-4 w-4 mr-2" />
            Generate Quiz
          </Button>
        </div>

        <Card className="shadow-lg bg-gray-100">
          <CardHeader>
            <CardDescription className="text-sm font-medium text-muted-foreground">
              {course?.title}
            </CardDescription>
            <CardTitle className="text-2xl font-bold text-primary">
              {chapter?.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-primary max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => (
                    <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />
                  ),
                  h2: ({ node, ...props }) => (
                    <h2
                      className="text-xl font-semibold mt-5 mb-3"
                      {...props}
                    />
                  ),
                  h3: ({ node, ...props }) => (
                    <h3 className="text-lg font-medium mt-4 mb-2" {...props} />
                  ),
                  p: ({ node, ...props }) => <p className="mb-4" {...props} />,
                  ul: ({ node, ...props }) => (
                    <ul className="list-disc pl-6 mb-4" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="list-decimal pl-6 mb-4" {...props} />
                  ),
                  li: ({ node, ...props }) => (
                    <li className="mb-1" {...props} />
                  ),
                  blockquote: ({ node, ...props }) => (
                    <blockquote
                      className="border-l-4 border-primary pl-4 italic my-4"
                      {...props}
                    />
                  ),
                  //@ts-ignore
                  code: ({ node, inline, ...props }) =>
                    inline ? (
                      <code
                        className="bg-[#1e2837] px-1 py-0.5 rounded text-sm"
                        {...props}
                      />
                    ) : (
                      <pre className="bg-[#1e2837] p-4 rounded-md overflow-x-auto">
                        <code className="text-sm" {...props} />
                      </pre>
                    ),
                }}
              >
                {chapter?.content || ""}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
