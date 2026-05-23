export const T = {
  green:    "#0B5E3E",    // INEC emerald theme accent
  greenLt:  "#34D399",    // Active indicator neon green
  greenDk:  "#0F172A",    // Dark background of panel tiles
  gold:     "#22D3EE",    // Cyan-400 tactical accent
  goldLt:   "#67E8F9",    // Cyan-300 neon highlight
  white:    "#FFFFFF",    // High contrast white
  offWhite: "#D1D5DB",    // Slate gray primary text
  danger:   "#EF4444",    // Alert warning red
  dangerLt: "#F87171",    // Glow alert red
  info:     "#2563EB",    // Tactical cobalt blue
  infoLt:   "#60A5FA",    // Soft indigo
  text:     "#F3F4F6",    // High-visibility body text
  textMid:  "#9CA3AF",    // Grey caption label
  textLt:   "#6B7280",    // Tactical low-opacity telemetry text
  border:   "#1F2937",    // Tactical grid border
};

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSessionId(): string {
  return (
    "NSES-" +
    Date.now().toString(36).toUpperCase() +
    "-" +
    Math.random().toString(36).slice(2, 8).toUpperCase()
  );
}

export function formatTime(d = new Date()): string {
  return d.toLocaleString("en-NG", {
    timeZone: "Africa/Lagos",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
