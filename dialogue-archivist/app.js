diff --git a/dialogue-archivist/app.js b/dialogue-archivist/app.js
index 35fc2bb95619d7ad0a705380edc5491db7b68316..60db7cc8a495c35f2390426761b34374cc21d0f6 100644
--- a/dialogue-archivist/app.js
+++ b/dialogue-archivist/app.js
@@ -1 +1,181 @@
 const speakerGrid = document.getElementById("speakerGrid");
+const inputText = document.getElementById("inputText");
+const output = document.getElementById("output");
+const splitMode = document.getElementById("splitMode");
+
+for (let i = 1; i <= 10; i++) {
+  const input = document.createElement("input");
+  input.type = "text";
+  input.placeholder = `Speaker ${i}`;
+  input.id = `speaker-${i}`;
+  speakerGrid.appendChild(input);
+}
+
+document.getElementById("fillDemo").addEventListener("click", () => {
+  document.getElementById("speaker-1").value = "Renars Odins";
+  document.getElementById("speaker-2").value = "ChatGPT";
+  document.getElementById("speaker-3").value = "Tailored name";
+});
+
+function getSpeakers() {
+  const speakers = [];
+  for (let i = 1; i <= 10; i++) {
+    const value = document.getElementById(`speaker-${i}`).value.trim();
+    if (value) speakers.push(value);
+  }
+  return speakers;
+}
+
+function escapeRegExp(value) {
+  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
+}
+
+function normalizeTranscript(text) {
+  return text
+    .replace(/\u00A0/g, " ")
+    .replace(/\r\n?/g, "\n")
+    .replace(/[\t\f\v]+/g, " ")
+    .replace(/[ \t]+\n/g, "\n")
+    .replace(/\n{3,}/g, "\n\n")
+    .trim();
+}
+
+function splitByBlankLines(text) {
+  return text
+    .split(/\n\s*\n/g)
+    .map((s) => s.trim())
+    .filter(Boolean);
+}
+
+function looksShortLine(line) {
+  return line.length <= 60;
+}
+
+function shouldStartNewTurn(currentBlockLines, nextLine) {
+  const currentText = currentBlockLines.join("\n");
+  const currentIsSingleShort = currentBlockLines.length === 1 && looksShortLine(currentText);
+  const currentIsLong = currentBlockLines.length >= 2 || currentText.length >= 90;
+  const nextIsShort = looksShortLine(nextLine);
+  const nextClearlyLonger = nextLine.length >= currentText.length + 15;
+
+  // Short prompt followed by longer line often means next turn starts.
+  if (currentIsSingleShort && (!nextIsShort || nextClearlyLonger)) return true;
+
+  // Multi-line / longer block followed by short line often means a new turn starts.
+  if (currentIsLong && nextIsShort) return true;
+
+  return false;
+}
+
+function splitShortAlternatingChain(text) {
+  const lines = text
+    .split("\n")
+    .map((s) => s.trim())
+    .filter(Boolean);
+
+  if (lines.length <= 1) return lines;
+
+  const blocks = [];
+  let current = [lines[0]];
+
+  for (let i = 1; i < lines.length; i++) {
+    const next = lines[i];
+
+    if (shouldStartNewTurn(current, next)) {
+      blocks.push(current.join("\n"));
+      current = [next];
+    } else {
+      current.push(next);
+    }
+  }
+
+  blocks.push(current.join("\n"));
+  return blocks;
+}
+
+function splitTranscript(text, mode) {
+  const cleaned = normalizeTranscript(text);
+
+  if (!cleaned) return [];
+
+  if (mode === "single-newline") {
+    return cleaned
+      .split("\n")
+      .map((s) => s.trim())
+      .filter(Boolean);
+  }
+
+  // Primary rule: split by blank lines.
+  const blankLineBlocks = splitByBlankLines(cleaned);
+  if (blankLineBlocks.length > 1) return blankLineBlocks;
+
+  // Conservative fallback for short alternating chains without blank lines.
+  // This uses structure and line length only.
+  return splitShortAlternatingChain(cleaned);
+}
+
+function stripLeadingSaid(text) {
+  return text.replace(/^said\s*:\s*/i, "");
+}
+
+function removeExistingSpeakerPrefix(block, speakers) {
+  const normalizedBlock = block.trim();
+  if (!normalizedBlock) return "";
+
+  let cleaned = stripLeadingSaid(normalizedBlock);
+
+  // Remove known speaker prefixes first for highest confidence.
+  for (const speaker of speakers) {
+    const speakerPattern = new RegExp(
+      `^${escapeRegExp(speaker)}\\s*(?:said)?\\s*[:\-–—]\\s*`,
+      "i"
+    );
+    if (speakerPattern.test(cleaned)) {
+      cleaned = cleaned.replace(speakerPattern, "");
+      break;
+    }
+  }
+
+  // Conservative fallback for copied transcripts with "Name: message" prefixes.
+  cleaned = cleaned.replace(/^[A-Z][\w .'-]{0,40}\s*(?:said)?\s*[:\-–—]\s*/i, "");
+
+  return stripLeadingSaid(cleaned).trim();
+}
+
+function buildLabeledTranscript(blocks, speakers) {
+  if (!speakers.length) {
+    return "Please enter at least one speaker name.";
+  }
+
+  return blocks
+    .map((block, index) => {
+      const speaker = speakers[index % speakers.length];
+      const cleanedBlock = removeExistingSpeakerPrefix(block, speakers);
+      return `**${speaker} said:**\n${cleanedBlock}`;
+    })
+    .join("\n\n");
+}
+
+document.getElementById("processBtn").addEventListener("click", () => {
+  const speakers = getSpeakers();
+  const blocks = splitTranscript(inputText.value, splitMode.value);
+  output.textContent = buildLabeledTranscript(blocks, speakers);
+});
+
+document.getElementById("copyBtn").addEventListener("click", async () => {
+  try {
+    await navigator.clipboard.writeText(output.textContent);
+  } catch (err) {
+    alert("Copy failed. You can still select the text manually.");
+  }
+});
+
+document.getElementById("downloadBtn").addEventListener("click", () => {
+  const blob = new Blob([output.textContent], { type: "text/markdown;charset=utf-8" });
+  const url = URL.createObjectURL(blob);
+  const a = document.createElement("a");
+  a.href = url;
+  a.download = "dialogue-archived.md";
+  a.click();
+  URL.revokeObjectURL(url);
+});
