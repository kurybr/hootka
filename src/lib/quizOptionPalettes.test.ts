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
testContrastRatioIsSymmetric();
testKnownContrastCases();
testAllPaletteColorsMeetContrastRequirements();

console.log("quizOptionPalettes.test.ts: ok");
