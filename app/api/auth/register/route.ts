import { NextResponse } from "next/server";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { User } from "@/models/User";
import { hashPassword, signToken, getAuthCookieOptions } from "@/lib/auth";
import { MockDB } from "@/lib/mockStore";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { name, email, password, address } = body as {
      name?: unknown;
      email?: unknown;
      password?: unknown;
      address?: unknown;
    };

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email address is required" },
        { status: 400 }
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. In-Memory Mock Store Fallback
    if (!isMongoConfigured()) {
      const existing = MockDB.findUserByEmail(normalizedEmail);
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }

      const mockUser = MockDB.addUser({
        id: `usr_${Math.random().toString(36).substring(2, 9)}`,
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: "user",
        address: typeof address === "string" ? address.trim() : "",
      });

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
        { status: 201 }
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

    // 2. Real MongoDB
    const db = await connectDB();
    if (!db) {
      const mockUser = MockDB.addUser({
        id: `usr_${Math.random().toString(36).substring(2, 9)}`,
        name: name.trim(),
        email: normalizedEmail,
        password,
        role: "user",
        address: typeof address === "string" ? address.trim() : "",
      });

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
        { status: 201 }
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

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "user",
      address: typeof address === "string" ? address.trim() : "",
    });

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
      { status: 201 }
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
