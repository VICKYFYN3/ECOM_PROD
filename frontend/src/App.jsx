import React, { useEffect, useState } from 'react'
import {Routes,Route, BrowserRouter} from 'react-router-dom'
import Home from './pages/Home'
import Orders from './pages/Orders'
import Collection from './pages/Collection'
import About from './pages/About'
import Contact from './pages/Contact'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Login from './pages/Login'
import PlaceOrder from './pages/PlaceOrder'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'
import { Toaster } from 'sonner';
import Verify from './pages/Verify'
import VerifyPaystack from './pages/VerifyPaystack';
import UserProfile from './pages/UserProfile';
import ScrollToTop from "./components/ScrollToTop";
import WhatsappFAB from "./components/WhatsappFAB";

function App() {
  // PWA install prompt logic
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Only show if not already shown this session
    if (!sessionStorage.getItem('pwaInstallPromptShown')) {
      const handler = (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallBanner(true);
        sessionStorage.setItem('pwaInstallPromptShown', 'true');
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Already set in sessionStorage
  };

  return (
    <>
      <ScrollToTop />
      <WhatsappFAB />
      {/* PWA Install Banner */}
      {showInstallBanner && (
        <div style={{
          position: 'fixed',
          left: '50%',
          bottom: '2rem',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(90deg, #4f46e5 0%, #6366f1 100%)',
          color: '#fff',
          padding: '1.5em 2em',
          borderRadius: '1.5em',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          zIndex: 1000,
          animation: 'slideUp 0.5s'
        }}>
          <img
            src='/icon-192x192.png'
            alt='App Icon'
            style={{
              width: 48,
              height: 48,
              borderRadius: '1em',
              marginRight: '1em',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '1.1em', marginBottom: 4 }}>
              Install our app for a faster, offline experience!
            </div>
            <div style={{ fontSize: '0.95em', opacity: 0.85 }}>
              Get quick access from your home screen.
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            style={{
              marginLeft: '1.5em',
              padding: '0.7em 1.3em',
              background: '#fff',
              color: '#4f46e5',
              border: 'none',
              borderRadius: '1em',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseOver={e => { e.target.style.background = '#6366f1'; e.target.style.color = '#fff'; }}
            onMouseOut={e => { e.target.style.background = '#fff'; e.target.style.color = '#4f46e5'; }}
          >
            Install
          </button>
          <button
            onClick={handleDismiss}
            style={{
              marginLeft: '0.7em',
              padding: '0.7em 1.1em',
              background: 'transparent',
              color: '#fff',
              border: '1.5px solid #fff',
              borderRadius: '1em',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s'
            }}
            onMouseOver={e => { e.target.style.background = '#fff'; e.target.style.color = '#4f46e5'; }}
            onMouseOut={e => { e.target.style.background = 'transparent'; e.target.style.color = '#fff'; }}
          >
            Dismiss
          </button>
          <style>
            {`
              @keyframes slideUp {
                from { transform: translateX(-50%) translateY(100px); opacity: 0; }
                to { transform: translateX(-50%) translateY(0); opacity: 1; }
              }
            `}
          </style>
        </div>
      )}
      <div className='px-4 sm:px-[5vw] md:px-[7vw] lg:px-[4vw]'>
        <Toaster closeButton richColors position='top-right' />
        <Navbar />
        <SearchBar />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/collection' element={<Collection />} />
          <Route path='/product/:productId' element={<Product />} />
          <Route path='/orders' element={<Orders />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/login' element={<Login />} />
          <Route path='/place-order' element={<PlaceOrder />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/verify' element={<Verify />} />
          <Route path="/verify-paystack" element={<VerifyPaystack />} />
          <Route path="/profile" element={<UserProfile />} />
        </Routes>
        <Footer />
      </div>
    </>
  )
}

export default App