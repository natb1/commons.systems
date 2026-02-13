# commons.systems: Agentic Coding Workflow

This repository serves as a monorepo for Nate's agentic coding workflows and proof-of-concept (POC) applications.

## Pre-requisites

- **Project Management** (github): Created a project.
- **Version Control** (git): Created a repo.
- **Agentic Coding Tools** (Claude Code): Manually Installed TODO(#2)

## Design Principles

- Agentic patterns for both augmented and delegated coding workflows.
- Augmented workflows focus on requirements management and design, while delegated workflows focus on implementation.
- Delegated workflows have well defined break points for human quality control (QC).

## Agentic Coding Workflow

| Step | Agent Pattern | Artifacts |
|------|--------------|-----------|
| 1. Functional Requirement Definition & Prioritization | Augmented | #3 |
| 2. Dev Environment Management | Delegated + QC | #5 #6 #7 #18 |
| 3. Implementation Planning | Delegated + QC | #8 #9 |
| 4. Implementation | Delegated | #10 #20 #11 #16 #15 #17 |
| 5. QA (functional review of pull request) | Augmented | #21 #12 #19 |
| 6. Code Quality Review | Delegated + QC | #13 #14 |
| 7. Security Review | Delegated + QC | #22 |
| 8. Merge | Augmented | #23 #24 #19 |

## Cross Cutting Artifacts
- #26
