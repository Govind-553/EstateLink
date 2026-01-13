document.addEventListener('DOMContentLoaded', function() {
    // --- LOGIN CHECK ---
    const token = localStorage.getItem("userToken");
    if (!token) {
        showCustomPopup("⚠️ You must be logged in to view properties. Redirecting to login page...");
        window.location.href = "sellLogin.html";
        return;
    }

    // --- VARIABLE DECLARATIONS ---
    let filters = {};
    let propertiesData = [];
    let filteredData = [];

    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const dropdowns = document.querySelectorAll('.dropdown');
    const searchBtn = document.getElementById('searchBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const selectedFiltersContainer = document.getElementById('selectedFilters');
    const propertiesBody = document.getElementById('propertiesBody');
    const tableContainer = document.getElementById('tableContainer');
    const tableMessage = document.getElementById('tableMessage');
    const priceInput = document.getElementById('priceInput');
    const BaseUrl = 'https://real-estate-project-1-lps5.onrender.com/api/sellflats';

    // --- SIDE PANEL LOGIC ---
    const overlay = document.getElementById('overlay');
    const logoutBtn = document.getElementById('logoutBtn');
    const profilePanel = document.getElementById('profilePanel');
    const profileIcon = document.getElementById('profileIcon');
    const closeProfileBtn = document.getElementById('closeProfileBtn');
    const profileName = document.getElementById('profileName');
    const profileMobile = document.getElementById('profileMobile');
    const userData = JSON.parse(localStorage.getItem("user"));

    if (userData) {
        profileName.value = userData.fullName || '';
        profileMobile.value = userData.mobileNumber || '';
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
    if (profileIcon && profilePanel && closeProfileBtn && logoutBtn) {
        profileIcon.addEventListener('click', (e) => {
            e.preventDefault();
            openPanel(profilePanel);
        });
        closeProfileBtn.addEventListener('click', closeAllPanels);
        overlay.addEventListener('click', closeAllPanels);
        logoutBtn.addEventListener("click", () => {
            localStorage.removeItem("userToken");
            localStorage.removeItem("user");
            window.location.href = "sellLogin.html";
        });
    }

    // --- CARD VIEW SETUP (insert after table) ---
    let cardView = document.getElementById('cardView');
    if (!cardView) {
        cardView = document.createElement('div');
        cardView.id = 'cardView';
        cardView.className = 'card-view';
        cardView.style.display = 'none';
        // insert after tableContainer if available
        if (tableContainer && tableContainer.parentNode) {
            tableContainer.parentNode.insertBefore(cardView, tableContainer.nextSibling);
        } else {
            document.body.appendChild(cardView);
        }
    }

    // --- DATA FETCHING ---
    async function fetchProperties() {
        try {
            const response = await fetch(`${BaseUrl}/all-public`, {
                headers: { 'Content-Type': 'application/json', 'authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch properties');
            const result = await response.json();
            // preserve your existing data extraction:
            propertiesData = result.data || [];
            console.log("Fetched properties:", propertiesData);
        } catch (error) {
            console.error('Error fetching properties:', error);
            showTableMessage('❌ Error loading properties. Please try again later.');
        }
    }

    // --- CORE FILTERING LOGIC (unchanged) ---
    function applyFilters() {
        const filterLocation = filters.location ? filters.location.value.toLowerCase() : '';
        const filterType = filters.propertyType ? filters.propertyType.value.toLowerCase() : '';
        const priceValue = filters.priceInput ? filters.priceInput.value : '';
        const filterOwnershipType = filters.ownershipType ? filters.ownershipType.value.toLowerCase() : '';

        filteredData = propertiesData.filter(property => {
            const rowLocation = (property.location || '').toLowerCase();
            const normalizedRowType = (property.propertyType || '').toLowerCase().replace(/\s+/g, '');

            const matchLocation = !filterLocation || rowLocation.includes(filterLocation);
            const matchType = !filterType || normalizedRowType === filterType;
            const matchOwnershipType = !filterOwnershipType || (property.ownershipType || '').toLowerCase() === filterOwnershipType;

            let matchPrice = true;
            if (priceValue) {
                const budget = parseInt(String(priceValue).replace(/[^0-9]/g, ''), 10);
                const propertyPrice = parseInt(String(property.price || '').replace(/[^0-9]/g, ''), 10);

                if (!isNaN(budget) && !isNaN(propertyPrice)) {
                    matchPrice = propertyPrice <= budget;
                } else {
                    matchPrice = false;
                }
            }
            
            return matchLocation && matchType && matchPrice && matchOwnershipType;
        });
    }

    // --- RENDER HELPERS (TABLE + CARDS) ---
    function renderProperties() {
        if (!propertiesBody) return;
        propertiesBody.innerHTML = "";
        filteredData.forEach(property => {
            const row = document.createElement("tr");

            let displayPrice = '';
            if (property.price) {
                const numericPrice = String(property.price).replace(/\D/g, '');
                if (numericPrice) {
                    displayPrice = `₹${Number(numericPrice).toLocaleString('en-IN')}`;
                }
            }

            row.innerHTML = `
                <td data-label="Location">${property.location || ''}</td>
                <td data-label="Property Type">${property.propertyType || ''}</td>
                <td data-label="Price">${displayPrice}</td>
                <td data-label="Name">${property.userName || ''}</td>
                <td data-label="Contact">${property.contact || ''}</td>
                <td data-label="Date">${property.date ? new Date(property.date).toLocaleDateString() : ''}</td>
                <td data-label="Ownership">${property.ownershipType || ''}</td>
            `;
            propertiesBody.appendChild(row);
        });
    }

    function renderCards() {
        if (!cardView) return;
        cardView.innerHTML = '';
        filteredData.forEach(property => {
            const card = document.createElement('div');
            card.className = 'card-item';
            let displayPrice = '';
            if (property.price) {
                const numericPrice = String(property.price).replace(/\D/g, '');
                if (numericPrice) displayPrice = `₹${Number(numericPrice).toLocaleString('en-IN')}`;
            }
            card.innerHTML = `
                <div class="card-row"><span class="card-label">Location:</span> <span class="card-value">${property.location || ''}</span></div>
                <div class="card-row"><span class="card-label">Type:</span> <span class="card-value">${property.propertyType || ''}</span></div>
                <div class="card-row"><span class="card-label">Price:</span> <span class="card-value">${displayPrice}</span></div>
                <div class="card-row"><span class="card-label">Name:</span> <span class="card-value">${property.userName || ''}</span></div>
                <div class="card-row"><span class="card-label">Contact:</span> <span class="card-value">${property.contact || ''}</span></div>
                <div class="card-row"><span class="card-label">Date:</span> <span class="card-value">${property.date ? new Date(property.date).toLocaleDateString() : ''}</span></div>
                <div class="card-row"><span class="card-label">Ownership:</span> <span class="card-value">${property.ownershipType || ''}</span></div>
            `;
            cardView.appendChild(card);
        });
    }

    function showTable() {
        if (tableContainer) tableContainer.classList.remove('hidden');
        if (tableMessage) tableMessage.classList.add('hidden');
        if (cardView) cardView.style.display = 'none';
    }

    function showCardView() {
        if (tableContainer) tableContainer.classList.add('hidden');
        if (tableMessage) tableMessage.classList.add('hidden');
        if (cardView) cardView.style.display = 'flex';
    }

    function hideTable() {
        if (tableContainer) tableContainer.classList.add('hidden');
        if (tableMessage) tableMessage.classList.remove('hidden');
        if (cardView) cardView.style.display = 'none';
    }

    function showTableMessage(message) {
        if (tableMessage) tableMessage.textContent = message;
        hideTable();
    }

    function updateSelectedFilters() {
        if (!selectedFiltersContainer) return;
        selectedFiltersContainer.innerHTML = '';
        const hasFilters = Object.values(filters).some(f => f && f.value);

        if (hasFilters) {
            Object.values(filters).forEach(filter => {
                if (filter && filter.value) {
                    const tag = document.createElement('div');
                    tag.className = 'filter-tag';
                    tag.innerHTML = `<span>${filter.text}</span>`;
                    selectedFiltersContainer.appendChild(tag);
                }
            });
            if (clearAllBtn) clearAllBtn.style.display = 'block';
        } else {
            if (clearAllBtn) clearAllBtn.style.display = 'none';
        }
    }

    // show cards on mobile portrait, table otherwise
    function shouldShowCards() {
        const isMobile = window.innerWidth < 769;
        const isPortrait = window.matchMedia("(orientation: portrait)").matches;
        return isMobile && isPortrait;
    }

    // --- SEARCH / RENDER FLOW ---
    function performSearch() {
        if (Object.keys(filters).length === 0 || Object.values(filters).every(f => !f.value)) {
            showTableMessage("⚠️ Please select at least one filter to start a search.");
            return;
        }

        applyFilters();

        if (filteredData.length > 0) {
            if (shouldShowCards()) {
                renderCards();
                showCardView();
            } else {
                renderProperties();
                showTable();
            }
        } else {
            hideTable();
            showTableMessage("❌ No properties found matching your criteria.");
        }
    }

    // --- EVENT LISTENERS ---
    hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
    searchBtn.addEventListener('click', performSearch);

    dropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('.dropdown-btn');
        const options = dropdown.querySelectorAll('.dropdown-option');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = dropdown.classList.contains('active');
            dropdowns.forEach(d => d.classList.remove('active'));
            if (!isActive) dropdown.classList.add('active');
        });

        options.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                btn.querySelector('span').textContent = option.textContent;
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                filters[dropdown.id] = { value: option.dataset.value, text: option.textContent };
                dropdown.classList.remove('active');
                updateSelectedFilters();
            });
        });
    });

    priceInput.addEventListener('input', () => {
        const priceValue = priceInput.value.trim();
        if (priceValue) {
            filters.priceInput = { value: priceValue, text: `Budget: ₹${priceValue}` };
        } else {
            delete filters.priceInput;
        }
        updateSelectedFilters();
    });

    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            filters = {};
            priceInput.value = '';
            dropdowns.forEach(dropdown => {
                dropdown.querySelector('.dropdown-btn span').textContent = dropdown.id === 'location' ? 'Select Location' : 'Select Property Type';
                dropdown.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
            });
            updateSelectedFilters();
            showTableMessage('⚠️ Please use the search filters above to find properties.');
        });
    }

    document.addEventListener('click', () => dropdowns.forEach(d => d.classList.remove('active')));

    // re-render on resize and orientation change so view (cards/table) is correct
    function reRenderForViewport() {
        if (!filteredData || filteredData.length === 0) return;
        if (shouldShowCards()) {
            renderCards();
            showCardView();
        } else {
            renderProperties();
            showTable();
        }
    }

    window.addEventListener('resize', reRenderForViewport);
    const mq = window.matchMedia("(orientation: portrait)");
    if (mq && typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', reRenderForViewport);
    } else {
        window.addEventListener('orientationchange', reRenderForViewport);
    }

    // --- INITIALIZATION ---
    showTableMessage('⚠️ Please use the search filters above to find properties.');
    fetchProperties();
}); // DOMContentLoaded

// --- POPUP FUNCTIONS (unchanged) ---
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
        renderLoginForm && renderLoginForm();
    };

    overlay.classList.remove('popup-hidden');
    overlay.classList.add('popup-visible');
    const card = document.querySelector('.custom-popup-card');
    if (card) card.style.transform = 'scale(1)';
}

function hideCustomPopup() {
    const overlay = document.getElementById('custom-popup-overlay');
    if (overlay) {
        overlay.classList.remove('popup-visible');
        overlay.classList.add('popup-hidden');
    }
    const card = document.querySelector('.custom-popup-card');
    if (card) card.style.transform = 'scale(0.9)';
}