function fetchCustomers() {
    fetch('/api/customers')
        .then(response => response.json())
        .then(data => {
            const customerDropdown = document.getElementById('customers');

            if (data.length === 0) {
                const noDataOption = document.createElement('option');
                noDataOption.textContent = 'No customers found';
                customerDropdown.appendChild(noDataOption);
            } else {
                data.forEach(customer => {
                    const option = document.createElement('option');
                    option.value = customer.customer_id;
                    option.textContent = customer.customer_fname;
                    customerDropdown.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching customers:', error);
            alert('Failed to load customers.');
        });
}
