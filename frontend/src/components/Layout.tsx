import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import SearchModal from './SearchModal'
import Drawer from './Drawer'
import { useWindowWidth } from '../lib/hooks'

export default function Layout() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const w = useWindowWidth()
  const mobile = w < 900

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: 'var(--bg)', color: 'var(--tx)', fontSize: 13, lineHeight: 1.45,
    }}>
      <Header
        mobile={mobile}
        onOpenSearch={() => setSearchOpen(true)}
        onToggleDrawer={() => setDrawerOpen((v) => !v)}
      />
      <main style={{ flex: '1 1 auto', overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        <Outlet />
      </main>
      <Footer />
      {searchOpen && <SearchModal onClose={() => setSearchOpen(false)} />}
      {drawerOpen && <Drawer onClose={() => setDrawerOpen(false)} />}
    </div>
  )
}
