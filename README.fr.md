<p align="right"><a href="README.md">English</a></p>
<img src="assets/hero.svg" alt="BumpLab" width="100%">

# BumpLab

**Mettez à jour une dépendance npm vers une version précise, adaptez le code concerné et examinez la migration sous forme de patch testé.**

## Voir la démo

<a href="assets/demo.mp4"><img src="assets/demo.gif" alt="BumpLab — démonstration enregistrée" width="100%"></a>

<sub>Démo réellement exécutée, rejouée avec des annotations et un rythme adapté à la lecture. Adaptateur déterministe ; Git et les vérifications s’exécutent réellement.</sub>

[Vidéo MP4](assets/demo.mp4) · [Reproduire la démo](docs/demo.md)

## Essayer la version 0.1

```sh
git clone https://github.com/elie-laloum/bumplab.git
cd bumplab
npm test
npm run demo
```

La démonstration utilise un registre local et une vraie installation npm : une API supprimée fait échouer le test, puis le code est adapté à sa nouvelle signature.

## Utilisation et périmètre

Configurez un dépôt Git propre, les fichiers source autorisés, les commandes de test et un adaptateur. La démonstration utilise un adaptateur déterministe sans clé API. L’adaptateur Anthropic nécessite votre clé et un identifiant de modèle. Son contrat est testé, mais les performances de correction par modèle réel ne sont pas évaluées. Les commandes s’exécutent avec vos permissions locales.

[Configuration complète et contrat de l’API](README.md#use-it-on-your-project) · [Limites détaillées](README.md#boundaries) · [Contribuer](CONTRIBUTING.md)

La documentation technique de référence est en anglais. Cette traduction présente le démarrage et le périmètre de la version actuelle.

[GitLab origin](https://gitlab.elielaloum.com/elielaloum/bumplab) · [GitHub mirror](https://github.com/elie-laloum/bumplab)

Le dépôt GitLab privé contient la source de référence ; GitHub en est le miroir public.
