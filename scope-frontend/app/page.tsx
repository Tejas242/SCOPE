import { Navbar } from '@/components/layout/navbar';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Github, Sparkles, MessageSquare, BarChart3, FileText, Shield, ArrowUpRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  
  const features = [
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: "AI Assistant",
      description: "Natural conversations with data-driven insights to resolve student complaints efficiently."
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: "Advanced Analytics",
      description: "Visualize trends and patterns to make informed decisions about student concerns."
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Automated Processing",
      description: "Intelligent categorization and prioritization of incoming complaints."
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Secure Platform",
      description: "Enterprise-grade security with role-based access to protect sensitive information."
    }
  ];
  
  const testimonials = [
    {
      quote: "SCOPE has transformed how we process and respond to student complaints. Response times have decreased by 40%.",
      author: "Dr. Sarah Johnson",
      title: "Dean of Students, Pacific University"
    },
    {
      quote: "The AI-driven insights have helped us identify recurring issues and address them proactively before they escalate.",
      author: "Mark Williams",
      title: "Student Affairs Director, Northside College"
    },
    {
      quote: "Implementation was seamless, and our staff adapted quickly. The dashboards provide precisely the insights we need.",
      author: "Emily Chen",
      title: "IT Administrator, Eastern State University"
    }
  ];

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-screen w-full flex items-center justify-center pt-24 pb-16 overflow-hidden">
        {/* Modern geometric background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          <div className="absolute top-0 right-0 w-1/2 h-96 bg-primary/5 rounded-bl-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-1/2 h-96 bg-primary/5 rounded-tr-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 reveal">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-sm font-medium text-primary mb-4">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Complaint Management</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
              Student Complaints,
              <span className="block mt-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Intelligently Managed
              </span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Streamline student complaint processes with AI-driven categorization, 
              prioritization, and resolution tracking for educational institutions.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link href="/login">
                <Button size="lg" className="h-12 px-6 text-base gap-2 bg-primary hover:bg-primary/90 transition-all duration-300">
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              
              <a href="#features">
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="h-12 px-6 text-base group border-primary/20 hover:border-primary/50"
                >
                  Learn More
                  <ArrowUpRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </a>
            </div>
            
            {/* Trusted by section */}
            <div className="pt-16 reveal">
              <p className="text-sm uppercase text-muted-foreground font-medium tracking-wider mb-6">
                Trusted by educational institutions
              </p>
              <div className="flex flex-wrap justify-center items-center gap-8 opacity-70">
                <div className="font-bold text-xl">University of Tech</div>
                <div className="font-bold text-xl">Pacific College</div>
                <div className="font-bold text-xl">Eastern Institute</div>
                <div className="font-bold text-xl">Western Academy</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Bottom wave pattern */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-background"></div>
      </section>
      
      {/* Features Section */}
      <section id="features" className="py-24 relative">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"></div>
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center mb-16 reveal">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <span>Key Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Everything you need to manage student complaints</h2>
            <p className="text-xl text-muted-foreground mt-4">
              SCOPE combines powerful AI technology with a user-friendly interface to streamline 
              the entire complaint management process.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 reveal">
            {features.map((feature, i) => (
              <div key={i} className="group">
                <div className="bg-card hover:bg-card/95 border border-border/50 hover:border-primary/30 rounded-xl p-6 h-full transition-all duration-300 hover:shadow-md hover:shadow-primary/5">
                  <div className="mb-4 p-2.5 rounded-lg bg-primary/10 inline-flex text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Feature Showcase */}
          <div className="mt-32 grid lg:grid-cols-2 gap-12 items-center reveal">
            <div className="space-y-6">
              <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span>AI-Powered Assistant</span>
              </div>
              <h2 className="text-3xl font-bold">Get intelligent insights from your complaint data</h2>
              <p className="text-lg text-muted-foreground">
                SCOPE&apos;s AI assistant analyzes complaint patterns, suggests categorization, 
                and helps prioritize issues needing immediate attention.
              </p>
              
              <ul className="space-y-3">
                {[
                  "Natural language processing to understand complaint context",
                  "Automated categorization and sentiment analysis",
                  "Pattern recognition to identify recurring issues",
                  "Proactive suggestions for resolution strategies"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 p-1 rounded-full bg-primary/10">
                      <Check className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              <div className="pt-4">
                <Link href="/login">
                  <Button className="gap-2 group">
                    Try it yourself
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="relative rounded-xl overflow-hidden border shadow-lg">
              <div className="w-full h-full bg-card p-4 flex flex-col">
                <div className="flex items-center gap-2 mb-4 px-2 py-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  </div>
                  <div className="text-sm font-medium text-center mx-auto">SCOPE AI Assistant</div>
                </div>
                
                {/* Chat interface mockup */}
                <div className="flex-1 space-y-4 overflow-hidden bg-muted/10 rounded-lg p-4">
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">AI</div>
                    <div className="bg-muted/30 rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">How can I help with your complaint analysis today?</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-row-reverse gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">U</div>
                    <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">Show me trends in IT support complaints from last month</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">AI</div>
                    <div className="bg-muted/30 rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">I&apos;ve analyzed the IT support complaints from last month. Here are the key trends:</p>
                      <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                        <li>40% related to Wi-Fi connectivity issues</li>
                        <li>25% about login problems</li>
                        <li>20% software access related</li>
                        <li>15% hardware failures</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Statistics Section */}
      <section className="py-24 bg-muted/5 relative">
        <div className="absolute inset-y-0 left-0 w-1/3 bg-primary/5 transform -skew-x-12"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 reveal">
            <div className="text-center p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-primary">40%</div>
              <p className="text-muted-foreground">Reduction in response time</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-primary">85%</div>
              <p className="text-muted-foreground">Accurate categorization</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-primary">24/7</div>
              <p className="text-muted-foreground">AI-powered assistance</p>
            </div>
            <div className="text-center p-6">
              <div className="text-4xl md:text-5xl font-bold mb-2 text-primary">50+</div>
              <p className="text-muted-foreground">Institutions using SCOPE</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-24 relative">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16 reveal">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <span>Success Stories</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold">Trusted by leading educational institutions</h2>
            <p className="text-xl text-muted-foreground mt-4">
              See how SCOPE has transformed complaint management processes across different organizations.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 reveal">
            {testimonials.map((testimonial, i) => (
              <div key={i} className="bg-card border rounded-xl p-8 shadow-sm relative hover:shadow-md hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300">
                <div className="text-6xl text-primary/10 font-serif absolute top-4 left-4">&quot;</div>
                <p className="text-lg mb-6 relative z-10">{testimonial.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {testimonial.author.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.author}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden bg-primary/5">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8 reveal">
            <h2 className="text-3xl md:text-4xl font-bold">Ready to transform your complaint management process?</h2>
            <p className="text-xl text-muted-foreground">
              Join educational institutions already using SCOPE to improve student satisfaction and operational efficiency.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <Link href="/login">
                <Button size="lg" className="h-12 px-8 text-base gap-2 bg-primary hover:bg-primary/90">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              
              <Link href="/login">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base border-primary/20 hover:border-primary/50">
                  Schedule a Demo
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">S</div>
                <div className="font-bold text-2xl">SCOPE</div>
              </div>
              <p className="text-muted-foreground max-w-xs">
                Student Complaint Organization & Prioritization Engine - 
                Transforming how educational institutions manage student feedback.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">API Reference</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <div className="space-y-3">
                <Link href="https://github.com" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Github className="h-4 w-4" /> GitHub
                </Link>
                <Link href="#" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <MessageSquare className="h-4 w-4" /> Contact Us
                </Link>
                <Link href="/login" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowRight className="h-4 w-4" /> Log In
                </Link>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-12 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} SCOPE. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
                <Link href="#" className="hover:text-foreground transition-colors">Cookies</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
