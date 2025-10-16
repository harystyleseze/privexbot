import { MessageSquare, Workflow, Database, Cloud } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const featureTabs = [
  {
    id: "chatbots",
    label: "Chatbots",
    icon: MessageSquare,
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

export function Features() {
  return (
    <section id="features" className="py-16 md:py-24 scroll-mt-16">
      <Container>
        <SectionHeading
          title="Powerful Features"
          subtitle="Everything you need to build, deploy, and scale AI chatbots with complete privacy."
        />

        <Tabs defaultValue="chatbots" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
            {featureTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="flex items-center gap-2 py-3"
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {featureTabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Features Grid */}
                <div className="space-y-6">
                  {tab.features.map((feature, index) => (
                    <Card key={index} className="transition-all duration-300 hover:shadow-md">
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Screenshot Placeholder */}
                <div className="hidden md:block">
                  <Card className="h-full min-h-[400px] bg-gradient-to-br from-primary/5 to-secondary/5">
                    <CardContent className="flex items-center justify-center h-full p-8">
                      <div className="text-center text-muted-foreground">
                        <div className="mb-4 inline-block p-4 bg-secondary rounded-lg">
                          <tab.icon className="h-12 w-12" />
                        </div>
                        <p className="text-sm">Screenshot Preview</p>
                        <p className="text-xs mt-2">{tab.label} Interface</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Container>
    </section>
  );
}
