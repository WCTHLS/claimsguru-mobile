# Claims Flow Backend Integration Guide (Screens 5, 6, 7 & 8 + Medical Coding)

This guide explains how **ClaimsGuru Mobile** is linked directly to the **ClaimGPT Backend Microservices** (`C:\Users\Admin\Desktop\claimsgurubackend`), how to start both servers, how the live data pipeline works without hardcoded mocks, and how to test the application.

---

## 1. How to Start the Backend Server (Port 8000)

Open a **PowerShell** terminal in the backend directory:

```powershell
cd C:\Users\Admin\Desktop\claimsgurubackend
```

### Option A: All-In-One Docker Stack (Recommended)
Starts API Gateway (Port 8000), Microsoft SQL Server, Redis, and all Celery workers (OCR & Default):

```powershell
.\run_local_containers.ps1
```

> **To stop the Docker stack:**
> ```powershell
> .\run_local_containers.ps1 -Stop
> ```

### Option B: Direct Python Gateway (Without Docker)
If you prefer running the FastAPI Gateway directly on your host machine:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Verify Backend is Running
```powershell
curl.exe http://localhost:8000/health
# Expected output: {"status":"ok"}
```

---

## 2. How to Start the Mobile App (Port 8081)

Open a separate **PowerShell** terminal in the mobile directory:

```powershell
cd C:\Users\Admin\Desktop\claimsguru_mobile
```

### Option A: Run in Web Browser (Default & Instant)
```powershell
npm run web
# or: npx expo start --web
```
The application will open automatically at **`http://localhost:8081`**.

### Option B: Run on Android Emulator
```powershell
npx expo start --android
```
*(The app automatically detects the Android emulator loopback `10.0.2.2:8000`)*

### Option C: Run on Physical Android Phone (via USB)
```powershell
adb reverse tcp:8000 tcp:8000
npx expo start
```
*(Scan the QR code with Expo Go)*

---

## 3. Real Microservice Endpoints Mapped

All screens are directly wired to the ClaimGPT microservices with **zero hardcoded values**:

| Screen | Action | Backend Method & Endpoint | Real Data Extracted |
|---|---|---|---|
| **Screen 5 (Claims List)** | Fetch all claims & counts | `GET /ingress/claims` | Live claims in database, real status badges & counts |
| **Screen 6 (Upload Panel)** | Upload claim document(s) | `POST /ingress/claims/` | Multipart file upload; queues claim, creates UUID in DB |
| **Screen 7 (Workflow)** | Start workflow pipeline | `POST /workflow/start/{id}` | Dispatches Celery tasks across microservice queue |
| **Screen 7 (Workflow)** | Live progress bar (0-100%) | `GET /ingress/claims/{id}/progress` | Monotonic pipeline percentage & completion status |
| **Screen 7 (Workflow)** | Step index status | `GET /ingress/claims/{id}/status` | Step index (0=OCR, 1=Parse, 2=Code, 3=Predict, 4=Validate) |
| **Screen 7 (Workflow)** | Real document metrics | `GET /submission/claims/{id}/preview` | Real patient name, diagnosis, total fields (47), ICD codes |
| **Screen 7 (Workflow)** | Validation rule counts | `GET /validator/validate/{id}` | Real rule results (e.g. 8 of 11 rules passed) |
| **Screen 7 (Workflow)** | Rejection risk score | `GET /predictor/predict/{id}` | Real ML prediction score (e.g. 28% MEDIUM risk) |
| **Screen 8 (Claim Detail)** | Fetch full claim record | `GET /ingress/claims/{id}` | Patient name, doctor, hospital, admission & discharge |
| **Screen 8 (Claim Detail)** | Hospital bill line items | `GET /submission/claims/{id}/preview` | 34 real expense line items from parsed hospital bill |
| **Screen 8 (Claim Detail)** | Index for search | `POST /search/index/{id}` | Vector embedding & full-text indexing |
| **Screen 8 (Claim Detail)** | Download original file | `GET /ingress/claims/{id}/file` | Streams original attached PDF/image |
| **Screen 8 (Claim Detail)** | Delete claim | `DELETE /ingress/claims/{id}` | Deletes claim and child records with cascade cleanup |
| **Medical Coding Screen** | Fetch diagnostic codes | `GET /submission/claims/{id}/preview` | Real ICD-10 codes matched (e.g. A96, A99 / D69, D69.9) |
| **Medical Coding Screen** | Accept / Reject feedback | `POST /submission/claims/{id}/code-feedback` | Posts reviewer action (`{"code": "A96", "action": "accept"}`) |

---

## 4. How the Real Data Pipeline Works (Zero Hardcoding)

When you upload a real claim document (e.g., `r_claim_0497.pdf`):

1. **Upload & Ingress**:
   - The file is sent as multipart/form-data to `POST /ingress/claims/`.
   - The backend stores the file in MinIO/S3, creates the Claim in SQL Server, and dispatches Celery workers.
2. **Live Workflow Stepper & Progress Bar**:
   - A live progress bar displays the exact backend progress (`5% → 25% → 50% → 75% → 100%`).
   - As workers process the document, the 5 stages update with **real metrics**:
     - **OCR**: Text extracted from your actual document.
     - **Parse**: `47 fields parsed · discharge_summary` (actual count of extracted fields).
     - **Code**: `2 codes assigned (D69, D69.9)` (actual ICD-10 diagnostic codes).
     - **Predict**: `Risk 28% · MEDIUM · 4 factors` (actual ML risk model prediction).
     - **Validate**: `8 of 11 rules passed` (actual deterministic rule engine output).
     - **Processing Time**: Exact Celery execution duration (e.g. `13.6s` instead of hardcoded `4.2s`).
3. **Claim Detail & Expenses**:
   - Displays real patient name (`Selvam Chandrasekaran · 54 · Male`).
   - Displays real hospital (`AIIMS Institute of Medical Sciences`).
   - Displays real doctor (`Dr. Senthil Murugan`).
   - Displays real primary diagnosis (`Dyslipidaemia Haemorrhagic`).
   - Displays real amount claimed (`Rs. 2,97,748`).
   - Displays all **34 real expense line items** (Surgeon fee Rs. 83,481, Anaesthesia Rs. 25,044, Nursing Rs. 10,494, etc.).
4. **Medical Coding Feedback**:
   - Loads the exact diagnostic ICD-10 codes for the patient's condition.
   - Tapping Thumbs Up (Accept) or Thumbs Down (Reject) sends feedback directly to `POST /submission/claims/{id}/code-feedback`.

---

## 5. Automated Integration Test Command

To verify that all backend endpoints are running and responding properly:

```powershell
cd C:\Users\Admin\Desktop\claimsguru_mobile
node "C:\Users\Admin\.gemini\antigravity\brain\01baee90-052e-479c-88e0-34098d0a1de0\scratch\test_backend_integration.js"
```
