document.addEventListener('DOMContentLoaded', function() {
    const BASE_URL = 'https://real-estate-project-1-lps5.onrender.com/api/sellflats';
    let properties = [];

    // --- Custom Modal Functionality (Unified) ---
    const customModal = document.getElementById('customModal');
    const modalMessage = document.getElementById('modalMessage');
    const okBtn = document.getElementById('okBtn');
    const confirmYesBtn = document.getElementById('confirmYesBtn');
    const confirmNoBtn = document.getElementById('confirmNoBtn');
    
    function showCustomPopup(message, isConfirm = false, callback = null, duration = 3000) {
        modalMessage.textContent = message;

        if (isConfirm) {
            okBtn.style.display = 'none';
            confirmYesBtn.style.display = 'inline-block';
            confirmNoBtn.style.display = 'inline-block';
        } else {
            okBtn.style.display = 'inline-block';
            confirmYesBtn.style.display = 'none';
            confirmNoBtn.style.display = 'none';

            setTimeout(() => {
                customModal.style.display = 'none';
                if (callback) callback(true);
            }, duration);
        }

        customModal.style.display = 'flex';

        okBtn.onclick = () => {
            customModal.style.display = 'none';
            if (callback) callback(true);
        };

        confirmYesBtn.onclick = () => {
            customModal.style.display = 'none';
            if (callback) callback(true);
        };

        confirmNoBtn.onclick = () => {
            customModal.style.display = 'none';
            if (callback) callback(false);
        };
    }

    // --- UI Element References ---
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const propertyPanel = document.getElementById('propertyPanel');
    const addNewBtn = document.getElementById('addNewBtn');
    const closePropertyPanelBtn = document.getElementById('closePropertyPanel');
    const propertyForm = document.getElementById('addPropertyForm');
    const propertyIdInput = document.getElementById('propertyId');
    const overlay = document.getElementById('overlay');
    const propertiesBody = document.getElementById('propertiesBody');
    const tableView = document.getElementById('tableView');
    const cardView = document.getElementById('cardView');
    const dropdowns = document.querySelectorAll('.dropdown');
    const selectedFiltersContainer = document.getElementById('selectedFilters');
    const searchInputs = document.querySelectorAll('.search-input');
    const clearButtons = document.querySelectorAll('.clear-btn');
    const searchBtn = document.getElementById('searchBtn');
    const contactInput = propertyForm.elements['contact'];
    const userNameInput = propertyForm.elements['userName'];

    // NOTE: include ownershipType in filters
    let filters = { location: null, flatType: null, price: null, mobile: null, ownershipType: null }; 

   // API for User Fetching by Contact Number
    contactInput.addEventListener('blur', async () => {
        const contactVal = contactInput.value.trim();
        if (contactVal.length === 10) {
            try {
                const res = await fetch(`https://real-estate-project-1-lps5.onrender.com/api/users/findByContact/${contactVal}`);
                const data = await res.json();

                if (res.ok && data.fullName) {
                    userNameInput.value = data.fullName; 
                    showCustomPopup(`✅ Data is fetched successfully: ${data.message}`);
                } else if (res.status === 403) {
                    userNameInput.value = ""; 
                    showCustomPopup("⚠️ " + data.message); 
                    closePanel();
                } else {
                    userNameInput.value = "";
                    showCustomPopup("⚠️ " + data.message); 
                }
            } catch (err) {
                console.error("Error checking user:", err);
                showCustomPopup("❌ Error fetching user details: " + err.message);
            }
        }
    });

    async function fetchAndRenderProperties() {
        try {
            const accessToken = localStorage.getItem('token');
            if (!accessToken) { showCustomPopup("Please log in as admin."); return; }
            const response = await fetch(`${BASE_URL}/all`, { headers: { 'Content-Type': 'application/json', 'authorization': `Bearer ${accessToken}` } });
            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
            const data = await response.json();
            properties = data.data || [];
            filterAndRender();
        } catch (error) {
            console.error("Error fetching sell properties:", error);
            showCustomPopup("❌ Could not fetch listings. Please log in again." + error.message);
        }
    }

    propertyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        for (const element of propertyForm.elements) {
            if (element.required && !element.value) {
                showCustomPopup(`⚠️ Please fill out the "${element.labels[0].textContent.replace(':', '')}" field.`);
                return;
            }
        }
        const accessToken = localStorage.getItem('token');
        if (!accessToken) { showCustomPopup('❌ Authentication failed. Please log in again.'); return; }
        const formData = {
            location: propertyForm.elements['location'].value,
            propertyType: propertyForm.elements['propertyType'].value,
            price: propertyForm.elements['price'].value,
            name: propertyForm.elements['userName'].value,
            contact: propertyForm.elements['contact'].value,
            date: propertyForm.elements['date'].value,
            ownershipType: propertyForm.elements['ownershipType'].value
        };
        const propertyId = propertyIdInput.value;
        const isCreating = propertyId === '';
        const url = isCreating ? `${BASE_URL}/create` : `${BASE_URL}/update/${propertyId}`;
        const method = isCreating ? 'POST' : 'PUT';
        try {
            const response = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'authorization': `Bearer ${accessToken}` 
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Failed to save data.' }));
                throw new Error(errorData.message);
            }
        
            showCustomPopup(isCreating ? '✅ New property for sale added!' : '✅ Property for sale updated!');
            await fetchAndRenderProperties();
            closePanel();
        
        }  catch (error) {
            console.error("Error submitting form:", error);
            showCustomPopup(`❌ An error occurred: ${error.message}`);
        }
    });

    document.querySelector('.listings-section').addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.edit-btn');
        if (editBtn) {
            const property = properties.find(p => p.id === editBtn.dataset.id);
            if (property) {
                propertyIdInput.value = property.id;
                propertyForm.elements['location'].value = property.location;
                propertyForm.elements['propertyType'].value = property.propertyType;
                propertyForm.elements['price'].value = property.price.replace(/[₹,]/g, '');
                propertyForm.elements['userName'].value = property.userName;
                propertyForm.elements['contact'].value = property.contact;
                propertyForm.elements['date'].value = new Date(property.date).toISOString().substring(0, 10);
                propertyForm.elements['ownershipType'].value = property.ownershipType;
                document.getElementById('propertyPanelTitle').textContent = 'Edit Sale Property';
                document.getElementById('submitPropertyBtn').textContent = 'Save Changes';
                openPanel();
            }
        }
        const deleteBtn = e.target.closest('.delete-btn');
        if (deleteBtn) {
            showCustomPopup('⚠️ Are you sure you want to delete this property for sale?', true, async (confirmed) => {
                if (confirmed) {
                    try {
                        const accessToken = localStorage.getItem('token');
                        if (!accessToken) { showCustomPopup('Authentication error.'); return; }
                        const response = await fetch(`${BASE_URL}/delete/${deleteBtn.dataset.id}`, { method: 'DELETE', headers: { 'authorization': `Bearer ${accessToken}` } });
                        if (!response.ok) throw new Error('Failed to delete property.');
                        showCustomPopup('✅ Property for sale deleted successfully!');
                        await fetchAndRenderProperties();
                    } catch (error) {
                        console.error("Error deleting property:", error);
                        showCustomPopup("❌ Failed to delete property for sale.");
                    }
                }
            });
        }
    });

    function getFilteredData() {
        return properties.filter(p => {
            if (filters.location && filters.location.value && p.location !== filters.location.value) return false;
            if (filters.flatType && filters.flatType.value && p.propertyType !== filters.flatType.value) return false;
            if (filters.ownershipType && filters.ownershipType.value) {
                const ownershipValue = p.ownershipType || 'Agent';
                if (ownershipValue !== filters.ownershipType.value) return false;
            }
            if (filters.price && filters.price.value) {
                const propertyPrice = parseInt(String(p.price || '').replace(/[^0-9]/g, ''), 10);
                const filterBudget = parseInt(filters.price.value.replace(/[^0-9]/g, ''), 10);
                if (!isNaN(propertyPrice) && !isNaN(filterBudget) && propertyPrice > filterBudget) return false;
            }
            if (filters.mobile && filters.mobile.value && !String(p.contact).includes(filters.mobile.value)) return false;
            return true;
        });
    }
    
    // rotation logic uses width + orientation (portrait => cards on mobile) ---
    function filterAndRender() {
        const filteredData = getFilteredData();

        // Use both width and orientation:
        const isMobile = window.innerWidth < 769;
        const isPortrait = window.matchMedia("(orientation: portrait)").matches;

        // Show cards only on mobile + portrait. Table otherwise (desktop or landscape).
        const showCards = isMobile && isPortrait;

        tableView.style.display = showCards ? 'none' : 'block';
        cardView.style.display = showCards ? 'flex' : 'none';

        if (showCards) renderCards(filteredData); else renderTable(filteredData);
        updateCounters(filteredData);
    }
    // --- end updated rotation logic ---

    function renderTable(data) {
        propertiesBody.innerHTML = '';
        data.forEach(prop => {
            const row = propertiesBody.insertRow();
            row.innerHTML = `<td>${prop.location || ''}</td>
            <td>${prop.propertyType || ''}</td>
            <td>${prop.price || ''}</td><td>${prop.userName || ''}</td>
            <td>${"+91 " + (prop.contact || '')}</td>
            <td>${new Date(prop.date).toLocaleDateString()}</td>
            <td>${prop.ownershipType || ''}</td>
            <td class="actions-cell"><button class="action-btn edit-btn" data-id="${prop.id}"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" data-id="${prop.id}"><i class="fas fa-trash-alt"></i></button></td>`;
        });
    }

    function renderCards(data) {
        cardView.innerHTML = '';
        data.forEach(prop => {
            const card = document.createElement('div');
            card.className = 'card-item';
            card.innerHTML = `<div class="card-row"><span class="card-label">Location:</span> <span class="card-value">${prop.location}</span></div><div class="card-row"><span class="card-label">Type:</span> <span class="card-value">${prop.propertyType}</span></div><div class="card-row"><span class="card-label">Price:</span> <span class="card-value">${prop.price}</span></div><div class="card-row"><span class="card-label">Name:</span> <span class="card-value">${prop.userName}</span></div><div class="card-row"><span class="card-label">Contact:</span> <span class="card-value">${prop.contact}</span></div><div class="card-row"><span class="card-label">Date:</span> <span class="card-value">${new Date(prop.date).toLocaleDateString()}</span></div><div class="card-row"><span class="card-label">Ownership:</span> <span class="card-value">${prop.ownershipType}</span></div><div class="card-actions actions-cell"><button class="action-btn edit-btn" data-id="${prop.id}"><i class="fas fa-edit"></i></button><button class="action-btn delete-btn" data-id="${prop.id}"><i class="fas fa-trash-alt"></i></button></div>`;
            cardView.appendChild(card);
        });
    }

    function updateCounters(data) {
        document.getElementById('totalProperties').textContent = data.length;
        document.getElementById('ownerProperties').textContent = data.filter(p => p.ownershipType === 'Owner').length;
        document.getElementById('agentProperties').textContent = data.filter(p => p.ownershipType === 'Agent').length;
    }

    function openPanel() { propertyPanel.style.width = '320px'; overlay.style.display = 'block'; }
    function closePanel() { propertyPanel.style.width = '0'; overlay.style.display = 'none'; }
    addNewBtn.addEventListener('click', () => { propertyForm.reset(); propertyIdInput.value = ''; document.getElementById('propertyPanelTitle').textContent = 'Add New Sale Property'; document.getElementById('submitPropertyBtn').textContent = 'Add Property'; openPanel(); });
    closePropertyPanelBtn.addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);
    hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
    window.addEventListener('resize', filterAndRender);
    window.matchMedia("(orientation: portrait)").addEventListener('change', filterAndRender);

    // Initialize dropdown UI (uses data-filter-key to map dropdown -> logical filter key)
    dropdowns.forEach(dropdown => {
        const btn = dropdown.querySelector('.dropdown-btn');
        const options = dropdown.querySelectorAll('.dropdown-option');
        const logicalKey = dropdown.dataset.filterKey; // e.g. 'location', 'flatType', 'ownershipType'
        btn.addEventListener('click', (e) => { 
            e.stopPropagation(); 
            dropdowns.forEach(d => { if(d !== dropdown) d.classList.remove('active'); }); 
            dropdown.classList.toggle('active'); 
        });
        options.forEach(option => {
            option.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                btn.querySelector('span').textContent = option.textContent; 
                options.forEach(opt => opt.classList.remove('selected')); 
                option.classList.add('selected'); 
                if (logicalKey) {
                    filters[logicalKey] = { value: option.dataset.value, text: option.textContent }; 
                } else {
                    // fallback: use dropdown.id as key
                    filters[dropdown.id] = { value: option.dataset.value, text: option.textContent };
                }
                dropdown.classList.remove('active'); 
                updateSelectedFilters(); 
                filterAndRender();
            });
        });
    });

    document.addEventListener('click', () => dropdowns.forEach(d => d.classList.remove('active')));
    
    searchInputs.forEach(input => {
        input.addEventListener('input', () => { 
            filters[input.id] = { value: input.value, text: input.value }; 
            updateSelectedFilters(); 
            filterAndRender();
        });
    });
    
    clearButtons.forEach(button => {
        button.addEventListener('click', () => { const targetId = button.dataset.target; document.getElementById(targetId).value = ''; filters[targetId] = null; updateSelectedFilters(); filterAndRender(); });
    });
    
    searchBtn.addEventListener('click', filterAndRender);
    
    function updateSelectedFilters() {
        selectedFiltersContainer.innerHTML = '';

        // default labels for resetting dropdowns / inputs
        const defaultLabels = {
            location: 'Select Location',
            flatType: 'Select Property Type',
            ownershipType: 'Select Ownership Type',
            price: 'Enter Budget',
            mobile: 'Enter Mobile No.'
        };

        Object.keys(filters).forEach(key => {
            if(filters[key] && filters[key].value) {
                const tag = document.createElement('div');
                tag.className = 'filter-tag';
                tag.innerHTML = `<span>${filters[key].text}</span><div class="remove" data-filter="${key}">×</div>`;
                selectedFiltersContainer.appendChild(tag);
            }
        });

        selectedFiltersContainer.querySelectorAll('.remove').forEach(remove => {
            remove.addEventListener('click', (e) => {
                const filterKey = e.target.dataset.filter;
                filters[filterKey] = null;

                // Find the search dropdown that maps to this logical key (data-filter-key)
                const dropdownDiv = document.querySelector(`.dropdown[data-filter-key="${filterKey}"]`);
                if (dropdownDiv) {
                    const labelSpan = dropdownDiv.querySelector('.dropdown-btn span');
                    if (labelSpan) labelSpan.textContent = defaultLabels[filterKey] || 'Select';
                    dropdownDiv.querySelectorAll('.dropdown-option').forEach(opt => opt.classList.remove('selected'));
                }

                // If there's also an input or element with the same id (form fields), reset its value safely
                const inputElem = document.getElementById(filterKey);
                if (inputElem && (inputElem.tagName === 'INPUT' || inputElem.tagName === 'TEXTAREA' || inputElem.tagName === 'SELECT')) {
                    inputElem.value = '';
                }

                updateSelectedFilters();
                filterAndRender();
            });
        });
    }

    fetchAndRenderProperties();
});