      function showCustomPopup(message, title = "Notification", onOk = null, showClose = false) {
          const overlay = document.getElementById('custom-popup-overlay');
          const popupTitle = document.getElementById('popup-title');
          const popupMessage = document.getElementById('popup-message');
          const okBtn = document.getElementById('popup-ok-btn');
          const closeBtn = document.getElementById('popup-close-btn');
          const successIcon = document.getElementById('success-icon');
          const errorIcon = document.getElementById('error-icon');

          popupTitle.textContent = title;
          popupMessage.textContent = message;

          successIcon.style.display = title === "Success" ? "block" : "none";
          errorIcon.style.display = title === "Error" ? "block" : "none";

          closeBtn.style.display = showClose ? 'inline-block' : 'none';

          okBtn.onclick = () => {
              if (onOk) onOk();
              hideCustomPopup();
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

      document.addEventListener('DOMContentLoaded', () => {
          const passwordInput = document.getElementById('password');
          const togglePassword = document.querySelector('.toggle-password');

          // Corrected logic to ensure only one icon class is present
          if (passwordInput.type === 'password') {
              togglePassword.classList.add('fa-eye-slash');
              togglePassword.classList.remove('fa-eye');
          } else {
              togglePassword.classList.add('fa-eye');
              togglePassword.classList.remove('fa-eye-slash');
          }

          togglePassword.addEventListener('click', () => {
              const type = passwordInput.type === 'password' ? 'text' : 'password';
              passwordInput.type = type;
              togglePassword.classList.toggle('fa-eye');
              togglePassword.classList.toggle('fa-eye-slash');
          });

          const adminLoginForm = document.getElementById('loginForm');
          adminLoginForm.addEventListener('submit', async (e) => {
              e.preventDefault();

              const mobile = document.getElementById('mobileNumber').value;
              const pass = document.getElementById('password').value;

              try {
                  const response = await fetch("https://real-estate-project-1-lps5.onrender.com/api/users/admin-login", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ mobileNumber: "+91" + mobile, password: pass })
                  });

                  const data = await response.json();

                  if (response.ok && data.token) {
                      localStorage.setItem("token", data.token);
                      localStorage.setItem("admin", JSON.stringify(data.data));
                      showCustomPopup("✅ Admin Logged-in successfully!", "Success", () => {
                          window.location.href = "admin-dashboard.html";
                      });
                  } else {
                      showCustomPopup(data.message ||"⚠️ Invalid login credentials", "Error");
                  }
              } catch (error) {
                  console.error("Error:", error.message);
                  showCustomPopup("❌ Something went wrong. Please try again.", "Error");
              }
          });
      });
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
                renderLoginForm();
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
