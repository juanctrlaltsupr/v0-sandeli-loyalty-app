import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get("category_id")
  const supabase = createAdminClient()

  let query = supabase
    .from("products")
    .select("*, categories(name, points_cost)")
    .order("created_at", { ascending: false })

  if (categoryId) {
    query = query.eq("category_id", categoryId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ products: data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("products")
    .insert(body)
    .select("*, categories(name, points_cost)")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ product: data }, { status: 201 })
}
