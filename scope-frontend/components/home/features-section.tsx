'use client';

import { 
  MessageSquare, 
  BarChart3, 
  FileText, 
  Clock, 
  Shield,
  AlertCircle
} from 'lucide-react';

interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}

const features: Feature[] = [
  {
    icon: <MessageSquare className="h-10 w-10" />,
    title: "AI-Powered Chat",
    description: "Communicate with an intelligent assistant that can answer questions and provide insights about complaints.",
    color: "text-purple-600",
    bgColor: "bg-purple-50 dark:bg-purple-950/30"
  },
  {
    icon: <BarChart3 className="h-10 w-10" />,
    title: "Advanced Analytics",
    description: "Visualize trends, patterns, and key metrics to make data-driven decisions about student complaints.",
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30"
  },
  {
    icon: <FileText className="h-10 w-10" />,
    title: "Complaint Management",
    description: "Efficiently categorize, prioritize, and track complaints from submission to resolution.",
    color: "text-emerald-600",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/30"
  },
  {
    icon: <Clock className="h-10 w-10" />,
    title: "Real-time Processing",
    description: "Get instant feedback and categorization of complaints as they come in for faster response times.",
    color: "text-orange-600",
    bgColor: "bg-orange-50 dark:bg-orange-950/30"
  },
  {
    icon: <Shield className="h-10 w-10" />,
    title: "Secure & Private",
    description: "All data is encrypted and stored securely with role-based access controls to protect student privacy.",
    color: "text-red-600",
    bgColor: "bg-red-50 dark:bg-red-950/30"
  },
  {
    icon: <AlertCircle className="h-10 w-10" />,
    title: "Priority Detection",
    description: "Automatically identify urgent complaints that require immediate attention based on severity.",
    color: "text-teal-600",
    bgColor: "bg-teal-50 dark:bg-teal-950/30"
  }
];

const FeatureCard = ({ feature }: { feature: Feature }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all hover:shadow-lg">
      {/* Icon with colored background */}
      <div className={`mb-5 inline-flex h-16 w-16 items-center justify-center rounded-xl ${feature.bgColor} ${feature.color} p-3`}>
        {feature.icon}
      </div>
      
      <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
      <p className="text-muted-foreground">{feature.description}</p>
    </div>
  );
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24">
      <div className="container max-w-7xl mx-auto px-6 sm:px-8">
        <div className="space-y-16">
          <div className="mx-auto text-center md:max-w-2xl space-y-4">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Powerful Features</h2>
            <p className="text-xl text-muted-foreground">
              SCOPE combines advanced AI with an intuitive interface to streamline complaint management.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
