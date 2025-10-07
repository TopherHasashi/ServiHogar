import UserDashboard from "../components/user/UserDashboardModular"
import { useAuth } from "../lib/auth"
import { Navigate } from "react-router-dom"

export default function ProfesionalPage() {
  const { user, loading, logout } = useAuth()

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-gray-600">Cargando…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.effective_role !== "profesional") {
    // Redirige según el rol efectivo si no es profesional
    if (user.effective_role === "verificador") return <Navigate to="/verificador" replace />
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
    isProfessional: true,
    avatar: "",
  }

  return <UserDashboard user={unifiedUser} onLogout={logout} />
}
