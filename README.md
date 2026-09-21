<p align="center"><strong>English</strong> · <a href="README.fr.md">Français</a></p>

<p align="center"><img src="assets/hero.svg" alt="BumpLab — Upgrade the dependency. Adapt the code." width="100%"></p>

# BumpLab

**Upgrade the dependency. Adapt the code. Show the evidence.**

An open-source agent workflow designed to carry a targeted dependency upgrade through the application changes and checks it requires.

> **In development.** This repository contains the initial specification and documentation. No executable release has shipped yet.


**Original repository: [GitLab](https://gitlab.elielaloum.com/elielaloum/bumplab)** · [Public GitHub mirror](https://github.com/elie-laloum/bumplab). The GitLab origin is private and requires access. Code changes are integrated in GitLab and synchronized to GitHub.


## A version bump is the beginning

A new dependency version can change APIs, types, and configuration. BumpLab is designed for the work between selecting that version and having an application you can review and test.

```text
Target version → Migration sources → Dependency update → Code adaptation → Checks
```

## A deliberately focused first release

- TypeScript applications using npm.
- One direct dependency and an explicit target version per run.
- A baseline check before modifications.
- Migration decisions linked to their source documentation.
- Manifest, lockfile, application patch, and a report of passed and failed checks.

The first version should use one documented model adapter, bounded attempts, and an isolated execution environment. Usage and model costs should remain visible.

## Where it fits

[Renovate](https://docs.renovatebot.com/) already automates dependency updates. BumpLab's proposed focus is a bounded migration of the consuming application with inspectable evidence. Its value must be demonstrated on concrete upgrades, not assumed from a feature checklist.

## The demo we will ship

A small TypeScript application, a selected dependency upgrade with a known API change, the resulting failure, and an agent-generated adaptation. Show the diff and the actual checks. Report blocked migrations as blocked.

## Release requirements

The target version must remain installed. Existing tests and type checks cannot be weakened to make the upgrade pass. The original failure state, approved edit scope, attempts, and final result must be preserved.

## Help shape it

Useful early contributions: minimal migration fixtures, official migration references, and reproducible edge cases. Installation instructions and package coordinates will follow a verified release.


---

[Roadmap](ROADMAP.md) · [Contributing](CONTRIBUTING.md) · [MIT license](LICENSE)
