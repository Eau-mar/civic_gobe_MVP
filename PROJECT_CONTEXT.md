# Project Context

## Objectif du Projet
Plateforme CivicNiger (Backend API et Application Mobile) destinée probablement à la participation citoyenne, aux signalements et à l'engagement (modules: profils, savoir, signalement, voix, users, civicTech).

## Architecture & Stack
- **Frontend:** Non applicable directement (possible interface web d'admin dans Django)
- **Backend:** Python / Django (`civic_niger` folder)
- **Database:** SQLite (`db.sqlite3` présent) - probable besoin de migration vers PostgreSQL pour la prod.
- **Mobile:** React Native avec Expo (`civic_niger_mobile` folder)
- **Infrastructure:** Local pour l'instant (env virtuel présent)
- **Language/Framework specifics:** Django, React Native, Node.js

## Modules Principaux
- `users`: Gestion des utilisateurs, permissions et authentification.
- `signalement`: Gestion des rapports/signalements citoyens.
- `voix`: Système d'opinion ou de vote.
- `savoir`: Base de connaissances ou informations citoyennes.
- `profils`: Profils utilisateurs détaillés.
- `civicTech`: Outils technologiques civiques spécifiques.

## Environnement
- **Dev:** `manage.py runserver` pour le backend, `npx expo start` pour le mobile.
- **CI/CD:** Non détecté (pas de `.github` ou `.gitlab-ci.yml` visible).

## Tests Existants
- **Unitaires:** Tests Python détectés (`users/tests.py`).
- **E2E/Intégration:** Inconnus à ce stade sur le mobile.

## Risques & Dette Technique
- Base de données SQLite en dev qui pourrait poser problème de performance ou de concurrence si poussée telle quelle en production.
- Sécurisation des endpoints API (`permissions.py` en cours de modification).

## Inconnues Importantes
- Stratégie de déploiement (AWS, Heroku, VPS classique ?).
- Méthode d'authentification entre le Mobile et le Backend (JWT, Token, Session ?).
