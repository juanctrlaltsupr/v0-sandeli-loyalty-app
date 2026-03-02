"use client"

import { AdminShell } from "@/components/admin/admin-shell"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { use, useState } from "react"
import useSWR from "swr"
import {
  Mail,
  Phone,
  MapPin,
  User,
  Star,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { data, isLoading, mutate } = useSWR(`/api/clients/${id}`, fetcher)
  const [redeemCode, setRedeemCode] = useState("")
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const client = data?.client
  const invoices = data?.invoices || []
  const redemptions = data?.redemptions || []

  const handleValidateCode = async () => {
    if (!redeemCode.trim()) return
    setValidating(true)
    setValidationResult(null)

    try {
      const res = await fetch("/api/redemptions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: redeemCode.trim() }),
      })

      const result = await res.json()

      if (!res.ok) {
        setValidationResult({ success: false, message: result.error })
      } else {
        setValidationResult({
          success: true,
          message: `Validado correctamente. Se descontaron ${result.pointsDeducted} puntos.`,
        })
        setRedeemCode("")
        mutate()
      }
    } catch {
      setValidationResult({
        success: false,
        message: "Error de conexion",
      })
    } finally {
      setValidating(false)
    }
  }

  if (isLoading) {
    return (
      <AdminShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminShell>
    )
  }

  if (!client) {
    return (
      <AdminShell>
        <p className="text-center text-muted-foreground">Cliente no encontrado</p>
      </AdminShell>
    )
  }

  return (
    <AdminShell>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-foreground">{client.full_name}</h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Client Info */}
          <Card className="lg:col-span-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Informacion del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{client.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{client.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{client.address}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{client.gender}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">
                  Registrado el{" "}
                  {new Date(client.created_at).toLocaleDateString("es-CO")}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-3 rounded-lg bg-primary/10 p-3">
                <Star className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-lg font-bold text-primary">{client.points} pts</p>
                  <p className="text-xs text-muted-foreground">Puntos disponibles</p>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Codigo de usuario: <span className="font-mono font-bold">{client.user_code}</span>
              </div>
            </CardContent>
          </Card>

          {/* Redemption Validation */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Validar Codigo de Redencion
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                Ingresa el codigo de 8 caracteres que el cliente genero al redimir un
                producto.
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Ej: ABCD1234"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                  maxLength={8}
                />
                <Button
                  onClick={handleValidateCode}
                  disabled={validating || redeemCode.length < 8}
                >
                  {validating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Validar
                </Button>
              </div>
              {validationResult && (
                <div
                  className={`rounded-lg p-3 text-sm ${
                    validationResult.success
                      ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                      : "bg-destructive/10 text-destructive"
                  }`}
                >
                  {validationResult.message}
                </div>
              )}

              {/* Redemption history */}
              <div className="mt-2">
                <h3 className="mb-2 text-sm font-medium text-foreground">
                  Historial de Redenciones
                </h3>
                {redemptions.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    Sin redenciones aun
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {redemptions.map(
                      (r: {
                        id: string
                        code: string
                        status: string
                        points_spent: number
                        created_at: string
                        products: { name: string }
                      }) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between rounded-lg bg-secondary p-3"
                        >
                          <div className="flex flex-col">
                            <p className="text-sm font-medium text-foreground">
                              {r.products?.name}
                            </p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {r.code}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-foreground">
                              {r.points_spent} pts
                            </span>
                            <Badge
                              variant={
                                r.status === "validated"
                                  ? "default"
                                  : r.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="gap-1"
                            >
                              {r.status === "validated" && (
                                <CheckCircle2 className="h-3 w-3" />
                              )}
                              {r.status === "pending" && (
                                <Clock className="h-3 w-3" />
                              )}
                              {r.status === "rejected" && (
                                <XCircle className="h-3 w-3" />
                              )}
                              {r.status === "validated"
                                ? "Validado"
                                : r.status === "pending"
                                ? "Pendiente"
                                : "Rechazado"}
                            </Badge>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Historial de Facturas</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                Sin facturas registradas
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-xs font-medium uppercase text-muted-foreground">
                        # Factura
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                        Monto
                      </th>
                      <th className="px-3 py-2 text-center text-xs font-medium uppercase text-muted-foreground">
                        Puntos
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium uppercase text-muted-foreground">
                        Fecha
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map(
                      (inv: {
                        id: string
                        invoice_number: string
                        amount: number
                        points_earned: number
                        created_at: string
                      }) => (
                        <tr
                          key={inv.id}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-3 py-2 text-sm font-medium text-foreground">
                            #{inv.invoice_number}
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-foreground">
                            ${inv.amount.toLocaleString("es-CO")}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                              +{inv.points_earned}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right text-sm text-muted-foreground">
                            {new Date(inv.created_at).toLocaleDateString("es-CO")}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  )
}
