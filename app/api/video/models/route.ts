import { NextResponse } from "next/server";
import { videoModelCatalog } from "@/services/server/modelRegistry";
import { isGatewayConfigured } from "@/services/server/config";

export async function GET() {
  return NextResponse.json({
    gatewayConfigured: isGatewayConfigured(),
    models: videoModelCatalog()
  });
}
