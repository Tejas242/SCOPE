'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown } from 'lucide-react';

export function HeroSection() {
  const scrollToFeatures = () => {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[80vh] w-full flex items-center justify-center overflow-hidden py-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/80 z-0" />
      
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      
      {/* Hero content */}
      <div className="container max-w-7xl px-6 sm:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="relative inline-block">
            <div className="absolute -top-6 -left-6 w-12 h-12 border-t-2 border-l-2 border-primary"></div>
            <div className="absolute -bottom-6 -right-6 w-12 h-12 border-b-2 border-r-2 border-primary"></div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Student Complaint <span className="text-primary font-extrabold">Organization</span> & <span className="text-primary font-extrabold">Prioritization</span> Engine
            </h1>
          </div>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mt-6">
            Transforming the way educational institutions handle student concerns with AI-powered insights
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href="/login">
              <Button size="lg" className="h-12 px-6 text-base gap-2 relative overflow-hidden group">
                <span className="relative z-10">Get Started</span>
                <ArrowRight className="h-4 w-4 relative z-10 transition-transform group-hover:translate-x-1" />
                <span className="absolute inset-0 bg-primary/10 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="h-12 px-6 text-base"
              onClick={scrollToFeatures}
            >
              Learn More
            </Button>
          </div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <button
          onClick={scrollToFeatures}
          className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-sm mb-2">Explore</span>
          <ChevronDown className="h-5 w-5 animate-bounce" />
        </button>
      </div>
    </section>
  );
}
