const API_URL = 'http://localhost:5000';

async function testBackend() {
    const result = document.getElementById('backend-result');
    result.innerHTML = '<p>Testing...</p>';
    
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        result.innerHTML = `<p class="success">✓ Backend is running!</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
    } catch (error) {
        result.innerHTML = `<p class="error">✗ Backend connection failed: ${error.message}</p>`;
    }
}

async function getStoreInfo() {
    const result = document.getElementById('store-result');
    const storeGuid = document.getElementById('storeGuid').value;
    const label = document.getElementById('label').value;
    
    result.innerHTML = '<p>Fetching store info...</p>';
    
    try {
        const response = await fetch(`${API_URL}/api/stores/${storeGuid}/labels`);
        const data = await response.json();
        
        const labelData = data.labels.find(l => l.label === label);
        if (labelData) {
            document.getElementById('storeId').value = labelData.store_id;
            result.innerHTML = `<p class="success">✓ Store found!</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
        } else {
            result.innerHTML = `<p class="error">✗ Label "${label}" not found</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
    } catch (error) {
        result.innerHTML = `<p class="error">✗ Failed to fetch store: ${error.message}</p>`;
    }
}

async function testKDSSummary() {
    const result = document.getElementById('kds-result');
    const storeId = document.getElementById('storeId').value;
    
    result.innerHTML = '<p>Fetching KDS summary...</p>';
    
    try {
        const response = await fetch(`${API_URL}/api/kds/${storeId}/summary`);
        const data = await response.json();
        
        if (data.success) {
            result.innerHTML = `<p class="success">✓ KDS data loaded!</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
        } else {
            result.innerHTML = `<p class="error">✗ KDS request failed</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
    } catch (error) {
        result.innerHTML = `<p class="error">✗ Failed to fetch KDS: ${error.message}</p>`;
    }
}

async function createTestOrder() {
    const result = document.getElementById('order-result');
    const storeId = document.getElementById('storeId').value;
    
    result.innerHTML = '<p>Creating test order...</p>';
    
    try {
        // First, get products
        const productsResponse = await fetch(`${API_URL}/api/products/store/${storeId}`);
        const productsData = await productsResponse.json();
        
        if (!productsData.products || productsData.products.length === 0) {
            result.innerHTML = '<p class="error">✗ No products found. Please add products first.</p>';
            return;
        }
        
        // Create an order with the first product
        const product = productsData.products[0];
        const orderData = {
            store_id: parseInt(storeId),
            order_name: 'Test Order',
            items: [{
                product_id: product.id,
                product_name: product.name,
                price: product.price,
                quantity: 2
            }],
            subtotal: product.price * 2,
            tax: 0,
            total: product.price * 2,
            payment_method: 'cash',
            status: 'active'
        };
        
        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            result.innerHTML = `<p class="success">✓ Test order created!</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
        } else {
            result.innerHTML = `<p class="error">✗ Failed to create order</p><pre>${JSON.stringify(data, null, 2)}</pre>`;
        }
    } catch (error) {
        result.innerHTML = `<p class="error">✗ Error: ${error.message}</p>`;
    }
}

function openKDS() {
    const storeGuid = document.getElementById('storeGuid').value;
    const label = document.getElementById('label').value;
    const url = `http://localhost:5173/kds/${storeGuid}/${label}`;
    window.open(url, '_blank');
}

function openStandaloneKDS() {
    window.open('http://localhost:5000/public/kds-standalone.html', '_blank');
}

// Auto-test on load
window.addEventListener('DOMContentLoaded', () => {
    testBackend();
    
    // Attach event listeners
    document.getElementById('btn-backend').addEventListener('click', testBackend);
    document.getElementById('btn-store').addEventListener('click', getStoreInfo);
    document.getElementById('btn-kds').addEventListener('click', testKDSSummary);
    document.getElementById('btn-order').addEventListener('click', createTestOrder);
    document.getElementById('btn-open-kds').addEventListener('click', openKDS);
    document.getElementById('btn-open-standalone').addEventListener('click', openStandaloneKDS);
});
