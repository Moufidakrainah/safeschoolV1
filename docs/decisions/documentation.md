# 0001 - Use Repository Markdown for Documentation

## Context

We need a shared, searchable, and versioned knowledge base.
Transcendence requires clear traceability and easy collaboration.

## Decision

All project documentation is maintained in this repository under `docs/`, using Markdown files.

## Why

- Documentation and code evolve together in the same workflow.
- Git history provides traceability for every change.
- Pull requests enable lightweight review and team visibility.
- Repository search works across all Markdown content.

## Alternatives Considered

- GitHub Wiki: easier for some edits, but separate from the main repository workflow.
- External tools (Notion, OneNote, Asana, Trello): good for personal notes, but weaker for project-level versioning and long-term traceability.
