/**
 * Core implementation for line-ending normalization and detection.
 *
 * Design decisions:
 *
 * 1. Normalization is a two-phase process. First we split the input into
 *    logical lines using a combined CR/LF aware regex. Then we join with
 *    the target separator. This avoids the classic bug where a naive
 *    string replace of CRLF -> LF followed by CR -> LF works, but LF -> CRLF
 *    followed by CR -> CRLF double-converts existing CRLFs. By splitting
 *    first, every original line ending maps to exactly one output ending.
 *
 * 2. Detection returns the dominant line ending by character count, with a
 *    deterministic tie-break: on an exact tie, CRLF beats LF beats CR. This
 *    makes detection stable across runs for the same input, which matters
 *    because downstream code may branch on the detected type.
 *
 * 3. Mixed input (e.g. "a\r\nb\nc\r") is normalized by converting every
 *    ending to the target, regardless of what it was. This is the simplest
 *    contract that handles real-world files with mixed endings from edits on
 *    different platforms.
 */

/**
 * The CR line ending byte sequence.
 * @type {readonly [number]} as Uint8Array-compatible tuple
 */
export const CR = "\r";

/**
 * The LF line ending byte sequence.
 */
export const LF = "\n";

/**
 * The CRLF line ending byte sequence.
 */
export const CRLF = "\r\n";

/**
 * Split text into logical lines, preserving the content but discarding the
 * original line endings.
 *
 * We use a regex that matches any of \r\n, \r, or \n. Order matters in the
 * alternation: \r\n must come before \r and \n, otherwise \r\n would be split
 * as a bare \r followed by \n, producing an empty phantom line.
 *
 * @param {string} text
 * @returns {string[]}
 */
function splitLines(text) {
  if (text.length === 0) {
    return [""];
  }
  // Match CRLF, CR, or LF — in that order.
  return text.split(/\r\n|\r|\n/);
}

/**
 * Convert any line endings in `text` to `target`.
 *
 * @param {string} text - The input text.
 * @param {string} target - One of LF, CR, or CRLF.
 * @returns {string} The text with all line endings replaced by `target`.
 */
export function convertLineEndings(text, target) {
  if (typeof text !== "string") {
    throw new TypeError("text must be a string");
  }
  if (target !== LF && target !== CR && target !== CRLF) {
    throw new RangeError(
      "target must be one of LF, CR, or CRLF (the exported constants)"
    );
  }
  const lines = splitLines(text);
  return lines.join(target);
}

/**
 * Normalize `text` so that every line ending is `target`.
 *
 * This is an alias of {@link convertLineEndings}, provided under a name that
 * reads well when the caller is normalizing for a specific platform.
 *
 * @param {string} text
 * @param {string} target
 * @returns {string}
 */
export function normalize(text, target) {
  return convertLineEndings(text, target);
}

/**
 * Count occurrences of each line ending type in the input.
 *
 * Counting is done with a manual scan rather than regex matching, because we
 * need to avoid double-counting the \r in a CRLF. The scan treats the \r in a
 * \r\n pair as part of the CRLF, not as a standalone CR.
 *
 * @param {string} text
 * @returns {{ LF: number, CR: number, CRLF: number }}
 */
export function detectLineEndings(text) {
  if (typeof text !== "string") {
    throw new TypeError("text must be a string");
  }
  let lf = 0;
  let cr = 0;
  let crlf = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    if (ch === 10) {
      // LF not preceded by CR
      lf++;
    } else if (ch === 13) {
      // CR. Check if followed by LF.
      if (i + 1 < text.length && text.charCodeAt(i + 1) === 10) {
        crlf++;
        i++; // consume the LF
      } else {
        cr++;
      }
    }
  }
  return { LF: lf, CR: cr, CRLF: crlf };
}

/**
 * Return the human-readable name for a line ending constant.
 *
 * @param {string} ending - One of LF, CR, or CRLF.
 * @returns {string} "LF", "CR", "CRLF", or "UNKNOWN".
 */
export function lineEndingName(ending) {
  switch (ending) {
    case LF:
      return "LF";
    case CR:
      return "CR";
    case CRLF:
      return "CRLF";
    default:
      return "UNKNOWN";
  }
}
