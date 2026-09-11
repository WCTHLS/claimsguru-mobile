# ClaimsGuru Mobile Client (Android & iOS)

Enterprise cross-platform mobile application for **ClaimsGuru**, built with **React Native (Expo)**. Directly integrated with the deployed **Microsoft Azure Pre-Prod Cloud Backend**.

---

## 🚀 Quick Start for Team Members

You can run and test this app on your **physical Android phone** or **iPhone** in under 2 minutes using **Expo Go**.

### 1. Prerequisites
* **Node.js**: `v18.x`, `v20.x`, or higher installed ([Download Node.js](https://nodejs.org/))
* **Git**: Installed
* **Expo Go App**:
  * 🤖 **Android**: Download **Expo Go** from [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
  * 🍏 **iOS**: Download **Expo Go** from [Apple App Store](https://apps.apple.com/app/expo-go/id982107779)

---

### 2. Setup & Installation

Clone the repository and install dependencies:

```bash
# Clone branch or checkout
git clone -b feat/claims-azure-preprod https://github.com/WCTHLS/claimsguru-mobile.git
# Or if already cloned:
git fetch origin && git checkout feat/claims-azure-preprod
cd claimsguru-mobile

# Install packages
npm install
```

---

### 3. Launch the Team Dev Server

#### Option A: One-Click PowerShell Script (Recommended on Windows)
```powershell
.\start_team_expo.ps1 -Tunnel
```

#### Option B: Standard NPM / Expo CLI Command (Windows / macOS / Linux)
```bash
npx expo start --go --tunnel -c
```

> **Why `--tunnel`?** The tunnel flag allows your phone to connect securely over Cloudflare/ngrok tunnels even if your phone and computer are on different Wi-Fi networks or mobile data.

---

### 4. Open the App on Your Phone

1. Once the terminal shows the large **QR code**:
   * 🤖 **Android**: Open the **Expo Go** app &rarr; Tap **"Scan QR Code"** &rarr; Point camera at terminal.
   * 🍏 **iOS**: Open the native **Camera app** &rarr; Point at QR code &rarr; Tap the **"Open in Expo Go"** banner.
2. The JavaScript bundle will download (`100%`) and launch the ClaimsGuru app immediately.

---

## 🧪 End-to-End Testing Workflow

### Step 1: Sign Up or Log In
* Open the app.
* Enter your Name, Email, Phone, and Password &rarr; Tap **Create Account** (or **Sign In** if you already created one).
* *The account is saved directly into Azure MSSQL (`users` and `patient_profiles` tables).*

### Step 2: Upload a Claim Document
* On the Home / Chat screen, tap the **+** or **Upload Document** action.
* Select a Medical Bill, Discharge Summary, or Prescriptions (PDF, JPG, PNG).
* Tap **Upload to Backend**.

### Step 3: Live 5-Stage AI Pipeline Execution
* The app automatically connects to Azure Ingress (`/ingress/claims/`) and tracks live pipeline progress:
  1. **OCR Extraction** *(Azure Document Intelligence)*
  2. **Clinical Parsing** *(Field mapping: Hospital, Diagnosis, Amount, Dates)*
  3. **Medical Coding** *(ICD-10 & CPT Code mapping)*
  4. **Adjudication Scoring** *(Rejection risk calculation)*
  5. **Validation Rules** *(IRDAI checklist compliance)*

### Step 4: Review Adjudicated Claim & IRDAI Form
* Inspect the extracted fields (Diagnosis, Admission/Discharge dates, Billed total).
* Tap into the Claim Summary to view the generated TPA analysis.

---

## ⚙️ Backend Configuration

The mobile app is pre-configured to communicate with the Azure Pre-Prod Ingress Gateway:

```env
# .env
EXPO_PUBLIC_ENABLE_ENTRA_ID=false
EXPO_PUBLIC_API_URL=https://cg-preprod-cin-ingress.purpleocean-4441f644.centralindia.azurecontainerapps.io
```

### Endpoints Overview:
* **Ingress API Gateway**: `https://cg-preprod-cin-ingress.purpleocean-4441f644.centralindia.azurecontainerapps.io`
* **Web Portal**: `https://cg-preprod-cin-frontend.purpleocean-4441f644.centralindia.azurecontainerapps.io`

---

## 🛠️ Useful Scripts

| Command | Purpose |
| :--- | :--- |
| `npm start` | Start standard interactive Metro bundler |
| `npm run start -- --tunnel` | Start with Cloudflare tunnel for remote devices |
| `npm run web` | Run and preview on desktop browser (`http://localhost:8081`) |
| `npx tsc --noEmit` | Validate TypeScript types (0 errors) |

---

## ❓ Troubleshooting

1. **"Could not connect to development server"**:
   * Ensure you ran with `--tunnel` (`npx expo start --go --tunnel -c`).
   * Verify your phone has internet access.
2. **Bundle cache issue**:
   * Run with `-c` flag to clear the Metro bundler cache: `npx expo start --go --tunnel -c`.
3. **Camera / Document Picker permissions**:
   * If prompted, grant photo and camera permissions in your device settings.
