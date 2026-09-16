import { Hono } from "hono";
import z, { email } from "zod";
import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateJWT, hashPassword, verifyPassword } from "../lib/auth";

const authRoute = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

// POST /auth/register
authRoute.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

  const { email, password } = parsed.data;

  // Check if user already exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existingUser) {
    return c.json({ error: "User already exists" }, 409);
  }

  //   Hash the password and create user
  const passwordHash = await hashPassword(password);
  const [newUser] = await db
    .insert(users)
    .values({ email, passwordHash, plan: "free" })
    .returning();

  //  Generate JWT for immediate login
  const token = await generateJWT(newUser.id);

  return c.json(
    {
      messages: "User registered successfully",
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        plan: newUser.plan,
      },
    },
    201,
  );
});

// POST /auth/login
authRoute.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.format() }, 400);

  const { email, password } = parsed.data;

  // Check if user exists
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  // Verify password
  const isPasswordValid = await verifyPassword(password, user.passwordHash);
  if (!isPasswordValid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const token = await generateJWT(user.id);

  return c.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      email: user.email,
      plan: user.plan,
    },
  });
});

export default authRoute;
