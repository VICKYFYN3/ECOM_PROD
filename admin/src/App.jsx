import React, { useEffect, useState } from 'react'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar';
import { Routes, Route } from 'react-router-dom';
import Add from './pages/Add';
import List from './pages/List';
import Orders from './pages/Orders';
import Login from './components/Login';
import { Toaster } from 'sonner';
import Compose from './pages/Compose';
import ContactMessages from './pages/ContactMessages';

export const backendURL = import.meta.env.VITE_BACKEND_URL
export const currency = '₦'
const App = () => {

  const [token, setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token') : '');
  useEffect(() => {
    localStorage.setItem('token', token);
  },[token])

  return (
    <div className='bg-gray-50 min-h-screen'>
      <Toaster closeButton richColors position='top-right' />
      {token === ""
        ? <Login setToken={setToken} />
        : <>
          <Navbar setToken={setToken}/>
          <hr />
          <div className='flex w-full'>
            <Sidebar />
            <div className='w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base'>
              <Routes>
                <Route path='/add' element={<Add token={token} />} />
                <Route path='/list' element={<List token={token} />} />
                <Route path='/orders' element={<Orders token={token} />} />
                <Route path='/compose' element={<Compose token={token} />} />
                <Route path='/contact-messages' element={<ContactMessages token={token} />} />
              </Routes>
            </div>
          </div>
        </>}

    </div>
  )
}

export default App