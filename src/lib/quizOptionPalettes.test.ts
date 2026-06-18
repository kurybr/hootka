import assert from "node:assert/strict";
import {
  getContrastRatio,
  getOptionButtonStyle,
  getOptionSelectionRingColor,
  getOptionTextColor,
  getQuizOptionPalette,
  MIN_CONTRAST_RATIO,
  OPTION_TEXT_DARK,
  OPTION_TEXT_LIGHT,
  QUIZ_OPTION_PALETTES,
  resolveQuizOptionPaletteId,
} from "./quizOptionPalettes";

function testResolvePaletteId() {
  assert.equal(resolveQuizOptionPaletteId(undefined), "hootka");
  assert.equal(resolveQuizOptionPaletteId("copa"), "copa");
  assert.equal(resolveQuizOptionPaletteId("invalid"), "hootka");
}

function testPaletteColors() {
  const hootka = getQuizOptionPalette("hootka");
  assert.equal(hootka.colors.length, 4);
  assert.equal(getOptionButtonStyle("hootka", 0).backgroundColor, hootka.colors[0]);
  assert.equal(getOptionButtonStyle("hootka", 3).backgroundColor, hootka.colors[3]);
  assert.equal(
    getOptionButtonStyle("hootka", 99).backgroundColor,
    hootka.colors[3]
  );
}

function testAllPalettesHaveFourColors() {
  for (const palette of ["hootka", "copa", "lgbt", "dia", "lua"] as const) {
    const resolved = getQuizOptionPalette(palette);
    assert.equal(resolved.colors.length, 4);
    assert.ok(resolved.label.length > 0);
  }
}

function testContrastRatioIsSymmetric() {
  assert.equal(
    getContrastRatio(OPTION_TEXT_LIGHT, "#283593"),
    getContrastRatio("#283593", OPTION_TEXT_LIGHT)
  );
}

function testKnownContrastCases() {
  assert.equal(getOptionTextColor("#90A4AE"), OPTION_TEXT_DARK);
  assert.equal(getOptionTextColor("#FFED00"), OPTION_TEXT_DARK);
  assert.equal(getOptionTextColor("#283593"), OPTION_TEXT_LIGHT);
  assert.equal(getOptionSelectionRingColor("#FFED00"), OPTION_TEXT_DARK);
  assert.equal(getOptionSelectionRingColor("#283593"), OPTION_TEXT_LIGHT);
}

function testAllPalettesHaveDiscardedColor() {
  for (const palette of QUIZ_OPTION_PALETTES) {
    assert.ok(palette.discardedColor.startsWith("#"));
    assert.equal(
      getOptionButtonStyle(palette.id, 0, "discarded").backgroundColor,
      palette.discardedColor
    );
  }
}

function testDiscardedColorsMeetContrastRequirements() {
  for (const palette of QUIZ_OPTION_PALETTES) {
    const style = getOptionButtonStyle(palette.id, 0, "discarded");
    const contrast = getContrastRatio(style.color, palette.discardedColor);
    const meetsContrast =
      contrast >= MIN_CONTRAST_RATIO || Boolean(style.textShadow);

    assert.ok(
      meetsContrast,
      `${palette.id} discarded ${palette.discardedColor} contrast ${contrast.toFixed(2)}`
    );
  }
}

function testSelectedUsesActiveColor() {
  const active = getOptionButtonStyle("lgbt", 2, "active");
  const selected = getOptionButtonStyle("lgbt", 2, "selected");
  assert.equal(selected.backgroundColor, active.backgroundColor);
}

function testAllPaletteColorsMeetContrastRequirements() {
  for (const palette of QUIZ_OPTION_PALETTES) {
    palette.colors.forEach((backgroundColor, index) => {
      const style = getOptionButtonStyle(palette.id, index);
      const contrast = getContrastRatio(style.color, backgroundColor);
      const meetsContrast =
        contrast >= MIN_CONTRAST_RATIO || Boolean(style.textShadow);

      assert.ok(
        meetsContrast,
        `${palette.id}[${index}] ${backgroundColor} contrast ${contrast.toFixed(2)} without text shadow`
      );
    });
  }
}

testResolvePaletteId();
testPaletteColors();
testAllPalettesHaveFourColors();
testAllPalettesHaveDiscardedColor();
testContrastRatioIsSymmetric();
testKnownContrastCases();
testDiscardedColorsMeetContrastRequirements();
testSelectedUsesActiveColor();
testAllPaletteColorsMeetContrastRequirements();

console.log("quizOptionPalettes.test.ts: ok");
