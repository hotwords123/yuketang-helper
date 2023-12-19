/**
 * Returns a random integer in [l, r].
 * @param {number} l
 * @param {number} r
 */
export function randInt(l, r) {
  return l + Math.floor(Math.random() * (r - l + 1));
}

/**
 * Shuffles the elements in the array.
 * @param {Array} array
 */
export function shuffleArray(array) {
  for (let i = 1; i < array.length; i++) {
    let j = randInt(0, i);
    if (j != i) {
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  return array;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
