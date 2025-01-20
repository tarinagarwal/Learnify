import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-16">
        <Outlet />
      </main>
      <footer className="bg-gray-100 border border-t-black py-6 px-4 sm:px-6 lg:px-8">
        <div
          className="max-w-7xl mx-auto flex flex-col items-center space-y-2 
                  md:flex-row md:justify-between md:space-y-0 
                  text-center text-muted-foreground"
        >
          {/* Copyright */}
          <p>
            &copy; {new Date().getFullYear()} Learnify. All rights reserved.
          </p>

          {/* Tarin Agarwal Link */}
          <div>
            <a
              href="https://tarin-agarwal.web.app/home"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-600"
            >
              Tarin Agarwal
            </a>
          </div>

          {/* Star on Github Button */}
          <div>
            <a
              href="https://github.com/tarinagarwal/Learnify"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center border border-gray-300 
                   rounded-md px-4 py-2 bg-white hover:bg-white
                   hover:text-gray-700 transition-colors"
            >
              🌟 Star on Github
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
