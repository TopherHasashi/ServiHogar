import { useState, useEffect } from "react"
import { Button } from "./components/ui/button"
import { Settings, Home, User } from "lucide-react"
import Header from "./components/Header"
import Hero from "./components/Hero"
import Services from "./components/Services"
import Benefits from "./components/Benefits"
import Process from "./components/Process"
import ProfessionalCTA from "./components/ProfessionalCTA"
import Testimonials from "./components/Testimonials"
import FAQ from "./components/FAQ"
import Contact from "./components/Contact"
import Footer from "./components/Footer"

import AdminDashboardBI from "./components/admin/AdminDashboardBI"
import VerifierDashboard from "./components/admin/VerifierDashboard"
import UserAuth from "./components/user/UserAuth"
import UserDashboard from "./components/user/UserDashboardModular"

import AllServices from "./components/AllServices"
import CustomerReviews from "./components/CustomerReviews"
import AboutUs from "./components/AboutUs"
import HowItWorks from "./components/HowItWorks"
import JoinAsProfessional from "./components/JoinAsProfessional"
import TermsConditions from "./components/TermsConditions"
import PrivacyPolicy from "./components/PrivacyPolicy"

type ViewType = "public" | "admin" | "verifier" | "user-auth" | "user-dashboard" | "all-services" | "reviews" | "about-us" | "how-it-works" | "join-professional" | "terms-conditions" | "privacy-policy"

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("public")
  const [user, setUser] = useState<any>(null)
  const [adminAuthenticated, setAdminAuthenticated] = useState(false)
  const [verifierAuthenticated, setVerifierAuthenticated] = useState(false)

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [currentView])

  const handleUserLogin = (userData: any) => {
    setUser(userData)
    setCurrentView("user-dashboard")
  }

  const handleUserLogout = () => {
    setUser(null)
    setCurrentView("public")
  }

  const handleAdminLogin = () => {
    setAdminAuthenticated(true)
    setCurrentView("admin")
  }

  const handleAdminLogout = () => {
    setAdminAuthenticated(false)
    setCurrentView("public")
  }

  const handleVerifierLogin = () => {
    setVerifierAuthenticated(true)
    setCurrentView("verifier")
  }

  const handleVerifierLogout = () => {
    setVerifierAuthenticated(false)
    setCurrentView("public")
  }

  // Navigation Buttons - Optimized for mobile
  const NavigationButtons = () => (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {/* Home Button for secondary views */}
      {!["public", "admin", "verifier", "user-auth", "user-dashboard"].includes(currentView) && (
        <Button
          onClick={() => setCurrentView("public")}
          size="lg"
          className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-full w-12 h-12 sm:w-14 sm:h-14"
          variant="outline"
          title="Volver al Inicio"
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      )}
      
      {/* User Account Button */}
      {currentView === "public" && (
        <Button
          onClick={() => setCurrentView("user-auth")}
          size="lg"
          className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-full w-12 h-12 sm:w-14 sm:h-14"
          variant="outline"
          title="Mi Cuenta"
        >
          <User className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      )}
      
      {/* Admin Home Button */}
      {currentView === "admin" && (
        <Button
          onClick={() => setCurrentView("public")}
          size="lg"
          className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-full w-12 h-12 sm:w-14 sm:h-14"
          variant="secondary"
          title="Ir al Inicio"
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      )}

      {/* Verifier Home Button */}
      {currentView === "verifier" && (
        <Button
          onClick={() => setCurrentView("public")}
          size="lg"
          className="shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-full w-12 h-12 sm:w-14 sm:h-14"
          variant="secondary"
          title="Ir al Inicio"
        >
          <Home className="w-5 h-5 sm:w-6 sm:h-6" />
        </Button>
      )}
    </div>
  )

  // Render based on current view
  switch (currentView) {
    case "admin":
      return (
        <>
          <AdminDashboardBI onLogout={handleAdminLogout} />
          <NavigationButtons />
        </>
      )

    case "verifier":
      return (
        <>
          <VerifierDashboard onLogout={handleVerifierLogout} />
          <NavigationButtons />
        </>
      )
    
    case "user-auth":
      return (
        <UserAuth 
          onLogin={handleUserLogin}
          onAdminLogin={handleAdminLogin}
          onVerifierLogin={handleVerifierLogin}
          onBack={() => setCurrentView("public")}
        />
      )
    
    case "user-dashboard":
      return (
        <UserDashboard 
          user={user}
          onLogout={handleUserLogout}
        />
      )



    case "all-services":
      return (
        <>
          <AllServices 
            onBack={() => setCurrentView("public")}
            onServiceSelect={() => setCurrentView("user-auth")}
          />
          <NavigationButtons />
        </>
      )

    case "reviews":
      return (
        <>
          <CustomerReviews 
            onBack={() => setCurrentView("public")}
          />
          <NavigationButtons />
        </>
      )

    case "about-us":
      return (
        <>
          <AboutUs 
            onBack={() => setCurrentView("public")}
          />
          <NavigationButtons />
        </>
      )

    case "how-it-works":
      return (
        <>
          <HowItWorks 
            onBack={() => setCurrentView("public")}
          />
          <NavigationButtons />
        </>
      )

    case "join-professional":
      return (
        <>
          <JoinAsProfessional 
            onBack={() => setCurrentView("public")}
            onJoinClick={() => setCurrentView("user-auth")}
          />
          <NavigationButtons />
        </>
      )

    case "terms-conditions":
      return (
        <>
          <TermsConditions 
            onBack={() => setCurrentView("public")}
          />
          <NavigationButtons />
        </>
      )

    case "privacy-policy":
      return (
        <>
          <PrivacyPolicy 
            onBack={() => setCurrentView("public")}
          />
          <NavigationButtons />
        </>
      )
    
    default: // public
      return (
        <>
          <div className="min-h-screen bg-white">
            <Header 
              onUserClick={() => setCurrentView("user-auth")}
              onAllServicesClick={() => setCurrentView("all-services")}
              onReviewsClick={() => setCurrentView("reviews")}
              onHowItWorksClick={() => setCurrentView("how-it-works")}
            />
            <Hero 
              onAllServicesClick={() => setCurrentView("all-services")}
              onUserClick={() => setCurrentView("user-auth")}
            />
            <Services onServiceClick={() => setCurrentView("user-auth")} />
            <Benefits onUserClick={() => setCurrentView("user-auth")} />
            <Process 
              onServiceClick={() => setCurrentView("user-auth")}
              onAllServicesClick={() => setCurrentView("all-services")}
              onHowItWorksClick={() => setCurrentView("how-it-works")}
            />
            <ProfessionalCTA onJoinClick={() => setCurrentView("user-auth")} />
            <Testimonials onReviewsClick={() => setCurrentView("reviews")} />
            <FAQ onContactClick={() => setCurrentView("public")} />
            <Contact />
            <Footer 
              onAboutClick={() => setCurrentView("about-us")}
              onHowItWorksClick={() => setCurrentView("how-it-works")}
              onJoinProfessionalClick={() => setCurrentView("join-professional")}
              onTermsClick={() => setCurrentView("terms-conditions")}
              onPrivacyClick={() => setCurrentView("privacy-policy")}
            />
          </div>
          <NavigationButtons />
        </>
      )
  }
}