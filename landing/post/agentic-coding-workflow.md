# Agentic Coding Workflow

The agentic coding workflow is a structured approach to building software with an AI assistant. It combines planning, implementation, testing, and review into a repeatable loop with human oversight at key checkpoints.

## The Core Idea

Traditional coding workflows rely on a developer to hold context across the full lifecycle of a change — from requirements to review. Agentic workflows offload the mechanical parts to an AI agent (Claude Code, in this case) while keeping humans in control of decisions that matter: scope, design tradeoffs, and final approval.

## How It Works

1. **Planning** — The agent enters plan mode, explores the codebase, and proposes an implementation plan. The human reviews and approves before any code is written.

2. **Implementation** — The agent writes code, with parallel subagents handling tests concurrently. Each logical unit of work gets its own commit.

3. **Testing loops** — Unit tests run first, then acceptance tests against Firebase emulators. The agent iterates until everything passes.

4. **Review** — Code quality, security, and acceptance reviews run as structured loops. The human classifies findings as required, false positive, or out of scope.

5. **Merge** — Once all reviews pass, the PR is marked ready and merged.

## What Makes It Work

The workflow succeeds because it's explicit. Every step is documented, every decision is recorded in commit messages and PR comments, and the agent never takes irreversible actions without confirmation.

The scaffolding for this project is a concrete example: the agent ran `go run main.go create landing`, reviewed the output, and then implemented the blog on top of the generated structure — all within a single PR.

## The Stack

- **Claude Code** — AI assistant running the workflow
- **Firebase** — Hosting, Firestore, and Auth
- **Go** — Scaffolding tool
- **TypeScript** — Frontend, no framework
- **Playwright + Vitest** — Testing

The code is at [github.com/natb1/commons.systems](https://github.com/natb1/commons.systems).
