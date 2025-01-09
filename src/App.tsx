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
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <AuthGuard>
              <Layout>
                <Home />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/quiz"
          element={
            <AuthGuard>
              <Layout>
                <Quiz />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/history"
          element={
            <AuthGuard>
              <Layout>
                <History />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/resources"
          element={
            <AuthGuard>
              <Layout>
                <Resources />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/pdf-chat"
          element={
            <AuthGuard>
              <Layout>
                <PdfChat />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/courses"
          element={
            <AuthGuard>
              <Layout>
                <Courses />
              </Layout>
            </AuthGuard>
          }
        />
        <Route
          path="/courses/:courseId/chapters/:chapterId"
          element={
            <AuthGuard>
              <Layout>
                <ChapterContent />
              </Layout>
            </AuthGuard>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
