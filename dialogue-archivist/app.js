diff --git a/dialogue-archivist/app.js b/dialogue-archivist/app.js
index 35fc2bb95619d7ad0a705380edc5491db7b68316..d66c9d93ef003adf287f62426ab0c9d924f2ddf3 100644
--- a/dialogue-archivist/app.js
+++ b/dialogue-archivist/app.js
@@ -1 +1,126 @@
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
+  // Preserve internal newlines within each paragraph-like block.
+  return cleaned
+    .split(/\n\s*\n/g)
+    .map((s) => s.trim())
+    .filter(Boolean);
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
+  // Generic fallback for copied transcripts with "Name: message" prefixes.
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
