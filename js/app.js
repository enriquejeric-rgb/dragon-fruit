/**
 * app.js
 * Clean & Simple Dragon Fruit Ripeness Checker
 * Focused strictly on Ripe vs Unripe detection
 */

const App = {
  videoStream: null,
  currentEvaluation: null,
  facingMode: 'environment',
  hasImageLoaded: false,

  init() {
    this.bindEvents();
    this.renderHistoryTable();
  },

  bindEvents() {
    // Check Ripeness Button
    document.getElementById('btnCheckRipeness').addEventListener('click', () => {
      this.checkRipeness();
    });

    // Upload Photo
    const fileInput = document.getElementById('fileInputPhoto');
    document.getElementById('btnUploadTrigger').addEventListener('click', () => {
      fileInput.click();
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleUpload(e.target.files[0]);
      }
    });

    // Camera Button / Switch
    document.getElementById('btnCameraSwitch').addEventListener('click', () => {
      if (!this.videoStream) {
        this.startCamera();
      } else {
        this.switchCamera();
      }
    });

    // Save Result to History
    document.getElementById('btnSaveToHistory').addEventListener('click', () => {
      this.saveToHistory();
    });

    // Clear / Reset View
    document.getElementById('btnResetView').addEventListener('click', () => {
      this.resetView();
    });

    // History Actions
    document.getElementById('btnDownloadCSV').addEventListener('click', () => {
      InspectionHistory.exportToCSV();
    });

    document.getElementById('btnClearHistoryLogs').addEventListener('click', () => {
      if (confirm('Clear scan history?')) {
        InspectionHistory.clearAll();
        this.renderHistoryTable();
        this.showToast('History cleared');
      }
    });

    // Settings Modal
    document.getElementById('btnSettingsOpen').addEventListener('click', () => {
      this.openSettings();
    });
    document.getElementById('btnModalClose').addEventListener('click', () => {
      this.closeSettings();
    });
    document.getElementById('btnModalCancel').addEventListener('click', () => {
      this.closeSettings();
    });
    document.getElementById('settingsModalOverlay').addEventListener('click', (e) => {
      if (e.target.id === 'settingsModalOverlay') this.closeSettings();
    });
    document.getElementById('btnModalSave').addEventListener('click', () => {
      this.saveSettings();
    });
    document.getElementById('btnTestApi').addEventListener('click', () => {
      this.testRoboflow();
    });
  },

  // Camera Management
  async startCamera() {
    const video = document.getElementById('liveVideo');
    const previewImg = document.getElementById('fruitPhotoPreview');
    const placeholder = document.getElementById('emptyPlaceholder');

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: this.facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });

        this.videoStream = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        previewImg.style.display = 'none';
        if (placeholder) placeholder.style.display = 'none';
        this.hasImageLoaded = true;

        video.onloadedmetadata = () => {
          video.play();
        };
        this.clearCanvas();
        return;
      } catch (err) {
        this.showToast('Camera not available or access denied');
      }
    } else {
      this.showToast('Camera not supported by browser');
    }
  },

  stopCamera() {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(t => t.stop());
      this.videoStream = null;
    }
  },

  switchCamera() {
    this.facingMode = (this.facingMode === 'environment') ? 'user' : 'environment';
    this.stopCamera();
    this.startCamera();
  },

  handleUpload(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.stopCamera();
      const video = document.getElementById('liveVideo');
      const previewImg = document.getElementById('fruitPhotoPreview');
      const placeholder = document.getElementById('emptyPlaceholder');

      video.style.display = 'none';
      if (placeholder) placeholder.style.display = 'none';

      previewImg.src = e.target.result;
      previewImg.style.display = 'block';
      this.hasImageLoaded = true;

      previewImg.onload = () => {
        this.clearCanvas();
      };
    };
    reader.readAsDataURL(file);
  },

  clearCanvas() {
    const canvas = document.getElementById('viewCanvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  },

  resetView() {
    this.stopCamera();
    const video = document.getElementById('liveVideo');
    const previewImg = document.getElementById('fruitPhotoPreview');
    const placeholder = document.getElementById('emptyPlaceholder');

    video.style.display = 'none';
    previewImg.style.display = 'none';
    previewImg.src = '';
    if (placeholder) placeholder.style.display = 'flex';
    this.hasImageLoaded = false;
    this.currentEvaluation = null;

    this.clearCanvas();

    document.getElementById('statusBoxContainer').className = 'ripeness-status-box default';
    const statusImg = document.getElementById('ripenessStatusImg');
    if (statusImg) {
      statusImg.src = 'assets/logo.png';
      statusImg.alt = 'Dragon Fruit Grader';
    }
    document.getElementById('statusTitleText').textContent = 'READY TO CHECK';
    document.getElementById('statusDescText').textContent = 'Upload or capture a dragon fruit photo to check if it\'s ripe or unripe.';
    document.getElementById('detailStatusVal').textContent = '--';
    document.getElementById('detailConfidenceVal').textContent = '--';
    document.getElementById('detailSkinVal').textContent = '--';
    const harvestVal = document.getElementById('detailHarvestVal');
    harvestVal.textContent = 'Waiting for photo';
    harvestVal.style.color = 'var(--text-muted)';
    document.getElementById('resultTimestamp').textContent = 'Ready to check';
  },

  // Main Action: Check Ripeness
  async checkRipeness() {
    const video = document.getElementById('liveVideo');
    const previewImg = document.getElementById('fruitPhotoPreview');

    const isVideoReady = (this.videoStream && video.videoWidth > 0);
    const isImageReady = (previewImg && previewImg.src && previewImg.style.display !== 'none');

    if (!isVideoReady && !isImageReady) {
      this.showToast('Please upload or capture a photo first');
      return;
    }

    const imageSource = isVideoReady ? video : previewImg;

    // Snapshot image to canvas
    const canvas = document.createElement('canvas');
    const w = imageSource.naturalWidth || imageSource.videoWidth || 600;
    const h = imageSource.naturalHeight || imageSource.videoHeight || 600;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(imageSource, 0, 0, w, h);
    const snapshotUrl = canvas.toDataURL('image/jpeg', 0.92);

    // Run Detection
    const detectionResult = await DefectDetector.detect(imageSource);

    // Evaluate Ripeness
    const ripenessReport = DragonFruitRipeness.evaluate(detectionResult.predictions);

    // Draw bounding box on canvas
    const viewCanvas = document.getElementById('viewCanvas');
    const box = document.getElementById('viewportBox');
    viewCanvas.width = box.clientWidth;
    viewCanvas.height = box.clientHeight;
    DefectDetector.drawBoundingBoxes(
      viewCanvas.getContext('2d'),
      detectionResult.predictions,
      viewCanvas.width,
      viewCanvas.height,
      detectionResult.imageWidth,
      detectionResult.imageHeight
    );

    this.currentEvaluation = {
      imageSnapshot: snapshotUrl,
      detectionResult,
      ripenessReport
    };

    // Render result card with actual scanned image
    this.renderResultCard(ripenessReport, snapshotUrl);
  },

  renderResultCard(report, snapshotUrl) {
    const container = document.getElementById('statusBoxContainer');
    const statusImg = document.getElementById('ripenessStatusImg');
    const titleEl = document.getElementById('statusTitleText');
    const descEl = document.getElementById('statusDescText');

    // Display actual uploaded or scanned image in the Ripeness Result badge
    const actualImageSrc = snapshotUrl || (this.currentEvaluation && this.currentEvaluation.imageSnapshot) || 'assets/logo.png';
    if (statusImg) {
      statusImg.src = actualImageSrc;
      statusImg.alt = report.isDragonFruit 
        ? (report.isRipe ? 'Scanned Ripe Dragon Fruit' : 'Scanned Unripe Dragon Fruit')
        : 'Non-Dragon Fruit Image';
    }

    if (!report.isDragonFruit) {
      container.className = 'ripeness-status-box not-fruit';
      titleEl.textContent = 'NOT DRAGON FRUIT';
      descEl.textContent = 'No dragon fruit was recognized in this photo. Please upload or scan a clear photo of a dragon fruit.';
      document.getElementById('detailStatusVal').textContent = 'Not Dragon Fruit';
      document.getElementById('detailConfidenceVal').textContent = '--';
      document.getElementById('detailSkinVal').textContent = 'Unrecognized';
      const harvestEl = document.getElementById('detailHarvestVal');
      harvestEl.textContent = 'Please scan a dragon fruit';
      harvestEl.style.color = '#C2410C';
    } else if (report.isRipe) {
      container.className = 'ripeness-status-box ripe';
      titleEl.textContent = 'RIPE';
      descEl.textContent = 'Fully matured dragon fruit with rich red/pink skin. Flesh is sweet and ready to eat!';
      document.getElementById('detailStatusVal').textContent = 'Ripe';
      document.getElementById('detailConfidenceVal').textContent = `${report.confidence}%`;
      document.getElementById('detailSkinVal').textContent = 'Red / Pink';
      const harvestEl = document.getElementById('detailHarvestVal');
      harvestEl.textContent = 'Ready to harvest and eat';
      harvestEl.style.color = '#C2185B';
    } else {
      container.className = 'ripeness-status-box unripe';
      titleEl.textContent = 'UNRIPE';
      descEl.textContent = 'Young fruit with predominantly green skin and scales. Still maturing on the vine.';
      document.getElementById('detailStatusVal').textContent = 'Unripe';
      document.getElementById('detailConfidenceVal').textContent = `${report.confidence}%`;
      document.getElementById('detailSkinVal').textContent = 'Green / Yellow-Green';
      const harvestEl = document.getElementById('detailHarvestVal');
      harvestEl.textContent = 'Leave on vine to mature';
      harvestEl.style.color = '#2E7D32';
    }

    document.getElementById('resultTimestamp').textContent = `Checked at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  },

  saveToHistory() {
    if (!this.currentEvaluation) {
      this.showToast('Please check a fruit first');
      return;
    }

    const { ripenessReport, imageSnapshot } = this.currentEvaluation;

    const record = {
      isDragonFruit: ripenessReport.isDragonFruit,
      isRipe: ripenessReport.isRipe,
      label: ripenessReport.label,
      title: ripenessReport.title,
      statusNote: ripenessReport.statusNote,
      confidence: ripenessReport.confidence,
      thumbnail: imageSnapshot || ''
    };

    InspectionHistory.addRecord(record);
    this.renderHistoryTable();
    this.showToast('Saved to history!');
  },

  // Render History Table
  renderHistoryTable() {
    const tbody = document.getElementById('historyTableRows');
    if (!tbody) return;

    const list = InspectionHistory.getAll();
    tbody.innerHTML = '';

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 24px;">
            No checks recorded yet.
          </td>
        </tr>
      `;
      return;
    }

    list.forEach(item => {
      const tr = document.createElement('tr');
      let badgeClass = 'badge-not-fruit';
      if (item.isDragonFruit !== false) {
        badgeClass = item.isRipe ? 'badge-ripe' : 'badge-unripe';
      }

      const thumbHtml = item.thumbnail
        ? `<img src="${item.thumbnail}" class="table-fruit-thumb" alt="Fruit">`
        : `<img src="assets/logo.png" class="table-fruit-thumb" style="padding: 4px; background: #FAF7F5; object-fit: contain;" alt="Fruit">`;

      const confText = (item.isDragonFruit !== false && item.confidence > 0)
        ? `<strong>${item.confidence}%</strong>`
        : '<span style="color: var(--text-muted);">--</span>';

      tr.innerHTML = `
        <td>${thumbHtml}</td>
        <td><strong>${item.id}</strong></td>
        <td><span style="color: var(--text-muted); font-size: 12px;">${item.timestamp}</span></td>
        <td><span class="badge-pill ${badgeClass}">${item.title || (item.isRipe ? 'RIPE' : 'UNRIPE')}</span></td>
        <td>${confText}</td>
        <td style="max-width: 340px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
          ${item.statusNote || ''}
        </td>
      `;

      tbody.appendChild(tr);
    });
  },

  // Settings Modal
  openSettings() {
    document.getElementById('inputRoboflowApiKey').value = RoboflowClient.config.apiKey || '';
    document.getElementById('inputRoboflowProjectName').value = RoboflowClient.config.project || 'thanh-long-detection-znzlc-k8knb';
    document.getElementById('inputRoboflowVersionNum').value = RoboflowClient.config.version || '4';
    document.getElementById('selectEngineSource').value = DefectDetector.activeModel || 'offline';

    const msg = document.getElementById('testStatusMsg');
    msg.style.display = 'none';

    document.getElementById('settingsModalOverlay').style.display = 'flex';
  },

  closeSettings() {
    document.getElementById('settingsModalOverlay').style.display = 'none';
  },

  saveSettings() {
    const apiKey = document.getElementById('inputRoboflowApiKey').value.trim();
    const project = document.getElementById('inputRoboflowProjectName').value.trim();
    const version = document.getElementById('inputRoboflowVersionNum').value.trim();
    const model = document.getElementById('selectEngineSource').value;

    RoboflowClient.saveConfig({ apiKey, project, version });
    DefectDetector.setModel(model);

    this.closeSettings();
    this.showToast('Settings saved!');
  },

  async testRoboflow() {
    const msg = document.getElementById('testStatusMsg');
    msg.style.display = 'block';
    msg.style.background = '#E0F2FE';
    msg.style.color = '#0369A1';
    msg.textContent = 'Testing connection...';

    const apiKey = document.getElementById('inputRoboflowApiKey').value.trim();
    const project = document.getElementById('inputRoboflowProjectName').value.trim();
    const version = document.getElementById('inputRoboflowVersionNum').value.trim();

    RoboflowClient.saveConfig({ apiKey, project, version });

    const res = await RoboflowClient.testConnection();
    if (res.success) {
      msg.style.background = '#DCFCE7';
      msg.style.color = '#15803D';
      msg.textContent = res.message;
    } else {
      msg.style.background = '#FEE2E2';
      msg.style.color = '#B91C1C';
      msg.textContent = res.message;
    }
  },

  showToast(text) {
    const toast = document.getElementById('toastMessage');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }
};

window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
