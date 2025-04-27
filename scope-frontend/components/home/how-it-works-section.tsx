'use client';

const steps = [
  {
    number: "01",
    title: "Submit",
    description: "Students submit complaints through an intuitive form, providing all necessary details for proper handling."
  },
  {
    number: "02",
    title: "Analyze",
    description: "Advanced AI algorithms analyze and categorize complaints, identifying urgent issues and common patterns."
  },
  {
    number: "03",
    title: "Process",
    description: "Staff members review categorized complaints with AI-generated insights to make informed decisions."
  },
  {
    number: "04",
    title: "Resolve",
    description: "Track resolution progress, communicate with students, and document outcomes for future reference."
  }
];

export function HowItWorksSection() {

  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-6 sm:px-8">
        <div className="space-y-16">
          <div className="mx-auto text-center md:max-w-2xl space-y-4">
            <div className="mb-6">
              <div className="h-1 w-16 bg-primary mx-auto mb-4"></div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How It Works</h2>
            </div>
            <p className="text-xl text-muted-foreground">
              SCOPE simplifies the complaint management process from start to finish.
            </p>
          </div>

          <div className="grid gap-12 lg:gap-16">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={`flex flex-col lg:flex-row items-start gap-6 lg:gap-12 ${
                  index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                <div className="flex-shrink-0 w-full lg:w-1/2">
                  <div className="relative rounded-2xl overflow-hidden border aspect-[16/9] flex items-center justify-center group">
                    {/* Step Number */}
                    <div className="text-8xl font-bold text-primary/20 absolute inset-0 flex items-center justify-center transition-opacity group-hover:opacity-0">
                      {step.number}
                    </div>
                    
                    {/* Step Title on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary">{step.title}</span>
                    </div>
                    
                    {/* Border Accent */}
                    <div className="absolute bottom-0 left-0 w-0 h-1 bg-primary group-hover:w-full transition-all duration-500"></div>
                  </div>
                </div>
                
                <div className="w-full lg:w-1/2 space-y-4 py-4">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                      {step.number}
                    </span>
                    {step.title}
                  </h3>
                  <p className="text-lg text-muted-foreground">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
