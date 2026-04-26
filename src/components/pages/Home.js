import React from 'react';
import { Link } from 'react-router-dom';
import { AuthData } from '../../auth/AuthWrapper';

export const Home = () => {
  const { user } = AuthData();

  return (
    <div className="page home-page">
      <div className="home-hero">
        <div className="home-logo">💰</div>
        <h1 className="home-title">Finance Tracker</h1>
        <p className="home-subtitle">
          Take control of your money. Track expenses, monitor income,<br />
          and get AI-powered insights — all with your data staying private.
        </p>
        {!user.isAuthenticated && (
          <div className="home-cta">
            <Link to="/register" className="btn-primary home-btn">Get Started Free</Link>
            <Link to="/login" className="home-btn-secondary">Sign In</Link>
          </div>
        )}
        {user.isAuthenticated && (
          <div className="home-cta">
            <Link to="/" className="btn-primary home-btn">Go to Dashboard</Link>
          </div>
        )}
      </div>

      <div className="home-features">
        <div className="home-feature">
          <span className="feature-icon">📊</span>
          <h3>Expense Tracking</h3>
          <p>Log and categorize every transaction. See where your money goes with clear charts.</p>
        </div>
        <div className="home-feature">
          <span className="feature-icon">🏦</span>
          <h3>Bank Statement Import</h3>
          <p>Upload PDF statements from any bank. Local AI extracts all transactions automatically.</p>
        </div>
        <div className="home-feature">
          <span className="feature-icon">🔒</span>
          <h3>100% Private</h3>
          <p>All AI processing runs on your own machine. Your financial data never leaves your device.</p>
        </div>
        <div className="home-feature">
          <span className="feature-icon">🎯</span>
          <h3>Savings Goals</h3>
          <p>Set goals and get personalized recommendations on how to reach them faster.</p>
        </div>
      </div>
    </div>
  );
};
