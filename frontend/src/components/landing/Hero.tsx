import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import {
  ContainerAnimated,
  ContainerInset,
  ContainerScroll,
  ContainerSticky,
  HeroButton,
  HeroVideo,
} from "@/components/ui/animated-video-on-scroll";
import { useTheme } from "@/contexts/ThemeContext";

export function Hero() {
  const { actualTheme } = useTheme();

  // Different gradient backgrounds for light and dark mode
  // Using PrivexBot brand colors: Primary #3b82f6, Secondary #8b5cf6
  const getBackgroundStyle = () => {
    if (actualTheme === "dark") {
      return {
        background:
          "radial-gradient(50% 50% at 50% 20%, hsl(var(--primary) / 0.35) 0%, hsl(var(--primary) / 0.18) 22.92%, hsl(var(--primary) / 0.09) 42.71%, hsl(var(--background)) 88.54%)",
      };
    } else {
      return {
        background:
          "radial-gradient(50% 50% at 50% 20%, hsl(var(--primary) / 0.18) 0%, hsl(var(--primary) / 0.10) 22.92%, hsl(var(--primary) / 0.05) 42.71%, hsl(var(--background)) 88.54%)",
      };
    }
  };

  return (
    <section>
      <ContainerScroll className="h-[350vh]">
        <ContainerSticky
          style={getBackgroundStyle()}
          className="px-6 py-10 text-foreground"
        >
          <ContainerAnimated className="space-y-4 text-center">
            <h1 className="text-5xl font-semibold tracking-tight md:text-6xl">
              Build Privacy-First AI Chatbots
            </h1>
            <p className="mx-auto max-w-[54ch] text-lg text-muted-foreground">
              Seamlessly deploy your bots with built-in privacy protections and
              verifiable execution in a secure, trusted environment.
            </p>
          </ContainerAnimated>

          <ContainerInset className="max-h-[500px] w-auto py-8">
            <HeroVideo
              src="/videos/privexbot-anime.mp4"
              data-src="/videos/privexbot-anime.mp4"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%234361EE' width='1920' height='1080'/%3E%3C/svg%3E"
            />
          </ContainerInset>

          <ContainerAnimated
            transition={{ delay: 0.4 }}
            outputRange={[-120, 0]}
            inputRange={[0, 0.7]}
            className="mx-auto mt-2 w-fit"
          >
            <Link to="/signup">
              <HeroButton>
                <span className="text-foreground">Start Building Free</span>
                <ArrowRight className="ml-2 h-4 w-4 text-foreground transition-transform group-hover:translate-x-1" />
              </HeroButton>
            </Link>
          </ContainerAnimated>

          {/* Trust indicators */}
          <ContainerAnimated
            transition={{ delay: 0.6 }}
            outputRange={[-100, 0]}
            inputRange={[0, 0.7]}
            className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-success-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Verifiable Execution</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-success-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>TEE Computing</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-success-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Confidential AI</span>
            </div>
          </ContainerAnimated>
        </ContainerSticky>
      </ContainerScroll>
    </section>
  );
}
