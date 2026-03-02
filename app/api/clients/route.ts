import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

function generateUserCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789"
  const specials = "#$@*!"
  let code = ""
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const specialChar = specials.charAt(Math.floor(Math.random() * specials.length))
  const insertPos = Math.floor(Math.random() * (code.length + 1))
  return code.slice(0, insertPos) + specialChar + code.slice(insertPos)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search") || ""
  const supabase = createAdminClient()

  let query = supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false })

  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
    )
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ clients: data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const { email, full_name, phone, address, gender } = body
  const supabase = createAdminClient()

  const userCode = generateUserCode()

  const { data: client, error } = await supabase
    .from("clients")
    .insert({
      email,
      full_name,
      phone,
      address,
      gender,
      user_code: userCode,
      points: 0,
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Ya existe un cliente con ese correo electronico." },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Send credentials via WhatsApp
  try {
    const whatsappToken = process.env.WHATSAPP_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (whatsappToken && phoneNumberId) {
      const phoneNumber = phone.startsWith("+") ? phone.slice(1) : phone
      await fetch(
        `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: phoneNumber,
            type: "text",
            text: {
              body: `Bienvenido a Sandeli! 🎉\n\nTus credenciales de acceso a la app de fidelizacion son:\n\n📧 Correo: ${email}\n📱 Telefono: ${phone}\n\nPuedes iniciar sesion con cualquiera de las dos. Se te enviara un codigo de verificacion cada vez que inicies sesion.\n\nDescarga la app y comienza a acumular puntos con cada compra!`,
            },
          }),
        }
      )
    }
  } catch (e) {
    console.error("WhatsApp send error:", e)
  }

  return NextResponse.json({ client }, { status: 201 })
}
