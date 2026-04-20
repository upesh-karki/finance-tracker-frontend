import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import { API } from '../../api/config';

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    occupation: "",
    phoneNumber: "",
    email: "",
    username: "",
    password: "",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(API.register, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert("User successfully registered!");
        navigate("/login");
      } else {
        alert(`Registration failed: ${result.message || response.statusText}`);
      }
    } catch (error) {
      alert("An error occurred during registration.");
      console.error("Error:", error);
    }
  };

  const populateForm = () => {
    setFormData({
      firstName: "John",
      lastName: "Doe",
      occupation: "Engineer",
      phoneNumber: "555-123-4567",
      email: "john.doe@example.com",
      username: "johndoe",
      password: "password123",
    });
  };

  return (
    <div className="page">
      <h2>Welcome to our Finance Management App</h2>
      <p>To sign up now please enter your details and get ready to reach your financial goals!</p>
      <form id="registrationForm" className="form" onSubmit={handleRegister}>
        <div className="inputs">
          <label htmlFor="firstName">First Name:</label>
          <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} required /><br /><br />

          <label htmlFor="lastName">Last Name:</label>
          <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} required /><br /><br />

          <label htmlFor="occupation">Occupation:</label>
          <input type="text" id="occupation" name="occupation" value={formData.occupation} onChange={handleInputChange} /><br /><br />

          <label htmlFor="phoneNumber">Phone Number:</label>
          <input type="text" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} /><br /><br />

          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required /><br /><br />

          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" value={formData.username} onChange={handleInputChange} required /><br /><br />

          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleInputChange} required /><br /><br />

          <button type="button" id="populateBtn" onClick={populateForm}>Populate Form</button>
          <div className="button">
            <button type="submit" id="registerBtn">Register</button>
          </div>
        </div>
      </form>
    </div>
  );
};
