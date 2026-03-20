// Material Stock Management - Main JavaScript

// Global Variables
let materials = [];
let isEditing = false;
let currentEditId = null;
let suggestions = { item_names: [], party_names: [], storage_places: [] };
let sortColumn = 'date';
let sortDirection = 'desc'; // 'asc' or 'desc'

// DOM Elements
const materialsTableBody = document.getElementById('materials-tbody');
const searchInput = document.getElementById('search-input');
const materialForm = document.getElementById('material-form');
const materialModal = document.getElementById('materialModal');
const deleteModal = document.getElementById('deleteModal');
const loadingOverlay = document.getElementById('loading-overlay');
const emptyState = document.getElementById('empty-state');

// Bootstrap Modal Instances
let materialModalInstance;
let deleteModalInstance;
let toastInstance;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Bootstrap components
    materialModalInstance = new bootstrap.Modal(materialModal);
    deleteModalInstance = new bootstrap.Modal(deleteModal);
    toastInstance = new bootstrap.Toast(document.getElementById('notification-toast'));
    
    // Set current date
    setCurrentDate();
    
    // Load initial data
    loadMaterials();
    loadStatistics();
    loadSuggestions();
    
    // Event Listeners
    materialForm.addEventListener('submit', handleFormSubmit);
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    
    // Set default date in form
    document.getElementById('material-date').valueAsDate = new Date();
    
    // Add click listeners for sortable column headers
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', () => handleSort(header.dataset.sort));
        header.style.cursor = 'pointer';
    });
});

// Set current date in navbar
function setCurrentDate() {
    const dateElement = document.getElementById('current-date');
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    dateElement.textContent = new Date().toLocaleDateString('en-US', options);
}

// Handle sorting when column header is clicked
function handleSort(column) {
    if (sortColumn === column) {
        // Toggle direction if same column
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        // New column, default to ascending
        sortColumn = column;
        sortDirection = 'asc';
    }
    
    // Update sort icons
    updateSortIcons();
    
    // Re-render with sorted data
    renderMaterialsTable(sortMaterials(materials));
}

// Sort materials array
function sortMaterials(data) {
    return [...data].sort((a, b) => {
        let valA = a[sortColumn];
        let valB = b[sortColumn];
        
        // Handle different data types
        if (sortColumn === 'date') {
            valA = new Date(valA);
            valB = new Date(valB);
        } else if (['inward', 'outward', 'balance'].includes(sortColumn)) {
            valA = Number(valA);
            valB = Number(valB);
        } else {
            // String comparison (case-insensitive)
            valA = (valA || '').toString().toLowerCase();
            valB = (valB || '').toString().toLowerCase();
        }
        
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });
}

// Update sort icons in table headers
function updateSortIcons() {
    document.querySelectorAll('.sortable').forEach(header => {
        const icon = header.querySelector('.sort-icon');
        const column = header.dataset.sort;
        
        if (column === sortColumn) {
            icon.className = sortDirection === 'asc' 
                ? 'bi bi-sort-up sort-icon active' 
                : 'bi bi-sort-down sort-icon active';
        } else {
            icon.className = 'bi bi-arrow-down-up sort-icon';
        }
    });
}

// Load autocomplete suggestions
async function loadSuggestions() {
    try {
        const response = await fetch('/api/suggestions');
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        
        suggestions = await response.json();
        populateDataLists();
    } catch (error) {
        console.error('Error loading suggestions:', error);
    }
}

// Populate datalist elements with suggestions
function populateDataLists() {
    // Item Names
    const itemNameList = document.getElementById('item-name-list');
    itemNameList.innerHTML = suggestions.item_names
        .map(name => `<option value="${escapeHtml(name)}">`)
        .join('');
    
    // Party Names
    const partyNameList = document.getElementById('party-name-list');
    partyNameList.innerHTML = suggestions.party_names
        .map(name => `<option value="${escapeHtml(name)}">`)
        .join('');
    
    // Storage Places
    const storagePlaceList = document.getElementById('storage-place-list');
    storagePlaceList.innerHTML = suggestions.storage_places
        .map(place => `<option value="${escapeHtml(place)}">`)
        .join('');
}

