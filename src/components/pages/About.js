import React from 'react';

export const About = () => {
  return (
    <div className="page">
      <h2 style={{color:'#cdd6f4', marginBottom: 8}}>About Finance Tracker</h2>
      <p style={{color:'#a6adc8', marginBottom: 32}}>A personal finance app built with privacy first.</p>

      <div className="about-grid">
        <div className="about-section">
          <h3>🛠 Tech Stack</h3>
          <ul>
            <li><strong>Backend:</strong> Java 17, Spring Boot 3.4, PostgreSQL, Liquibase</li>
            <li><strong>Frontend:</strong> React 18, Chart.js, React Router v6</li>
            <li><strong>AI:</strong> Ollama (gemma4:e2b) — runs 100% locally</li>
            <li><strong>Auth:</strong> JWT + BCrypt + Google OAuth + Email OTP</li>
            <li><strong>Infra:</strong> Docker Compose, nginx</li>
          </ul>
        </div>

        <div className="about-section">
          <h3>🔒 Privacy</h3>
          <p>Your financial data is sensitive. Finance Tracker is designed so that:</p>
          <ul>
            <li>Bank statement AI processing runs on your own machine via Ollama</li>
            <li>No financial data is sent to external AI APIs</li>
            <li>All data stays in your local PostgreSQL database</li>
            <li>JWT sessions expire after 30 minutes of inactivity</li>
          </ul>
        </div>

        <div className="about-section">
          <h3>✨ Features</h3>
          <ul>
            <li>Multi-account support (chequing, savings, credit cards)</li>
            <li>PDF bank statement import with AI extraction</li>
            <li>Expense &amp; income tracking with categories</li>
            <li>Missing statement reminders</li>
            <li>Savings goals &amp; recommendations</li>
            <li>Google OAuth + email verification</li>
          </ul>
        </div>

        <div className="about-section">
          <h3>📦 Version</h3>
          <ul>
            <li><strong>App version:</strong> 2026.04.1</li>
            <li><strong>DB schema:</strong> v1.2</li>
            <li><strong>Built by:</strong> Upesh Karki</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
