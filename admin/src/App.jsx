import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar';
import { Routes, Route, BrowserRouter } from 'react-router-dom';
import Add from './pages/Add';
import List from './pages/List';
import Orders from './pages/Orders';
import Login from './components/Login';
import { Toaster } from 'sonner';
import Compose from './pages/Compose';
import ContactMessages from './pages/ContactMessages';
import ScrollToTop from "./components/ScrollToTop";
import { useAuth } from './context/AuthContext';

export const backendURL = import.meta.env.VITE_BACKEND_URL
export const currency = '₦'
const App = () => {

  const { token, setToken } = useAuth();

  return (
    <>
      <ScrollToTop />
      <div className='bg-gray-50 min-h-screen'>
        <Toaster closeButton richColors position='top-right' />
        {token === ""
          ? <Login setToken={setToken} />
          : <>
              <Navbar setToken={setToken} />
              <div className='flex'>
                <Sidebar />
                <div className='flex-1 p-4'>
                  <Routes>
                    <Route path='/' element={<List />} />
                    <Route path='/add' element={<Add />} />
                    <Route path='/orders' element={<Orders />} />
                    <Route path='/compose' element={<Compose />} />
                    <Route path='/contact-messages' element={<ContactMessages />} />
                  </Routes>
                </div>
              </div>
            </>
        }
      </div>
    </>
  )
}

export default App