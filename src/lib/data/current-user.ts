import { prisma } from "@/src/lib/db/prisma";

const DEMO_USER_EMAIL = "orann1@gmail.com";

export async function getCurrentUserForDemo() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) throw new Error("Demo user not found. Run the seed script.");
  return user;
}
