import { NextResponse } from "next/server";
import { generateInitialPassword } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    password: generateInitialPassword(),
  });
}

