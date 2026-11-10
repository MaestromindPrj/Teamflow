import { NextRequest, NextResponse } from "next/server";

function clearSessionCookie(response: NextResponse) {
  response.cookies.delete("teamflow_session");
  response.cookies.set("teamflow_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
    expires: new Date(0),
    sameSite: "lax",
  });
  return response;
}

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  return clearSessionCookie(response);
}

export async function GET(req: NextRequest) {
  const loginUrl = new URL("/login", req.url);
  const response = NextResponse.redirect(loginUrl);
  return clearSessionCookie(response);
}
