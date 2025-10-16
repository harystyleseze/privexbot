import { Star, User } from "lucide-react";
import { Container } from "@/components/shared/Container";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { Card, CardContent } from "@/components/ui/card";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Product Manager",
    company: "TechCorp",
    quote:
      "PrivexBot transformed how we handle customer support. The Secret VM integration gives us peace of mind knowing our data is truly private.",
    rating: 5,
  },
  {
    name: "Marcus Rodriguez",
    role: "CTO",
    company: "FinanceAI",
    quote:
      "The visual workflow builder is incredible. We built complex compliance chatbots in days, not months. The no-code approach empowered our entire team.",
    rating: 5,
  },
  {
    name: "Aisha Patel",
    role: "Founder",
    company: "HealthTech Solutions",
    quote:
      "Privacy is critical in healthcare. PrivexBot's Trusted Execution Environment lets us deploy AI assistants that meet all our security requirements.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-16 md:py-24 bg-secondary/30">
      <Container>
        <SectionHeading
          title="Trusted by Teams Worldwide"
          subtitle="Join thousands of organizations building with PrivexBot"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="transition-all duration-300 hover:shadow-lg"
            >
              <CardContent className="pt-6">
                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-muted-foreground mb-6">
                  "{testimonial.quote}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role} at {testimonial.company}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
