// * Spaced Repetition System (SRS) Algorithm
//  * Implementation of SuperMemo SM-2 Algorithm
//  * 
//  * Quality ratings:
//  * 0 - Complete blackout
//  * 1 - Incorrect response, but remembered after seeing answer
//  * 2 - Incorrect response, but seemed easy to recall after seeing answer
//  * 3 - Correct response, but required significant effort
//  * 4 - Correct response, with some hesitation
//  * 5 - Perfect response, immediate recall
//  */

export interface SRSData {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

export interface ReviewResult extends SRSData {
  wasCorrect: boolean;
}

export function calculateNextReview(
  quality: number,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 0,
  currentRepetitions: number = 0
): ReviewResult {
  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }

  // If quality < 3, reset the card (failed review)
  if (quality < 3) {
    const newEaseFactor = Math.max(1.3, currentEaseFactor - 0.2);
    
    return {
      easeFactor: newEaseFactor,
      interval: 0,
      repetitions: 0,
      nextReviewDate: new Date(),
      wasCorrect: false,
    };
  }

  // Calculate new ease factor
  const newEaseFactor = Math.max(
    1.3,
    currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // Calculate new interval based on repetitions
  let newInterval: number;
  const newRepetitions = currentRepetitions + 1;

  if (newRepetitions === 1) {
    newInterval = 1;
  } else if (newRepetitions === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(currentInterval * newEaseFactor);
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  nextReviewDate.setHours(0, 0, 0, 0);

  return {
    easeFactor: Number(newEaseFactor.toFixed(2)),
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
    wasCorrect: true,
  };
}

export function getIntervalPreview(
  quality: number,
  currentEaseFactor: number = 2.5,
  currentInterval: number = 0,
  currentRepetitions: number = 0
): string {
  const result = calculateNextReview(
    quality,
    currentEaseFactor,
    currentInterval,
    currentRepetitions
  );

  if (result.interval === 0) {
    return 'Today';
  } else if (result.interval === 1) {
    return '1 day';
  } else if (result.interval < 30) {
    return `${result.interval} days`;
  } else if (result.interval < 365) {
    const months = Math.round(result.interval / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.round(result.interval / 365);
    return `${years} year${years > 1 ? 's' : ''}`;
  }
}

export function isDue(nextReviewDate: Date | number): boolean {
  const reviewDate = typeof nextReviewDate === 'number' 
    ? new Date(nextReviewDate) 
    : nextReviewDate;
  return reviewDate <= new Date();
}

export function calculateSuccessRate(
  correctReviews: number,
  totalReviews: number
): number {
  if (totalReviews === 0) return 0;
  return Math.round((correctReviews / totalReviews) * 100);
}