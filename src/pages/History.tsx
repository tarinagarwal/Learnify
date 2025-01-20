import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  HistoryIcon,
  X,
  ChevronRight,
  Award,
  Calendar,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import QuizResults from "../components/QuizResults";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SearchBar } from "@/components/SearchBar";
import { usePagination } from "@/hooks/use-pagination";
import { useBookmarks } from "@/hooks/use-bookmarks";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface QuizHistory {
  id: string;
  topic: string;
  score: number;
  total_questions: number;
  created_at: string;
  questions: any[];
  answers: string[];
}

const ITEMS_PER_PAGE = 6;

export default function History() {
  const [history, setHistory] = useState<QuizHistory[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<QuizHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<QuizHistory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBookmarked, setShowBookmarked] = useState(false);

  const {
    bookmarks,
    loading: bookmarksLoading,
    addBookmark,
    removeBookmark,
    isBookmarked,
  } = useBookmarks("quiz");

  const {
    currentItems,
    currentPage,
    totalPages,
    nextPage,
    previousPage,
    goToPage,
  } = usePagination({
    items: filteredHistory,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    let filtered = history;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((quiz) =>
        quiz.topic.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply bookmarks filter
    if (showBookmarked) {
      filtered = filtered.filter((quiz) => isBookmarked(quiz.id));
    }

    setFilteredHistory(filtered);
  }, [history, searchQuery, showBookmarked, bookmarks, isBookmarked]);

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

  const toggleBookmark = async (quizId: string) => {
    if (isBookmarked(quizId)) {
      await removeBookmark(quizId);
    } else {
      await addBookmark(quizId);
    }
  };

  // ---------------------------
  // Skeleton Loading
  // ---------------------------
  if (loading || bookmarksLoading) {
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

          {/* Skeleton Cards (6) */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="animate-pulse bg-gray-100">
                  <CardHeader>
                    {/* "Thumbnail" placeholder */}
                    <div className="h-48 bg-gray-200 rounded-md mb-4" />
                    {/* Title placeholder */}
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                    {/* Subtitle placeholder */}
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-8 bg-gray-200 rounded" />
                      <div className="h-8 bg-gray-200 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
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

        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search quizzes..."
          />
          <Button
            variant={showBookmarked ? "default" : "outline"}
            onClick={() => setShowBookmarked(!showBookmarked)}
          >
            {showBookmarked ? (
              <BookmarkCheck className="h-4 w-4 mr-2" />
            ) : (
              <Bookmark className="h-4 w-4 mr-2" />
            )}
            {showBookmarked ? "Show All" : "Show Bookmarked"}
          </Button>
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
        ) : filteredHistory.length === 0 ? (
          <Card className="text-center p-8 bg-gray-100">
            <CardContent>
              <HistoryIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                {showBookmarked
                  ? "No bookmarked quizzes found"
                  : "Your learning journey is about to begin!"}
              </p>
              <p className="mt-2 text-muted-foreground">
                {showBookmarked
                  ? "Bookmark some quizzes to see them here"
                  : "Take your first quiz to see your progress here."}
              </p>
              <Button className="mt-6" asChild>
                <a href="/quiz">Start a Quiz</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {currentItems.map((quiz) => (
                <Card
                  key={quiz.id}
                  className="hover:shadow-lg bg-gray-100 transition-shadow cursor-pointer"
                  onClick={() => setSelectedQuiz(quiz)}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-primary truncate pr-8">
                        {quiz.topic}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(quiz.id);
                        }}
                      >
                        {isBookmarked(quiz.id) ? (
                          <BookmarkCheck className="h-5 w-5" />
                        ) : (
                          <Bookmark className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
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
                          width: `${
                            (quiz.score / quiz.total_questions) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 overflow-x-auto whitespace-nowrap">
                <Pagination className="inline-flex items-center gap-2">
                  <PaginationContent className="flex">
                    {/* Previous Button */}
                    <PaginationItem>
                      <PaginationPrevious onClick={previousPage} />
                    </PaginationItem>

                    {/* Pages with Ellipsis (show max 3 page numbers: first, current, last) */}
                    {(() => {
                      const pagesToShow = [];

                      if (totalPages <= 3) {
                        // If there are 3 or fewer pages, show them all directly
                        for (let i = 1; i <= totalPages; i++) {
                          pagesToShow.push(i);
                        }
                      } else {
                        // Always show first page
                        pagesToShow.push(1);

                        // If currentPage is greater than 2, we have a gap -> add ellipsis
                        if (currentPage > 2) {
                          pagesToShow.push("...");
                        }

                        // If current is neither the first nor the last, show it
                        if (currentPage > 1 && currentPage < totalPages) {
                          pagesToShow.push(currentPage);
                        }

                        // If currentPage is at least 2 less than totalPages, we have a gap -> add ellipsis
                        if (currentPage < totalPages - 1) {
                          pagesToShow.push("...");
                        }

                        // Always show last page (unless totalPages is 1, but we have the check above)
                        if (totalPages !== 1) {
                          pagesToShow.push(totalPages);
                        }
                      }

                      // Render pages or ellipses
                      return pagesToShow.map((page, index) => {
                        if (page === "...") {
                          // Render ellipses
                          return (
                            //@ts-ignore
                            <PaginationItem key={`dots-${index}`} disabled>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          );
                        }
                        // Render normal page number
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                            //@ts-ignore
                              onClick={() => goToPage(page)}
                              isActive={currentPage === page}
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      });
                    })()}

                    {/* Next Button */}
                    <PaginationItem>
                      <PaginationNext onClick={nextPage} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
