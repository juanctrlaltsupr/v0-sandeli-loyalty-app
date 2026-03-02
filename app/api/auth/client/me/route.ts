import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  const cookieStore = await cookies()
  const clientId = cookieStore.get("sandeli_client_id")?.value

  if (!clientId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single()

  if (error || !client) {
    return NextResponse.json({ error: "Cliente no encontrado" }, { status: 404 })
  }

  return NextResponse.json({ client })
}
