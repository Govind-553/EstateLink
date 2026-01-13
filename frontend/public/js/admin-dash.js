document.addEventListener('DOMContentLoaded', function() {
    // --- Initial State & Data ---

    // --- DOM Element Selectors ---
    const usersTable = document.getElementById('usersTable');
    const usersBody = document.getElementById('usersBody');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const overlay = document.getElementById('overlay');
    
    // Panels
    const profilePanel = document.getElementById('profilePanel');

    // Panel Triggers
    const profileIcon = document.getElementById('profileIcon');
    
    // Panel Close Buttons
    const closeProfileBtn = document.getElementById('closeProfileBtn');
    
    // Filtering
    const mobileSearchInput = document.getElementById('mobileSearch');
    const statusDropdown = document.getElementById('accountStatusFilter');
    const togglePassword = document.getElementById('togglePassword');
    const profilePasswordInput = document.getElementById('profilePassword');
    const logoutBtn = document.getElementById('logoutBtn');
    const userData = JSON.parse(localStorage.getItem("admin"));
    let allusers = [];

    // --- Core Functions ---
    
    // Unified Custom Popup Function
    function showCustomPopup(message, isConfirm = false, callback = null) {
        const popupOverlay = document.getElementById('custom-popup-overlay');
        const popupMessage = document.getElementById('popup-message');
        const popupOkBtn = document.getElementById('popup-ok-btn');
        const popupCloseBtn = document.getElementById('popup-close-btn');

        popupMessage.textContent = message;

        if (isConfirm) {
            popupOkBtn.textContent = "Yes";
            popupOkBtn.classList.remove('btn-primary');
            popupOkBtn.classList.add('btn-success');
            popupCloseBtn.style.display = 'inline-block';
            popupCloseBtn.textContent = "No";
        } else {
            popupOkBtn.textContent = "OK";
            popupOkBtn.classList.add('btn-primary');
            popupOkBtn.classList.remove('btn-success');
            popupCloseBtn.style.display = 'none';
        }

        popupOkBtn.onclick = () => {
            hideCustomPopup();
            if (callback) callback(true);
        };

        popupCloseBtn.onclick = () => {
            hideCustomPopup();
            if (callback) callback(false);
        };
        
        popupOverlay.classList.remove('popup-hidden');
        popupOverlay.classList.add('popup-visible');
        document.querySelector('.custom-popup-card').style.transform = 'scale(1)';
    }

    function hideCustomPopup() {
        const overlay = document.getElementById('custom-popup-overlay');
        overlay.classList.remove('popup-visible');
        overlay.classList.add('popup-hidden');
        document.querySelector('.custom-popup-card').style.transform = 'scale(0.9)';
    }

    if (userData) {
        document.getElementById("profileName").value = userData.fullName;
        document.getElementById("profileMobile").value = userData.mobileNumber;
    }

    // --- Fetch users from API ---
    async function fetchUsers() {
        try {
            const token = localStorage.getItem("token"); // if JWT is required
            const response = await fetch("https://real-estate-project-1-lps5.onrender.com/api/users/all-users", {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}` // send JWT if backend requires
                }
            });

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            allusers = await response.json();
            renderTable(allusers); // Pass users to your table renderer
            updateCounters(allusers); // Pass fresh users to counters
        } catch (error) {
            console.error("Error fetching users:", error);
            showCustomPopup("❌ Error fetching users. Please try again." + error.message);
            usersBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">Error loading users.</td></tr>`;
        }
    }

    function renderTable(data) {
        usersBody.innerHTML = '';
        if (data.length === 0) {
            usersBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px;">No users found.</td></tr>`;
            return;
        }
        data.forEach((user) => {
            const statusText = user.subscriptionStatus ? user.subscriptionStatus : "Unknown";
            const statusClass = `status-${user.subscriptionStatus ? user.subscriptionStatus.toLowerCase() : 'unknown'}`;
            let formattedMobile = String(user.mobileNumber || "N/A");
            if (formattedMobile !== "N/A" && formattedMobile.startsWith('91')) {
                formattedMobile = formattedMobile.replace('91', '+91 ');
            } else if (formattedMobile !== "N/A") {
                formattedMobile = '+91' + formattedMobile;
            }
            const row = document.createElement('tr');
            row.innerHTML = `
                <td data-label="Name">${user.fullName || "N/A"}</td>
                <td data-label="Contact">${formattedMobile}</td>
                <td data-label="Date Joined">${
                    user.registrationDate
                    ? new Date(user.registrationDate).toLocaleDateString()
                    : "N/A"
                }</td>
                <td data-label="User Type">${user.type || "N/A"}</td>
                <td data-label="Status"><span class="${statusClass}">${statusText}</span></td>
            `;
            usersBody.appendChild(row);
        });
        updateCounters(data);
    }
    
    function updateCounters(data) {
        document.getElementById('totalUsers').textContent = data.length;
        document.getElementById('agentUsers').textContent = data.filter(u => u.type === 'Agent').length;
        document.getElementById('ownerUsers').textContent = data.filter(u => u.type === 'Owner').length;
        document.getElementById('activeUsers').textContent = data.filter(u => u.subscriptionStatus === 'Active').length;
        document.getElementById('inactiveUsers').textContent = data.filter(u => u.subscriptionStatus === 'Inactive').length;
    }
    
    function checkOrientation() {
        if (window.innerWidth <= 768 && window.innerHeight > window.innerWidth) {
            usersTable.classList.add('mobile-table');
        } else {
            usersTable.classList.remove('mobile-table');
        }
    }

    // --- Panel Management ---
function openPanel() {
    profilePanel.classList.add('open');
    overlay.classList.add('show');
}

function closeAllPanels() {
    profilePanel.classList.remove('open');
    overlay.classList.remove('show');
}

    // --- Event Handlers ---
    hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
    profileIcon.addEventListener('click', (e) => { e.preventDefault(); openPanel(profilePanel); });
    
    closeProfileBtn.addEventListener('click', closeAllPanels);
    overlay.addEventListener('click', closeAllPanels);
    
    // Toggle Password Visibility
    togglePassword.addEventListener('click', () => {
        const type = profilePasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        profilePasswordInput.setAttribute('type', type);
        togglePassword.classList.toggle('fa-eye');
        togglePassword.classList.toggle('fa-eye-slash');
    });

    // Logout Button
    document.getElementById("logoutBtn").addEventListener("click", () => {
        localStorage.removeItem("token");
        localStorage.removeItem("admin");
        window.location.href = "login.html"; // redirect to login page
    });

    // --- Filtering Logic ---
    let currentFilters = { mobile: '', subscriptionStatus: '' }; // Changed 'status' to 'subscriptionStatus' to match backend

    function filterAndRender() {
        let filteredData = [...allusers];

        if (currentFilters.mobile) {
            filteredData = filteredData.filter(user => String(user.mobileNumber).includes(currentFilters.mobile));
        }
        if (currentFilters.subscriptionStatus) {
            filteredData = filteredData.filter(user => user.subscriptionStatus && user.subscriptionStatus.toLowerCase() === currentFilters.subscriptionStatus.toLowerCase());
        }
        
        renderTable(filteredData);
        updateCounters(filteredData);
    }
    
    mobileSearchInput.addEventListener('input', (e) => {
        currentFilters.mobile = e.target.value.trim();
        filterAndRender();
    });
    
    // Custom Dropdown Logic
    statusDropdown.addEventListener('click', (e) => {
        if (e.target.classList.contains('dropdown-option')) {
            const value = e.target.dataset.value;
            statusDropdown.querySelector('.dropdown-btn span').textContent = e.target.textContent;
            currentFilters.subscriptionStatus = value;
            filterAndRender();
        }
        statusDropdown.classList.toggle('active');
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (!statusDropdown.contains(e.target)) {
        statusDropdown.classList.remove('active');
      }
    });

    fetchUsers(); // Render the initial table
    checkOrientation(); // Initial check for mobile view
    window.addEventListener('resize', checkOrientation); // Re-check on window resize
});