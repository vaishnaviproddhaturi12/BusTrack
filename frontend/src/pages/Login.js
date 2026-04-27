import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import API_BASE_URL from '../apiConfig';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const performLogin = async (formData, isRetry = false) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      let userData = data.user;

      // Try to load bus data but don't fail if it doesn't load
      if (['student', 'driver', 'parent'].includes(data.user.role) && !data.user.bus) {
        try {
          const busController = new AbortController();
          const busBusTimeoutId = setTimeout(() => busController.abort(), 5000);

          const busResponse = await fetch(`${API_BASE_URL}/api/bus/my-bus`, {
            headers: { Authorization: `Bearer ${data.token}` },
            signal: busController.signal
          });

          clearTimeout(busBusTimeoutId);

          if (busResponse.ok) {
            const busData = await busResponse.json();
            if (busData.id) {
              userData = { ...data.user, bus: busData };
            }
          }
        } catch (err) {
          console.log('Bus data load skipped (continuing without it):', err.message);
        }
      }

      login(data.token, userData);
      showToast('Logged in successfully.');
      
      if (data.user.role === 'driver') {
        navigate('/driver');
      } else if (data.user.role === 'busIncharge') {
        navigate('/bus-incharge');
      } else if (data.user.role === 'admin') {
        navigate('/');
      } else if (data.user.role === 'parent') {
        navigate('/track');
      } else {
        navigate('/track');
      }

      return true;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      throw err;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setRetryCount(0);

    try {
      await performLogin(formData);
    } catch (err) {
      console.error('Login error:', err);
      
      // Determine if we should retry
      const isNetworkError = err.message.includes('timeout') || 
                              err.message.includes('Failed to fetch') ||
                              err.message.includes('connection');
      
      if (isNetworkError && retryCount < 2) {
        setRetryCount(prev => prev + 1);
        setError(`Connection issue. Retrying... (Attempt ${retryCount + 2}/3)`);
        
        // Retry after 2 seconds
        setTimeout(() => {
          performLogin(formData, true)
            .then(() => {
              setLoading(false);
            })
            .catch(retryErr => {
              setError(retryErr.message || 'Login failed. Please try again.');
              setLoading(false);
            });
        }, 2000);
        
        return;
      }
      
      setError(err.message || 'Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Login to BusTrack</h2>
          <p>Access live bus tracking</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-control"
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="form-control"
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register here</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;
