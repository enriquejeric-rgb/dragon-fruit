# 🍓 Dragon Fruit Ripeness Checker

A simple, aesthetic web application designed to check dragon fruit ripeness (**Ripe** vs **Unripe**) and accurately reject **Non-Dragon-Fruit** photos. Pre-configured to connect directly to your Roboflow dataset: `thanh-long-detection-znzlc-k8knb`.

---

## 🌿 How It Works

* **Ripe Dragon Fruit:**
  * Detected by rich magenta/red/pink skin with green bract tips.
  * Card turns soft pink with `RIPE` status and bounding box.
  * Recommendation: Ready for harvest and fresh consumption.

* **Unripe Dragon Fruit:**
  * Detected by predominantly green skin and scales.
  * Card turns soft green with `UNRIPE` status and bounding box.
  * Recommendation: Leave on the vine to mature.

* **Non-Dragon-Fruit Protection:**
  * If an uploaded photo is NOT a dragon fruit (e.g. human face, room, desk, car, pet, white document, or other objects), the detector rejects it.
  * Card turns warm amber with **`NOT DRAGON FRUIT`** status.
  * Recommendation: Prompts the user to scan or upload a clear photo of a dragon fruit.

---

## 🎨 Clean & Aesthetic Dragon Fruit Design

* **Mascot Web Logo:** 3D aesthetic character dragon fruit logo in the header and browser favicon.
* **Actual Photo Display:** Ripeness Result card displays the actual uploaded or scanned photo in the preview thumbnail.
* **Ready State:** On initial load or after clicking **Clear / Reset**, the result card shows a neutral **`READY TO CHECK`** state.
* **Warm Dragon Fruit Theme:** Natural pitaya colors: dragon fruit pink (`#E91E63`, `#C2185B`) and vine green (`#2E7D32`), with friendly typography (`Plus Jakarta Sans`).

---

## ⚙️ Roboflow Model Setup

* **Workspace:** `reji`
* **Project ID:** `thanh-long-detection-znzlc-k8knb`
* **Version:** `4`

When your training finishes:
1. Click the **gear icon (⚙)** in the top right.
2. Paste your **Roboflow Private API Key**.
3. Select **Roboflow Model (Online API)**.
4. Click **Test Connection**, then **Save Settings**.

---

## 🚀 How to Run

* **Local Server:** Double-click `start.bat` (opens `http://localhost:3000`).
* **Direct Browser:** Double-click `open_app.bat` or open `index.html` directly in your browser.
