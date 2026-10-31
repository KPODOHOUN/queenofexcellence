const TOKEN_KEY = "qoe-visitor";

function randomToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Identifiant anonyme du navigateur, pour ne compter qu'une présence par visiteur. */
export function visitorToken(): string {
  try {
    let token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      token = randomToken();
      localStorage.setItem(TOKEN_KEY, token);
    }
    return token;
  } catch {
    return randomToken();
  }
}

export type Attendance = { count: number; attending: boolean };

export async function fetchAttendance(eventId: string): Promise<Attendance | null> {
  const res = await fetch(`/api/public/attendance?eventId=${encodeURIComponent(eventId)}&token=${visitorToken()}`);
  return res.ok ? res.json() : null;
}

export async function confirmAttendance(eventId: string): Promise<Attendance | null> {
  const res = await fetch("/api/public/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventId, token: visitorToken() }),
  });
  return res.ok ? res.json() : null;
}

export function attendanceLabel(count: number) {
  return `${count.toLocaleString("fr-FR")} participant${count > 1 ? "s" : ""} confirmé${count > 1 ? "s" : ""}`;
}
