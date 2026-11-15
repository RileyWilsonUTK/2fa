# 2fa
2fa survey with LLM generated warnings

# COSC 469/569 Class Project — Adaptive 2FA Prompt Study

An interactive web application built with **Google Apps Script**, **Google Sheets**, and the **Gemini API** (`gemini-3.5-flash-lite`) to investigate how users respond to different Two-Factor Authentication (2FA) prompts and whether context-aware, LLM-generated security warnings reduce risky approvals.

---

## Project Overview

Standard 2FA prompts often fail due to user habituation ("approve-on-autopilot"), prompt fatigue, or confusing technical metadata. This study evaluates an adaptive intervention pipeline:

1. **Condition Assignment (4 Scenarios):** Participants experience one of four realistic 2FA mobile prompt designs:
   * **Condition 1 (Section A — Baseline):** Minimal push prompt (*"Are you trying to sign in?"*) with no device, IP, or location context.
   * **Condition 2 (Section B — MFA Fatigue):** Repeated back-to-back sign-in requests (*"4th request in 2 minutes"*).
   * **Condition 3 (Section C — Number Matching):** Requires verifying a 2-digit challenge code (`47`) before approving.
   * **Condition 4 (Section D — High-Context Anomaly):** Displays full metadata highlighting an unrecognized browser, OS, and foreign location/IP.
2. **Self-Report & Silent Telemetry:** Captures the participant's initial `Approve`/`Deny` decision, 1–5 ratings for **Annoyance/Confusion** and **Confidence**, and silently measures **decision latency (in seconds)** using `performance.now()`.
3. **Adaptive LLM Security Warning:** Sends the prompt context, decision latency, and self-report ratings to Gemini (`gemini-3.5-flash-lite`) to generate a tailored 2–4 sentence security notice (e.g., pattern-interrupt alerts for fast autopilot clicks vs. plain-language explanations for slow/confused decisions).
4. **Post-Warning Re-evaluation & Logging:** Records whether the participant keeps or changes their decision after reading the LLM warning and appends the full row to Google Sheets.

---

## Repository Files

* **`Code.gs`** — Server-side Google Apps Script handling web app routing (`doGet`), Gemini API calls with automatic retry/fallback (`generateWarning`), and spreadsheet logging (`saveFinalResponse`).
* **`Index.html`** — Client-side multi-step survey interface, built-in HTML/CSS 2FA mobile prompt mockups, and silent response-time tracking.

---

## Setup & Deployment Instructions

### 1. Create the Google Sheet
1. Create a new **Google Sheet** and rename the first tab to **`Responses`**.
2. Paste these exact headers into **Row 1 (Columns A–H)**:
   ```text
   Timestamp | Condition | Initial_Decision | Decision_Time_Sec | Annoyed_Confused | Confidence | Generated_Warning | Final_Decision
   ```

### 2. Add the Apps Script Code
1. In the Google Sheet, open **Extensions > Apps Script**.
2. Replace the contents of **`Code.gs`** with the `Code.gs` file from this repository.
3. Click the **+** icon next to **Files**, select **HTML**, name it **`Index`**, and paste the contents of **`Index.html`**.

### 3. Configure Your Gemini API Key
1. Generate a free API key in [Google AI Studio](https://google.com).
2. In Apps Script, open **Project Settings** (gear icon) > **Script Properties**.
3. Add a property named **`GEMINI_API_KEY`** and paste your API key as the value.

### 4. Deploy as a Web App
1. Click **Deploy > New deployment** in the top right of the Apps Script editor.
2. Select **Web app** as the deployment type.
3. Set **Execute as** to **Me** and **Who has access** to **Anyone**.
4. Click **Deploy**, authorize permissions, and share the generated `/exec` URL with study participants.

---

## Team Collaboration Notes
* **Editing Together:** Share the bound Google Sheet with teammates as **Editors** so everyone can access **Extensions > Apps Script** and view live data in `Responses`.
* **Publishing Changes:** Whenever `Code.gs` or `Index.html` is edited, go to **Deploy > Manage deployments > Edit (pencil icon) > New version > Deploy** so the live participant URL updates.

