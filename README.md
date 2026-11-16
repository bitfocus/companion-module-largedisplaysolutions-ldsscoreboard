# LDSscoreboard Companion Module

Module Bitfocus Companion complet pour **LDSscoreboard**.

## Fonctionnalités

- **Actions** : Toutes les commandes de l’API (slides, compteurs, timers, roster, labels dynamiques, vecteurs, variables automatiques)
- **Variables** : Score local/visiteur, noms d’équipes, timer principal (mise à jour toutes les 2 secondes)
- **Feedbacks** : Base pour compteur et timer
- **Presets** : Boutons prêts à l’emploi (scores +1, start/stop/reset timer, show slide)

## Configuration

- **IP Address** : PC qui fait tourner LDSscoreboard
- **Port** : Port HTTP (souvent 8080 ou 8086)

## Installation

```bash
cd companion-module-largedisplaysolutions-ldsscoreboard
npm install
npm run build
```

Dans Companion → Modules → Add from local folder.

## API couverte

Basée sur la documentation officielle HTTP API de Large Display Solutions.
