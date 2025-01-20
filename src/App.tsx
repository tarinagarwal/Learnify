import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthGuard from "./components/AuthGuard";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Quiz from "./components/Quiz";
import History from "./pages/History";
import Resources from "./pages/Resources";
import PdfChat from "./pages/PdfChat";
import Courses from "./pages/Courses";
import ChapterContent from "./pages/ChapterContent";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/quiz"
            element={
              <AuthGuard>
                <Quiz />
              </AuthGuard>
            }
          />
          <Route
            path="/history"
            element={
              <AuthGuard>
                <History />
              </AuthGuard>
            }
          />
          <Route
            path="/resources"
            element={
              <AuthGuard>
                <Resources />
              </AuthGuard>
            }
          />
          <Route
            path="/pdf-chat"
            element={
              <AuthGuard>
                <PdfChat />
              </AuthGuard>
            }
          />
          <Route
            path="/courses"
            element={
              <AuthGuard>
                <Courses />
              </AuthGuard>
            }
          />
          <Route
            path="/courses/:courseId/chapters/:chapterId"
            element={
              <AuthGuard>
                <ChapterContent />
              </AuthGuard>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
