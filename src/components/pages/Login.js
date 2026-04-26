import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthData } from "../../auth/AuthWrapper";

export const Login = () => {
  const navigate = useNavigate();
  const { login, googleLogin } = AuthData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      if (err.message.startsWith("EMAIL_NOT_VERIFIED:")) {
        const userEmail = err.message.split(":")[1];
        navigate("/verify-email", { state: { email: userEmail } });
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">💰</div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your Finance Tracker</p>

        <form onSubmit={handleLogin} className="auth-form">
          <div className="auth-input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="auth-input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn-primary" disabled={loading}>
            {loading ? <span className="auth-spinner" /> : "Sign In"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <GoogleSignInButton onSuccess={googleLogin} onError={setError} />

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
};

// Separate Google button component using credential flow (id_token)
const GoogleSignInButton = ({ onSuccess, onError }) => {
  const { googleLogin } = AuthData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCredentialResponse = async (credentialResponse) => {
    setLoading(true);
    try {
      await googleLogin(credentialResponse.credential);
      navigate("/");
    } catch (err) {
      onError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Use Google Identity Services script for credential flow
  React.useEffect(() => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "389529819718-sb52ttlbk8jnt2to2drng5a4vjfq70cm.apps.googleusercontent.com",
        callback: handleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-signin-btn"),
        { theme: "filled_black", size: "large", width: 340, text: "signin_with" }
      );
    }
  }, []);

  return (
    <>
      <script src="https://accounts.google.com/gsi/client" async defer></script>
      <div id="google-signin-btn" className="google-btn-wrapper" />
      {loading && <p style={{textAlign:'center',color:'#a6adc8',fontSize:'0.85rem'}}>Signing in with Google...</p>}
    </>
  );
};
