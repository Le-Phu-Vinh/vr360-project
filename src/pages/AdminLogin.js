import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminLogin.css';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'vr360admin';

const AdminLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionStorage.getItem('vr360_admin_auth') === 'true') {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate auth delay for UX
    await new Promise((r) => setTimeout(r, 700));

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      sessionStorage.setItem('vr360_admin_auth', 'true');
      navigate('/admin', { replace: true });
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không đúng');
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Animated background */}
      <div className="login-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />
      </div>

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon-wrap">
            <span className="logo-icon">🏛️</span>
          </div>
          <h1 className="login-title">VR360 Admin</h1>
          <p className="login-subtitle">Hệ thống quản lý hiện vật bảo tàng</p>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="login-field">
            <label htmlFor="admin-username">Tên đăng nhập</label>
            <div className="input-wrap">
              <span className="input-icon">👤</span>
              <input
                id="admin-username"
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="admin"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="admin-password">Mật khẩu</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••••"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="toggle-pw"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="login-spinner" />
                Đang xác thực...
              </>
            ) : (
              <>
                <span>🚀</span> Đăng nhập
              </>
            )}
          </button>
        </form>

        <Link to="/" className="back-link">
          ← Quay lại trang VR360
        </Link>
      </div>
    </div>
  );
};

export default AdminLogin;
