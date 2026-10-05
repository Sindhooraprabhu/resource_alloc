import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'citizen'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.includes('@')) {
      newErrors.email = 'Valid email is required';
    }
    
    if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Valid 10-digit phone number is required';
    }
    
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      try {
        await register(formData);
        navigate('/login');
      } catch (err) {
        setErrors({ submit: 'Registration failed. Please try again.' });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-8">
      <div className="w-full max-w-md p-8 bg-surface rounded-xl shadow-md border border-border/50">
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-primary mb-2">LifeLink AI</div>
          <p className="text-text-secondary">Join the Emergency Healthcare Network</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-text-sm font-medium mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-25 transition-all bg-surface-color hover:border-primary/50 ${errors.name ? 'border-error' : 'border-border'}`}
              placeholder="Dr. John Smith"
            />
            {errors.name && <p className="mt-1 text-error text-sm">{errors.name}</p>}
          </div>
          
          <div>
            <label className="block text-text-sm font-medium mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-25 transition-all bg-surface-color hover:border-primary/50 ${errors.email ? 'border-error' : 'border-border'}`}
              placeholder="doctor@lifelink.com"
            />
            {errors.email && <p className="mt-1 text-error text-sm">{errors.email}</p>}
          </div>
          
          <div>
            <label className="block text-text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-25 transition-all bg-surface-color hover:border-primary/50 ${errors.phone ? 'border-error' : 'border-border'}`}
              placeholder="+1234567890"
            />
            {errors.phone && <p className="mt-1 text-error text-sm">{errors.phone}</p>}
          </div>
          
          <div>
            <label className="block text-text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-25 transition-all bg-surface-color hover:border-primary/50 ${errors.password ? 'border-error' : 'border-border'}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-error text-sm">{errors.password}</p>}
          </div>
          
          <div>
            <label className="block text-text-sm font-medium mb-2">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              minLength="6"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-25 transition-all bg-surface-color hover:border-primary/50 ${errors.confirmPassword ? 'border-error' : 'border-border'}`}
              placeholder="••••••••"
            />
            {errors.confirmPassword && <p className="mt-1 text-error text-sm">{errors.confirmPassword}</p>}
          </div>
          
          <div>
            <label className="block text-text-sm font-medium mb-2">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-25 transition-all bg-surface-color hover:border-primary/50"
            >
              <option value="citizen">Citizen</option>
              <option value="ambulance">Ambulance Staff</option>
              <option value="hospital">Hospital Staff</option>
              <option value="doctor">Doctor</option>
              <option value="traffic">Traffic Authority</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          
          {errors.submit && (
            <div className="px-4 py-3 bg-error/10 text-error rounded-lg text-sm border border-error/20">
              {errors.submit}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white px-4 py-3 rounded-lg font-medium transition-all hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-text-sm text-text-secondary">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline font-medium">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;