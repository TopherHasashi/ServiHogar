import UserDashboard from "../components/user/UserDashboardModular"
import { useAuth } from "../lib/auth"
import { Navigate } from "react-router-dom"

export default function ClientePage() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="w-full px-4 py-10">
        <p className="text-gray-600">Cargando…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.effective_role && user.effective_role !== "cliente") {
    // Redirigir al panel correspondiente si no es cliente
    if (user.effective_role === "profesional") return <Navigate to="/profesional" replace />
    if (user.effective_role === "verificador") return <Navigate to="/verificador" replace />
    if (user.effective_role === "administrador") return <Navigate to="/admin" replace />
    return <Navigate to="/" replace />
  }

  const unifiedUser = {
    id: user.id,
    name: `${(user.first_name || "").trim()} ${(user.last_name || "").trim()}`.trim() || user.username,
    email: user.email,
    phone: user.profile?.phone || "",
    district: user.profile?.district || "",
    region: user.profile?.region || "",
    address: user.profile?.address || "",
    isProfessional: user.effective_role === 'profesional' || user.effective_role === 'administrador',
    // Preferir avatar tope (expuesto por /api/auth/me/) y luego el del perfil si existe
    avatar: (user as any)?.avatar || ((user as any)?.profile?.avatar_url) || "",
  }

  return <UserDashboard user={unifiedUser} onLogout={logout} />
}
