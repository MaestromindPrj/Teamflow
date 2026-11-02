import { NextRequest } from "next/server";
import { GET as getJobRoles, POST as postJobRoles, PUT as putJobRoles, DELETE as deleteJobRoles } from "../job-roles/route";

export async function GET() {
  return getJobRoles();
}

export async function POST(req: NextRequest) {
  return postJobRoles(req);
}

export async function PUT(req: NextRequest) {
  return putJobRoles(req);
}

export async function DELETE(req: NextRequest) {
  return deleteJobRoles(req);
}

