import React, { useContext, useEffect, useState } from 'react'
import { ShopContext } from '../context/ShopContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Eye, EyeOff, Mail, Lock, Key, Loader2 } from 'lucide-react';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const Login = () => {
  const [currentState, setCurrentState] = useState('Login');
  const { token, setToken, backendURL } = useContext(ShopContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetStep, setResetStep] = useState('email'); // 'email', 'code', 'password'
  const [resetTimer, setResetTimer] = useState(0); // seconds
  const [resetCode, setResetCode] = useState(''); // for code input
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const [isResetPasswordLoading, setIsResetPasswordLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    if (isLoading) return; // Prevent multiple submissions
    
    setIsLoading(true);
    try {
      if (currentState === 'Sign Up') {
        if (formData.password !== formData.confirmPassword) {
          toast.error("Passwords don't match");
          setIsLoading(false);
          return;
        }
        const response = await axios.post(backendURL + '/api/user/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password
        });
        if (response.data.success) {
          setVerificationEmail(formData.email);
          setVerificationStep(true);
          setResendTimer(240); // 4 minutes
          toast.success("Verification code sent to your email!");
        } else {
          toast.error(response.data.message);
        }
      } else {
        const response = await axios.post(backendURL + '/api/user/login', {
          email: formData.email,
          password: formData.password
        });
        if (response.data.success) {
          setToken(response.data.token);
          localStorage.setItem('token', response.data.token);
          toast.success("Login successful!");
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await axios.post(backendURL + '/api/user/google-auth', {
        token: credentialResponse.credential
      });
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        toast.success("Google authentication successful!");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Google authentication failed");
    }
  };

  // Modified handleForgotPassword to move to code step and start timer
  const handleForgotPassword = async () => {
    if (isForgotPasswordLoading) return; // Prevent multiple clicks
    try {
      if (!forgotPasswordEmail) {
        toast.error("Please enter your email");
        return;
      }
      setIsForgotPasswordLoading(true);
      const response = await axios.post(backendURL + '/api/user/forgot-password', {
        email: forgotPasswordEmail
      });
      if (response.data.success) {
        toast.success("Reset code sent to your email!");
        setResetStep('code');
        setResetTimer(60); // 1 minute
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (isResetPasswordLoading) return; // Prevent multiple clicks
    
    try {
      if (!newPassword || !resetCode) {
        toast.error("Please enter the reset code and new password");
        return;
      }
      if (newPassword.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      setIsResetPasswordLoading(true);
      const response = await axios.post(backendURL + '/api/user/reset-password', {
        token: resetCode,
        newPassword
      });
      if (response.data.success) {
        toast.success("Password reset successful! You can now login.");
        setResetCode('');
        setNewPassword('');
        setForgotPasswordEmail('');
        setResetStep('email');
        setCurrentState('Login');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsResetPasswordLoading(false);
    }
  };

  const resetPasswordFlow = () => {
    setResetToken('');
    setNewPassword('');
    setForgotPasswordEmail('');
    setResetStep('email');
  };

  // Add this helper to reset forgot password state
  const resetForgotPasswordState = () => {
    setForgotPasswordEmail('');
    setResetCode('');
    setNewPassword('');
    setResetStep('email');
    setIsForgotPasswordLoading(false);
    setIsResetPasswordLoading(false);
    setResetTimer(0);
  };

  // Verification code submit handler
  const handleVerifyCode = async () => {
    if (isVerifying) return;
    setIsVerifying(true);
    try {
      const response = await axios.post(backendURL + '/api/user/verify-email', {
        email: verificationEmail,
        code: verificationCode
      });
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        toast.success("Email verified and registration complete!");
        setVerificationStep(false);
        setVerificationEmail('');
        setVerificationCode('');
        navigate('/');
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (isResending || resendTimer > 0) return;
    setIsResending(true);
    try {
      const response = await axios.post(backendURL + '/api/user/resend-verification-code', {
        email: verificationEmail
      });
      if (response.data.success) {
        toast.success("Verification code resent!");
        setResendTimer(240); // 4 minutes
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  // New handler for verifying reset code
  const handleVerifyResetCode = () => {
    if (!resetCode) {
      toast.error('Please enter the reset code');
      return;
    }
    if (resetTimer <= 0) {
      toast.error('Reset code expired. Please request a new one.');
      return;
    }
    setResetStep('password');
  };

  // Timer effect for resend
  useEffect(() => {
    let timer;
    if (verificationStep && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [verificationStep, resendTimer]);

  // Timer effect for reset code
  useEffect(() => {
    let timer;
    if (currentState === 'Forgot Password' && resetStep === 'code' && resetTimer > 0) {
      timer = setInterval(() => {
        setResetTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [currentState, resetStep, resetTimer]);

  // Helper to format timer as mm:ss
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token]);

  // Add OTP input state for 6 digits
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputs = [];

  // Update resetCode when otpDigits change
  useEffect(() => {
    setResetCode(otpDigits.join(''));
  }, [otpDigits]);

  // Handler for OTP input
  const handleOtpChange = (e, idx) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) return;
    const newDigits = [...otpDigits];
    newDigits[idx] = value[0];
    setOtpDigits(newDigits);
    // Move to next input
    if (idx < 5 && value) {
      const next = document.getElementById(`otp-input-${idx + 1}`);
      if (next) next.focus();
    }
  };
  const handleOtpKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (otpDigits[idx]) {
        const newDigits = [...otpDigits];
        newDigits[idx] = '';
        setOtpDigits(newDigits);
      } else if (idx > 0) {
        const prev = document.getElementById(`otp-input-${idx - 1}`);
        if (prev) prev.focus();
      }
    }
  };
  const handleOtpPaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length) {
      setOtpDigits(paste.split('').concat(Array(6 - paste.length).fill('')));
    }
    e.preventDefault();
  };

  // Enhanced OTP input style with animation, filled, placeholder, responsive, and accessibility
  const getOtpBoxClass = (digit, idx, isFocused) => [
    'w-12 sm:w-14 h-12 sm:h-16 text-center text-2xl sm:text-3xl font-bold border rounded-xl mx-1 sm:mx-1.5 transition-all duration-200 outline-none',
    'bg-gray-50 border-gray-300 shadow-sm',
    isFocused ? 'border-blue-500 ring-2 ring-blue-200 ring-inset shadow-lg animate-otp-focus' : '',
    digit ? 'bg-green-50 border-green-400 text-green-700' : '',
    !digit ? 'placeholder-otp-underscore' : '',
    'focus:bg-white',
    'focus:shadow-lg',
    'otp-digit-box',
  ].join(' ');

  // Track which OTP input is focused
  const [otpFocusIdx, setOtpFocusIdx] = useState(0);

  // Add shake animation class (for future error feedback)
  const [otpShake, setOtpShake] = useState(false);

  // Add keyframes for focus and shake animation
  // (This will be injected into a <style> tag below)

  return (
    <div className='flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800'>
      {verificationStep ? (
        <div className='w-full'>
          <div className='inline-flex items-center gap-2 mb-2 mt-10'>
            <p className='prata-regular text-3xl'>Verify Email</p>
            <hr className='border-none h-[1.5px] w-8 bg-gray-800'/>
          </div>
          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
            <div className='flex items-center gap-2 mb-2'>
              <Key size={16} className='text-blue-600' />
              <p className='text-sm font-medium text-blue-800'>Check your email</p>
            </div>
            <p className='text-sm text-blue-700'>
              We've sent a 6-digit verification code to <strong>{verificationEmail}</strong>
            </p>
          </div>
          <div className='space-y-4'>
            <div className='relative'>
              <Key className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' size={18} />
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className='w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors text-center text-xl tracking-widest font-mono'
                placeholder='000000'
                maxLength="6"
                required
                disabled={isVerifying}
              />
            </div>
            <button
              onClick={handleVerifyCode}
              disabled={isVerifying || verificationCode.length !== 6}
              className='bg-black text-white font-light px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {isVerifying && <Loader2 size={18} className="animate-spin" />}
              {isVerifying ? 'Verifying...' : 'Verify Email'}
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending || resendTimer > 0}
              className='text-sm text-gray-600 hover:text-black transition-colors w-full text-center disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isResending ? 'Resending...' : resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Didn't receive the code? Resend"}
            </button>
            <button
              type="button"
              onClick={() => {
                setVerificationStep(false);
                setVerificationEmail('');
                setVerificationCode('');
              }}
              className='text-sm text-gray-600 hover:text-black transition-colors w-full text-center'
            >
              ← Back to Sign Up
            </button>
          </div>
        </div>
      ) : currentState === 'Forgot Password' ? (
        <div className='w-full'>
          <div className='inline-flex items-center gap-2 mb-2 mt-10'>
            <p className='prata-regular text-3xl'>Forgot Password</p>
            <hr className='border-none h-[1.5px] w-8 bg-gray-800'/>
          </div>
          {resetStep === 'email' && (
            <>
              <div className='mb-4'>
                <p className='text-sm text-gray-700 mb-2'>Enter your email to receive a password reset code.</p>
                <input
                  type='email'
                  value={forgotPasswordEmail}
                  onChange={e => setForgotPasswordEmail(e.target.value)}
                  className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors'
                  placeholder='Email'
                  required
                  disabled={isForgotPasswordLoading}
                />
              </div>
              <button
                onClick={handleForgotPassword}
                disabled={isForgotPasswordLoading}
                className='bg-black text-white font-light px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {isForgotPasswordLoading && <Loader2 size={18} className="animate-spin" />}
                {isForgotPasswordLoading ? 'Sending...' : 'Send Reset Code'}
              </button>
              <button
                type="button"
                onClick={() => { setCurrentState('Login'); resetForgotPasswordState(); }}
                className='text-sm text-gray-600 hover:text-black transition-colors w-full text-center mt-4'
              >
                ← Back to Login
              </button>
            </>
          )}
          {resetStep === 'code' && (
            <>
              <div className='mb-4'>
                <p className='text-sm text-gray-700 mb-2'>Enter the reset code sent to your email.</p>
                <div className={`flex gap-3 justify-center mb-2 ${otpShake ? 'otp-shake' : ''}`} onPaste={handleOtpPaste}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-input-${idx}`}
                      type='text'
                      inputMode='numeric'
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e, idx)}
                      onKeyDown={e => handleOtpKeyDown(e, idx)}
                      onFocus={() => setOtpFocusIdx(idx)}
                      disabled={resetTimer <= 0}
                      className={getOtpBoxClass(digit, idx, otpFocusIdx === idx)}
                      style={{letterSpacing: '2px'}}
                      aria-label={`Reset code digit ${idx + 1}`}
                      placeholder={digit ? '' : '_'}
                    />
                  ))}
                </div>
                <div className='flex items-center justify-between mt-2'>
                  <span className='text-xs text-gray-500'>Expires in: <span className={resetTimer <= 60 ? 'text-red-500' : ''}>{formatTimer(resetTimer)}</span></span>
                  {resetTimer <= 0 && <span className='text-xs text-red-500'>Code expired</span>}
                </div>
              </div>
              <button
                onClick={handleVerifyResetCode}
                disabled={resetTimer <= 0}
                className='bg-black text-white font-light px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                Verify Code
              </button>
              {resetTimer <= 0 && (
                <button
                  type="button"
                  onClick={async () => {
                    setIsForgotPasswordLoading(true);
                    try {
                      const response = await axios.post(backendURL + '/api/user/forgot-password', { email: forgotPasswordEmail });
                      if (response.data.success) {
                        toast.success("A new reset code has been sent to your email!");
                        setResetTimer(60);
                        setOtpDigits(Array(6).fill('')); // Reset OTP inputs
                      } else {
                        toast.error(response.data.message);
                      }
                    } catch (error) {
                      toast.error(error.response?.data?.message || error.message);
                    } finally {
                      setIsForgotPasswordLoading(false);
                    }
                  }}
                  disabled={isForgotPasswordLoading}
                  className='bg-blue-600 text-white font-light px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
                >
                  {isForgotPasswordLoading ? 'Resending...' : 'Resend Code'}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setResetStep('email'); setResetTimer(0); setOtpDigits(Array(6).fill('')); }}
                className='text-sm text-gray-600 hover:text-black transition-colors w-full text-center mt-4'
              >
                ← Back
              </button>
            </>
          )}
          {resetStep === 'password' && (
            <>
              <div className='mb-4'>
                <p className='text-sm text-gray-700 mb-2'>Enter your new password.</p>
                <div className='relative'>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-black transition-colors'
                    placeholder='New Password'
                    required
                    disabled={isResetPasswordLoading}
                  />
                  <button
                    type="button"
                    className='absolute right-3 top-1/2 transform -translate-y-1/2'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    disabled={isResetPasswordLoading}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <button
                onClick={handleResetPassword}
                disabled={isResetPasswordLoading}
                className='bg-black text-white font-light px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
              >
                {isResetPasswordLoading && <Loader2 size={18} className="animate-spin" />}
                {isResetPasswordLoading ? 'Resetting...' : 'Reset Password'}
              </button>
              <button
                type="button"
                onClick={() => { setResetStep('email'); resetForgotPasswordState(); }}
                className='text-sm text-gray-600 hover:text-black transition-colors w-full text-center mt-4'
              >
                ← Back to Login
              </button>
            </>
          )}
        </div>
      ) : (
        <form onSubmit={onSubmitHandler} className='w-full'>
          <div className='inline-flex items-center gap-2 mb-2 mt-10'>
            <p className='prata-regular text-3xl'>{currentState}</p>
            <hr className='border-none h-[1.5px] w-8 bg-gray-800'/>
          </div>
          
          {currentState === 'Sign Up' && (
            <input
              name="name"
              onChange={handleChange}
              value={formData.name}
              type="text"
              className='w-full px-3 py-2 border border-gray-800 mb-4'
              placeholder='Name'
              required
              disabled={isLoading}
            />
          )}
          
          <input
            name="email"
            onChange={handleChange}
            value={formData.email}
            type="email"
            className='w-full px-3 py-2 border border-gray-800 mb-4'
            placeholder='Email'
            required
            disabled={isLoading}
          />
          
          <div className='relative mb-4'>
            <input
              name="password"
              onChange={handleChange}
              value={formData.password}
              type={showPassword ? "text" : "password"}
              className='w-full px-3 py-2 border border-gray-800'
              placeholder='Password'
              required
              disabled={isLoading}
            />
            <button
              type="button"
              className='absolute right-3 top-1/2 transform -translate-y-1/2'
              onClick={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          
          {currentState === 'Sign Up' && (
            <div className='relative mb-4'>
              <input
                name="confirmPassword"
                onChange={handleChange}
                value={formData.confirmPassword}
                type={showConfirmPassword ? "text" : "password"}
                className='w-full px-3 py-2 border border-gray-800'
                placeholder='Confirm Password'
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className='absolute right-3 top-1/2 transform -translate-y-1/2'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          )}
          
          <div className='w-full flex justify-between text-sm mt-[-8px] mb-4'>
            <p
              className='cursor-pointer font-bold text-base text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-150'
              onClick={() => { setCurrentState('Forgot Password'); resetForgotPasswordState(); }}
            >
              Forgot your Password?
            </p>
            {
              currentState === 'Login'
              ? <p
                  className='cursor-pointer font-bold text-base text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-150'
                  onClick={() => setCurrentState('Sign Up')}
                >
                  Create an account
                </p>
              : <p
                  className='cursor-pointer font-bold text-base text-blue-600 hover:underline hover:text-blue-800 transition-colors duration-150'
                  onClick={() => setCurrentState('Login')}
                >
                  Already have an account?
                </p>
            }
          </div>
          
          <button 
            type="submit"
            disabled={isLoading}
            className='bg-black text-white font-light px-8 py-2 mt-4 cursor-pointer w-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {isLoading 
              ? (currentState === 'Login' ? 'Signing In...' : 'Signing Up...') 
              : (currentState === 'Login' ? 'Sign In' : 'Sign Up')
            }
          </button>
          
          <div className='flex items-center my-4'>
            <hr className='flex-grow border-t border-gray-300'/>
            <span className='px-3 text-gray-500'>or</span>
            <hr className='flex-grow border-t border-gray-300'/>
          </div>
          
          <GoogleOAuthProvider clientId={clientId}>
            <div className='flex justify-center'>
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  toast.error("Google login failed");
                }}
                useOneTap
              />
            </div>
          </GoogleOAuthProvider>
        </form>
      )}
      {/* Add custom styles for animation and placeholder */}
      <style>{`
        .otp-digit-box::placeholder, .placeholder-otp-underscore::placeholder {
          color: #cbd5e1;
          opacity: 1;
          font-size: 2rem;
          font-weight: 400;
          letter-spacing: 2px;
          text-align: center;
        }
        @media (max-width: 640px) {
          .otp-digit-box { width: 3rem !important; height: 3rem !important; font-size: 1.5rem !important; }
        }
        @keyframes otp-focus {
          0% { box-shadow: 0 0 0 0 #3b82f6; }
          100% { box-shadow: 0 0 0 4px #3b82f633; }
        }
        .animate-otp-focus {
          animation: otp-focus 0.2s;
        }
        @keyframes otp-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .otp-shake {
          animation: otp-shake 0.4s;
        }
      `}</style>
    </div>
  )
}

export default Login;