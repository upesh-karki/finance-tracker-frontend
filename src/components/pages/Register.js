import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { API } from "../../api/config";
import { AuthData } from "../../auth/AuthWrapper";

const GOOGLE_CLIENT_ID = "389529819718-sb52ttlbk8jnt2to2drng5a4vjfq70cm.apps.googleusercontent.com";

export const Register = () => {
  const navigate = useNavigate();
  const { googleLogin } = AuthData();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Mount Google Sign In button
  useEffect(() => {
    const initGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCredential,
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-register-btn"),
          { theme: "filled_black", size: "large", width: 340, text: "signup_with" }
        );
      }
    };
    // Try immediately, then retry after script loads
    initGoogle();
    const timer = setTimeout(initGoogle, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleCredential = async (credentialResponse) => {
    setGoogleLoading(true);
    setError("");
    try {
      await googleLogin(credentialResponse.credential);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(API.authRegister, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Registration failed");
      navigate("/verify-email", { state: { email: formData.email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <script src="https://accounts.google.com/gsi/client" async defer />
      <div className="auth-card">
        <div className="auth-logo">💰</div>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Start tracking your finances today</p>

        {/* Google Sign Up — skip form entirely */}
        <div id="google-register-btn" className="google-btn-wrapper" />
        {googleLoading && <p style={{textAlign:'center',color:'#a6adc8',fontSize:'0.85rem',margin:'8px 0'}}>Signing up with Google...</p>}

        <div className="auth-divider"><span>or sign up with email</span></div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-row">
            <div className="auth-input-group">
              <label>First Name</label>
              <input type="text" name="firstName" value={formData.firstName}
                onChange={handleChange} placeholder="John" required />
            </div>
            <div className="auth-input-group">
              <label>Last Name</label>
              <input type="text" name="lastName" value={formData.lastName}
                onChange={handleChange} placeholder="Doe" required />
            </div>
          </div>

          <div className="auth-input-group">
            <label>Email</label>
            <input type="email" name="email" value={formData.email}
              onChange={handleChange} placeholder="you@example.com" required />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <input type="password" name="password" value={formData.password}
              onChange={handleChange} placeholder="Min. 8 characters" required />
          </div>

          <div className="auth-input-group">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword}
              onChange={handleChange} placeholder="Repeat password" required />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : "Create Account"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};
