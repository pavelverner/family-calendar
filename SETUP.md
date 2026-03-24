# Nastavení Rodinného Kalendáře

## 1. Vytvoř Firebase projekt (zdarma)

1. Jdi na https://console.firebase.google.com
2. Klikni **Přidat projekt**, pojmenuj ho (např. `rodinny-kalendar`)
3. Google Analytics: klidně vypni, klikni **Vytvořit projekt**

## 2. Přidej webovou aplikaci

1. V konzoli Firebase klikni na ikonu **</>** (Web)
2. Zadej název (např. `kalendar-web`), klikni **Zaregistrovat aplikaci**
3. Zobrazí se ti `firebaseConfig` s hodnotami — ty budeme potřebovat

## 3. Nastav Firestore databázi

1. V levém menu: **Sestavení → Firestore Database**
2. Klikni **Vytvořit databázi**
3. Vyber **Zahájit v testovacím režimu** (30 dní volný přístup, pak nastavíme pravidla)
4. Vyber lokalitu (např. `europe-west1`) a potvrď

## 4. Nastav proměnné prostředí

V složce `family-calendar` zkopíruj soubor `.env.example` na `.env`:

```
cp .env.example .env
```

Otevři `.env` a vyplň hodnoty z Firebase konfigurace:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=rodinny-kalendar.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=rodinny-kalendar
VITE_FIREBASE_STORAGE_BUCKET=rodinny-kalendar.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123:web:abc
```

## 5. Spusť aplikaci

```bash
cd family-calendar
npm install
npm run dev
```

Otevři http://localhost:5173

## 6. (Volitelné) Zabezpečení Firestore

Po 30 dnech testovacího režimu nastav pravidla ve Firebase konzoli:
Firestore → Pravidla:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /events/{document=**} {
      allow read, write: if true; // Pro rodinné použití stačí
    }
  }
}
```

## 7. Přístup z telefonu nebo pro Elišku

Spuštěnou aplikaci lze sdílet přes lokální síť (uvede adresu při `npm run dev`),
nebo nasadit zdarma na Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
npm run build
firebase deploy
```

Tím dostaneš veřejnou URL (např. `rodinny-kalendar.web.app`) přístupnou odkudkoli.
