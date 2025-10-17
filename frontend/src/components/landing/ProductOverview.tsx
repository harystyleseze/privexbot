import { Upload, Palette, Settings, Rocket, ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: Upload,
    title: "Create Knowledge Base",
    description:
      "Upload documents, connect data sources, or integrate with Notion and Google Docs to build your AI's knowledge foundation.",
    details: ["Multi-format support", "Smart chunking", "Version control"],
    step: 1,
    color: "from-blue-500/20 to-primary/20",
  },
  {
    icon: Palette,
    title: "Design Your Chatbot",
    description:
      "Choose between simple form-based chatbots or advanced visual workflow builder for complex conversational flows.",
    details: ["Drag & drop builder", "Pre-built templates", "Custom branding"],
    step: 2,
    color: "from-purple-500/20 to-primary/20",
  },
  {
    icon: Settings,
    title: "Customize & Configure",
    description:
      "Configure AI reasoning, add integrations, set up webhooks, and fine-tune responses to match your brand voice.",
    details: ["API integrations", "Webhook support", "Custom logic"],
    step: 3,
    color: "from-cyan-500/20 to-primary/20",
  },
  {
    icon: Rocket,
    title: "Deploy & Scale",
    description:
      "Launch your chatbot across web, WhatsApp, Telegram, or embed it anywhere. Monitor performance and iterate.",
    details: ["Multi-channel deploy", "Real-time analytics", "Auto-scaling"],
    step: 4,
    color: "from-green-500/20 to-primary/20",
  },
];

const stepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.6,
      ease: [0.0, 0.0, 0.2, 1] as const,
    },
  }),
};

export function ProductOverview() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      </div>

      <Container>
        <SectionHeading
          title="How It Works"
          subtitle="From idea to deployment in four simple steps. Build powerful AI assistants without writing code."
        />

        {/* Timeline container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Vertical line (mobile) */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent md:hidden"></div>

          {/* Steps */}
          <div className="space-y-12 md:space-y-20">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={index}
                  custom={index}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-100px" }}
                  variants={stepVariants}
                  className={`relative flex flex-col md:flex-row gap-8 items-center ${
                    !isEven ? "md:flex-row-reverse" : ""
                  }`}
                >
                  {/* Mobile step indicator */}
                  <div className="absolute left-0 md:hidden flex items-center justify-center w-16 h-16 rounded-full bg-primary dark:bg-primary text-primary-foreground font-bold text-xl shadow-lg z-10">
                    {step.step}
                  </div>

                  {/* Content card */}
                  <div className="flex-1 ml-20 md:ml-0">
                    <div className="group relative overflow-hidden rounded-2xl border bg-card p-8 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50">
                      {/* Gradient background */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                      ></div>

                      <div className="relative z-10">
                        {/* Icon and step number for desktop */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center justify-center w-14 h-14 rounded-xl bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                              <Icon className="h-7 w-7" />
                            </div>
                            <div className="md:hidden flex items-center justify-center w-12 h-12 rounded-xl bg-primary/20 dark:bg-primary/30 text-primary">
                              <Icon className="h-6 w-6" />
                            </div>
                          </div>
                          <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                            {step.step}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-2xl font-bold mb-3 text-foreground">{step.title}</h3>

                        {/* Description */}
                        <p className="text-muted-foreground dark:text-foreground/70 mb-4 leading-relaxed">
                          {step.description}
                        </p>

                        {/* Details list */}
                        <ul className="space-y-2">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-center gap-2 text-sm text-foreground/90">
                              <Check className="h-4 w-4 text-primary dark:text-primary shrink-0" />
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Shine effect */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow connector for desktop */}
                  <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
                    <ArrowRight className={`h-6 w-6 text-primary ${!isEven ? "rotate-180" : ""}`} />
                  </div>

                  {/* Visual placeholder */}
                  <div className="hidden md:block flex-1">
                    <div className="aspect-video rounded-xl bg-gradient-to-br from-primary/5 to-secondary/10 border flex items-center justify-center overflow-hidden">
                      <div className="p-8 text-center">
                        <Icon className="h-16 w-16 mx-auto text-primary/30 mb-4" />
                        <p className="text-sm text-muted-foreground">Step {step.step} Preview</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-16 text-center"
        >
          <p className="text-lg text-muted-foreground mb-6">
            Ready to build your first AI chatbot?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                Start Building Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Button size="lg" variant="outline">
                Explore Features
              </Button>
            </a>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
