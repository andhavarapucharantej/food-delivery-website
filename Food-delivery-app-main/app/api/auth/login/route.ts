import { NextResponse } from "next/server";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { User } from "@/models/User";
import { comparePassword, signToken, getAuthCookieOptions } from "@/lib/auth";
import { MockDB } from "@/lib/mockStore";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { email, password } = body as { email?: unknown; password?: unknown };

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. In-Memory Mock Store Fallback (When MongoDB is not configured or offline)
    if (!isMongoConfigured()) {
      let mockUser = MockDB.findUserByEmail(normalizedEmail);

      if (!mockUser) {
        // Auto-register mock user for frictionless browser testing
        mockUser = MockDB.addUser({
          id: `usr_${Math.random().toString(36).substring(2, 9)}`,
          name: normalizedEmail.split("@")[0],
          email: normalizedEmail,
          password,
          role: normalizedEmail.includes("admin") ? "admin" : "user",
          address: "123 High Street, Bengaluru",
        });
      } else if (mockUser.password !== password) {
        return NextResponse.json(
          { error: "Invalid email or password" },
          { status: 401 }
        );
      }

      const token = await signToken({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
      });

      const cookieOptions = getAuthCookieOptions();
      const response = NextResponse.json(
        {
          user: {
            id: mockUser.id,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            address: mockUser.address,
          },
        },
        { status: 200 }
      );

      response.cookies.set({
        name: cookieOptions.name,
        value: token,
        httpOnly: cookieOptions.httpOnly,
        sameSite: cookieOptions.sameSite,
        secure: cookieOptions.secure,
        path: cookieOptions.path,
        maxAge: cookieOptions.maxAge,
      });

      return response;
    }

    // 2. Real MongoDB Connection
    const db = await connectDB();
    if (!db) {
      // If DB fails to connect, gracefully fallback to mock user
      const mockUser = MockDB.findUserByEmail(normalizedEmail);
      if (mockUser && mockUser.password === password) {
        const token = await signToken({
          id: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          name: mockUser.name,
        });

        const cookieOptions = getAuthCookieOptions();
        const response = NextResponse.json(
          {
            user: {
              id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              role: mockUser.role,
              address: mockUser.address,
            },
          },
          { status: 200 }
        );

        response.cookies.set({
          name: cookieOptions.name,
          value: token,
          httpOnly: cookieOptions.httpOnly,
          sameSite: cookieOptions.sameSite,
          secure: cookieOptions.secure,
          path: cookieOptions.path,
          maxAge: cookieOptions.maxAge,
        });

        return response;
      }
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await signToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const cookieOptions = getAuthCookieOptions();
    const response = NextResponse.json(
      {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          address: user.address,
        },
      },
      { status: 200 }
    );

    response.cookies.set({
      name: cookieOptions.name,
      value: token,
      httpOnly: cookieOptions.httpOnly,
      sameSite: cookieOptions.sameSite,
      secure: cookieOptions.secure,
      path: cookieOptions.path,
      maxAge: cookieOptions.maxAge,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
