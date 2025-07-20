import React from 'react';
import { Button } from "@/components/ui/button";
import { NavLink, Link } from "react-router-dom";
import { 
  Briefcase, 
  User, 
  Search, 
  FileText, 
  Edit, 
  Plus,
  GraduationCap,
  Building2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NavigationProps {
  userType: 'student' | 'employer';
}

export const Navigation: React.FC<NavigationProps> = ({ userType }) => {
  const studentLinks = [
    { path: "/dashboard", label: "Dashboard", icon: Search },
    { path: "/available-jobs", label: "Available Jobs", icon: Briefcase },
    { path: "/my-jobs", label: "My Jobs", icon: FileText },
    { path: "/student-profile", label: "My Profile", icon: User },
  ];

  const employerLinks = [
    { path: "/dashboard", label: "Dashboard", icon: Building2 },
    { path: "/available-jobs", label: "Available Jobs", icon: Briefcase },
    { path: "/post-job", label: "Post a Job", icon: Plus },
    { path: "/manage-jobs", label: "Manage Jobs", icon: Edit },
    { path: "/profile", label: "My Profile", icon: User },
  ];

  const links = userType === 'student' ? studentLinks : employerLinks;

  const { user } = useAuth();

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-border shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 overflow-x-auto py-2">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap hover:bg-accent hover:text-accent-foreground ${
                  isActive
                    ? 'bg-gradient-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
          {user?.userType === 'employer' && (
            <NavLink
              to="/review-applications"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 whitespace-nowrap hover:bg-accent hover:text-accent-foreground ${
                  isActive
                    ? 'bg-gradient-primary text-primary-foreground shadow-soft'
                    : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Briefcase className="h-4 w-4" />
              Review Applications
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
};