// Show loading overlay
function showLoading() {
    loadingOverlay.classList.remove('d-none');
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.classList.add('d-none');
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('notification-toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    const toastHeader = document.getElementById('toast-header');
    
    // Remove previous classes
    toast.classList.remove('toast-success', 'toast-error', 'toast-info');
    
    // Set type-specific styling
    switch(type) {
        case 'success':
            toast.classList.add('toast-success');
            toastTitle.textContent = 'Success';
            break;
        case 'error':
            toast.classList.add('toast-error');
            toastTitle.textContent = 'Error';
            break;
        case 'info':
            toast.classList.add('toast-info');
            toastTitle.textContent = 'Info';
            break;
    }
    
    toastMessage.textContent = message;
    toastInstance.show();
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load all materials
async function loadMaterials() {
    showLoading();
    try {
        const response = await fetch('/api/materials');
        if (!response.ok) throw new Error('Failed to fetch materials');
        
        materials = await response.json();
        renderMaterialsTable(sortMaterials(materials));
        updateSortIcons();
    } catch (error) {
        console.error('Error loading materials:', error);
        showToast('Failed to load materials', 'error');
    } finally {
        hideLoading();
    }
}

// Load statistics
async function loadStatistics() {
    try {
        const response = await fetch('/api/statistics');
        if (!response.ok) throw new Error('Failed to fetch statistics');
        
        const stats = await response.json();
        
        document.getElementById('stat-total-items').textContent = stats.total_items;
        document.getElementById('stat-total-inward').textContent = stats.total_inward;
        document.getElementById('stat-total-outward').textContent = stats.total_outward;
        document.getElementById('stat-total-balance').textContent = stats.total_balance;
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Render materials table
function renderMaterialsTable(data) {
    const tbody = materialsTableBody;
    
    if (data.length === 0) {
        tbody.innerHTML = '';
        emptyState.classList.remove('d-none');
        return;
    }
    
    emptyState.classList.add('d-none');
    
    tbody.innerHTML = data.map((material, index) => {
        const balanceClass = material.balance > 0 ? 'balance-positive' : 
                            material.balance < 0 ? 'balance-negative' : 'balance-zero';
        
        return `
            <tr data-id="${material.id}" class="fade-in-up">
                <td class="ps-4">${index + 1}</td>
                <td class="date-cell">${formatDate(material.date)}</td>
                <td class="item-name">${escapeHtml(material.item_name)}</td>
                <td class="party-name">${escapeHtml(material.party_name)}</td>
                <td class="text-center inward-cell">
                    <i class="bi bi-arrow-down-circle-fill me-1"></i>${material.inward}
                </td>
                <td class="text-center outward-cell">
                    <i class="bi bi-arrow-up-circle-fill me-1"></i>${material.outward}
                </td>
                <td class="text-center">
                    <span class="${balanceClass}">${material.balance}</span>
                </td>
                <td>
                    <span class="storage-badge">
                        <i class="bi bi-geo-alt me-1"></i>${escapeHtml(material.storage_place)}
                    </span>
                </td>
                <td class="text-center pe-4">
                    <button class="btn btn-action btn-view me-1" onclick="openHistoryModal(${material.id}, '${escapeHtml(material.item_name)}')" 
                            title="View History">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-action btn-edit me-1" onclick="openEditModal(${material.id})" 
                            title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-action btn-delete" onclick="openDeleteModal(${material.id}, '${escapeHtml(material.item_name)}')" 
                            title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Open Add Modal
function openAddModal() {
    isEditing = false;
    currentEditId = null;
    
    // Reset form
    materialForm.reset();
    document.getElementById('material-id').value = '';
    document.getElementById('material-date').valueAsDate = new Date();
    document.getElementById('material-inward').value = 0;
    document.getElementById('material-outward').value = 0;
    document.getElementById('material-balance').value = 0;
    
    // Show add mode fields, hide edit mode fields
    document.getElementById('add-mode-fields').classList.remove('d-none');
    document.getElementById('edit-mode-fields').classList.add('d-none');
    
    // Hide history section
    document.getElementById('history-section').classList.add('d-none');
    
    // Update modal title
    document.getElementById('materialModalLabel').innerHTML = 
        '<i class="bi bi-plus-circle me-2"></i> Add New Material';
    document.getElementById('save-btn').innerHTML = 
        '<i class="bi bi-check-circle me-1"></i> Save Material';
}

// Open Edit Modal
async function openEditModal(id) {
    isEditing = true;
    currentEditId = id;
    
    showLoading();
    try {
        const response = await fetch(`/api/materials/${id}`);
        if (!response.ok) throw new Error('Failed to fetch material');
        
        const material = await response.json();
        
        // Store current totals for balance calculation
        window.currentMaterial = material;
        
        // Populate form
        document.getElementById('material-id').value = material.id;
        document.getElementById('material-date').value = material.date;
        document.getElementById('material-item-name').value = material.item_name;
        document.getElementById('material-party-name').value = material.party_name;
        document.getElementById('material-storage-place').value = material.storage_place;
        
        // Hide add mode fields, show edit mode fields
        document.getElementById('add-mode-fields').classList.add('d-none');
        document.getElementById('edit-mode-fields').classList.remove('d-none');
        
        // Show current totals
        document.getElementById('current-total-inward').textContent = material.inward;
        document.getElementById('current-total-outward').textContent = material.outward;
        document.getElementById('current-balance').textContent = material.balance;
        
        // Reset action fields
        document.getElementById('action-inward').value = 0;
        document.getElementById('action-outward').value = 0;
        document.getElementById('new-balance').value = material.balance;
        
        // Update modal title
        document.getElementById('materialModalLabel').innerHTML = 
            '<i class="bi bi-pencil-square me-2"></i> Update Material: ' + escapeHtml(material.item_name);
        document.getElementById('save-btn').innerHTML = 
            '<i class="bi bi-check-circle me-1"></i> Add Action';
        
        // Show history section and load history
        document.getElementById('history-section').classList.remove('d-none');
        await loadMaterialHistory(id);
        
        materialModalInstance.show();
    } catch (error) {
        console.error('Error fetching material:', error);
        showToast('Failed to load material details', 'error');
    } finally {
        hideLoading();
    }
}

// Calculate new balance when adding action
function calculateNewBalance() {
    if (!window.currentMaterial) return;
    
    const actionInward = parseInt(document.getElementById('action-inward').value) || 0;
    const actionOutward = parseInt(document.getElementById('action-outward').value) || 0;
    const currentBalance = window.currentMaterial.balance;
    const newBalance = currentBalance + actionInward - actionOutward;
    
    document.getElementById('new-balance').value = newBalance;
}

// Load material history
async function loadMaterialHistory(id) {
    try {
        const response = await fetch(`/api/materials/${id}/history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const history = await response.json();
        const tbody = document.getElementById('history-tbody');
        
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No actions recorded yet</td></tr>';
        } else {
            tbody.innerHTML = history.map(h => `
                <tr>
                    <td><span class="badge bg-secondary">${h.action_number}</span></td>
                    <td>${formatDate(h.date)}</td>
                    <td>${escapeHtml(h.item_name) || '-'}</td>
                    <td>${escapeHtml(h.party_name) || '-'}</td>
                    <td class="text-center text-success">${h.action_inward > 0 ? '+' + h.action_inward : '-'}</td>
                    <td class="text-center text-danger">${h.action_outward > 0 ? '-' + h.action_outward : '-'}</td>
                    <td class="text-center fw-bold">${h.running_balance}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('history-tbody').innerHTML = 
            '<tr><td colspan="7" class="text-center text-danger">Error loading history</td></tr>';
    }
}

// Open history modal to view action history from table
async function openHistoryModal(id, itemName) {
    document.getElementById('history-modal-item-name').textContent = `Item: ${itemName}`;
    document.getElementById('history-modal-table-body').innerHTML = 
        '<tr><td colspan="7" class="text-center text-muted">Loading...</td></tr>';
    
    const historyModal = new bootstrap.Modal(document.getElementById('historyModal'));
    historyModal.show();
    
    try {
        const response = await fetch(`/api/materials/${id}/history`);
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const history = await response.json();
        const tbody = document.getElementById('history-modal-table-body');
        
        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No actions recorded yet</td></tr>';
        } else {
            tbody.innerHTML = history.map(h => `
                <tr>
                    <td><span class="badge bg-secondary">${h.action_number}</span></td>
                    <td>${formatDate(h.date)}</td>
                    <td>${escapeHtml(h.item_name) || '-'}</td>
                    <td>${escapeHtml(h.party_name) || '-'}</td>
                    <td class="text-center text-success">${h.action_inward > 0 ? '+' + h.action_inward : '-'}</td>
                    <td class="text-center text-danger">${h.action_outward > 0 ? '-' + h.action_outward : '-'}</td>
                    <td class="text-center fw-bold">${h.running_balance}</td>
                </tr>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('history-modal-table-body').innerHTML = 
            '<tr><td colspan="7" class="text-center text-danger">Error loading history</td></tr>';
    }
}

// Toggle history table visibility
function toggleHistoryTable() {
    const container = document.getElementById('history-table-container');
    const icon = document.getElementById('history-toggle-icon');
    
    if (container.classList.contains('d-none')) {
        container.classList.remove('d-none');
        icon.classList.remove('bi-chevron-down');
        icon.classList.add('bi-chevron-up');
    } else {
        container.classList.add('d-none');
        icon.classList.remove('bi-chevron-up');
        icon.classList.add('bi-chevron-down');
    }
}

// Handle form submit (Add/Update)
async function handleFormSubmit(event) {
    event.preventDefault();
    
    let formData;
    
    if (isEditing && currentEditId) {
        // Edit mode: send action values (what to ADD)
        formData = {
            date: document.getElementById('material-date').value,
            item_name: document.getElementById('material-item-name').value.trim(),
            party_name: document.getElementById('material-party-name').value.trim(),
            action_inward: parseInt(document.getElementById('action-inward').value) || 0,
            action_outward: parseInt(document.getElementById('action-outward').value) || 0,
            storage_place: document.getElementById('material-storage-place').value.trim()
        };
        // Inward and outward are optional - user can edit just to change party name, item name, etc.
    } else {
        // Add mode: send initial values
        formData = {
            date: document.getElementById('material-date').value,
            item_name: document.getElementById('material-item-name').value.trim(),
            party_name: document.getElementById('material-party-name').value.trim(),
            inward: parseInt(document.getElementById('material-inward').value) || 0,
            outward: parseInt(document.getElementById('material-outward').value) || 0,
            storage_place: document.getElementById('material-storage-place').value.trim()
        };
    }
    
    // Validation - only date and item_name are required
    if (!formData.date || !formData.item_name) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    showLoading();
    try {
        let response;
        if (isEditing && currentEditId) {
            // Update existing material
            response = await fetch(`/api/materials/${currentEditId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } else {
            // Add new material
            response = await fetch('/api/materials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            materialModalInstance.hide();
            loadMaterials();
            loadStatistics();
            loadSuggestions(); // Refresh autocomplete suggestions
            
            // Highlight the updated/new row
            setTimeout(() => {
                const row = document.querySelector(`tr[data-id="${result.material.id}"]`);
                if (row) {
                    row.classList.add('highlight');
                }
            }, 100);
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error saving material:', error);
        showToast('Failed to save material', 'error');
    } finally {
        hideLoading();
    }
}

// Open Delete Modal
function openDeleteModal(id, itemName) {
    document.getElementById('delete-material-id').value = id;
    document.getElementById('delete-item-name').textContent = itemName;
    deleteModalInstance.show();
}

// Confirm Delete
async function confirmDelete() {
    const id = document.getElementById('delete-material-id').value;
    
    showLoading();
    try {
        const response = await fetch(`/api/materials/${id}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(result.message, 'success');
            deleteModalInstance.hide();
            loadMaterials();
            loadStatistics();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting material:', error);
        showToast('Failed to delete material', 'error');
    } finally {
        hideLoading();
    }
}

// Calculate balance on input change
function calculateBalance() {
    const inward = parseInt(document.getElementById('material-inward').value) || 0;
    const outward = parseInt(document.getElementById('material-outward').value) || 0;
    document.getElementById('material-balance').value = inward - outward;
}

// Handle search
async function handleSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        loadMaterials();
        return;
    }
    
    showLoading();
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Failed to search');
        
        const results = await response.json();
        renderMaterialsTable(sortMaterials(results));
    } catch (error) {
        console.error('Error searching:', error);
        showToast('Search failed', 'error');
    } finally {
        hideLoading();
    }
}

// Refresh data
function refreshData() {
    searchInput.value = '';
    loadMaterials();
    loadStatistics();
    showToast('Data refreshed successfully', 'info');
}

// Export to CSV (bonus feature)
function exportToCSV() {
    if (materials.length === 0) {
        showToast('No data to export', 'error');
        return;
    }
    
    const headers = ['Date', 'Item Name', 'Party Name', 'Inward', 'Outward', 'Balance', 'Storage Place'];
    const csvContent = [
        headers.join(','),
        ...materials.map(m => [
            m.date,
            `"${m.item_name}"`,
            `"${m.party_name}"`,
            m.inward,
            m.outward,
            m.balance,
            `"${m.storage_place}"`
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `material_stock_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showToast('Export completed', 'success');
}

// Export to Excel (HTML Table format - universally compatible)
function exportToExcel() {
    if (materials.length === 0) {
        showToast('No data to export', 'error');
        return;
    }
    
    // Create HTML table that Excel can open
    let htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="UTF-8">
    <!--[if gte mso 9]>
    <xml>
        <x:ExcelWorkbook>
            <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                    <x:Name>Material Stock</x:Name>
                    <x:WorksheetOptions>
                        <x:DisplayGridlines/>
                    </x:WorksheetOptions>
                </x:ExcelWorksheet>
            </x:ExcelWorksheets>
        </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <style>
        table { border-collapse: collapse; width: 100%; }
        th { 
            background-color: #4472C4; 
            color: white; 
            font-weight: bold; 
            padding: 10px; 
            border: 1px solid #000;
            text-align: center;
        }
        td { 
            padding: 8px; 
            border: 1px solid #ccc; 
        }
        .number { text-align: center; }
        .positive { color: #198754; font-weight: bold; text-align: center; }
        .negative { color: #DC3545; font-weight: bold; text-align: center; }
    </style>
</head>
<body>
    <table>
        <thead>
            <tr>
                <th>Sr. No.</th>
                <th>Date</th>
                <th>Item Name</th>
                <th>Party Name</th>
                <th>Inward</th>
                <th>Outward</th>
                <th>Balance</th>
                <th>Storage Place</th>
            </tr>
        </thead>
        <tbody>`;
    
    // Add data rows
    materials.forEach((m, index) => {
        const balanceClass = m.balance >= 0 ? 'positive' : 'negative';
        htmlContent += `
            <tr>
                <td class="number">${index + 1}</td>
                <td>${escapeHtmlForExcel(m.date)}</td>
                <td>${escapeHtmlForExcel(m.item_name)}</td>
                <td>${escapeHtmlForExcel(m.party_name)}</td>
                <td class="number">${m.inward}</td>
                <td class="number">${m.outward}</td>
                <td class="${balanceClass}">${m.balance}</td>
                <td>${escapeHtmlForExcel(m.storage_place)}</td>
            </tr>`;
    });
    
    htmlContent += `
        </tbody>
    </table>
</body>
</html>`;
    
    // Download the file
    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `material_stock_${new Date().toISOString().split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Excel file downloaded successfully!', 'success');
}

// Escape HTML for Excel export
function escapeHtmlForExcel(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Print Table
function printTable() {
    if (materials.length === 0) {
        showToast('No data to print', 'error');
        return;
    }
    
    // Create print content
    let printContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Material Stock Report - ${new Date().toLocaleDateString()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #4472C4;
        }
        .header h1 {
            color: #4472C4;
            font-size: 24px;
            margin-bottom: 5px;
        }
        .header p {
            color: #666;
            font-size: 12px;
        }
        .summary {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item .label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
        }
        .summary-item .value {
            font-size: 20px;
            font-weight: bold;
            color: #333;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
            font-size: 12px;
        }
        th { 
            background-color: #4472C4; 
            color: white; 
            font-weight: bold; 
            padding: 10px 8px; 
            text-align: left;
            border: 1px solid #3d66b0;
        }
        th.center { text-align: center; }
        td { 
            padding: 8px; 
            border: 1px solid #ddd; 
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #f0f0f0; }
        .number { text-align: center; }
        .positive { color: #198754; font-weight: bold; text-align: center; }
        .negative { color: #DC3545; font-weight: bold; text-align: center; }
        .zero { color: #666; text-align: center; }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #666;
            display: flex;
            justify-content: space-between;
        }
        @media print {
            body { padding: 10px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Material Stock Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="summary-item">
            <div class="label">Total Items</div>
            <div class="value">${materials.length}</div>
        </div>
        <div class="summary-item">
            <div class="label">Total Inward</div>
            <div class="value" style="color: #198754;">${materials.reduce((sum, m) => sum + m.inward, 0)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Total Outward</div>
            <div class="value" style="color: #DC3545;">${materials.reduce((sum, m) => sum + m.outward, 0)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Net Balance</div>
            <div class="value" style="color: #0d6efd;">${materials.reduce((sum, m) => sum + m.balance, 0)}</div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 40px;" class="center">Sr.</th>
                <th style="width: 90px;">Date</th>
                <th>Item Name</th>
                <th>Party Name</th>
                <th style="width: 70px;" class="center">Inward</th>
                <th style="width: 70px;" class="center">Outward</th>
                <th style="width: 70px;" class="center">Balance</th>
                <th>Storage Place</th>
            </tr>
        </thead>
        <tbody>`;
    
    // Add data rows
    materials.forEach((m, index) => {
        const balanceClass = m.balance > 0 ? 'positive' : (m.balance < 0 ? 'negative' : 'zero');
        printContent += `
            <tr>
                <td class="number">${index + 1}</td>
                <td>${m.date}</td>
                <td>${escapeHtmlForExcel(m.item_name)}</td>
                <td>${escapeHtmlForExcel(m.party_name)}</td>
                <td class="number">${m.inward}</td>
                <td class="number">${m.outward}</td>
                <td class="${balanceClass}">${m.balance}</td>
                <td>${escapeHtmlForExcel(m.storage_place)}</td>
            </tr>`;
    });
    
    printContent += `
        </tbody>
    </table>
    
    <div class="footer">
        <span>Material Stock Management System</span>
        <span>Page 1</span>
    </div>
</body>
</html>`;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
        printWindow.print();
    };
    
    showToast('Print dialog opened', 'info');
}

// Open Print by Date Range Modal
function openPrintByDateModal() {
    // Set default dates (current month)
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    document.getElementById('print-start-date').value = firstDay.toISOString().split('T')[0];
    document.getElementById('print-end-date').value = today.toISOString().split('T')[0];
    
    const modal = new bootstrap.Modal(document.getElementById('printDateModal'));
    modal.show();
}

// Open Print by Party Name Modal
function openPrintByPartyModal() {
    const select = document.getElementById('print-party-name');
    select.innerHTML = '<option value="">-- Select Party --</option>';
    
    // Get unique party names from materials
    const partyNames = [...new Set(materials.map(m => m.party_name).filter(p => p && p.trim()))];
    partyNames.sort();
    
    partyNames.forEach(party => {
        const option = document.createElement('option');
        option.value = party;
        option.textContent = party;
        select.appendChild(option);
    });
    
    if (partyNames.length === 0) {
        showToast('No party names found in records', 'warning');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('printPartyModal'));
    modal.show();
}

// Open Print by Item Name Modal
function openPrintByItemModal() {
    const select = document.getElementById('print-item-name');
    select.innerHTML = '<option value="">-- Select Item --</option>';
    
    // Get unique item names from materials
    const itemNames = [...new Set(materials.map(m => m.item_name).filter(i => i && i.trim()))];
    itemNames.sort();
    
    itemNames.forEach(item => {
        const option = document.createElement('option');
        option.value = item;
        option.textContent = item;
        select.appendChild(option);
    });
    
    if (itemNames.length === 0) {
        showToast('No item names found in records', 'warning');
        return;
    }
    
    const modal = new bootstrap.Modal(document.getElementById('printItemModal'));
    modal.show();
}

// Print by Date Range
function printByDateRange() {
    const startDate = document.getElementById('print-start-date').value;
    const endDate = document.getElementById('print-end-date').value;
    
    if (!startDate || !endDate) {
        showToast('Please select both start and end dates', 'error');
        return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
        showToast('Start date cannot be after end date', 'error');
        return;
    }
    
    // Filter materials by date range
    const filteredMaterials = materials.filter(m => {
        const materialDate = new Date(m.date);
        return materialDate >= new Date(startDate) && materialDate <= new Date(endDate);
    });
    
    if (filteredMaterials.length === 0) {
        showToast('No records found in the selected date range', 'warning');
        return;
    }
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('printDateModal')).hide();
    
    // Print with filter info
    printFilteredTable(filteredMaterials, `Date Range: ${startDate} to ${endDate}`);
}

// Print by Party Name
function printByPartyName() {
    const partyName = document.getElementById('print-party-name').value;
    
    if (!partyName) {
        showToast('Please select a party name', 'error');
        return;
    }
    
    // Filter materials by party name
    const filteredMaterials = materials.filter(m => m.party_name === partyName);
    
    if (filteredMaterials.length === 0) {
        showToast('No records found for the selected party', 'warning');
        return;
    }
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('printPartyModal')).hide();
    
    // Print with filter info
    printFilteredTable(filteredMaterials, `Party Name: ${partyName}`);
}

// Print by Item Name
function printByItemName() {
    const itemName = document.getElementById('print-item-name').value;
    
    if (!itemName) {
        showToast('Please select an item name', 'error');
        return;
    }
    
    // Filter materials by item name
    const filteredMaterials = materials.filter(m => m.item_name === itemName);
    
    if (filteredMaterials.length === 0) {
        showToast('No records found for the selected item', 'warning');
        return;
    }
    
    // Close modal
    bootstrap.Modal.getInstance(document.getElementById('printItemModal')).hide();
    
    // Print with filter info
    printFilteredTable(filteredMaterials, `Item Name: ${itemName}`);
}

// Print Filtered Table
function printFilteredTable(data, filterInfo) {
    if (data.length === 0) {
        showToast('No data to print', 'error');
        return;
    }
    
    // Create print content
    let printContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Material Stock Report - ${new Date().toLocaleDateString()}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid #4472C4;
        }
        .header h1 {
            color: #4472C4;
            font-size: 24px;
            margin-bottom: 5px;
        }
        .header p {
            color: #666;
            font-size: 12px;
        }
        .filter-info {
            text-align: center;
            margin-bottom: 15px;
            padding: 10px;
            background: #e7f3ff;
            border-radius: 5px;
            color: #0d6efd;
            font-weight: bold;
        }
        .summary {
            display: flex;
            justify-content: space-around;
            margin-bottom: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item .label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
        }
        .summary-item .value {
            font-size: 20px;
            font-weight: bold;
            color: #333;
        }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 10px;
            font-size: 12px;
        }
        th { 
            background-color: #4472C4; 
            color: white; 
            font-weight: bold; 
            padding: 10px 8px; 
            text-align: left;
            border: 1px solid #3d66b0;
        }
        th.center { text-align: center; }
        td { 
            padding: 8px; 
            border: 1px solid #ddd; 
        }
        tr:nth-child(even) { background-color: #f9f9f9; }
        tr:hover { background-color: #f0f0f0; }
        .number { text-align: center; }
        .positive { color: #198754; font-weight: bold; text-align: center; }
        .negative { color: #DC3545; font-weight: bold; text-align: center; }
        .zero { color: #666; text-align: center; }
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 10px;
            color: #666;
            display: flex;
            justify-content: space-between;
        }
        @media print {
            body { padding: 10px; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Material Stock Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="filter-info">
        <i class="bi bi-funnel"></i> Filter Applied: ${filterInfo}
    </div>
    
    <div class="summary">
        <div class="summary-item">
            <div class="label">Total Items</div>
            <div class="value">${data.length}</div>
        </div>
        <div class="summary-item">
            <div class="label">Total Inward</div>
            <div class="value" style="color: #198754;">${data.reduce((sum, m) => sum + m.inward, 0)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Total Outward</div>
            <div class="value" style="color: #DC3545;">${data.reduce((sum, m) => sum + m.outward, 0)}</div>
        </div>
        <div class="summary-item">
            <div class="label">Net Balance</div>
            <div class="value" style="color: #0d6efd;">${data.reduce((sum, m) => sum + m.balance, 0)}</div>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th style="width: 40px;" class="center">Sr.</th>
                <th style="width: 90px;">Date</th>
                <th>Item Name</th>
                <th>Party Name</th>
                <th style="width: 70px;" class="center">Inward</th>
                <th style="width: 70px;" class="center">Outward</th>
                <th style="width: 70px;" class="center">Balance</th>
                <th>Storage Place</th>
            </tr>
        </thead>
        <tbody>`;
    
    // Add data rows
    data.forEach((m, index) => {
        const balanceClass = m.balance > 0 ? 'positive' : (m.balance < 0 ? 'negative' : 'zero');
        printContent += `
            <tr>
                <td class="number">${index + 1}</td>
                <td>${m.date}</td>
                <td>${escapeHtmlForExcel(m.item_name)}</td>
                <td>${escapeHtmlForExcel(m.party_name)}</td>
                <td class="number">${m.inward}</td>
                <td class="number">${m.outward}</td>
                <td class="${balanceClass}">${m.balance}</td>
                <td>${escapeHtmlForExcel(m.storage_place)}</td>
            </tr>`;
    });
    
    printContent += `
        </tbody>
    </table>
    
    <div class="footer">
        <span>Material Stock Management System</span>
        <span>Page 1</span>
    </div>
</body>
</html>`;
    
    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = function() {
        printWindow.print();
    };
    
    showToast('Print dialog opened', 'info');
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + N: New material
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        openAddModal();
        materialModalInstance.show();
    }
    
    // Escape: Close modals
    if (e.key === 'Escape') {
        materialModalInstance.hide();
        deleteModalInstance.hide();
    }
    
    // Ctrl/Cmd + F: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
});
