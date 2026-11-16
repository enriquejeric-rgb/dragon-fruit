/**
 * ripeness.js
 * Evaluates dragon fruit Ripeness (Ripe vs Unripe)
 */

const DragonFruitRipeness = {
  evaluate(predictions = [], defaultRipe = true) {
    let isRipe = true;
    let confidence = 0.94;
    let detectionLabel = 'Ripe';
    let rawClass = 'ripe';

    // If predictions come from Roboflow or Detector
    if (predictions && predictions.length > 0) {
      const topPred = predictions[0];
      const cls = (topPred.class || '').toLowerCase();

      if (cls.includes('unripe') || cls.includes('green')) {
        isRipe = false;
        detectionLabel = 'Unripe';
        rawClass = 'unripe';
      } else {
        isRipe = true;
        detectionLabel = 'Ripe';
        rawClass = 'ripe';
      }
      confidence = topPred.confidence || 0.92;
    } else {
      isRipe = Boolean(defaultRipe);
      detectionLabel = isRipe ? 'Ripe' : 'Unripe';
      confidence = isRipe ? 0.95 : 0.92;
    }

    const title = isRipe ? 'RIPE' : 'UNRIPE';
    const statusNote = isRipe 
      ? 'Fully matured fruit with vibrant red/pink skin and sweet flesh. Ready for harvest and consumption.'
      : 'Young fruit with predominantly green skin and scales. Still developing on the vine; needs more maturation time.';

    return {
      isRipe,
      label: detectionLabel,
      title,
      statusNote,
      confidence: Math.round(confidence * 100),
      rawClass,
      predictions
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DragonFruitRipeness;
}
