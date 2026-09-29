# Guide de Test en Local - Civic Niger

Ce guide vous explique comment démarrer très simplement l'application sur votre propre machine (en local) pour tester à la fois le backend Django, la plateforme web (Autorité) et l'application mobile (Citoyen).

## 1. Démarrer le Backend (Django) 🟢

Le backend contient la base de données et les API.

1. Ouvrez un terminal.
2. Allez dans le dossier du backend :
   ```bash
   cd civic_niger
   ```
3. Activez votre environnement virtuel (si vous en utilisez un, par exemple `env\Scripts\activate` sur Windows).
4. Lancez le serveur :
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```
*(Le backend tournera sur `http://localhost:8000`)*

---

## 2. Tester l'Interface Web Autorité (React Native Web) 💻

C'est l'interface destinée aux ministères et mairies.

1. Ouvrez un **deuxième** terminal.
2. Allez dans le dossier de l'application :
   ```bash
   cd civic_niger_mobile
   ```
3. Démarrez l'application en mode Web :
   ```bash
   npm run web
   ```
*(La page s'ouvrira automatiquement dans votre navigateur. Vous pourrez y créer un compte Autorité ou vous connecter).*

---

## 3. Tester l'Application Mobile Citoyen (Expo) 📱

C'est l'interface destinée au grand public.

1. Dans le **même terminal** (celui de `civic_niger_mobile`), au lieu de `npm run web`, vous pouvez lancer :
   ```bash
   npx expo start -c
   ```
2. Un QR Code va s'afficher dans le terminal.
3. Prenez votre téléphone (Android ou iPhone) :
   - Installez l'application **Expo Go** (disponible gratuitement sur le Play Store ou l'App Store).
   - Ouvrez Expo Go et scannez le QR code.
   - L'application Civic Niger se lancera directement sur votre téléphone avec le design mobile !

*(Astuce : L'application mobile se connectera automatiquement à votre backend local via le réseau Wi-Fi).*
