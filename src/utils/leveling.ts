// WoW Classic XP table for levels 1–60 (total XP required to reach each level)
export const WOW_CLASSIC_XP_TABLE = [
  0,      // Level 1 (start)
  400,    // Level 2
  900,    // Level 3
  1400,   // Level 4
  2100,   // Level 5
  2800,   // Level 6
  3600,   // Level 7
  4500,   // Level 8
  5400,   // Level 9
  6500,   // Level 10
  7600,   // Level 11
  8800,   // Level 12
  10100,  // Level 13
  11400,  // Level 14
  12900,  // Level 15
  14400,  // Level 16
  15900,  // Level 17
  17500,  // Level 18
  19200,  // Level 19
  20900,  // Level 20
  22700,  // Level 21
  24600,  // Level 22
  26600,  // Level 23
  28700,  // Level 24
  30900,  // Level 25
  33200,  // Level 26
  35600,  // Level 27
  38100,  // Level 28
  40700,  // Level 29
  43400,  // Level 30
  46200,  // Level 31
  49100,  // Level 32
  52100,  // Level 33
  55200,  // Level 34
  58400,  // Level 35
  61700,  // Level 36
  65100,  // Level 37
  68600,  // Level 38
  72200,  // Level 39
  75900,  // Level 40
  79700,  // Level 41
  83600,  // Level 42
  87600,  // Level 43
  91700,  // Level 44
  95900,  // Level 45
  100200, // Level 46
  104600, // Level 47
  109100, // Level 48
  113700, // Level 49
  118400, // Level 50
  123200, // Level 51
  128100, // Level 52
  133100, // Level 53
  138200, // Level 54
  143400, // Level 55
  148700, // Level 56
  154100, // Level 57
  159600, // Level 58
  165200, // Level 59
  170900, // Level 60
];

