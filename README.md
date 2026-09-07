# Claims Guru Mobile Client (Android & iOS)

Cross-platform mobile application for **Claims Guru**, built with **React Native** and **Expo**. Features a chat-first interface, 5-stage AI pipeline runner, medical document analyzer, and IRDAI claim form generator.

---

## 🚀 Quick Start (For Developers)

### 1. Prerequisites
- **Node.js**: Version `18.x` or `20.x` installed ([Download Node.js](https://nodejs.org/))
- **Git**

### 2. Installation
Clone the repository and install dependencies:

```bash
# 1. Install project packages
npm install

# 2. Ensure web preview dependencies are installed
npx expo install react-native-web react-dom @expo/metro-runtime
```

### 3. Running the App
Start the interactive Metro development server:

```bash
npm start
```

---

## 📱 How to Preview & Test

Once `npm start` is running in your terminal:

| Target | How to Open | Requirements |
| :--- | :--- | :--- |
| **🌐 Web Browser** *(Fastest)* | Press **`w`** in terminal | Any browser (Chrome / Edge / Safari) at `http://localhost:8081` |
| **📱 Real Android Phone** | Scan the terminal QR code | Install **Expo Go** from Google Play Store (Phone & PC on same Wi-Fi) |
| **🍏 Real iPhone** | Scan the terminal QR code | Open default **Camera app** (Phone & PC on same Wi-Fi) |
| **🤖 Android Emulator** | Press **`a`** in terminal | Android Studio installed with an active Android Virtual Device (AVD) |
| **💻 iOS Simulator** | Press **`i`** in terminal | macOS with Xcode installed |

---

## 📂 Repository Architecture

```
claimsguru-mobile/
│
├── 🤖 android/                     # Android Native Build Project (Google Play Store)
│   ├── app/
│   │   ├── build.gradle            # Android build configs & SDK versions
│   │   └── src/main/
│   │       └── AndroidManifest.xml # Camera, Storage, Biometric permissions
│   └── build.gradle                # Root Gradle configuration
│
├── 🍏 ios/                         # iOS Native Build Project (Apple App Store)
│   ├── Podfile                     # CocoaPods dependencies
│   └── ClaimsGuru/
│       └── Info.plist              # Privacy descriptions (Camera, FaceID)
│
├── 🌐 src/                         # Shared Cross-Platform Source (All 23 Screens)
│   ├── app/
│   │   ├── App.tsx                 # App Root & Providers
│   │   └── navigation/             # Typed React Navigation (Tabs & Stacks)
│   │
│   ├── core/
│   │   ├── theme/                  # Design tokens: Brand (#0d9488), Dark mode surfaces
│   │   ├── rbac/                   # Role engine (viewer, submitter, reviewer, admin)
│   │   └── utils/                  # en-IN INR formatter, PHI regex scrubber, date helpers
│   │
│   ├── features/                   # Modular Feature Screens
│   │   ├── auth/                   # Sign In (Keycloak SSO) & Sign Up (TPA onboarding)
│   │   ├── chat/                   # Chat-First Home + Upload Tray + Pipeline Card
│   │   ├── sessions/               # Conversation history & replays
│   │   ├── claims/                 # Claims list & Claim detail
│   │   ├── workflow/               # 5-stage pipeline runner (OCR -> Validate)
│   │   ├── brain/                  # AI Brain Preview, Risk, Fraud, Validation (R001–R011)
│   │   ├── documents-ocr/          # Document grid, OCR fields, Scan analyzer
│   │   ├── search/                 # Full-text & FAISS semantic search
│   │   ├── submission/             # IRDAI claim form generator (Part A/B)
│   │   ├── patient/                # Patient profile & activity timeline (proposals)
│   │   └── profile/                # Profile & RBAC role switcher
│   │
│   ├── mocks/                      # Standalone Mock Data Layer
│   ├── shared/                     # Reusable UI Primitives (Gauges, Steppers, Badges)
│   └── state/                      # Zustand Global State Stores
│
├── app.json                        # Expo app metadata & package identifiers
├── package.json                    # Dependencies and run scripts
└── tsconfig.json                   # TypeScript configuration
```

---

## 🔐 Role-Based Access Control (RBAC)

The app includes an interactive **RBAC role switcher** in the **Profile** screen:

| Role | Permissions |
| :--- | :--- |
| **`viewer`** | Read-only access: Chat, search, and view existing claims. |
| **`submitter`** | Upload documents, run pipeline, and submit claims to payers. |
| **`reviewer`** | Submitter rights + Medical code feedback, field edits, and validation re-runs. |
| **`admin`** | Full rights: Claim deletion, processing configuration, and Ops console. |

---

## 📦 Production Builds & Store Deployment

### Google Play Store (Android)
```bash
# Builds signed release .aab (Android App Bundle)
npm run build:android
```
*Output: `android/app/build/outputs/bundle/release/app-release.aab`*

### Apple App Store (iOS)
```bash
# Generates iOS Archive (.ipa)
npm run build:ios
```
*Output: `ClaimsGuru.ipa` uploaded to App Store Connect / TestFlight.*
