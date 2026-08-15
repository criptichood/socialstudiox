import { NextResponse } from "next/server";
import { buildModelCatalog } from "@/services/server/modelRouter";

export async function GET() {
  return NextResponse.json(buildModelCatalog());
}
