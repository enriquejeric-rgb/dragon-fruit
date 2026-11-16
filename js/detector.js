/**
 * detector.js
 * Detects Dragon Fruit Ripeness (Ripe vs Unripe)
 * Handles Roboflow API integration & on-device offline recognition
 */

const DefectDetector = {
  activeModel: 'offline', // 'offline' or 'roboflow-api'

  init() {
    const saved = localStorage.getItem('df_model_choice');
    if (saved) this.activeModel = saved;
  },

  setModel(modelType) {
    this.activeModel = modelType;
    localStorage.setItem('df_model_choice', modelType);
  },

  async detect(imageSource, options = {}) {
    // If user configured Roboflow API
    if (this.activeModel === 'roboflow-api' && RoboflowClient.hasApiKey()) {
      try {
        const base64 = this.getImageBase64(imageSource);
        const result = await RoboflowClient.detect(base64);
        return {
          ...result,
          modelName: `Roboflow Model (v${RoboflowClient.config.version})`,
          isOffline: false
        };
      } catch (err) {
        console.warn('Roboflow API call failed, falling back to local detector:', err);
      }
    }

    // Default: Local Ripeness Detector
    return await this.detectLocal(imageSource, options);
  },

  async detectLocal(imageSource, options = {}) {
    await new Promise(r => setTimeout(r, 60)); // Quick responsive feel

    let width = imageSource.naturalWidth || imageSource.videoWidth || imageSource.width || 600;
    let height = imageSource.naturalHeight || imageSource.videoHeight || height || 600;

    // Analyze image color spectrum (Red/Magenta vs Green)
    const predictions = this.analyzeRipenessByColor(imageSource, width, height);

    return {
      predictions,
      imageWidth: width,
      imageHeight: height,
      modelName: 'Local Model',
      isOffline: true
    };
  },

  /**
   * Evaluates image to determine:
   * 1. Whether it is actually a dragon fruit (or another object/face/background)
   * 2. If it is a dragon fruit, whether it is RIPE or UNRIPE
   */
  analyzeRipenessByColor(imageSource, width, height) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scanW = 120;
      const scanH = 120;
      canvas.width = scanW;
      canvas.height = scanH;
      ctx.drawImage(imageSource, 0, 0, scanW, scanH);

      const imgData = ctx.getImageData(0, 0, scanW, scanH).data;
      const totalPixels = scanW * scanH;

      let pinkCount = 0;
      let greenCount = 0;
      let borderFruitCount = 0;
      let minX = scanW, maxX = 0, minY = scanH, maxY = 0;

      for (let y = 0; y < scanH; y++) {
        for (let x = 0; x < scanW; x++) {
          const idx = (y * scanW + x) * 4;
          const r = imgData[idx];
          const g = imgData[idx + 1];
          const b = imgData[idx + 2];
          const a = imgData[idx + 3];

          if (a < 50) continue; // transparent pixel

          // Fast RGB-to-HSV calculation
          const rNorm = r / 255, gNorm = g / 255, bNorm = b / 255;
          const max = Math.max(rNorm, gNorm, bNorm);
          const min = Math.min(rNorm, gNorm, bNorm);
          const delta = max - min;

          let h = 0;
          const s = max === 0 ? 0 : delta / max;
          const v = max;

          if (delta !== 0) {
            if (max === rNorm) {
              h = (gNorm - bNorm) / delta + (gNorm < bNorm ? 6 : 0);
            } else if (max === gNorm) {
              h = (bNorm - rNorm) / delta + 2;
            } else {
              h = (rNorm - gNorm) / delta + 4;
            }
            h *= 60;
          }

          // 1. Magenta / Hot Pink fruit skin (distinctive pitaya coloration: 320°-360° or 0°-14°)
          // Excludes human skin/orange (Hue 18°-55°), wood, grays, and whites.
          const isPinkSkin = ((h >= 320 || h <= 14) && s >= 0.32 && v >= 0.22 && v <= 0.96);

          // 2. Vegetal / Lime scales and unripe fruit skin:
          // Hue in 65°-150°, S >= 0.26, V between 0.20 and 0.96.
          const isGreenSkin = ((h >= 65 && h <= 150) && s >= 0.26 && v >= 0.20 && v <= 0.96);

          if (isPinkSkin || isGreenSkin) {
            if (isPinkSkin) pinkCount++;
            if (isGreenSkin) greenCount++;

            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;

            if (x === 0 || x === scanW - 1 || y === 0 || y === scanH - 1) {
              borderFruitCount++;
            }
          }
        }
      }

      const totalFruitPixels = pinkCount + greenCount;
      const fruitRatio = totalFruitPixels / totalPixels;

      // VALIDATION: Reject non-dragon-fruit images
      // A genuine dragon fruit photo contains at least ~7.5% fruit-colored pixels
      if (fruitRatio < 0.075 || totalFruitPixels < 350) {
        // Not a dragon fruit! (e.g. human face, room, desk, car, cat, white paper)
        return [];
      }

      // Reject full-screen solid wallpaper / lawn (e.g., >85% solid green/pink covering all borders)
      const borderTotal = (scanW * 2) + (scanH * 2) - 4;
      if (fruitRatio > 0.85 && (borderFruitCount / borderTotal) > 0.75) {
        return [];
      }

      // Check pixel cluster bounding dimensions
      const boxW = maxX - minX;
      const boxH = maxY - minY;
      if (boxW < scanW * 0.15 || boxH < scanH * 0.15) {
        return [];
      }

      // Dragon fruit confirmed! Classify RIPE vs UNRIPE
      const isRipe = (pinkCount >= 400 && pinkCount >= greenCount * 0.45);

      // Scale bounding box back to image coordinates with slight natural padding
      const padX = Math.round(boxW * 0.05);
      const padY = Math.round(boxH * 0.05);
      const finalMinX = Math.max(0, minX - padX);
      const finalMaxX = Math.min(scanW, maxX + padX);
      const finalMinY = Math.max(0, minY - padY);
      const finalMaxY = Math.min(scanH, maxY + padY);

      const origScaleX = width / scanW;
      const origScaleY = height / scanH;

      const predX = Math.round(finalMinX * origScaleX);
      const predY = Math.round(finalMinY * origScaleY);
      const predW = Math.round((finalMaxX - finalMinX) * origScaleX);
      const predH = Math.round((finalMaxY - finalMinY) * origScaleY);

      const confidence = isRipe 
        ? Math.min(0.96, Math.max(0.86, 0.82 + (pinkCount / totalPixels)))
        : Math.min(0.95, Math.max(0.83, 0.78 + (greenCount / totalPixels)));

      return [{
        x: predX,
        y: predY,
        width: predW,
        height: predH,
        class: isRipe ? 'Ripe' : 'Unripe',
        confidence: +(confidence.toFixed(2)),
        color: isRipe ? '#E91E63' : '#2E7D32'
      }];
    } catch (e) {
      console.error('Error during fruit analysis:', e);
      return [];
    }
  },

  drawBoundingBoxes(ctx, predictions, displayWidth, displayHeight, origWidth, origHeight) {
    if (!predictions || predictions.length === 0) return;

    const scaleX = displayWidth / (origWidth || displayWidth);
    const scaleY = displayHeight / (origHeight || displayHeight);

    ctx.save();
    predictions.forEach(p => {
      const bx = p.x * scaleX;
      const by = p.y * scaleY;
      const bw = p.width * scaleX;
      const bh = p.height * scaleY;

      const isRipe = (p.class || '').toLowerCase().includes('ripe') && !(p.class || '').toLowerCase().includes('unripe');
      const boxColor = isRipe ? '#E91E63' : '#2E7D32';

      // Clean simple box
      ctx.lineWidth = 3;
      ctx.strokeStyle = boxColor;
      ctx.strokeRect(bx, by, bw, bh);

      // Light tint
      ctx.fillStyle = boxColor + '18';
      ctx.fillRect(bx, by, bw, bh);

      // Label tag
      const confPercent = Math.round((p.confidence || 0.9) * 100);
      const labelText = `${p.class} (${confPercent}%)`;
      ctx.font = 'bold 13px -apple-system, sans-serif';
      const textMetrics = ctx.measureText(labelText);
      const tagW = textMetrics.width + 16;
      const tagH = 24;

      ctx.fillStyle = boxColor;
      ctx.fillRect(bx, Math.max(0, by - tagH), tagW, tagH);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(labelText, bx + 8, Math.max(16, by - 7));
    });
    ctx.restore();
  },

  getImageBase64(imageSource) {
    if (typeof imageSource === 'string' && imageSource.startsWith('data:image')) {
      return imageSource;
    }
    const canvas = document.createElement('canvas');
    canvas.width = imageSource.naturalWidth || imageSource.videoWidth || imageSource.width || 600;
    canvas.height = imageSource.naturalHeight || imageSource.videoHeight || imageSource.height || 600;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageSource, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.9);
  }
};

DefectDetector.init();
