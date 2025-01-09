import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Book,
  Plus,
  ChevronRight,
  Loader2,
  Brain,
  Search,
  BookAIcon,
  BookIcon,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import {
  generateCourseOutline,
  generateChapterContent,
} from "../services/groq";
import type { Course, Chapter } from "../types/course";
import StarRating from "../components/StarRating";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

interface CourseWithRating extends Course {
  average_rating?: number;
  total_ratings?: number;
  user_rating?: number;
}

const Courses: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseWithRating[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithRating[]>(
    []
  );
  const [course] = useState<Course | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithRating | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState("");
  const [ratingLoading, setRatingLoading] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const chaptersRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    setFilteredCourses(
      courses.filter((course) =>
        course.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [courses, searchQuery]);

  const fetchCourses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data: coursesData, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (coursesError) throw coursesError;

      const coursesWithRatings = await Promise.all(
        coursesData.map(async (course) => {
          const { data: ratingData } = await supabase.rpc("get_course_rating", {
            course_uuid: course.id,
          });

          const { data: userRating } = await supabase
            .from("course_ratings")
            .select("rating")
            .eq("course_id", course.id)
            .eq("user_id", user.id)
            .single();

          return {
            ...course,
            average_rating: ratingData?.[0]?.average_rating || 0,
            total_ratings: ratingData?.[0]?.total_ratings || 0,
            user_rating: userRating?.rating,
          };
        })
      );

      setCourses(coursesWithRatings);
      setFilteredCourses(coursesWithRatings);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = async (course: CourseWithRating) => {
    try {
      const { data: chapters, error } = await supabase
        .from("chapters")
        .select("*")
        .eq("course_id", course.id)
        .order("order_index");

      if (error) throw error;

      setSelectedCourse({ ...course, chapters });

      setTimeout(() => {
        chaptersRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    } catch (error) {
      console.error("Error fetching chapters:", error);
    }
  };

  const handleRating = async (courseId: string, rating: number) => {
    try {
      setRatingLoading(courseId);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

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

      await fetchCourses();
    } catch (error) {
      console.error("Error rating course:", error);
    } finally {
      setRatingLoading(null);
    }
  };

  // const handleGenerateCourseQuiz = () => {
  //   sessionStorage.setItem("quizTopic", course?.title || "");
  //   sessionStorage.setItem("quizContent", course?.description || "");
  //   navigate("/quiz");
  // };

  const handleCreateCourse = async () => {
    if (!topic.trim()) return;

    try {
      setGenerating(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const outline = await generateCourseOutline(topic);

      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          title: outline.title,
          description: outline.description,
          user_id: user.id,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      const chaptersPromises = outline.chapters.map(async (chapterOutline) => {
        const content = await generateChapterContent(
          outline.title,
          chapterOutline.title,
          chapterOutline.description
        );

        return supabase.from("chapters").insert({
          course_id: course.id,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-xl text-primary">Loading Courses...</p>
        </div>
      </div>
    );
  }

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

        <div className="mb-8 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="relative w-full sm:w-64">
            <Input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 border-2 border-black"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
          </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.length === 0 ? (
            <div className="col-span-full text-center">
              <p className="text-muted-foreground">
                No courses found. Try a different search or create a new course.
              </p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <Card
                key={course.id}
                className={`transition-shadow bg-gray-100 hover:shadow-lg flex flex-col ${
                  selectedCourse?.id === course.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardHeader>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>{course.description}</CardDescription>
                </CardHeader>
                <CardFooter className="flex flex-col gap-2 justify-between mt-auto">
                  <StarRating
                    rating={course.average_rating || 0}
                    totalRatings={course.total_ratings || 0}
                    userRating={course.user_rating}
                    onRate={(rating) =>
                      course.id && handleRating(course.id, rating)
                    }
                    readonly={!course.id}
                  />
                  <Button
                    className="w-full "
                    onClick={() => handleCourseClick(course)}
                  >
                    <BookIcon className="h-4 w-4 mr-2" />
                    Show Chapters
                  </Button>
                  {/* <Button
                    className="w-full"
                    onClick={() => handleGenerateCourseQuiz()}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Generate Quiz
                  </Button> */}
                </CardFooter>
              </Card>
            ))
          )}
        </div>

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
                  onRate={(rating) =>
                    selectedCourse.id && handleRating(selectedCourse.id, rating)
                  }
                />
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-lg font-semibold mb-2">Chapters</h3>
              <div className="space-y-2">
                {selectedCourse.chapters?.map((chapter) => (
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Courses;
