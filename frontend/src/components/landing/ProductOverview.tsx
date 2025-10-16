import { Upload, Palette, Settings, Rocket } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: Upload,
    title: "Create Knowledge Base",
    description:
      "Upload documents, connect data sources, or integrate with Notion and Google Docs to build your AI's knowledge foundation.",
    step: 1,
  },
  {
    icon: Palette,
    title: "Design Chatbot",
    description:
      "Choose between simple form-based chatbots or advanced visual workflow builder for complex conversational flows.",
    step: 2,
  },
  {
    icon: Settings,
    title: "Customize Logic",
    description:
      "Configure AI reasoning, add integrations, set up webhooks, and fine-tune responses to match your needs.",
    step: 3,
  },
  {
    icon: Rocket,
    title: "Deploy Anywhere",
    description:
      "Launch your chatbot on web, mobile, or embed it anywhere with our lightweight widget. Monitor and iterate.",
    step: 4,
  },
];

export function ProductOverview() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <Container>
        <SectionHeading
          title="How It Works"
          subtitle="From idea to deployment in four simple steps. Build powerful AI assistants without writing a single line of code."
        />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent -translate-x-1/2 z-0" />
                )}

                <Card className="relative z-10 h-full transition-all duration-300 hover:shadow-lg">
                  <CardContent className="pt-6">
                    {/* Step number */}
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mb-4">
                      {step.step}
                    </div>

                    {/* Icon */}
                    <div className="inline-flex rounded-lg p-3 mb-4 bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Ready to see it in action?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#features"
              className="text-primary font-medium hover:underline"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Explore Features →
            </a>
          </div>
        </div>
      </Container>
    </section>
  );
}
