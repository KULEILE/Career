// src/components/Auth/EmailVerificationHandler.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyActionCode, getAuth } from "firebase/auth";

export default function EmailVerificationHandler() {
  const [message, setMessage] = useState("Verifying email...");
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");

    if (mode === "verifyEmail" && oobCode) {
      applyActionCode(auth, oobCode)
        .then(() => {
          setMessage("Your email has been successfully verified!");
          setTimeout(() => navigate("/login"), 2000);
        })
        .catch(err => {
          setMessage("Error verifying email: " + err.message);
        });
    } else {
      setMessage("Invalid verification link.");
    }
  }, [auth, navigate]);

  return (
    <div className="container">
      <h2>{message}</h2>
    </div>
  );
}
