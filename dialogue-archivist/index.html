<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dialogue Archivist</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 1rem;
      line-height: 1.5;
      max-width: 1100px;
      margin-inline: auto;
    }

    h1 {
      margin-top: 0;
    }

    .speaker-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .speaker-grid input,
    textarea,
    select,
    button {
      width: 100%;
      box-sizing: border-box;
      padding: 0.65rem;
      font-size: 1rem;
    }

    textarea {
      min-height: 260px;
      resize: vertical;
      margin-bottom: 1rem;
    }

    .controls {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .controls > * {
      flex: 1 1 180px;
    }

    .output {
      white-space: pre-wrap;
      border: 1px solid #ccc;
      padding: 1rem;
      min-height: 260px;
      background: #fafafa;
    }

    .small {
      font-size: 0.92rem;
      color: #444;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <h1>Dialogue Archivist</h1>
  <p class="small">
    Paste a copied chat transcript, enter speakers in dialogue order, and rebuild labels.
  </p>

  <div class="speaker-grid" id="speakerGrid"></div>

  <div class="controls">
    <select id="splitMode">
      <option value="double-newline">Split by blank lines</option>
      <option value="single-newline">Split by every non-empty line</option>
    </select>
    <button id="fillDemo">Fill demo names</button>
    <button id="processBtn">Add labels</button>
    <button id="copyBtn">Copy output</button>
    <button id="downloadBtn">Download .md</button>
  </div>

  <textarea id="inputText" placeholder="Paste raw conversation text here..."></textarea>

  <h2>Preview</h2>
  <div id="output" class="output"></div>

  <script>
    const speakerGrid = document.getElementById("speakerGrid");
    const inputText = document.getElementById("inputText");
    const output = document.getElementById("output");
    const splitMode = document.getElementById("splitMode");

    for (let i = 1; i <= 10; i++) {
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = `Speaker ${i}`;
      input.id = `speaker-${i}`;
      speakerGrid.appendChild(input);
    }

    document.getElementById("fillDemo").addEventListener("click", () => {
      document.getElementById("speaker-1").value = "Renars Odins";
      document.getElementById("speaker-2").value = "ChatGPT";
      document.getElementById("speaker-3").value = "Tailored name";
    });

    function getSpeakers() {
      const speakers = [];
      for (let i = 1; i <= 10; i++) {
        const value = document.getElementById(`speaker-${i}`).value.trim();
        if (value) speakers.push(value);
      }
      return speakers;
    }

    function splitTranscript(text, mode) {
      const cleaned = text
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

      if (!cleaned) return [];

      if (mode === "single-newline") {
        return cleaned
          .split("\n")
          .map(s => s.trim())
          .filter(Boolean);
      }

      return cleaned
        .split(/\n\s*\n/g)
        .map(s => s.trim())
        .filter(Boolean);
    }

    function buildLabeledTranscript(blocks, speakers) {
      if (!speakers.length) {
        return "Please enter at least one speaker name.";
      }

      return blocks.map((block, index) => {
        const speaker = speakers[index % speakers.length];
        return `**${speaker} said:**\n${block}`;
      }).join("\n\n");
    }

    document.getElementById("processBtn").addEventListener("click", () => {
      const speakers = getSpeakers();
      const blocks = splitTranscript(inputText.value, splitMode.value);
      output.textContent = buildLabeledTranscript(blocks, speakers);
    });

    document.getElementById("copyBtn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(output.textContent);
      } catch (err) {
        alert("Copy failed. You can still select the text manually.");
      }
    });

    document.getElementById("downloadBtn").addEventListener("click", () => {
      const blob = new Blob([output.textContent], { type: "text/markdown;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dialogue-archived.md";
      a.click();
      URL.revokeObjectURL(url);
    });
  </script>
</body>
</html>
