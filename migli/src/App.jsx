import { useEffect, useState } from 'react'
import { useAppRoute, navigate } from '@hooks/useAppRoute'

import AppShell from '@components/shell/AppShell'
import TabBar from '@components/shell/TabBar'
import HomeTab from '@components/screens/HomeTab'
import CapturarTab from '@components/screens/CapturarTab'
import BibliotecaTab from '@components/screens/BibliotecaTab'
import PlanoTab from '@components/screens/PlanoTab'
import PerfilTab from '@components/screens/PerfilTab'

import PublicPropertyPage from '@components/property/PublicPropertyPage'
import ScanScreen from '@components/capture/ScanScreen'
import ProcessingReveal from '@components/capture/ProcessingReveal'
import ImmersiveViewer from '@components/viewer/ImmersiveViewer'
import SplashScreen from '@components/brand/SplashScreen'
import InstallPrompt from '@components/pwa/InstallPrompt'
import UpdateNotification from '@components/pwa/UpdateNotification'
import OfflineBanner from '@components/shell/OfflineBanner'

import { getDefaultScene } from '@lib/splatCatalog'

export default function App() {
  const route = useAppRoute()

  // Estado global do fluxo de captura
  const [scanOpen, setScanOpen] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [session, setSession] = useState(null)

  // Estado de viewer aberto (preview de imóvel da biblioteca, ou demo)
  const [openProperty, setOpenProperty] = useState(null)
  const [demoOpen, setDemoOpen] = useState(false)

  const startScan = () => setScanOpen(true)

  const handleScanComplete = (s) => {
    setSession(s)
    setScanOpen(false)
    setProcessing(true)
    // Quando o processamento terminar, usuário vai pra biblioteca
  }

  const handleProcessingClose = () => {
    setProcessing(false)
    setSession(null)
    navigate('/biblioteca')
  }

  // Capturar tab: ao abrir, aciona automaticamente o scan se vier de
  // outras tabs (UX: tap em "Escanear" deve abrir câmera direto)
  useEffect(() => {
    if (route.name === 'capturar' && !scanOpen && !processing) {
      // Pequeno delay pra animação da tab terminar antes
      const t = setTimeout(() => setScanOpen(true), 200)
      return () => clearTimeout(t)
    }
  }, [route.name, scanOpen, processing])

  const globalOverlays = (
    <>
      <OfflineBanner />
      <UpdateNotification />
      <InstallPrompt />
      <ScanScreen
        open={scanOpen}
        onClose={() => {
          setScanOpen(false)
          // Se veio da tab capturar, volta pra home depois de cancelar
          if (route.name === 'capturar') navigate('/')
        }}
        onComplete={handleScanComplete}
      />
      <ProcessingReveal
        open={processing}
        session={session}
        onClose={handleProcessingClose}
      />
      {/* Viewer de imóvel aberto pela biblioteca */}
      {openProperty && (
        <ImmersiveViewer
          open
          scene={
            openProperty.splat_url
              ? { splatUrl: openProperty.splat_url }
              : getDefaultScene()
          }
          propertyMeta={{
            name: openProperty.name,
            status: openProperty.subtitle ?? 'Tour imersivo',
            price: openProperty.price,
          }}
          onClose={() => setOpenProperty(null)}
        />
      )}
      {/* Viewer demo da Home */}
      {demoOpen && (
        <ImmersiveViewer
          open
          scene={getDefaultScene()}
          propertyMeta={{
            name: 'Tour de demonstração',
            status: 'Cena arquitetônica · MIGLI',
            rooms: ['Demonstração interativa'],
          }}
          onClose={() => setDemoOpen(false)}
        />
      )}
    </>
  )

  // Rota /p/:slug → página pública compartilhável (sem app shell)
  if (route.name === 'property') {
    return (
      <>
        <PublicPropertyPage slug={route.params.slug} />
        {globalOverlays}
      </>
    )
  }

  // App shell
  const tabName = route.name
  return (
    <>
      <SplashScreen />

      <AppShell tabKey={tabName}>
        {tabName === 'home' && (
          <HomeTab onScan={startScan} onSeeDemo={() => setDemoOpen(true)} />
        )}
        {tabName === 'capturar' && <CapturarTab onScan={startScan} />}
        {tabName === 'biblioteca' && (
          <BibliotecaTab
            onScan={startScan}
            onOpenProperty={(p) => setOpenProperty(p)}
          />
        )}
        {tabName === 'plano' && <PlanoTab onSubscribe={() => {}} />}
        {tabName === 'perfil' && <PerfilTab />}
      </AppShell>

      <TabBar activeTab={tabName} />

      {globalOverlays}
    </>
  )
}
