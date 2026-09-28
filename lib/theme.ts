export const themes = ["default", "dev"] as const;

export type Theme = (typeof themes)[number];
