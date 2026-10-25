import bcrypt from "bcryptjs";
import {
  countRecentLoginFailures,
  createLoginAttempt,
  findAdminByEmail,
} from "@/lib/db/models/admin";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000;

const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing-safety", 10);

export async function verifyAdminCredentials(
  rawEmail: string,
  password: string
): Promise<{ id: string; email: string; name: string | null } | null> {
  const email = rawEmail.toLowerCase().trim();

  const cutoff = new Date(Date.now() - LOCKOUT_WINDOW_MS);
  const recentFailures = await countRecentLoginFailures(email, cutoff);

  if (recentFailures >= MAX_FAILED_ATTEMPTS) {
    return null;
  }

  const admin = await findAdminByEmail(email);
  const valid = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  const success = Boolean(admin && valid);

  await createLoginAttempt(email, success);

  if (!success || !admin) return null;

  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
  };
}
