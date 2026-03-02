import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("banners")
    .select("*")
    .order("sort_order")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ banners: data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("banners")
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ banner: data }, { status: 201 })
}
