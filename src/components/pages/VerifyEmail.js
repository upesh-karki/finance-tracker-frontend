import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthData } from "../../auth/AuthWrapper";
import { API } from "../../api/config";

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthUser } = AuthData();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(120); // 2 min
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleOtpChange = (idx, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter the 6-digit code"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(API.authVerifyOtp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode: code }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Verification failed");
      setAuthUser(result.data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await fetch(API.authResendOtp(email), { method: "POST" });
      setCountdown(120);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">✉️</div>
        <h1 className="auth-title">Check your email</h1>
        <p className="auth-subtitle">
          We sent a 6-digit code to<br />
          <strong style={{ color: "#cdd6f4" }}>{email}</strong>
        </p>

        <form onSubmit={handleVerify} className="auth-form">
          <div className="otp-inputs">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={el => inputRefs.current[idx] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(idx, e.target.value)}
                onKeyDown={e => handleKeyDown(idx, e)}
                className="otp-box"
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-btn-primary" disabled={loading || otp.join("").length !== 6}>
            {loading ? <span className="auth-spinner" /> : "Verify Email"}
          </button>
        </form>

        <div className="resend-section">
          {canResend ? (
            <button className="auth-link-btn" onClick={handleResend} disabled={resending}>
              {resending ? "Sending..." : "Resend code"}
            </button>
          ) : (
            <p className="resend-timer">Resend code in <strong>{formatTime(countdown)}</strong></p>
          )}
        </div>

        <p className="auth-footer">
          <button className="auth-link-btn" onClick={() => navigate("/login")}>← Back to login</button>
        </p>
      </div>
    </div>
  );
};
