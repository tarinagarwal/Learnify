import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  UserCircle,
  LogOut,
  Menu,
  X,
  Book,
  MessageSquare,
  Brain,
  GraduationCap,
  Home,
  History,
  FileText,
  LogIn,
  UserPlus,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userName, setUserName] = useState("");
  const [isExpert, setIsExpert] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsAuthenticated(true);
        const { data: expertData } = await supabase
          .from("experts")
          .select("name")
          .eq("email", user.email)
          .maybeSingle();

        if (expertData) {
          setIsExpert(true);
          setUserName(expertData.name);
        } else {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", user.id)
            .single();

          if (profileData) {
            setUserName(profileData.name);
          }
        }
      } else {
        setIsAuthenticated(false);
        setUserName("");
        setIsExpert(false);
      }
    };

    fetchUserProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        fetchUserProfile();
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setUserName("");
        setIsExpert(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const NavLink = ({
    to,
    icon: Icon,
    children,
  }: {
    to: string;
    icon?: any;
    children: any;
  }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        className={cn(
          "flex items-center space-x-2 text-muted-foreground hover:text-primary transition-colors relative group py-2 px-4 -mx-4 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
          isActive && "text-primary font-medium"
        )}
        onClick={() => setIsOpen(false)}
      >
        {Icon && <Icon className="h-4 w-4" />}
        <span>{children}</span>
        <span
          className={cn(
            "absolute bottom-0 left-0 w-full h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out",
            isActive && "scale-x-100"
          )}
        />
      </Link>
    );
  };

  return (
    <nav className="bg-gray-100 backdrop-blur-3xl border-b border-black fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 w-full">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-primary">Learnify</span>
            </Link>
          </div>

          {isAuthenticated ? (
            <>
              <div className="hidden lg:flex lg:items-center lg:space-x-4 xl:space-x-6">
                <NavLink to="/">Home</NavLink>
                <NavLink to="/quiz">Quiz</NavLink>
                <NavLink to="/history">History</NavLink>
                <NavLink to="/resources">Resources</NavLink>
                <NavLink to="/pdf-chat">PDF Chat</NavLink>
                <NavLink to="/courses">Courses</NavLink>
              </div>

              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={`https://avatar.vercel.sh/${userName}.png`}
                          alt={userName}
                        />
                        <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {userName}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {isExpert ? "Expert" : "Student"}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="lg:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Learnify Menu</SheetTitle>
                      <SheetDescription>
                        Navigate through your learning journey
                      </SheetDescription>
                    </SheetHeader>
                    <div className="flex flex-col space-y-4 mt-4">
                      <NavLink to="/" icon={Home}>
                        Home
                      </NavLink>
                      <NavLink to="/quiz" icon={Book}>
                        Quiz
                      </NavLink>
                      <NavLink to="/history" icon={History}>
                        History
                      </NavLink>
                      <NavLink to="/resources" icon={FileText}>
                        Resources
                      </NavLink>
                      <NavLink to="/pdf-chat" icon={MessageSquare}>
                        PDF Chat
                      </NavLink>
                      <NavLink to="/courses" icon={GraduationCap}>
                        Courses
                      </NavLink>
                      <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button variant="ghost" asChild className="px-2 sm:px-4">
                <Link to="/login" className="flex items-center">
                  <LogIn className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
              <Button asChild className="px-2 sm:px-4">
                <Link to="/signup" className="flex items-center">
                  <UserPlus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Sign Up</span>
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
