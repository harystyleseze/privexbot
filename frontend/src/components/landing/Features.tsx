import { MessageSquare, Workflow, Database, Cloud, Sparkles } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const featureTabs = [
  {
    id: "chatbots",
    label: "Chatbots",
    icon: MessageSquare,
    color: "from-blue-500 to-primary",
    features: [
      {
        title: "Form-Based Builder",
        description: "Create simple chatbots with an intuitive form interface - perfect for FAQs and basic interactions.",
      },
      {
        title: "Rich Media Support",
        description: "Embed images, videos, buttons, and carousels to create engaging conversations.",
      },
      {
        title: "Multi-Language",
        description: "Support multiple languages and automatically detect user preferences.",
      },
      {
        title: "Analytics Dashboard",
        description: "Track conversations, user engagement, and identify improvement opportunities.",
      },
    ],
  },
  {
    id: "chatflows",
    label: "Chatflows",
    icon: Workflow,
    color: "from-purple-500 to-pink-500",
    features: [
      {
        title: "Visual Workflow Builder",
        description: "Design complex conversation flows with our drag-and-drop ReactFlow-powered interface.",
      },
      {
        title: "Conditional Logic",
        description: "Add branching, loops, and dynamic routing based on user responses and context.",
      },
      {
        title: "API Integrations",
        description: "Connect to external services, databases, and APIs to enrich your chatbot's capabilities.",
      },
      {
        title: "Function Calling",
        description: "Execute custom functions and automate tasks based on conversation context.",
      },
    ],
  },
  {
    id: "knowledge",
    label: "Knowledge Bases",
    icon: Database,
    color: "from-cyan-500 to-blue-500",
    features: [
      {
        title: "Multi-Source Import",
        description: "Import from files, websites, Notion, Google Docs, and more to build comprehensive knowledge bases.",
      },
      {
        title: "Smart Chunking",
        description: "Automatic document chunking with customizable strategies for optimal RAG performance.",
      },
      {
        title: "Vector Search",
        description: "Semantic search powered by embeddings to find the most relevant context for every query.",
      },
      {
        title: "Version Control",
        description: "Track changes, rollback updates, and manage multiple versions of your knowledge base.",
      },
    ],
  },
  {
    id: "deployment",
    label: "Deployment",
    icon: Cloud,
    color: "from-green-500 to-emerald-500",
    features: [
      {
        title: "Embeddable Widget",
        description: "Add a lightweight chat widget to any website with a single line of code.",
      },
      {
        title: "WhatsApp & Telegram",
        description: "Deploy to popular messaging platforms with pre-built integrations.",
      },
      {
        title: "API Access",
        description: "Full REST API for custom integrations and programmatic access.",
      },
      {
        title: "Custom Domains",
        description: "Host your chatbot on your own domain with SSL and custom branding.",
      },
    ],
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.0, 0.0, 0.2, 1] as const,
    },
  }),
};

export function Features() {
  return (
    <section id="features" className="py-16 md:py-24 scroll-mt-16 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      </div>

      <Container>
        <SectionHeading
          title="Powerful Features"
          subtitle="Everything you need to build, deploy, and scale AI chatbots with complete privacy."
        />

        <Tabs defaultValue="chatbots" className="w-full">
          {/* Mobile-optimized tabs */}
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto gap-2 bg-transparent p-0 md:p-1 md:bg-muted/50">
            {featureTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex flex-col md:flex-row items-center justify-center gap-2 py-3 md:py-2.5 px-3 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-md transition-all"
                >
                  <Icon className="h-5 w-5 md:h-4 md:w-4" />
                  <span className="text-xs md:text-sm font-medium">{tab.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {featureTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsContent key={tab.id} value={tab.id} className="mt-8 md:mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
                  {/* Features Grid - Full width on mobile, half on desktop */}
                  <div className="space-y-4 md:space-y-5">
                    {tab.features.map((feature, index) => (
                      <motion.div
                        key={index}
                        custom={index}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        variants={cardVariants}
                      >
                        <Card className="group transition-all duration-300 hover:shadow-lg hover:border-primary/50 border-2">
                          <CardContent className="pt-5 pb-5 px-5 md:pt-6 md:pb-6 md:px-6">
                            <div className="flex items-start gap-4">
                              {/* Feature icon on mobile */}
                              <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-base md:text-lg font-semibold mb-1.5 md:mb-2">
                                  {feature.title}
                                </h3>
                                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                                  {feature.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>

                  {/* Visual Preview - Hidden on mobile, shown on desktop */}
                  <div className="hidden lg:block sticky top-24 h-fit">
                    <Card className="overflow-hidden border-2">
                      <div className={`h-full min-h-[500px] bg-gradient-to-br ${tab.color} p-8 relative`}>
                        {/* Decorative elements */}
                        <div className="absolute inset-0 bg-grid-white/10 [mask-image:radial-gradient(white,transparent_85%)]"></div>

                        <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                          >
                            <div className="mb-6 inline-block p-6 bg-white/20 backdrop-blur-sm rounded-2xl">
                              <Icon className="h-20 w-20" />
                            </div>
                            <h4 className="text-2xl font-bold mb-3">{tab.label}</h4>
                            <p className="text-white/90 max-w-sm">
                              Explore powerful features designed to make your chatbot building experience seamless
                            </p>
                          </motion.div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </Container>
    </section>
  );
}
