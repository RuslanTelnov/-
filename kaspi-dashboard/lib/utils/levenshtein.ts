/**
 * Calculates the Levenshtein distance between two strings.
 * This is a measure of the difference between two sequences.
 * Returns the number of single-character edits (insertions, deletions or substitutions)
 * required to change one word into the other.
 */
export function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = []

    // Increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i]
    }

    // Increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1]
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1 // deletion
                    )
                )
            }
        }
    }

    return matrix[b.length][a.length]
}

/**
 * Normalizes a string for better matching:
 * - Converts to lowercase
 * - Removes extra whitespace
 * - Removes special characters
 */
export function normalizeString(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^\w\sа-яё]/gi, '') // Keep only letters and numbers
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * Calculates similarity percentage between two strings (0 to 100).
 */
export function calculateSimilarity(a: string, b: string): number {
    const normA = normalizeString(a)
    const normB = normalizeString(b)

    if (normA === normB) return 100
    if (normA.length === 0 || normB.length === 0) return 0

    const distance = levenshteinDistance(normA, normB)
    const maxLength = Math.max(normA.length, normB.length)

    return ((maxLength - distance) / maxLength) * 100
}
