import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, GraduationCap, Sparkles } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, description }) => {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding */}
        <div className="text-center lg:text-left space-y-6 text-white">
          <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
              <Sparkles className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold">UniGig</h1>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
              Connect Students with
              <span className="block text-secondary-light">Perfect Opportunities</span>
            </h2>
            <p className="text-xl text-white/90 max-w-lg">
              The ultimate freelancing platform designed specifically for university students and employers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <GraduationCap className="h-6 w-6 text-secondary-light" />
                <h3 className="font-semibold">For Students</h3>
              </div>
              <p className="text-sm text-white/80">Find part-time jobs, internships, and freelance projects.</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="h-6 w-6 text-secondary-light" />
                <h3 className="font-semibold">For Employers</h3>
              </div>
              <p className="text-sm text-white/80">Hire talented students for your projects and roles.</p>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full max-w-md mx-auto">
          <Card className="bg-white/95 backdrop-blur-sm shadow-large border-0">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
              <CardDescription className="text-muted-foreground">{description}</CardDescription>
            </CardHeader>
            <CardContent>
              {children}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};