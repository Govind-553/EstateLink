  import { firebaseConfig } from "./firebaseConfig.js";
  import { RAZORPAY_KEY_ID } from "./razorpayConfig.js";

  import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
  import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  console.log("Auth object:", auth);

  let recaptchaRegister, recaptchaForgot;
  let tempFullName, tempMobileNumber, tempPassword;
  let lastMode = null;
  let confirmationResult;

  function setupFirebaseAndForms() {
    const formContainer = document.getElementById('form-container');

    function setupRecaptchaRegister() {
      if (window.recaptchaRegister) {
        console.log("♻️ Re-using existing reCAPTCHA");
        return window.recaptchaRegister;
      }

      const container = document.getElementById('recaptcha-container-register');
      if (!container) {
        console.error("❌ recaptcha-container-register not found in DOM!");
        return null;
      }

      window.recaptchaRegister = new RecaptchaVerifier(container, {
        size: 'invisible',
        callback: (response) => {
          console.log("✅ reCAPTCHA solved:", response);
        },
        'expired-callback': () => {
          showCustomPopup("⚠️ reCAPTCHA expired, please try again.");
        }
      }, auth);

      return window.recaptchaRegister;
    }

    function setupRecaptchaForgot() {
      if (window.recaptchaForgot) {
        console.log("♻️ Re-using existing reCAPTCHA");
        return window.recaptchaForgot;
      }

      const container = document.getElementById('recaptcha-container-forgot');
      if (!container) {
        console.error("❌ recaptcha-container-forgot not found in DOM!");
        return null;
      }

      window.recaptchaForgot = new RecaptchaVerifier(container, {
        size: 'invisible',
        callback: (response) => {
          console.log("✅ reCAPTCHA solved:", response);
        },
        'expired-callback': () => {
          showCustomPopup("⚠️ reCAPTCHA expired, please try again.");
        }
      }, auth);

      return window.recaptchaForgot;
    }

    const renderLoginForm = () => {
      formContainer.innerHTML = `
        <h2>Login</h2>
        <form id="loginForm">
          <div class="input-group">
            <label for="mobile">Mobile Number</label>
            <div class="phone-input">
              <span>+91</span>
              <input type="tel" id="mobile" name="mobile" placeholder="Enter your mobile number" required pattern="^[6-9]\\d{9}$">
            </div>
          </div>
          <div class="input-group">
            <label for="password">Password</label>
            <div class="password-input-container">
              <input type="password" id="password" name="password" placeholder="Enter your password" required>
              <i class="fa-solid fa-eye-slash toggle-password"></i>
            </div>
          </div>
          <div class="form-links">
            <a href="#" id="forgotPasswordLink">Forgot Password?</a>
          </div>
          <div id="recaptcha-container-login"></div>
          <button type="submit" id="loginBtn" class="btn">Login</button>
        </form>
        <p class="message-text">Don't have an account? <a href="#" id="showRegisterLink">Sign up</a></p>
      `;
      setupEventListeners();
    };

    const renderRegisterForm = () => {
      formContainer.innerHTML = `
        <h2>Register</h2>
        <form id="registerForm">
          <div class="input-group">
            <label for="regName">Full Name</label>
            <input type="text" id="regName" name="name" placeholder="Enter your name" required>
          </div>
          <div class="input-group">
            <label for="regMobile">Mobile Number</label>
            <div class="phone-input">
              <span>+91</span>
              <input type="tel" id="regMobile" name="mobile" placeholder="Enter your mobile number" required pattern="^[6-9]\\d{9}$">
            </div>
          </div>
          <div class="input-group">
            <label for="regPassword">Password</label>
            <div class="password-input-container">
              <input type="password" id="regPassword" name="password" placeholder="Create a password" required>
              <i class="fa-solid fa-eye-slash toggle-password"></i>
            </div>
          </div>
          <div id="recaptcha-container-register"></div>
          <button type="submit" id="sendOtpBtn" class="btn">Register</button>
        </form>
        <p class="message-text">Already have an account? <a href="#" id="showLoginLink">Login</a></p>
      `;
      setupEventListeners();
      setupRecaptchaRegister();
    };

    const renderForgotPasswordForm = () => {
      formContainer.innerHTML = `
        <h2>Forgot Password</h2>
        <p class="message-text">Enter your registered mobile number to reset your password.</p>
        <form id="forgotPasswordForm">
          <div class="input-group">
            <label for="fpMobile">Mobile Number</label>
            <div class="phone-input">
              <span>+91</span>
              <input type="tel" id="fpMobile" name="mobile" placeholder="Enter your mobile number" required pattern="^[6-9]\\d{9}$">
            </div>
          </div>
          <div id="recaptcha-container-forgot"></div>
          <button type="submit" class="btn" id="sendOtpBtn">Send OTP</button>
        </form>
        <p class="message-text"><a href="#" id="showLoginLink">Back to Login</a></p>
      `;
      setupEventListeners();
      setupRecaptchaForgot();
    };

    const renderOtpForm = (mode, phoneNumber) => {
      lastMode = mode;
      formContainer.innerHTML = `
        <h2>Verify Your Mobile</h2>
        <p class="message-text">A 6-digit OTP has been sent to your mobile number.</p>
        <form id="otpForm">
          <div class="otp-box">
            <div class="otp-row">
              <input type="text" maxlength="1" class="otp-input" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-input" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-input" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-input" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-input" inputmode="numeric" />
              <input type="text" maxlength="1" class="otp-input" inputmode="numeric" />
            </div>
          </div>
          <button type="submit" class="btn" id="verifyOtpBtn">Verify OTP</button>
          <div id="recaptcha-container-register"></div>
          <div id="recaptcha-container-forgot"></div>
          <p class="message-text">Didn't receive the OTP? <a href="#" id="resendOtpLink">Resend OTP</a></p>
        </form>
        <p class="message-text"><a href="#" id="changeNumberLink">Change Number</a></p>
      `;

      setupOtpLogic(mode, phoneNumber);
      setupEventListeners();

      const resendOtpLink = document.getElementById('resendOtpLink');
      if (resendOtpLink) {
        resendOtpLink.addEventListener('click', async (e) => {
          e.preventDefault();
          const lastPhoneNumber = localStorage.getItem('tempMobileNumber');
          if (!lastPhoneNumber) {
            showCustomPopup('⚠️ Phone number not found. Please go back and enter your number again.');
            return;
          }

          try {
            let recaptcha;
            if (mode === 'register') {
              recaptcha = setupRecaptchaRegister();
            } else if (mode === 'forgot') {
              recaptcha = setupRecaptchaForgot();
            } else {
              showCustomPopup('❌ Invalid mode for resending OTP.');
              return;
            }

            if (!recaptcha) {
              showCustomPopup("❌ Could not initialize reCAPTCHA");
              return;
            }

            confirmationResult = await signInWithPhoneNumber(auth, lastPhoneNumber, recaptcha);
            window.confirmationResult = confirmationResult;
            showCustomPopup('✅ OTP resend successfully!');
          } catch (error) {
            console.error("Resend OTP error:", error);
            showCustomPopup('❌ Error resending OTP: ' + error.message);
          }
        });
      }
    };

    const renderPasswordResetForm = () => {
      formContainer.innerHTML = `
        <h2>Set New Password</h2>
        <form id="newPasswordForm">
          <div class="input-group">
            <label for="newPassword">New Password</label>
            <div class="password-input-container">
              <input type="password" id="newPassword" name="newPassword" placeholder="Enter new password" required>
              <i class="fa-solid fa-eye-slash toggle-password"></i>
            </div>
          </div>
          <div class="input-group">
            <label for="confirmPassword">Confirm Password</label>
            <div class="password-input-container">
              <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm new password" required>
              <i class="fa-solid fa-eye-slash toggle-password"></i>
            </div>
          </div>
          <button type="submit" class="btn">Update Password</button>
        </form>
        <p class="message-text"><a href="#" id="showLoginLink">Back to Login</a></p>
      `;
      setupEventListeners();
    };

    const renderVerificationPage = () => {
      formContainer.innerHTML = `
        <div style="text-align:center; padding: 2rem;">
          <i class="fa-solid fa-circle-check" style="font-size: 4rem; color: var(--secondary-blue); margin-bottom: 1rem;"></i>
          <h2>Password Changed!</h2>
          <p>Your password has been successfully updated.</p>
          <button class="btn" id="backToLoginBtn" style="margin-top: 2rem;">Back to Login</button>
        </div>
      `;

      const backToLoginBtn = document.getElementById('backToLoginBtn');
      if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', renderLoginForm);
      }
    };

    const renderRegistrationConfirmPage = () => {
      formContainer.innerHTML = `
        <div style="text-align:center; padding: 2rem;">
          <i class="fa-solid fa-circle-check" style="font-size: 4rem; color: var(--secondary-blue); margin-bottom: 1rem;"></i>
          <h2>Registration Confirm!</h2>
          <p>Your account has been registered successfully and your subscription is active.</p>
          <button class="btn" id="backToLoginBtn" style="margin-top: 2rem;">Go to Login</button>
        </div>
      `;

      const backToLoginBtn = document.getElementById('backToLoginBtn');
      if (backToLoginBtn) {
        backToLoginBtn.addEventListener('click', renderLoginForm);
      }
    };

    const setupEventListeners = () => {
      const togglePasswordIcons = document.querySelectorAll('.toggle-password');
      togglePasswordIcons.forEach(icon => {
        icon.addEventListener('click', () => {
          const passwordInput = icon.previousElementSibling;
          const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
          passwordInput.setAttribute('type', type);
          icon.classList.toggle('fa-eye');
          icon.classList.toggle('fa-eye-slash');
        });
      });

      const showRegisterLink = document.getElementById('showRegisterLink');
      if (showRegisterLink) showRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderRegisterForm();
      });

      const showLoginLink = document.getElementById('showLoginLink');
      if (showLoginLink) showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderLoginForm();
      });

      const forgotPasswordLink = document.getElementById('forgotPasswordLink');
      if (forgotPasswordLink) forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        renderForgotPasswordForm();
      });

      const loginForm = document.getElementById('loginForm');
      if (loginForm) loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mobileInput = document.getElementById('mobile').value;
        const passwordInput = document.getElementById('password').value;
        const phoneNumber = "+91" + mobileInput;

        try {
          const response = await fetch("https://real-estate-project-1-lps5.onrender.com/api/users/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mobileNumber: phoneNumber,
              password: passwordInput
            })
          });

          const data = await response.json();

          if (response.ok) {
            const expiryDate = data.subscriptionExpiry
              ? new Date(data.subscriptionExpiry).toLocaleDateString()
              : "N/A";
            showCustomPopup(`✅ User logged in successfully! Your subscription expires on ${expiryDate}.`);
            localStorage.setItem("userToken", data.token);
            localStorage.setItem("userMobileNumber", phoneNumber);
            localStorage.setItem("user", JSON.stringify(data.data));
            window.location.href = "sellProperties.html";
          } else if (response.status === 403 && data.subscriptionActive === false) {
            // Subscription expired or not active – show Razorpay renewal
            showCustomPopup(
              data.message || "⚠️ Your subscription has expired. Please subscribe to continue.",
              "Subscription Expired",
              () => handleSubscription(phoneNumber, "renewal", passwordInput),
              true
            );
          } else {
            showCustomPopup("❌ " + (data.message || "Login failed"));
          }
        } catch (error) {
          console.error("API error:", error);
          showCustomPopup("❌ Error logging in: " + error.message);
        }
      });

      const changeNumberLink = document.getElementById('changeNumberLink');
      if (changeNumberLink) changeNumberLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (lastMode === "register") {
          renderRegisterForm();
        } else if (lastMode === "forgot") {
          renderForgotPasswordForm();
        }
      });

      const registerForm = document.getElementById('registerForm');
      if (registerForm) registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mobileInput = document.getElementById('regMobile').value;
        const phoneNumber = "+91" + mobileInput;

        if (!/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
          showCustomPopup("⚠️ Please enter a valid 10-digit mobile number.");
          return;
        }

        try {
          confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, setupRecaptchaRegister());
          window.confirmationResult = confirmationResult;
          showCustomPopup("✅ OTP sent for registration!");

          tempFullName = document.getElementById("regName").value;
          tempPassword = document.getElementById("regPassword").value;
          tempMobileNumber = phoneNumber;

          localStorage.setItem("tempFullName", tempFullName);
          localStorage.setItem("tempPassword", tempPassword);
          localStorage.setItem("tempMobileNumber", tempMobileNumber);

          renderOtpForm("register", phoneNumber);
        } catch (error) {
          showCustomPopup("❌ Error sending OTP: " + error.message);
        }
      });

      const forgotPasswordForm = document.getElementById('forgotPasswordForm');
      if (forgotPasswordForm) forgotPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mobileInput = document.getElementById('fpMobile').value;
        const phoneNumber = '+91' + mobileInput;

        if (!/^\+91[6-9]\d{9}$/.test(phoneNumber)) {
          showCustomPopup("⚠️ Please enter a valid 10-digit mobile number.");
          return;
        }

        try {
          const response = await fetch("https://real-estate-project-1-lps5.onrender.com/api/users/forgot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contact: phoneNumber,
            })
          });

          const data = await response.json();
          if (!response.ok) {
            showCustomPopup("❌ " + data.msg);
            return;
          }

          showCustomPopup("✅ " + data.message);
          confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, setupRecaptchaForgot());
          window.confirmationResult = confirmationResult;
          localStorage.setItem("tempMobileNumber", phoneNumber);
          renderOtpForm("forgot", phoneNumber);
        } catch (error) {
          showCustomPopup("❌ Error sending OTP: " + error.message);
        }
      });

      const newPasswordForm = document.getElementById('newPasswordForm');
      if (newPasswordForm) newPasswordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPass = document.getElementById('newPassword').value;
        const confirmPass = document.getElementById('confirmPassword').value;
        const mobileNumber = localStorage.getItem("tempMobileNumber");

        if (newPass !== confirmPass) {
          return showCustomPopup("⚠️ Passwords do not match.");
        }

        try {
          const response = await fetch("https://real-estate-project-1-lps5.onrender.com/api/users/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contact: mobileNumber,
              confirmPassword: confirmPass,
              newPassword: newPass
            })
          });

          const data = await response.json();
          if (response.ok) {
            showCustomPopup("✅ " + data.message);
            localStorage.removeItem("tempMobileNumber");
            renderVerificationPage();
          } else {
            showCustomPopup("❌ " + data.msg);
          }
        } catch (err) {
          console.error("API error:", err);
          showCustomPopup("⚠️ Server error. Try again.");
        }
      });
    };

    const setupOtpLogic = (mode, phoneNumber) => {
      const otpInputs = document.querySelectorAll('.otp-input');
      const verifyOtpBtn = document.getElementById('verifyOtpBtn');

      otpInputs[0].focus();

      otpInputs.forEach((input, index, arr) => {
        input.addEventListener('input', () => {
          input.value = input.value.replace(/[^0-9]/g, '').slice(0, 1);
          if (input.value && index < arr.length - 1) {
            arr[index + 1].focus();
          }
          checkOtpFilled();
        });

        input.addEventListener('keydown', (e) => {
          if (e.key === 'Backspace' && !input.value && index > 0) {
            arr[index - 1].focus();
          }
        });
      });

      const checkOtpFilled = () => {
        const allFilled = Array.from(otpInputs).every(input => input.value.length === 1);
        verifyOtpBtn.disabled = !allFilled;
      };

      checkOtpFilled();

      verifyOtpBtn.addEventListener('click', async (event) => {
        event.preventDefault();
        const otp = Array.from(otpInputs).map(input => input.value).join('');

        if (otp.length !== 6) {
          showCustomPopup("⚠️ Please enter a valid 6-digit OTP.");
          return;
        }

        try {
          await window.confirmationResult.confirm(otp);
          showCustomPopup(
            "✅ OTP verified. To start your account, please pay the subscription fee now. You will get 1 month subscription.",
            "Subscription Required",
            async () => {
              const fullName = localStorage.getItem("tempFullName");
              const password = localStorage.getItem("tempPassword");
              const mobileNumber = localStorage.getItem("tempMobileNumber");

              if (!fullName || !password || !mobileNumber) {
                showCustomPopup("⚠️ Registration data not found. Please try again.");
                return;
              }

              try {
                const response = await fetch("https://real-estate-project-1-lps5.onrender.com/api/users/create", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    fullName: fullName,
                    mobileNumber: mobileNumber,
                    password: password
                  })
                });

                const data = await response.json();
                if (data.status === 'success') {
                  // First-time subscription
                  handleSubscription(mobileNumber, "registration");
                } else {
                  showCustomPopup("❌ " + (data.msg || "Registration failed."));
                }
              } catch (error) {
                console.error("API error:", error);
                showCustomPopup("❌ Error registering user: " + error.message);
              }
            },
            true
          );
        } catch (error) {
          console.error("OTP verification failed:", error);
          showCustomPopup("❌ OTP verification failed: " + error.message);
        }
      });
    };

    // ===== Razorpay Subscription Handler =====
    const handleSubscription = async (mobileNumber, mode = "registration", loginPassword = null) => {
      try {
        const response = await fetch("https://real-estate-project-1-lps5.onrender.com/api/payment/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobileNumber: mobileNumber }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to create subscription.");
        }

        const options = {
          key: RAZORPAY_KEY_ID,
          subscription_id: data.subscriptionId,
          handler: async function (response) {
            if (mode === "registration") {
              showCustomPopup(
                "✅ Payment Successful! Your 1 month subscription is now active.",
                "Subscription Confirmed",
                () => renderRegistrationConfirmPage()
              );
            } else if (mode === "renewal") {
              showCustomPopup(
                "✅ Payment Successful! Your subscription has been renewed. Logging you in...",
                "Subscription Renewed",
                async () => {
                  try {
                    const loginRes = await fetch("https://real-estate-project-1-lps5.onrender.com/api/users/login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        mobileNumber: mobileNumber,
                        password: loginPassword
                      })
                    });
                    const loginData = await loginRes.json();
                    if (loginRes.ok) {
                      localStorage.setItem("userToken", loginData.token);
                      localStorage.setItem("userMobileNumber", mobileNumber);
                      localStorage.setItem("user", JSON.stringify(loginData.data));
                      window.location.href = "sellProperties.html";
                    } else {
                      showCustomPopup("⚠️ " + (loginData.message || "Please try to login again manually."));
                    }
                  } catch (err) {
                    console.error("Login after renewal failed:", err);
                    showCustomPopup("⚠️ Payment done but automatic login failed. Please try logging in again.");
                  }
                }
              );
            }
          },
        };

        const rzp = new Razorpay(options);
        rzp.open();
      } catch (error) {
        console.error("Error starting subscription:", error);
        showCustomPopup("❌ Error starting subscription: " + error.message);
      }
    };

    renderLoginForm();
  }

  document.addEventListener('DOMContentLoaded', setupFirebaseAndForms);

  function showCustomPopup(message, title = "Notification", onOk = null, showClose = false) {
    const overlay = document.getElementById('custom-popup-overlay');
    const popupTitle = document.getElementById('popup-title');
    const popupMessage = document.getElementById('popup-message');
    const okBtn = document.getElementById('popup-ok-btn');
    const closeBtn = document.getElementById('popup-close-btn');

    popupTitle.textContent = title;
    popupMessage.textContent = message;

    closeBtn.style.display = showClose ? 'inline-block' : 'none';
    okBtn.textContent = (onOk && showClose) ? "Continue" : "OK";
    closeBtn.textContent = "Discard";

    okBtn.onclick = null;
    closeBtn.onclick = null;

    okBtn.onclick = () => {
      if (onOk) {
        hideCustomPopup();
        onOk();
      } else {
        hideCustomPopup();
      }
    };

    closeBtn.onclick = () => {
      hideCustomPopup();
    };

    overlay.classList.remove('popup-hidden');
    overlay.classList.add('popup-visible');
    document.querySelector('.custom-popup-card').style.transform = 'scale(1)';
  }

  function hideCustomPopup() {
    const overlay = document.getElementById('custom-popup-overlay');
    overlay.classList.remove('popup-visible');
    overlay.classList.add('popup-hidden');
    document.querySelector('.custom-popup-card').style.transform = 'scale(0.9)';
  }