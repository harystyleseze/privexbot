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
  const getBackgroundStyle = () => {
    if (actualTheme === "dark") {
      return {
        background:
          "radial-gradient(40% 40% at 50% 20%, hsl(var(--primary) / 0.3) 0%, hsl(var(--primary) / 0.15) 22.92%, hsl(var(--primary) / 0.08) 42.71%, hsl(var(--background)) 88.54%)",
      };
    } else {
      return {
        background:
          "radial-gradient(40% 40% at 50% 20%, hsl(var(--primary) / 0.15) 0%, hsl(var(--primary) / 0.08) 22.92%, hsl(var(--primary) / 0.04) 42.71%, hsl(var(--background)) 88.54%)",
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
            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
              Build Privacy-First AI Chatbots
            </h1>
            <p className="mx-auto max-w-[54ch] text-lg text-muted-foreground">
              Deploy intelligent chatbots powered by Secret VM. Zero coding required.
              Complete privacy guaranteed. Your data never leaves the secure enclave.
            </p>
          </ContainerAnimated>

          <ContainerInset className="max-h-[450px] w-auto py-6">
            <HeroVideo
              src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4"
              data-src="https://videos.pexels.com/video-files/3129671/3129671-uhd_2560_1440_30fps.mp4"
              poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Crect fill='%23000' width='1920' height='1080'/%3E%3C/svg%3E"
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
                className="h-5 w-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Free forever</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>5-min setup</span>
            </div>
          </ContainerAnimated>
        </ContainerSticky>
      </ContainerScroll>
    </section>
  );
}
