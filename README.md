# docsurf

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Convex, and more.

## Features

-  **TypeScript** - For type safety and improved developer experience
-  **TanStack Start** - SSR framework with TanStack Router
-  **TailwindCSS** - Utility-first CSS for rapid UI development
-  **shadcn/ui** - Reusable UI components
-  **Convex** - Reactive backend-as-a-service platform
-  **Biome** - Linting and formatting
-  **Husky** - Git hooks for code quality
-  **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
pnpm dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.

Your app will connect to the Convex cloud backend automatically.

## Project Structure

```
docsurf/
├── apps/
│   ├── web/         # Frontend application (React + TanStack Start)
├── packages/
│   └── backend/     # Convex backend functions and schema

```

## Available Scripts

-  `pnpm dev`: Start all applications in development mode
-  `pnpm build`: Build all applications
-  `pnpm dev:web`: Start only the web application
-  `pnpm dev:setup`: Setup and configure your Convex project
-  `pnpm check-types`: Check TypeScript types across all apps
-  `pnpm check`: Run Biome formatting and linting
