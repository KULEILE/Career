// src/components/Auth/EmailVerificationHandler.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyActionCode, getAuth } from "firebase/auth";

export default function EmailVerificationHandler() {
  const [message, setMessage] = useState("Verifying email...");
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    if (mode === "verifyEmail" && oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => {
          setMessage("Your email has been successfully verified! You can now login to your account.");
          setIsSuccess(true);
          setTimeout(() => navigate("/login", { 
            state: { 
              message: "Email verified successfully! Please login.",
              type: "success"
            }
          }), 3000);
        })
        .catch(err => {
          setMessage("Error verifying email: " + err.message);
          setIsSuccess(false);
        });
    } else {
      setMessage("Invalid verification link.");
      setIsSuccess(false);
    }
  }, [auth, navigate]);

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: '500px', margin: '2rem auto' }}>
        <div className="card-header">
          <h2 className="card-title">
            {isSuccess ? 'Email Verified Successfully!' : 'Verification Failed'}
          </h2>
        </div>
        <div className="card-body">
          <div className={isSuccess ? "alert alert-success" : "alert alert-error"}>
            {message}
          </div>
          {isSuccess && (
            <p>Redirecting to login page in 3 seconds...</p>
          )}
          {!isSuccess && (
            <div>
              <p>You can:</p>
              <ul>
                <li>Try to <a href="/login">login</a> and request a new verification email</li>
                <li>Register again with the same email</li>
                <li>Check if your email is already verified by trying to <a href="/login">login</a></li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}