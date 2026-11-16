/**
 * roboflow.js
 * Handles Roboflow Hosted Inference API integration
 * For project: thanh-long-detection-znzlc-k8knb
 */

const RoboflowClient = {
  config: {
    apiKey: '',
    workspace: 'reji',
    project: 'thanh-long-detection-znzlc-k8knb',
    version: '4',
    confidence: 0.40,
    overlap: 0.30,
    endpointUrl: 'https://detect.roboflow.com'
  },

  init() {
    const saved = localStorage.getItem('df_roboflow_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.config = { ...this.config, ...parsed };
      } catch (e) {
        console.error('Failed to parse saved Roboflow config:', e);
      }
    }
  },

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    localStorage.setItem('df_roboflow_config', JSON.stringify(this.config));
  },

  hasApiKey() {
    return Boolean(this.config.apiKey && this.config.apiKey.trim().length > 0);
  },

  /**
   * Tests connection with Roboflow API
   */
  async testConnection() {
    if (!this.hasApiKey()) {
      return { 
        success: false, 
        message: 'No Roboflow API key provided. Please enter your API key in Settings.' 
      };
    }

    const testUrl = `${this.config.endpointUrl}/${this.config.project}/${this.config.version}?api_key=${this.config.apiKey.trim()}`;
    
    try {
      // Roboflow responds with 400 or info if GET/POST without image, or we can check with dummy 1x1 base64
      const dummyPixel = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      const response = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: dummyPixel
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          success: true, 
          message: `Connected successfully to Roboflow model ${this.config.project}/${this.config.version}!` 
        };
      } else {
        const errorText = await response.text();
        let message = `Roboflow returned status ${response.status}`;
        try {
          const errObj = JSON.parse(errorText);
          if (errObj.message) message = errObj.message;
        } catch (_) {}

        if (response.status === 401 || response.status === 403) {
          message = 'Invalid API key or unauthorized project access.';
        } else if (response.status === 404) {
          message = `Model version ${this.config.version} not found or still training on Roboflow.`;
        }

        return { success: false, message };
      }
    } catch (err) {
      return { 
        success: false, 
        message: 'Network error connecting to Roboflow. Ensure you have internet access or try offline mode.' 
      };
    }
  },

  /**
   * Runs inference on image
   * @param {string} base64Image - Base64 encoded JPEG/PNG or dataURL
   * @returns {Promise<Object>} { predictions, inferenceTime, imageMeta }
   */
  async detect(base64Image) {
    if (!this.hasApiKey()) {
      throw new Error('Roboflow API key is not configured.');
    }

    // Clean data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

    const url = `${this.config.endpointUrl}/${this.config.project}/${this.config.version}?api_key=${this.config.apiKey.trim()}&confidence=${Math.round(this.config.confidence * 100)}&overlap=${Math.round(this.config.overlap * 100)}`;

    const startTime = performance.now();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: cleanBase64
    });

    const elapsed = Math.round(performance.now() - startTime);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Roboflow API Error (${response.status}): ${errText}`);
    }

    const data = await response.json();

    // Map Roboflow center (x, y) coordinates to top-left (x, y, width, height)
    const predictions = (data.predictions || []).map(p => {
      const x = p.x - (p.width / 2);
      const y = p.y - (p.height / 2);
      return {
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: p.width,
        height: p.height,
        class: p.class || 'Defect',
        confidence: p.confidence || 0.8
      };
    });

    return {
      predictions,
      inferenceTime: data.time ? Math.round(data.time * 1000) : elapsed,
      imageWidth: data.image?.width || 640,
      imageHeight: data.image?.height || 640,
      source: 'Roboflow API'
    };
  }
};

RoboflowClient.init();
