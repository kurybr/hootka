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
  QUIZ_FEEDBACK_COLORS,
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

function testFeedbackColorsMeetContrastRequirements() {
  for (const [name, backgroundColor] of Object.entries(QUIZ_FEEDBACK_COLORS)) {
    const state = name === "correct" ? "correct" : "incorrect";
    const style = getOptionButtonStyle("hootka", 0, state);
    const contrast = getContrastRatio(style.color, backgroundColor);
    const meetsContrast =
      contrast >= MIN_CONTRAST_RATIO || Boolean(style.textShadow);

    assert.ok(
      meetsContrast,
      `feedback ${name} ${backgroundColor} contrast ${contrast.toFixed(2)}`
    );
  }
}

function testFeedbackStatesUseGlobalColors() {
  assert.equal(
    getOptionButtonStyle("hootka", 0, "correct").backgroundColor,
    QUIZ_FEEDBACK_COLORS.correct
  );
  assert.equal(
    getOptionButtonStyle("hootka", 0, "incorrect").backgroundColor,
    QUIZ_FEEDBACK_COLORS.incorrect
  );
}

function testIncorrectFeedbackUsesRed() {
  assert.equal(
    getOptionButtonStyle("hootka", 0, "incorrect").backgroundColor,
    QUIZ_FEEDBACK_COLORS.incorrect
  );
}

function testBrasilPaletteUsesFlagColors() {
  const brasil = getQuizOptionPalette("copa");
  assert.deepEqual(brasil.colors, ["#007A33", "#FFDF00", "#002776", "#FFFFFF"]);

  const greenOption = getOptionButtonStyle("copa", 0);
  assert.equal(greenOption.backgroundColor, "#007A33");
  assert.equal(greenOption.color, OPTION_TEXT_LIGHT);

  const whiteOption = getOptionButtonStyle("copa", 3);
  assert.equal(whiteOption.color, OPTION_TEXT_DARK);
  assert.equal(whiteOption.usesSubtleBorder, true);
  assert.equal(whiteOption.borderColor, "hsl(var(--border))");
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
testContrastRatioIsSymmetric();
testKnownContrastCases();
testFeedbackStatesUseGlobalColors();
testFeedbackColorsMeetContrastRequirements();
testIncorrectFeedbackUsesRed();
testBrasilPaletteUsesFlagColors();
testSelectedUsesActiveColor();
testAllPaletteColorsMeetContrastRequirements();

console.log("quizOptionPalettes.test.ts: ok");
