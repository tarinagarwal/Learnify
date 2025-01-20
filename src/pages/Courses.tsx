import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Book,
  Plus,
  ChevronRight,
  Loader2,
  Search,
  BookmarkCheck,
  Bookmark,
  BookIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  generateCourseOutline,
  generateChapterContent,
} from "../services/groq";
import type { Course, Chapter } from "../types/course";
import StarRating from "@/components/StarRating"; // Adjust import path
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchBar } from "@/components/SearchBar"; // Adjust import path
import { usePagination } from "@/hooks/use-pagination"; // Adjust import path
import { useBookmarks } from "@/hooks/use-bookmarks"; // Adjust import path
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"; // Adjust import path

interface CourseWithRating extends Course {
  average_rating?: number;
  total_ratings?: number;
  user_rating?: number;
  chapters?: Chapter[];
}

const ITEMS_PER_PAGE = 6;

export default function Courses() {
  const navigate = useNavigate();

  // ---------------------------
  // State variables
  // ---------------------------
  const [courses, setCourses] = useState<CourseWithRating[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithRating[]>(
    []
  );
  const [selectedCourse, setSelectedCourse] = useState<CourseWithRating | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [ratingLoading, setRatingLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showBookmarked, setShowBookmarked] = useState(false);

  const chaptersRef = useRef<HTMLDivElement | null>(null);

  // ---------------------------
  // Hooks for pagination/bookmarks
  // ---------------------------
  const {
    bookmarks,
    loading: bookmarksLoading,
    addBookmark,
    removeBookmark,
    isBookmarked,
  } = useBookmarks("course");

  const {
    currentItems,
    currentPage,
    totalPages,
    nextPage,
    previousPage,
    goToPage,
  } = usePagination({
    items: filteredCourses,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // ---------------------------
  // Effects
  // ---------------------------
  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses by search or bookmarked status
  useEffect(() => {
    let newFiltered = courses;

    // Apply search filter (by title or description)
    if (searchQuery) {
      newFiltered = newFiltered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply bookmark filter

    if (showBookmarked) {
      //@ts-ignore
      newFiltered = newFiltered.filter((course) => isBookmarked(course.id));
    }

    setFilteredCourses(newFiltered);
  }, [courses, searchQuery, showBookmarked, bookmarks, isBookmarked]);

  // ---------------------------
  // Supabase queries
  // ---------------------------
  const fetchCourses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      setLoading(true);

      // Fetch all courses
      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      // For each course, get average rating, total ratings, and user's rating
      const coursesWithRatings: CourseWithRating[] = await Promise.all(
        (coursesData || []).map(async (course) => {
          // average rating + total ratings
          const { data: ratingData } = await supabase.rpc("get_course_rating", {
            course_uuid: course.id,
          });

          // user rating (use maybeSingle for safety)
          const { data: userRating } = await supabase
            .from("course_ratings")
            .select("rating")
            .eq("course_id", course.id)
            .eq("user_id", user.id)
            .maybeSingle();

          return {
            ...course,
            average_rating: ratingData?.[0]?.average_rating || 0,
            total_ratings: ratingData?.[0]?.total_ratings || 0,
            user_rating: userRating?.rating || 0,
          };
        })
      );

      setCourses(coursesWithRatings);
      setFilteredCourses(coursesWithRatings);
    } catch (err) {
      console.error("Error fetching courses:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchChaptersForCourse = async (course: CourseWithRating) => {
    try {
      const { data: chapters, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("course_id", course.id)
        .order("order_index");

      if (error) throw error;

      return chapters as Chapter[];
    } catch (error) {
      console.error("Error fetching chapters:", error);
      return [];
    }
  };

  // ---------------------------
  // Handlers
  // ---------------------------
  const handleCourseClick = async (course: CourseWithRating) => {
    // Fetch chapters for this course
    const courseChapters = await fetchChaptersForCourse(course);
    setSelectedCourse({ ...course, chapters: courseChapters });

    // Scroll to the chapters section
    setTimeout(() => {
      chaptersRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  };

  const handleRating = async (courseId: string, rating: number) => {
    try {
      setRatingLoading(courseId);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Upsert rating
      const { error } = await supabase.from("course_ratings").upsert(
        {
          course_id: courseId,
          user_id: user.id,
          rating,
        },
        {
          onConflict: "course_id,user_id",
        }
      );

      if (error) throw error;

      // Refresh courses to update average rating & user rating
      await fetchCourses();

      // If the currently selected course is the same, refetch its chapters
      if (selectedCourse?.id === courseId) {
        const updatedChapters = await fetchChaptersForCourse(selectedCourse);
        setSelectedCourse((prev) =>
          prev
            ? {
                ...prev,
                user_rating: rating,
                chapters: updatedChapters,
              }
            : prev
        );
      }
    } catch (error) {
      console.error("Error rating course:", error);
    } finally {
      setRatingLoading(null);
    }
  };

  const handleCreateCourse = async () => {
    if (!topic.trim()) return;

    try {
      setGenerating(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // Generate outline via your service
      const outline = await generateCourseOutline(topic);

      // Insert course
      const { data: newCourse, error: courseError } = await supabase
        .from("courses")
        .insert({
          title: outline.title,
          description: outline.description,
          user_id: user.id,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      // Insert chapters based on the generated outline
      const chaptersPromises = outline.chapters.map(async (chapterOutline) => {
        const content = await generateChapterContent(
          outline.title,
          chapterOutline.title,
          chapterOutline.description
        );

        return supabase.from("chapters").insert({
          course_id: newCourse.id,
          title: chapterOutline.title,
          content,
          order_index: chapterOutline.order_index,
        });
      });

      await Promise.all(chaptersPromises);

      setTopic("");
      fetchCourses();
    } catch (error) {
      console.error("Error creating course:", error);
    } finally {
      setGenerating(false);
    }
  };

  const toggleBookmark = async (courseId: string) => {
    if (isBookmarked(courseId)) {
      await removeBookmark(courseId);
    } else {
      await addBookmark(courseId);
    }
  };

  // ---------------------------
  // Rendering
  // ---------------------------
  // If still loading courses or bookmarks, show skeleton
  if (loading || bookmarksLoading) {
    return (
      <div className="min-h-screen bg-gray-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Book className="mx-auto h-16 w-16 text-primary" />
            <h2 className="mt-2 text-4xl font-bold text-primary">Courses</h2>
            <p className="mt-2 text-xl text-muted-foreground">
              Expand your knowledge with our interactive courses
            </p>
          </div>

          {/* Search and Bookmark Toggles */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search courses..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Bookmark toggle */}
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

              {/* Create Course Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Course
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Course</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="topic">Course Topic</Label>
                      <Input
                        id="topic"
                        placeholder="Enter a topic for the course"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={handleCreateCourse}
                      disabled={generating || !topic.trim()}
                      className="w-full"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating Course...
                        </>
                      ) : (
                        "Create Course"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {/* Skeleton Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="animate-pulse bg-gray-100">
                  <CardHeader>
                    {/* Large placeholder (thumbnail-like) */}
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
        {/* Header */}
        <div className="text-center mb-12">
          <Book className="mx-auto h-16 w-16 text-primary" />
          <h2 className="mt-2 text-4xl font-bold text-primary">Courses</h2>
          <p className="mt-2 text-xl text-muted-foreground">
            Expand your knowledge with our interactive courses
          </p>
        </div>

        {/* Search and Bookmark Toggles */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search courses..."
          />

          <div className="flex gap-2">
            {/* Bookmark toggle */}
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

            {/* Create Course Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Course</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">Course Topic</Label>
                    <Input
                      id="topic"
                      placeholder="Enter a topic for the course"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleCreateCourse}
                    disabled={generating || !topic.trim()}
                    className="w-full"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Course...
                      </>
                    ) : (
                      "Create Course"
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Main Content */}
        {filteredCourses.length === 0 ? (
          /* No courses (or no bookmarked courses) found */
          <Card className="text-center p-8 bg-gray-100">
            <CardContent>
              <Book className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                {showBookmarked
                  ? "No bookmarked courses found"
                  : "No courses found"}
              </p>
              <p className="mt-2 text-muted-foreground">
                {showBookmarked
                  ? "Bookmark some courses to see them here"
                  : "Try a different search term or create a new course"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* List of Courses (paginated) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentItems.map((course) => (
                <Card
                  key={course.id}
                  onClick={() => handleCourseClick(course)}
                  className={`transition-shadow bg-gray-100 hover:shadow-lg flex flex-col cursor-pointer ${
                    selectedCourse?.id === course.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle>{course.title}</CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          // Prevent the card click from firing
                          e.stopPropagation();
                          //@ts-ignore
                          toggleBookmark(course.id);
                        }}
                      >
                        {isBookmarked(
                          //@ts-ignore
                          course.id
                        ) ? (
                          <BookmarkCheck className="h-5 w-5" />
                        ) : (
                          <Bookmark className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardFooter className="flex flex-col gap-2 mt-auto">
                    <StarRating
                      rating={course.average_rating || 0}
                      totalRatings={course.total_ratings || 0}
                      userRating={course.user_rating}
                      onRate={(r) =>
                        handleRating(
                          //@ts-ignore
                          course.id,
                          r
                        )
                      }
                      //@ts-ignore
                      loading={ratingLoading === course.id}
                    />
                  </CardFooter>
                </Card>
              ))}
            </div>

            {/* Pagination controls */}
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

        {/* If a course is selected, show its chapters */}
        {selectedCourse && (
          <Card className="mt-8 bg-gray-100" ref={chaptersRef}>
            <CardHeader>
              <CardTitle>{selectedCourse.title}</CardTitle>
              <CardDescription>{selectedCourse.description}</CardDescription>
              <div className="mt-2">
                <StarRating
                  rating={selectedCourse.average_rating || 0}
                  totalRatings={selectedCourse.total_ratings || 0}
                  userRating={selectedCourse.user_rating}
                  onRate={(r) =>
                    selectedCourse.id && handleRating(selectedCourse.id, r)
                  }
                  //@ts-ignore
                  loading={ratingLoading === selectedCourse.id}
                />
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Chapters</h3>
              {selectedCourse.chapters?.length ? (
                <div className="space-y-2">
                  {selectedCourse.chapters.map((chapter) => (
                    <button
                      key={chapter.id}
                      onClick={() =>
                        navigate(
                          `/courses/${selectedCourse.id}/chapters/${chapter.id}`
                        )
                      }
                      className="w-full text-left px-4 py-3 rounded-md hover:bg-muted transition-colors flex items-center justify-between"
                    >
                      <span>{chapter.title}</span>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No chapters found.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
