import { useRoute, navigate } from '@hooks/useRoute'
import CustomCursor from '@components/ui/CustomCursor'
import Nav from '@components/Nav'
import HeroSection from '@components/sections/HeroSection'
import StatsStrip from '@components/sections/StatsStrip'
import ViewerSection from '@components/sections/ViewerSection'
import FeaturesSection from '@components/sections/FeaturesSection'
import UploadSection from '@components/sections/UploadSection'
import PricingSection from '@components/sections/PricingSection'
import CTASection from '@components/sections/CTASection'
import Footer from '@components/Footer'
import SplashScreen from '@components/brand/SplashScreen'
import UploadPanel from '@components/upload/UploadPanel'
import DashboardScreen from '@components/dashboard/DashboardScreen'
import PublicPropertyPage from '@components/property/PublicPropertyPage'
import InstallPrompt from '@components/pwa/InstallPrompt'
import UpdateNotification from '@components/pwa/UpdateNotification'

export default function App() {
  const route = useRoute()

  // PWA pieces are mounted globally — disponíveis em todas as rotas
  const globalPwa = (
    <>
      <UpdateNotification />
      <InstallPrompt />
    </>
  )

  if (route.name === 'property') {
    return (
      <>
        <PublicPropertyPage slug={route.params.slug} />
        {globalPwa}
      </>
    )
  }

  if (route.name === 'dashboard') {
    return (
      <>
        <DashboardScreen />
        {globalPwa}
      </>
    )
  }

  return (
    <div className="noise relative min-h-screen bg-ink-950 font-sans text-white">
      <SplashScreen />
      <CustomCursor />
      <Nav onOpenDashboard={() => navigate('/dashboard')} />

      <main>
        <HeroSection />
        <StatsStrip />
        <ViewerSection />
        <FeaturesSection />
        <UploadSection />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />

      <UploadPanel />
      {globalPwa}
    </div>
  )
}
