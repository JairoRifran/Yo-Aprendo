import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { soundCatalog } from "../frontend/utils/soundCatalog.js";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

async function loadLocalEnv() {
  try {
    const envText = await readFile(resolve(projectRoot, ".env"), "utf8");

    envText.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const separatorIndex = trimmed.indexOf("=");
      if (separatorIndex === -1) return;

      const key = trimmed.slice(0, separatorIndex).trim();
      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      const value = rawValue.replace(/^["']|["']$/g, "");

      if (key && process.env[key] == null) {
        process.env[key] = value;
      }
    });
  } catch {
    // A local .env file is optional.
  }
}

await loadLocalEnv();

const apiKey = process.env.ELEVENLABS_API_KEY;
const apiUrl = "https://api.elevenlabs.io/v1/sound-generation";
const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || "mp3_44100_128";
const promptInfluence = Number(process.env.ELEVENLABS_PROMPT_INFLUENCE || 0.35);
const only = new Set(
  (process.env.ELEVENLABS_ONLY || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
);

async function generateSound(name, sound) {
  const filePath = resolve(projectRoot, "frontend", sound.file.replace(/^\.\//, ""));
  const body = {
    text: sound.prompt,
    duration_seconds: sound.durationSeconds,
    prompt_influence: promptInfluence,
    loop: Boolean(sound.loop),
    model_id: "eleven_text_to_sound_v2"
  };

  console.log(`Generating ${name} -> ${sound.file}`);

  const response = await fetch(`${apiUrl}?output_format=${encodeURIComponent(outputFormat)}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs failed for ${name}: ${response.status} ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, Buffer.from(arrayBuffer));

  const characterCost = response.headers.get("character-cost");
  console.log(`Saved ${sound.file}${characterCost ? ` (character-cost: ${characterCost})` : ""}`);
}

if (!apiKey) {
  console.error("Missing ELEVENLABS_API_KEY. Add it to .env or set it before running this script.");
  process.exit(1);
}

for (const [name, sound] of Object.entries(soundCatalog)) {
  if (only.size && !only.has(name)) continue;
  await generateSound(name, sound);
}
