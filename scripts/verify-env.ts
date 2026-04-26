#!/usr/bin/env node
/**
 * Environment Variables Verification - Story 1.1 baseline.
 *
 * Checks only the shell-level env vars this story introduces:
 *   - NEXT_PUBLIC_APP_URL
 *   - NEXTAUTH_URL
 *   - NEXTAUTH_SECRET
 *   - Sentry DSN (optional but warned)
 *
 * Additional keys (DATABASE_URL, STRIPE_*, GEMINI, GROQ, UPSTASH_*, RESEND_*)
 * are added by the stories that introduce those features.
 *
 * Usage: pnpm run deploy:verify
 */

import * as fs from "fs";
import * as path from "path";

interface EnvRequirement {
  name: string;
  required: boolean;
  pattern?: RegExp;
  description: string;
  helpUrl?: string;
}

const ENV_REQUIREMENTS: EnvRequirement[] = [
  {
    name: "NEXT_PUBLIC_APP_URL",
    required: true,
    pattern: /^https?:\/\//,
    description: "Canonical public URL used for SEO metadata base",
  },
  {
    name: "NEXTAUTH_URL",
    required: true,
    pattern: /^https?:\/\//,
    description: "NextAuth origin URL (must be HTTPS in production)",
  },
  {
    name: "NEXTAUTH_SECRET",
    required: true,
    pattern: /^.{32,}$/,
    description: "NextAuth secret (min 32 characters)",
  },
  {
    name: "SENTRY_DSN",
    required: false,
    description: "Server-side Sentry DSN (optional in dev)",
  },
  {
    name: "NEXT_PUBLIC_SENTRY_DSN",
    required: false,
    description: "Client-side Sentry DSN (optional in dev)",
  },
];

const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function log(message: string, color: string = colors.reset): void {
  console.log(`${color}${message}${colors.reset}`);
}

function loadEnvFile(filePath: string): Record<string, string> {
  const env: Record<string, string> = {};

  if (!fs.existsSync(filePath)) return env;

  const content = fs.readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;

    const key = match[1].trim();
    let value = match[2].trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

function verifyEnvironment(): boolean {
  log("\n==============================================", colors.cyan);
  log("  Fracture Recovery - Environment Verification", colors.cyan);
  log("==============================================\n", colors.cyan);

  const envLocal = loadEnvFile(path.join(process.cwd(), ".env.local"));
  const envProd = loadEnvFile(
    path.join(process.cwd(), ".env.production.local")
  );
  const env = { ...process.env, ...envLocal, ...envProd };

  let passed = 0;
  let failed = 0;
  let warnings = 0;
  const errors: string[] = [];

  for (const req of ENV_REQUIREMENTS) {
    const value = env[req.name];

    if (!value || value.includes("[") || value.includes("replace-with")) {
      if (req.required) {
        log(`  [FAIL] ${req.name}`, colors.red);
        log(`         ${req.description}`, colors.reset);
        if (req.helpUrl) log(`         Get from: ${req.helpUrl}`, colors.blue);
        errors.push(req.name);
        failed++;
      } else {
        log(`  [SKIP] ${req.name} (optional)`, colors.yellow);
        warnings++;
      }
    } else if (req.pattern && !req.pattern.test(value)) {
      log(`  [WARN] ${req.name} - format may be incorrect`, colors.yellow);
      log(`         ${req.description}`, colors.reset);
      warnings++;
    } else {
      log(`  [PASS] ${req.name}`, colors.green);
      passed++;
    }
  }

  log("\n==============================================", colors.cyan);
  log("  Verification Summary", colors.cyan);
  log("==============================================", colors.cyan);
  log(`  Passed:   ${passed}`, colors.green);
  log(`  Warnings: ${warnings}`, colors.yellow);
  log(`  Failed:   ${failed}`, colors.red);

  if (failed > 0) {
    log("\n  Status: NOT READY FOR DEPLOYMENT", colors.red);
    log("\n  Missing required variables:", colors.red);
    errors.forEach((e) => log(`    - ${e}`, colors.red));
    log(
      "\n  Fill in values in .env.local (dev) or .env.production.local (prod).",
      colors.reset
    );
    return false;
  }

  if (warnings > 0) {
    log("\n  Status: READY (with warnings)", colors.yellow);
    return true;
  }

  log("\n  Status: READY FOR DEPLOYMENT", colors.green);
  return true;
}

const isReady = verifyEnvironment();
process.exit(isReady ? 0 : 1);
