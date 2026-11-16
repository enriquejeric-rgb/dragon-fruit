# 🍓 Dragon Fruit Ripeness Checker

A simple web application designed to check dragon fruit ripeness (**Ripe** vs **Unripe**), connected to your Roboflow dataset: `thanh-long-detection-znzlc-k8knb`.

---

## 🌿 How It Works

* **Ripe Dragon Fruit:**
  * Detected by rich red/pink skin coloration.
  * Marked with a pink box labeled `Ripe (95%)`.
  * Recommendation: Ready for harvest and fresh consumption.

* **Unripe Dragon Fruit:**
  * Detected by predominantly green skin and scales.
  * Marked with a green box labeled `Unripe (92%)`.
  * Recommendation: Leave on the vine to mature.

---

## 🎨 Clean & Aesthetic Dragon Fruit Design

* **Realistic Dragon Fruit Header Logo:** Clean, aesthetic vector illustration of a real dragon fruit with natural pink-to-lime scales, waxy specular highlights, and cactus stem.
* **Custom Ripe & Unripe Badge Logos:** Dedicated, beautifully styled dragon fruit badges for **RIPE** (rose badge with mature red/pink fruit) and **UNRIPE** (sage mint badge with young green/lime fruit).
* **No Sci-Fi / AI Tropes:** Simple, warm, and natural feel without neon reticles, cybernetic overlays, or tech jargon.
* **Warm Dragon Fruit Theme:** Natural pitaya colors: dragon fruit pink (`#E91E63`, `#C2185B`) and vine green (`#2E7D32`), with friendly typography (`Plus Jakarta Sans` & `Comfortaa`).
* **Direct Workflow:** Single clean screen with photo/camera input on the left, instant ripeness result card on the right, and recent scan logs below.

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
* **Direct Browser:** Double-click `open_app.bat` or open `index.html` directly in Chrome, Edge, Safari, or Firefox.
