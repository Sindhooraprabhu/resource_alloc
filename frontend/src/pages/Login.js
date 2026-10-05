import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/emergency');
      }
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8">
      <div className="w-full max-w-md p-8 bg-surface rounded-xl shadow-md border border-border/50">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-primary mb-2">LifeLink AI</div>
          <p className="text-text-secondary">Emergency Healthcare Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-25 transition-all bg-surface-color hover:border-primary/50"
              placeholder="doctor@lifelink.com"
            />
          </div>

          <div>
            <label className="block text-text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-25 transition-all bg-surface-color hover:border-primary/50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-error/10 text-error rounded-lg text-sm border border-error/20">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white px-4 py-3 rounded-lg font-medium transition-all hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-sm text-text-secondary">
            Don't have an account?{' '}
            <a href="/register" className="text-primary hover:underline font-medium">
              Sign Up
            </a>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link to="/emergency" className="text-sm text-primary hover:underline">
            Back to User Portal
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="text-center mb-3">
            <p className="text-xs text-text-tertiary font-medium">DEMO ACCOUNTS</p>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-primary/5 rounded-lg">
              <span className="text-text-secondary">Admin</span>
              <span className="font-mono text-primary">admin@lifelink.com / admin123</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-success/5 rounded-lg">
              <span className="text-text-secondary">Doctor</span>
              <span className="font-mono text-success">dr.smith@lifelink.com / doctor123</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-warning/5 rounded-lg">
              <span className="text-text-secondary">Hospital</span>
              <span className="font-mono text-warning">hospital@lifelink.com / hospital123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;