/**
 * grading.js
 * Implements Topic 3: Dragon Fruit Defect Detection & Grading Logic
 * Translates YOLO defect detections into agricultural export grading decisions
 */

const DragonFruitGrading = {
  // Configurable thresholds
  rules: {
    maxDefectsForGrade1: 0,
    maxDefectsForGrade2: 3,
    criticalDefectClasses: ['anthracnose', 'rot', 'stem_end_rot', 'decay', 'split', 'necrosis']
  },

  /**
   * Evaluates detections and returns a full grading report
   * @param {Array} detections - Array of {class, confidence, x, y, width, height, bbox}
   * @returns {Object} Grading evaluation object
   */
  evaluate(detections = []) {
    const defectCount = detections.length;
    
    // Check for critical defects
    const criticalDefects = detections.filter(d => 
      this.rules.criticalDefectClasses.some(crit => 
        (d.class || '').toLowerCase().includes(crit)
      )
    );

    let gradeNumber = 1;
    let gradeLabel = 'GRADE 1';
    let gradeSubtitle = 'Export Quality';
    let determination = 'Approved for International Export (Meets Global Premium Standards)';
    let gradeColor = '#22C55E'; // Green
    let gradeBgColor = '#DCFCE7';
    let gradeClass = 'grade-1';

    if (defectCount === 0) {
      gradeNumber = 1;
      gradeLabel = 'GRADE 1';
      gradeSubtitle = '(Export Quality)';
      determination = 'Grade 1: 0 Defects (Export-Grade, Premium International Quality)';
      gradeColor = '#22C55E';
      gradeClass = 'grade-1';
    } else if (defectCount <= this.rules.maxDefectsForGrade2 && criticalDefects.length === 0) {
      gradeNumber = 2;
      gradeLabel = 'GRADE 2';
      gradeSubtitle = '(Minor Defects)';
      determination = 'Grade 2: (Not Export-Grade, Suitable for Local Market)';
      gradeColor = '#F97316'; // Orange as in mockup
      gradeClass = 'grade-2';
    } else {
      gradeNumber = 3;
      gradeLabel = 'GRADE 3';
      gradeSubtitle = '(Processing)';
      determination = criticalDefects.length > 0 
        ? `Grade 3: Critical defect (${criticalDefects[0].class}) detected. Suitable for Processing/Industrial Use.`
        : `Grade 3: Excessive defects (${defectCount}). Unsuitable for fresh market, redirect to processing/puree.`;
      gradeColor = '#EF4444'; // Red
      gradeClass = 'grade-3';
    }

    // Quality Score (0 to 100)
    let score = 100;
    detections.forEach(d => {
      const isCritical = this.rules.criticalDefectClasses.some(crit => (d.class || '').toLowerCase().includes(crit));
      score -= isCritical ? 35 : 15;
    });
    score = Math.max(0, Math.min(100, score));

    // Summary breakdown by class
    const defectCountsByClass = {};
    detections.forEach(d => {
      const cls = d.class || 'Defect';
      defectCountsByClass[cls] = (defectCountsByClass[cls] || 0) + 1;
    });

    return {
      gradeNumber,
      gradeLabel,
      gradeSubtitle,
      determination,
      defectCount,
      criticalDefectCount: criticalDefects.length,
      gradeColor,
      gradeClass,
      qualityScore: score,
      breakdown: defectCountsByClass,
      detections
    };
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DragonFruitGrading;
}
