import { Shield, Zap, Globe, Network } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { motion } from "framer-motion";

const valueProps = [
  {
    icon: Shield,
    title: "Secret VM Powered Privacy",
    description:
      "Run AI workloads in Trusted Execution Environments for unparalleled privacy and security. Your data never leaves the secure enclave.",
    gradient: "from-primary/20 via-primary/10 to-transparent",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Zap,
    title: "No Code Required",
    description:
      "Build sophisticated chatbots with our intuitive drag-and-drop interface - no programming knowledge needed.",
    gradient: "from-yellow-500/20 via-yellow-500/10 to-transparent",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-600 dark:text-yellow-400",
  },
  {
    icon: Globe,
    title: "Multi-Channel Deploy",
    description:
      "Deploy your chatbot across web, WhatsApp, Telegram, and custom platforms with a single click.",
    gradient: "from-green-500/20 via-green-500/10 to-transparent",
    iconBg: "bg-green-500/10",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    icon: Network,
    title: "Advanced AI Workflows",
    description:
      "Create complex conversation flows with our visual builder or use simple form-based chatbots.",
    gradient: "from-purple-500/20 via-purple-500/10 to-transparent",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: [0.0, 0.0, 0.2, 1] as const,
    },
  }),
};

export function ValuePropositions() {
  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <Container>
        <SectionHeading
          title="Why Choose PrivexBot?"
          subtitle="Privacy-first AI chatbot platform with enterprise-grade security and ease of use"
        />

        {/* Modern Grid Layout - Equal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;

            return (
              <motion.div
                key={index}
                custom={index}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={cardVariants}
                className="group relative"
              >
                <div
                  className="relative h-full overflow-hidden rounded-2xl border bg-card p-8 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 min-h-[320px] flex flex-col"
                >
                  {/* Gradient background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${prop.gradient} opacity-50 transition-opacity group-hover:opacity-100`}
                  ></div>

                  {/* Content */}
                  <div className="relative z-10 flex flex-col h-full">
                    {/* Icon */}
                    <div
                      className={`inline-flex w-fit rounded-xl p-3.5 mb-5 ${prop.iconBg} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                    >
                      <Icon
                        className={`h-8 w-8 ${prop.iconColor}`}
                      />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold mb-3">
                      {prop.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground dark:text-foreground/70 leading-relaxed flex-grow">
                      {prop.description}
                    </p>

                    {/* Hover indicator for all cards */}
                    <div className="mt-5 flex items-center gap-2 text-primary font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>Learn more</span>
                      <svg
                        className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
