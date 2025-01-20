import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Brain, BookOpen, FileText, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gray-200 py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary sm:text-5xl md:text-6xl">
              Welcome to Learnify
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
              Empower your learning journey with interactive quizzes,
              comprehensive courses, and advanced PDF tools.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link to="/quiz">Start a Quiz</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/courses">Explore Courses</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-200 border-t border-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Discover Learnify's Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon={<Brain className="h-10 w-10 text-primary" />}
                title="Interactive Quiz System"
                description="Generate custom quizzes on any topic with adjustable difficulty levels and detailed explanations."
              />
              <FeatureCard
                icon={<BookOpen className="h-10 w-10 text-primary" />}
                title="Course Management"
                description="Create and manage structured courses with chapter-based content and progress tracking."
              />
              <FeatureCard
                icon={<FileText className="h-10 w-10 text-primary" />}
                title="Advanced PDF Tools"
                description="Analyze PDFs interactively, generate quizzes from content, and manage your document library."
              />
              <FeatureCard
                icon={<Users className="h-10 w-10 text-primary" />}
                title="User Management"
                description="Enjoy a personalized learning experience with secure profiles and progress tracking."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="transition-all bg-gray-100 duration-300 hover:shadow-lg">
      <CardHeader>
        <div className="mb-4">{icon}</div>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{description}</CardDescription>
      </CardContent>
    </Card>
  );
}