// Level titles and icons (milestones and in-betweens)
export const LEVEL_TITLES_AND_ICONS = [
  { title: "Dishwasher", icon: "\uD83E\uDDF9" }, // 🧽
  { title: "Dishwasher II", icon: "\uD83E\uDDF9" },
  { title: "Dishwasher III", icon: "\uD83E\uDDF9" },
  { title: "Dishwasher IV", icon: "\uD83E\uDDF9" },
  { title: "Prep Cook", icon: "\uD83E\uDDC8" }, // 🥄
  { title: "Prep Cook II", icon: "\uD83E\uDDC8" },
  { title: "Prep Cook III", icon: "\uD83E\uDDC8" },
  { title: "Prep Cook IV", icon: "\uD83E\uDDC8" },
  { title: "Line Cook", icon: "\uD83C\uDF73" }, // 🍳
  { title: "Line Cook II", icon: "\uD83C\uDF73" },
  { title: "Line Cook III", icon: "\uD83C\uDF73" },
  { title: "Line Cook IV", icon: "\uD83C\uDF73" },
  { title: "Commis Chef", icon: "\uD83D\uDD2A" }, // 🔪
  { title: "Commis Chef II", icon: "\uD83D\uDD2A" },
  { title: "Commis Chef III", icon: "\uD83D\uDD2A" },
  { title: "Sous Chef", icon: "\uD83E\uDDD1\u200D\uD83C\uDF73" }, // 🧑‍🍳
  { title: "Sous Chef II", icon: "\uD83E\uDDD1\u200D\uD83C\uDF73" },
  { title: "Sous Chef III", icon: "\uD83E\uDDD1\u200D\uD83C\uDF73" },
  { title: "Chef de Partie", icon: "\uD83C\uDF7D\uFE0F" }, // 🍽️
  { title: "Chef de Partie II", icon: "\uD83C\uDF7D\uFE0F" },
  { title: "Chef de Partie III", icon: "\uD83C\uDF7D\uFE0F" },
  { title: "Pastry Chef", icon: "\uD83E\uDDC1" }, // 🧁
  { title: "Pastry Chef II", icon: "\uD83E\uDDC1" },
  { title: "Pastry Chef III", icon: "\uD83E\uDDC1" },
  { title: "Saucier", icon: "\uD83E\uDD63" }, // 🥣
  { title: "Saucier II", icon: "\uD83E\uDD63" },
  { title: "Saucier III", icon: "\uD83E\uDD63" },
  { title: "Sommelier", icon: "\uD83C\uDF77" }, // 🍷
  { title: "Sommelier II", icon: "\uD83C\uDF77" },
  { title: "Sommelier III", icon: "\uD83C\uDF77" },
  { title: "Grillardin", icon: "\uD83C\uDF56" }, // 🍖
  { title: "Grillardin II", icon: "\uD83C\uDF56" },
  { title: "Grillardin III", icon: "\uD83C\uDF56" },
  { title: "Garde Manger", icon: "\uD83E\uDD57" }, // 🥗
  { title: "Garde Manger II", icon: "\uD83E\uDD57" },
  { title: "Garde Manger III", icon: "\uD83E\uDD57" },
  { title: "Executive Chef", icon: "\uD83D\uDC68\u200D\uD83C\uDF73" }, // 👨‍🍳
  { title: "Executive Chef II", icon: "\uD83D\uDC68\u200D\uD83C\uDF73" },
  { title: "Executive Chef III", icon: "\uD83D\uDC68\u200D\uD83C\uDF73" },
  { title: "Head Chef", icon: "\uD83C\uDF93" }, // 🎓
  { title: "Head Chef II", icon: "\uD83C\uDF93" },
  { title: "Head Chef III", icon: "\uD83C\uDF93" },
  { title: "Master Chef", icon: "\uD83C\uDFC5" }, // 🏅
  { title: "Master Chef II", icon: "\uD83C\uDFC5" },
  { title: "Master Chef III", icon: "\uD83C\uDFC5" },
  { title: "Culinary Director", icon: "\uD83D\uDC68\u200D\uD83D\uDCBC" }, // 👨‍💼
  { title: "Culinary Director II", icon: "\uD83D\uDC68\u200D\uD83D\uDCBC" },
  { title: "Culinary Director III", icon: "\uD83D\uDC68\u200D\uD83D\uDCBC" },
  { title: "Celebrity Chef", icon: "\u2B50" }, // ⭐
  { title: "Celebrity Chef II", icon: "\u2B50" },
  { title: "Celebrity Chef III", icon: "\u2B50" },
  { title: "Iron Chef", icon: "\uD83E\uDDBE" }, // 🦾
  { title: "Iron Chef II", icon: "\uD83E\uDDBE" },
  { title: "Iron Chef III", icon: "\uD83E\uDDBE" },
  { title: "Legendary Chef", icon: "\uD83D\uDC09" }, // 🐉
  { title: "Legendary Chef II", icon: "\uD83D\uDC09" },
  { title: "Legendary Chef III", icon: "\uD83D\uDC09" },
  { title: "Legendary Chef IV", icon: "\uD83D\uDC09" },
  { title: "Legendary Chef V", icon: "\uD83D\uDC09" },
  { title: "Toji Master", icon: "\uD83C\uDF76" }, // 🍶
];

// XP per activity (example)
export const XP_ACTIVITY_TABLE = {
  create_account: 10,
  confirm_email: 5,
  complete_profile: 10,
  complete_weekly_challenge: 40,
  create_recipe: 15,
  run_recipe: 20,         // "Cook Me"
  add_to_cookbook: 5,
  view_recipe: 2,
  scan_ingredient: 5,
  save_recipe: 3,
  achieve_streak: 20,
};

// Utility: Get level from total XP
export function getLevelFromXP(totalXP: number): number {
  let level = 1;
  let xpSum = 0;
  for (let i = 1; i < WOW_CLASSIC_XP_TABLE.length; i++) {
    xpSum += WOW_CLASSIC_XP_TABLE[i];
    if (totalXP < xpSum) {
      return i;
    }
    level = i + 1;
  }
  return Math.min(level, 60);
}

// Utility: Get XP needed for next level
export function getXPForNextLevel(level: number): number {
  if (level < 1 || level >= WOW_CLASSIC_XP_TABLE.length) return 0;
  return WOW_CLASSIC_XP_TABLE[level];
}

// Utility: Get XP progress toward next level
export function getXPProgress(totalXP: number): { level: number; current: number; required: number } {
  let xpSum = 0;
  for (let i = 1; i < WOW_CLASSIC_XP_TABLE.length; i++) {
    if (totalXP < xpSum + WOW_CLASSIC_XP_TABLE[i]) {
      return { level: i, current: totalXP - xpSum, required: WOW_CLASSIC_XP_TABLE[i] };
    }
    xpSum += WOW_CLASSIC_XP_TABLE[i];
  }
  return { level: 60, current: WOW_CLASSIC_XP_TABLE[59], required: 0 };
}
