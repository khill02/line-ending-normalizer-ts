import { test } from "node:test";
import assert from "node:assert/strict";

import {
  normalize,
  convertLineEndings,
  detectLineEndings,
  lineEndingName,
  LF,
  CR,
  CRLF,
} from "../src/index.js";

test("constants are the expected strings", () => {
  assert.equal(LF, "\n");
  assert.equal(CR, "\r");
  assert.equal(CRLF, "\r\n");
});

test("lineEndingName maps constants to names", () => {
  assert.equal(lineEndingName(LF), "LF");
  assert.equal(lineEndingName(CR), "CR");
  assert.equal(lineEndingName(CRLF), "CRLF");
  assert.equal(lineEndingName("bogus"), "UNKNOWN");
});

test("convertLineEndings LF to LF is identity", () => {
  const input = "a\nb\nc\n";
  assert.equal(convertLineEndings(input, LF), input);
});

test("convertLineEndings converts LF to CRLF", () => {
  const input = "a\nb\nc";
  assert.equal(convertLineEndings(input, CRLF), "a\r\nb\r\nc");
});

test("convertLineEndings converts CRLF to LF without doubling", () => {
  // The classic bug: naive CRLF->LF then CR->LF would be fine, but LF->CRLF
  // then CR->CRLF would turn \r\n into \r\r\n. Our split-then-join approach
  // avoids this.
  const input = "a\r\nb\r\nc";
  assert.equal(convertLineEndings(input, CRLF), "a\r\nb\r\nc");
  assert.equal(convertLineEndings(input, LF), "a\nb\nc");
});

test("convertLineEndings converts CR to LF", () => {
  const input = "a\rb\rc\r";
  assert.equal(convertLineEndings(input, LF), "a\nb\nc\n");
});

test("convertLineEndings handles mixed endings to CRLF", () => {
  const input = "a\r\nb\nc\rd\n";
  assert.equal(convertLineEndings(input, CRLF), "a\r\nb\r\nc\r\nd\r\n");
});

test("convertLineEndings handles mixed endings to LF", () => {
  const input = "a\r\nb\nc\rd\n";
  assert.equal(convertLineEndings(input, LF), "a\nb\nc\nd\n");
});

test("convertLineEndings handles empty string", () => {
  assert.equal(convertLineEndings("", LF), "");
  assert.equal(convertLineEndings("", CRLF), "");
});

test("convertLineEndings handles string with no line endings", () => {
  assert.equal(convertLineEndings("hello", LF), "hello");
  assert.equal(convertLineEndings("hello", CR), "hello");
});

test("convertLineEndings throws on invalid target", () => {
  assert.throws(() => convertLineEndings("a\n", "\r\r"), RangeError);
});

test("convertLineEndings throws on non-string input", () => {
  assert.throws(() => convertLineEndings(42, LF), TypeError);
});

test("normalize is an alias for convertLineEndings", () => {
  const input = "a\nb\n";
  assert.equal(normalize(input, CRLF), "a\r\nb\r\n");
});

test("detectLineEndings counts LF endings", () => {
  assert.deepEqual(detectLineEndings("a\nb\nc\n"), { LF: 3, CR: 0, CRLF: 0 });
});

test("detectLineEndings counts CRLF endings without double-counting", () => {
  // Important: the \r in \r\n must not be counted as a standalone CR.
  assert.deepEqual(detectLineEndings("a\r\nb\r\n"), { LF: 0, CR: 0, CRLF: 2 });
});

test("detectLineEndings counts CR endings", () => {
  assert.deepEqual(detectLineEndings("a\rb\r"), { LF: 0, CR: 2, CRLF: 0 });
});

test("detectLineEndings handles mixed endings", () => {
  assert.deepEqual(detectLineEndings("a\r\nb\nc\r"), { LF: 1, CR: 1, CRLF: 1 });
});

test("detectLineEndings handles empty string", () => {
  assert.deepEqual(detectLineEndings(""), { LF: 0, CR: 0, CRLF: 0 });
});

test("detectLineEndings handles string with no endings", () => {
  assert.deepEqual(detectLineEndings("hello"), { LF: 0, CR: 0, CRLF: 0 });
});

test("detectLineEndings throws on non-string input", () => {
  assert.throws(() => detectLineEndings(null), TypeError);
});
