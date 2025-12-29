import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ShieldX } from "lucide-react"

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center p-12 space-y-6">
          <div className="rounded-full bg-destructive/10 p-4">
            <ShieldX className="h-12 w-12 text-destructive" />
          </div>

          <div className="text-center space-y-2">
            <CardTitle className="text-2xl font-bold">
              Acceso Denegado
            </CardTitle>
            <CardDescription className="text-base">
              No tienes permiso para acceder a este sistema.
              <br />
              Este es un sistema personal de uso exclusivo.
            </CardDescription>
          </div>

          <Link href="/auth/signin" className="w-full">
            <Button variant="outline" className="w-full">
              Volver al inicio de sesión
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}