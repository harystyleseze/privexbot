/**
 * Environment Configuration
 *
 * This module provides runtime configuration that works in both development and production.
 *
 * HOW IT WORKS:
 *
 * 1. DEVELOPMENT (npm run dev):
 *    - Uses VITE_* environment variables from .env files
 *    - Variables are replaced at build time by Vite
 *    - Fast refresh works
 *
 * 2. PRODUCTION (Docker container):
 *    - Uses window.ENV_CONFIG set by /config.js
 *    - config.js is generated at container startup
 *    - Allows same Docker image to work in different environments
 *    - No rebuild needed when changing API URLs
 *
 * USAGE:
 *    import { config } from '@/config/env';
 *
 *    fetch(`${config.API_BASE_URL}/chatbots`);
 */

// Declare window.ENV_CONFIG type
declare global {
  interface Window {
    ENV_CONFIG?: {
      API_BASE_URL: string;
      WIDGET_CDN_URL: string;
      ENVIRONMENT: string;
    };
  }
}

/**
 * Get configuration value with fallback priority:
 * 1. Runtime config (window.ENV_CONFIG) - Production
 * 2. Build-time env vars (import.meta.env) - Development
 * 3. Default value
 */
function getConfig(
  runtimeKey: keyof NonNullable<typeof window.ENV_CONFIG>,
  envKey: string,
  defaultValue: string
): string {
  // Check if we have runtime config (production)
  if (typeof window !== 'undefined' && window.ENV_CONFIG) {
    const value = window.ENV_CONFIG[runtimeKey];
    // If value hasn't been replaced (still has placeholder), use default
    if (value && !value.startsWith('__')) {
      return value;
    }
  }

  // Check build-time environment variables (development)
  const envValue = import.meta.env[envKey];
  if (envValue) {
    return envValue;
  }

  // Fallback to default
  return defaultValue;
}

/**
 * Application Configuration
 *
 * These values are accessible throughout the application
 */
export const config = {
  /**
   * Backend API Base URL
   * Examples:
   * - Development: http://localhost:8000/api/v1
   * - Staging: https://staging-api.company.com/api/v1
   * - Production: https://api.company.com/api/v1
   */
  API_BASE_URL: getConfig(
    'API_BASE_URL',
    'VITE_API_BASE_URL',
    'http://localhost:8000/api/v1'
  ),

  /**
   * Widget CDN URL
   * Where the chat widget JavaScript is hosted
   */
  WIDGET_CDN_URL: getConfig(
    'WIDGET_CDN_URL',
    'VITE_WIDGET_CDN_URL',
    'http://localhost:8080'
  ),

  /**
   * Environment name
   * Used for debugging and feature flags
   */
  ENVIRONMENT: getConfig(
    'ENVIRONMENT',
    'VITE_ENV',
    'development'
  ),

  /**
   * Is production environment?
   */
  IS_PRODUCTION: getConfig('ENVIRONMENT', 'VITE_ENV', 'development') === 'production',

  /**
   * Is development environment?
   */
  IS_DEVELOPMENT: getConfig('ENVIRONMENT', 'VITE_ENV', 'development') === 'development',
} as const;

// Log configuration in development (helps debugging)
if (config.IS_DEVELOPMENT) {
  console.log('🔧 App Configuration:', config);
}

export default config;
