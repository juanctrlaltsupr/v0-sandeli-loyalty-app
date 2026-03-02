import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const { identifier } = await request.json()
  const supabase = createAdminClient()

  // Find client by email or phone
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .or(`email.eq.${identifier},phone.eq.${identifier}`)
    .single()

  if (error || !client) {
    return NextResponse.json(
      { error: "No se encontro una cuenta con esas credenciales." },
      { status: 404 }
    )
  }

  // Generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  // Save verification code
  await supabase.from("verification_codes").insert({
    client_id: client.id,
    code,
    expires_at: expiresAt,
  })

  // Send via WhatsApp
  try {
    const whatsappToken = process.env.WHATSAPP_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (whatsappToken && phoneNumberId) {
      const phone = client.phone.startsWith("+") ? client.phone.slice(1) : client.phone
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
            to: phone,
            type: "text",
            text: {
              body: `Sandeli - Tu codigo de verificacion es: ${code}\n\nEste codigo expira en 5 minutos. No compartas este codigo con nadie.`,
            },
          }),
        }
      )
    }
  } catch (e) {
    console.error("WhatsApp send error:", e)
  }

  return NextResponse.json({
    success: true,
    clientId: client.id,
    clientName: client.full_name,
    // In development, include code for testing
    ...(process.env.NODE_ENV === "development" ? { code } : {}),
  })
}
