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
          bottom: 0,
          left: 0,
          right: 0,
          background: '#222',
          color: '#fff',
          padding: '1em',
          textAlign: 'center',
          zIndex: 1000
        }}>
          <span>Install our app for a better experience!</span>
          <button
            style={{
              marginLeft: '1em',
              padding: '0.5em 1em',
              background: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={handleInstallClick}
          >
            Install
          </button>
          <button
            style={{
              marginLeft: '1em',
              padding: '0.5em 1em',
              background: '#888',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={handleDismiss}
          >
            Dismiss
          </button>
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