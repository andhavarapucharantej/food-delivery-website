import { NextResponse } from "next/server";
import { connectDB, isMongoConfigured } from "@/lib/mongodb";
import { User } from "@/models/User";
import { verifyAuthFromRequest } from "@/lib/auth";
import { serializeDoc } from "@/lib/serialize";
import { MockDB } from "@/lib/mockStore";

export async function GET(request: Request) {
  try {
    const payload = await verifyAuthFromRequest(request);
    if (!payload) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    if (!isMongoConfigured()) {
      const mockUser = MockDB.findUserById(payload.id);
      if (mockUser) {
        return NextResponse.json(
          {
            user: {
              _id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              role: mockUser.role,
              address: mockUser.address,
            },
          },
          { status: 200 }
        );
      }
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const db = await connectDB();
    if (!db) {
      const mockUser = MockDB.findUserById(payload.id);
      if (mockUser) {
        return NextResponse.json(
          {
            user: {
              _id: mockUser.id,
              name: mockUser.name,
              email: mockUser.email,
              role: mockUser.role,
              address: mockUser.address,
            },
          },
          { status: 200 }
        );
      }
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const user = await User.findById(payload.id).select("-password");
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user: serializeDoc(user) }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
