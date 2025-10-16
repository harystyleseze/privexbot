import { Shield, Zap, Globe, Network } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { Card, CardContent } from "@/components/ui/card";

const valueProps = [
  {
    icon: Shield,
    title: "Secret VM Powered",
    description:
      "Run AI workloads in Trusted Execution Environments for unparalleled privacy and security.",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    icon: Zap,
    title: "No Code Required",
    description:
      "Build sophisticated chatbots with our intuitive interface - no programming knowledge needed.",
    color: "text-yellow-600 dark:text-yellow-400",
  },
  {
    icon: Globe,
    title: "Multi-Channel Deploy",
    description:
      "Deploy your chatbot across web, mobile, and popular platforms with a single click.",
    color: "text-green-600 dark:text-green-400",
  },
  {
    icon: Network,
    title: "Advanced AI Flows",
    description:
      "Create complex workflows with our visual builder or use simple form-based chatbots.",
    color: "text-purple-600 dark:text-purple-400",
  },
];

export function ValuePropositions() {
  return (
    <section className="py-16 md:py-24">
      <Container>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            return (
              <Card
                key={index}
                className="group transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <CardContent className="pt-6">
                  <div className={`inline-flex rounded-lg p-3 mb-4 bg-secondary ${prop.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{prop.title}</h3>
                  <p className="text-muted-foreground">{prop.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
