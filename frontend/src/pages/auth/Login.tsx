import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/auth/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon } from 'lucide-react';

const phoneRegex = /^(\+2519|\+2517|09|07)\d{8}$/;

const Login: React.FC = () => {
  const { login, loginLoading } = useAuth();
  const navigate = useNavigate();
  const [phonenumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const validate = () => {
    let valid = true;
    setPhoneError('');
    setPasswordError('');
    if (!phoneRegex.test(phonenumber)) {
      setPhoneError('Phone number must start with +2519, +2517, 09, or 07 and be followed by 8 digits.');
      valid = false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;
    const res = await login(phonenumber, password);
    if (res.success) {
      const user = JSON.parse(localStorage.getItem('user')!);
      navigate(`/dashboard/${user.role}`);
    }  else if (res.status === 401) {
      setError('Invalid phone number or password');
    } else {
      setError('Something went wrong, please try again later');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted/40">
      <div className="mb-6 flex items-center justify-center">
        <h1 className="text-3xl font-bold text-primary-light dark:text-primary-dark mr-2">Kiya Lottery</h1>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 rounded-lg shadow-2xl bg-card">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="phonenumber">Phone Number</label>
          <Input
            id="phonenumber"
            type="text"
            value={phonenumber}
            onChange={e => setPhoneNumber(e.target.value)}
            autoFocus
            disabled={loginLoading}
            className={
              (phoneError ? 'border-red-500 ' : 'border-gray-300 dark:border-gray-700 ') +
              'border bg-white dark:bg-gray-900 focus:border-primary-light dark:focus:border-primary-dark focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark px-3 py-2'
            }
          />
          {phoneError && <p className="text-xs text-red-600 mt-1">{phoneError}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            disabled={loginLoading}
            className={
              (passwordError ? 'border-red-500 ' : 'border-gray-300 dark:border-gray-700 ') +
              'border bg-white dark:bg-gray-900 focus:border-primary-light dark:focus:border-primary-dark focus:ring-2 focus:ring-primary-light dark:focus:ring-primary-dark px-3 py-2'
            }
          />
          {passwordError && <p className="text-xs text-red-600 mt-1">{passwordError}</p>}
        </div>
        {error && <div className="mb-4 p-2 rounded bg-red-100 text-red-700 text-sm">{error}</div>}
        <Button
          type="submit"
          variant="default"
          className="w-full mt-4"
          disabled={loginLoading}
        >
          {loginLoading ? 'Processing…' : 'Login'}
        </Button>
      </form>
    </div>
  );
};

export default Login; 