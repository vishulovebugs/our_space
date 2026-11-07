import { useEffect, useRef, useState } from "react";

import {
  ACCESSORY_IDS,
  BODY_IDS,
  HAIR_COLORS,
  HAIR_IDS,
  OUTFIT_COLORS,
  OUTFIT_IDS,
  SKIN_COLORS,
  defaultCharacter,
  randomCharacter,
  validateCharacter,
} from "@pixel-hall/shared/character.js";

import { SPRITE_HEIGHT, SPRITE_WIDTH, composeCharacter } from "../sprites/index.js";

const PICKERS = [
  { key: "body", label: "Body", options: BODY_IDS },
  { key: "hair", label: "Hair", options: HAIR_IDS },
  { key: "outfit", label: "Outfit", options: OUTFIT_IDS },
  { key: "accessory", label: "Accessory", options: ACCESSORY_IDS },
];

const SWATCHES = [
  { key: "skin", label: "Skin", colors: SKIN_COLORS },
  { key: "hair", label: "Hair colour", colors: HAIR_COLORS },
  { key: "outfit", label: "Outfit colour", colors: OUTFIT_COLORS },
];

export default function CharacterCreator({ initialCharacter, onSave }) {
  const [character, setCharacter] = useState(() =>
    validateCharacter(initialCharacter).ok ? initialCharacter : defaultCharacter(),
  );
  const [saving, setSaving] = useState(false);
  const previewRef = useRef(null);

  useEffect(() => {
    const preview = previewRef.current;
    if (!preview) return;

    const context = preview.getContext("2d");
    context.clearRect(0, 0, preview.width, preview.height);
    context.drawImage(composeCharacter(character), 0, 0);
  }, [character]);

  function cycle(key, options, step) {
    setCharacter((current) => ({
      ...current,
      [key]: options[(options.indexOf(current[key]) + step + options.length) % options.length],
    }));
  }

  function setColor(key, color) {
    setCharacter((current) => ({ ...current, colors: { ...current.colors, [key]: color } }));
  }

  async function handleSave() {
    if (saving) return;

    setSaving(true);
    try {
      await onSave(character);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="screen creator" data-character={JSON.stringify(character)}>
      <h1>Pixel Hall</h1>
      <p>Design your character</p>

      <canvas
        ref={previewRef}
        className="preview"
        width={SPRITE_WIDTH}
        height={SPRITE_HEIGHT}
        aria-label="Character preview"
      />

      <div className="pickers">
        {PICKERS.map(({ key, label, options }) => (
          <div className="picker" key={key}>
            <button
              type="button"
              aria-label={`Previous ${label.toLowerCase()}`}
              onClick={() => cycle(key, options, -1)}
            >
              &lt;
            </button>
            <span>
              {label}: {character[key]}
            </span>
            <button
              type="button"
              aria-label={`Next ${label.toLowerCase()}`}
              onClick={() => cycle(key, options, 1)}
            >
              &gt;
            </button>
          </div>
        ))}
      </div>

      <div className="swatches">
        {SWATCHES.map(({ key, label, colors }) => (
          <div className="swatch-row" key={key}>
            <span>{label}</span>
            <div className="swatch-buttons">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`${key} ${color}`}
                  aria-pressed={character.colors[key] === color}
                  style={{ background: color }}
                  onClick={() => setColor(key, color)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        <button type="button" onClick={() => setCharacter(randomCharacter())}>
          Randomize
        </button>
        <button type="button" onClick={handleSave} disabled={saving}>
          Save
        </button>
      </div>
    </main>
  );
}
