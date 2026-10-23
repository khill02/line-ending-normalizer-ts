# line-ending-normalizer-ts

Converts text between LF, CRLF, and CR line ending conventions, with detection and reporting of which ending types are present.

```js
import { normalize, convertLineEndings, detectLineEndings, LF, CRLF } from "line-ending-normalizer-ts";

const text = "line1\r\nline2\rline3\n";

// See what's there
const counts = detectLineEndings(text);
// { LF: 1, CR: 1, CRLF: 1 }

// Force everything to LF
const lf = normalize(text, LF);
// "line1\nline2\nline3\n"

// Force everything to CRLF
const crlf = convertLineEndings(lf, CRLF);
// "line1\r\nline2\r\nline3\r\n"
```

## Why

Files edited across Windows, classic Mac, and Unix tools accumulate a mix of `\r\n`, `\r`, and `\n`. Most normalizers use a chain of string replaces (e.g. `s/\r\n/\n/g` then `s/\r/\n/g`). That works for LF output, but breaks when targeting CRLF: a replace of `\n` to `\r\n` runs before `\r` is handled, and existing `\r\n` sequences become `\r\r\n`. This library splits input into logical lines first, then joins with the target ending, so every original ending maps to exactly one output ending regardless of target or input mix.

The trade-off: we build an intermediate array of lines. For typical source files this is negligible; for multi-gigabyte blobs you'd want a streaming approach instead.

## Exports

- `LF`, `CR`, `CRLF` — string constants (`"\n"`, `"\r"`, `"\r\n"`).
- `convertLineEndings(text, target)` — returns a new string with all line endings converted to `target`.
- `normalize(text, target)` — alias for `convertLineEndings`, for readability when the goal is platform normalization.
- `detectLineEndings(text)` — returns `{ LF: number, CR: number, CRLF: number }` counting each ending type. A `\r` immediately followed by `\n` is counted as one CRLF, not as a CR plus an LF.
- `lineEndingName(ending)` — returns `"LF"`, `"CR"`, `"CRLF"`, or `"UNKNOWN"` for a given ending constant.

## Edge cases

- Empty string in, empty string out for `convertLineEndings`.
- A bare `\r` not followed by `\n` is treated as a CR ending; a `\r` followed by `\n` is treated as a single CRLF ending. This means detection never reports a standalone CR for the `\r` in a `\r\n` pair.
- `convertLineEndings` throws a `RangeError` if `target` is not one of the exported constants, and a `TypeError` if `text` is not a string.
