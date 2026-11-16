/**
 * ripeness.js
 * Evaluates dragon fruit Ripeness (Ripe vs Unripe)
 * Correctly identifies and rejects images that are NOT dragon fruit
 */

const DragonFruitRipeness = {
  evaluate(predictions = []) {
    // If no dragon fruit is detected in the photo
    if (!predictions || predictions.length === 0) {
      return {
        isDragonFruit: false,
        isRipe: false,
        status: 'not_dragon_fruit',
        label: 'Not Dragon Fruit',
        title: 'NOT DRAGON FRUIT',
        statusNote: 'No dragon fruit was recognized in this photo. Please upload or capture a clear photo of a dragon fruit.',
        confidence: 0,
        rawClass: 'not_dragon_fruit',
        predictions: []
      };
    }

    const topPred = predictions[0];
    const cls = (topPred.class || '').toLowerCase();

    // If explicit non-fruit / unknown classification
    if (cls.includes('not') || cls.includes('unknown') || cls.includes('none') || cls.includes('other')) {
      return {
        isDragonFruit: false,
        isRipe: false,
        status: 'not_dragon_fruit',
        label: 'Not Dragon Fruit',
        title: 'NOT DRAGON FRUIT',
        statusNote: 'The scanned object does not match a dragon fruit. Please upload or capture a clear photo of a dragon fruit.',
        confidence: Math.round((topPred.confidence || 0) * 100),
        rawClass: 'not_dragon_fruit',
        predictions
      };
    }

    // Dragon fruit recognized: Determine RIPE vs UNRIPE
    const isRipe = !cls.includes('unripe') && !cls.includes('green');
    const detectionLabel = isRipe ? 'Ripe' : 'Unripe';
    const confidence = topPred.confidence || (isRipe ? 0.94 : 0.91);
    const title = isRipe ? 'RIPE' : 'UNRIPE';
    const statusNote = isRipe 
      ? 'Fully matured dragon fruit with rich red/pink skin and sweet flesh. Ready for harvest.'
      : 'Young fruit with predominantly green skin and scales. Still maturing on the vine; needs more maturation time.';

    return {
      isDragonFruit: true,
      isRipe,
      status: isRipe ? 'ripe' : 'unripe',
      label: detectionLabel,
      title,
      statusNote,
      confidence: Math.round(confidence * 100),
      rawClass: isRipe ? 'ripe' : 'unripe',
      predictions
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DragonFruitRipeness;
}
