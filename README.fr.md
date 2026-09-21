<p align="center"><a href="README.md">English</a> · <strong>Français</strong></p>

<p align="center"><img src="assets/hero.fr.svg" alt="BumpLab — Mettre à jour la dépendance. Adapter le code." width="100%"></p>

# BumpLab

**Mettez à jour la dépendance. Adaptez le code. Vérifiez le résultat.**

Un workflow agentique open source conçu pour accompagner une mise à jour ciblée jusqu'aux adaptations du code et aux vérifications nécessaires.

> **En développement.** Ce dépôt contient la spécification et la documentation initiales. Aucune version exécutable n’est encore publiée.


**Dépôt d’origine : [GitLab](https://gitlab.elielaloum.com/elielaloum/bumplab)** · [Miroir public GitHub](https://github.com/elie-laloum/bumplab). Le dépôt GitLab est privé ; son accès nécessite une autorisation. Les modifications du code sont intégrées dans GitLab puis synchronisées vers GitHub.


## Le changement de version est un point de départ

Une nouvelle version peut modifier les API, les types et la configuration. BumpLab vise le travail entre le choix de cette version et l'obtention d'une application que vous pouvez examiner et tester.

```text
Version cible → Sources de migration → Mise à jour → Adaptation du code → Contrôles
```

## Une première version ciblée

- Applications TypeScript utilisant npm.
- Une dépendance directe et une version cible explicite par exécution.
- Vérification de l'état initial avant modification.
- Décisions de migration reliées à leur documentation source.
- Manifeste, lockfile, patch applicatif et rapport des contrôles réussis ou échoués.

Prévoir un adaptateur de modèle documenté, des tentatives limitées et un environnement d'exécution isolé. L'usage du modèle et son coût doivent rester visibles.

## Sa place dans votre workflow

[Renovate](https://docs.renovatebot.com/) automatise déjà les mises à jour de dépendances. BumpLab vise une migration bornée de l'application consommatrice, accompagnée de preuves examinables. Son intérêt devra être démontré sur des mises à jour concrètes.

## La démonstration à livrer

Une petite application TypeScript, une mise à jour présentant un changement d'API connu, l'échec obtenu et l'adaptation produite par l'agent. Montrer le diff et les contrôles réels. Une migration bloquée reste déclarée comme telle.

## Conditions de publication

La version cible doit rester installée. Les tests et le typage existants ne doivent pas être affaiblis pour faire passer la migration. Conserver l'état initial, le périmètre autorisé, les tentatives et le résultat final.

## Contribuer au projet

Premières contributions utiles : cas minimaux de migration, documentation officielle et cas limites reproductibles. Les instructions d'installation et les coordonnées du paquet suivront une version vérifiée.


---

[Feuille de route](ROADMAP.md) · [Contribuer](CONTRIBUTING.md) · [Licence MIT](LICENSE)
