const openMaterialTabs = new Set();

function fetchJobs() {
    const token = localStorage.getItem('token');  // Retrieve the token from localStorage

    if (!token) {
        console.error('No token found. User is not authenticated.');
        window.location.href = '/login.html'; // Redirect to login page if no token is found
        return;
    }

    fetch('/api/jobs', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,  // Include the token in the Authorization header
            'Content-Type': 'application/json',
        }
    })
    .then(response => {
        if (!response.ok) {
            if (response.status === 401) {
                console.error('Unauthorized: Invalid or expired token');
                window.location.href = '/login.html';  // Redirect to login if token is invalid or expired
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const jobListContainer = document.getElementById('jobs');
        jobListContainer.innerHTML = ''; // Clear the existing list

        const jobs = {}; // Object to store jobs, materials, and material lists

        // Group data by job
        data.forEach(item => {
            if (!jobs[item.job_id]) {
                jobs[item.job_id] = {
                    job_name: item.job_name,
                    customer_name: `${item.customer_fname} ${item.customer_lname}`,
                    materials: [],
                    material_list: [],
                    quote: [],
                };
            }

            // Add material data
            if (item.material_type) {
                const materialExists = jobs[item.job_id].materials.some(
                    mat => mat.type === item.material_type && mat.date === item.material_date
                );
                if (!materialExists) {
                    jobs[item.job_id].materials.push({
                        type: item.material_type,
                        amount: item.material_amount,
                        date: item.material_date,
                    });
                }
            }

            // Add material list data
            if (
                item.material_list_item &&
                !jobs[item.job_id].material_list.some(
                    listItem => listItem.name === item.material_list_item
                )
            ) {
                jobs[item.job_id].material_list.push({
                    name: item.material_list_item,
                    amount: item.material_list_amount,
                });
            }

            // Add quote data
            if (
                item.quote_id &&
                !jobs[item.job_id].quote.some(quote => quote.quote_id === item.quote_id)
            ) {
                jobs[item.job_id].quote.push({
                    quote_id: item.quote_id,
                    partName: item.part_name,
                    partPrice: item.part_price,
                });
            }
        });

        // Render jobs and their data
        for (const jobId in jobs) {
            const job = jobs[jobId];

            const listItem = document.createElement('li');
            listItem.classList.add('job-list');

            // Job button to display job name
            const jobButton = document.createElement('button');
            jobButton.classList.add('main-buttons');
            jobButton.textContent = `${job.job_name}`;
            listItem.appendChild(jobButton);

            // Customer name element
            const customerElement = document.createElement('p');
            customerElement.classList.add('customer');
            customerElement.textContent = `Customer: ${job.customer_name}`;
            customerElement.style.display = 'none'; // Initially hidden
            listItem.appendChild(customerElement);

            // Materials section
            const materialsHeading = document.createElement('button');
            materialsHeading.classList.add('sub-buttons');
            materialsHeading.textContent = 'Materials:';
            materialsHeading.style.display = 'none'; // Initially hidden
            listItem.appendChild(materialsHeading);

            const materials = document.createElement('div');
            materials.classList.add('materials');
            materials.style.display = 'none'; // Restore state
            job.materials.forEach(mat => {
                const materialItem = document.createElement('p');
                materialItem.textContent = `Type: ${mat.type}, Amount: ${mat.amount}, Date: ${mat.date}`;
                materials.appendChild(materialItem);
            });
            listItem.appendChild(materials);

            materialsHeading.addEventListener('click', () => {
                const isHidden = materials.style.display === 'none';
                materials.style.display = isHidden ? 'block' : 'none';
                addMaterialButton.style.display = isHidden ? 'block' : 'none';
                deleteMaterialButton.style.display = isHidden ? 'block' : 'none';
                [deleteMaterialNameInput, deleteMaterialSubmit].forEach(el => el.style.display = 'none');
                [materialNameInput, materialQuantityInput, addMaterialSubmit].forEach(el => el.style.display = 'none');
                if (isHidden) {
                    openMaterialTabs.add(jobId); // Save open state
                } else {
                    openMaterialTabs.delete(jobId); // Remove state
                }
            });
// Add Material
                // Create "Add Materials" button and related inputs
                const addMaterialButton = document.createElement('button');
                const materialNameInput = document.createElement('input');
                const materialQuantityInput = document.createElement('input');
                const addMaterialSubmit = document.createElement('button');

                // Set attributes and initial styles
                Object.assign(addMaterialButton, { textContent: 'Add Item', className: 'addMatBtn', style: 'display:none' });
                Object.assign(materialNameInput, { placeholder: 'Material Name', style: 'display: none;' });
                Object.assign(materialQuantityInput, { placeholder: 'Material Quantity', style: 'display: none;' });
                Object.assign(addMaterialSubmit, { textContent: 'Submit', className: 'submitBtn', style: 'display: none;' });

                // Append elements to the job list item
                listItem.append(addMaterialButton, materialNameInput, materialQuantityInput, addMaterialSubmit);

                // Toggle visibility of inputs on "Add Material" button click
                addMaterialButton.addEventListener('click', () => {
                    const toggleDisplay = el => el.style.display = el.style.display === 'none' ? 'block' : 'none';
                    [materialNameInput, materialQuantityInput, addMaterialSubmit].forEach(toggleDisplay);
                });

                
                // Handle material submission
                addMaterialSubmit.addEventListener('click', () => {
                    const materialName = materialNameInput.value;
                    const materialAmount = materialQuantityInput.value;

                    if (materialName && materialAmount) {
                        fetch('/api/materials', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                material_type: materialName,
                                material_amount: materialAmount,
                                job_id: jobId, // Correctly pass job ID
                                material_date: new Date().toISOString(),
                            }),
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to add material');
                            }
                            return response.json();
                        })
                        .then(data => {
                            fetchJobs(); // Refresh the job list to reflect the new material
                        })
                        .catch(error => {
                            console.error('Error adding material:', error);
                            alert('Failed to add material.');
                        });
                    } else {
                        alert('Please fill out all fields.');
                    }
                });
// Delete Material
                const deleteMaterialButton = document.createElement('button');
                const deleteMaterialNameInput = document.createElement('input');
                const deleteMaterialSubmit = document.createElement('button');

                // Set attributes and initial styles
                Object.assign(deleteMaterialButton, { textContent: 'Delete Item', className: 'addMatBtn', style: 'display:none' });
                Object.assign(deleteMaterialNameInput, { placeholder: 'Material Name', style: 'display: none;' });
                Object.assign(deleteMaterialSubmit, { textContent: 'Submit', className: 'submitBtn', style: 'display: none;' });

                // Append elements to the job list item
                listItem.append(deleteMaterialButton, deleteMaterialNameInput, deleteMaterialSubmit);

                // Toggle visibility of inputs on "Delete Material" button click
                deleteMaterialButton.addEventListener('click', () => {
                    const toggleDisplay = el => el.style.display = el.style.display === 'none' ? 'block' : 'none';
                    [deleteMaterialNameInput, deleteMaterialSubmit].forEach(toggleDisplay);
                });

                // Handle material deletion
                deleteMaterialSubmit.addEventListener('click', () => {
                    const materialName = deleteMaterialNameInput.value;
                    console.log(materialName);
                    if (materialName) {
                        fetch(`/api/deletematerial`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                material_type: materialName,
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                fetchJobs(); // Refresh the job list after deletion
                            } else {
                                alert(data.error || 'Failed to delete material.');
                            }
                        })
                        .catch(error => {
                            console.error('Error deleting material:', error);
                            alert('Failed to delete material.');
                        });
                    } else {
                        alert('Please enter a material name to delete.');
                    }
                });                

                // Material list details
                const materialListHeading = document.createElement('button');
                materialListHeading.classList.add('sub-buttons');
                materialListHeading.textContent = 'Material List:';
                materialListHeading.style.display = 'none'; // Initially hidden
                listItem.appendChild(materialListHeading);
                const materialListDetails = document.createElement('div');
                materialListDetails.classList.add('material-list');
                materialListDetails.style.display = 'none';
                job.material_list.forEach(list => {
                    const listItem = document.createElement('p');
                    listItem.textContent = `${list.name} - Total: $${list.amount}`;
                    materialListDetails.appendChild(listItem);
                });
                listItem.appendChild(materialListDetails);
                materialListHeading.addEventListener('click', () => {
                    const isHidden = materialListDetails.style.display === 'none';
                    materialListDetails.style.display = isHidden ? 'block' : 'none';
                    addMaterialListButton.style.display = isHidden ? 'block' : 'none';
                    [materialListNameInput, materialListQuantityInput, addMaterialListSubmit].forEach(el => el.style.display = 'none');
                    deleteMaterialListButton.style.display = isHidden ? 'block' : 'none';
                    [deleteMaterialListNameInput, deleteMaterialListSubmit].forEach(el => el.style.display = 'none');
                });

//Add material list
                const addMaterialListButton = document.createElement('button');
                const materialListNameInput = document.createElement('input');
                const materialListQuantityInput = document.createElement('input');
                const addMaterialListSubmit = document.createElement('button');

                // Set attributes and initial styles
                Object.assign(addMaterialListButton, { textContent: 'Add Item', className: 'addMatBtn', style: 'display:none' });
                Object.assign(materialListNameInput, { placeholder: 'Material Name', style: 'display: none;' });
                Object.assign(materialListQuantityInput, { placeholder: 'Material Cost', style: 'display: none;' });
                Object.assign(addMaterialListSubmit, { textContent: 'Submit', className: 'submitBtn', style: 'display: none;' });

                // Append elements to the job list item
                listItem.append(addMaterialListButton, materialListNameInput, materialListQuantityInput, addMaterialListSubmit);

                // Toggle visibility of inputs on "Add Material" button click
                addMaterialListButton.addEventListener('click', () => {
                    const toggleDisplay = el => el.style.display = el.style.display === 'none' ? 'block' : 'none';
                    [materialListNameInput, materialListQuantityInput, addMaterialListSubmit].forEach(toggleDisplay);
                });

                // Handle material submission
                addMaterialListSubmit.addEventListener('click', () => {
                    const materialListName = materialListNameInput.value;
                    const materialListAmount = materialListQuantityInput.value;

                    if (materialListName && materialListAmount) {
                        fetch('/api/materialList', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                material_list_item: materialListName,
                                material_list_amount: materialListAmount,
                                job_id: jobId, // Correctly pass job ID
                            }),
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to add material list');
                            }
                            return response.json();
                        })
                        .then(data => {
                            fetchJobs(); // Refresh the job list to reflect the new material
                        })
                        .catch(error => {
                            console.error('Error adding material list:', error);
                            alert('Failed to add material list.');
                        });
                    } else {
                        alert('Please fill out all fields.');
                    }
                });

// Delete Material List
                const deleteMaterialListButton = document.createElement('button');
                const deleteMaterialListNameInput = document.createElement('input');
                const deleteMaterialListSubmit = document.createElement('button');

                // Set attributes and initial styles
                Object.assign(deleteMaterialListButton, { textContent: 'Delete Item', className: 'addMatBtn', style: 'display:none' });
                Object.assign(deleteMaterialListNameInput, { placeholder: 'Material Name', style: 'display: none;' });
                Object.assign(deleteMaterialListSubmit, { textContent: 'Submit', className: 'submitBtn', style: 'display: none;' });

                // Append elements to the job list item
                listItem.append(deleteMaterialListButton, deleteMaterialListNameInput, deleteMaterialListSubmit);

                // Toggle visibility of inputs on "Delete Material" button click
                deleteMaterialListButton.addEventListener('click', () => {
                    const toggleDisplay = el => el.style.display = el.style.display === 'none' ? 'block' : 'none';
                    [deleteMaterialListNameInput, deleteMaterialListSubmit].forEach(toggleDisplay);
                });

                // Handle material deletion
                deleteMaterialListSubmit.addEventListener('click', () => {
                    const materialListName = deleteMaterialListNameInput.value;
                    if (materialListName) {
                        fetch(`/api/deletemateriallistitem`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                material_list_item: materialListName,
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                fetchJobs(); // Refresh the job list after deletion
                            } else {
                                alert(data.error || 'Failed to delete material item.');
                            }
                        })
                        .catch(error => {
                            console.error('Error deleting material item:', error);
                            alert('Failed to delete material item.');
                        });
                    } else {
                        alert('Please enter a material item name to delete.');
                    }
                });

// Quote section
                // Quote details
                const quoteHeading = document.createElement('button');
                quoteHeading.classList.add('sub-buttons');
                quoteHeading.textContent = 'Quote:';
                quoteHeading.style.display = 'none'; // Initially hidden
                listItem.appendChild(quoteHeading);
                const quoteDetails = document.createElement('div');
                quoteDetails.classList.add('quote');
                quoteDetails.style.display = 'none';

                let totalQuotePrice = 0;
                job.quote.forEach(quote => {
                    totalQuotePrice += parseFloat(quote.partPrice);
                    const quoteItem = document.createElement('p');
                    quoteItem.textContent = `Part: ${quote.partName}, Price: $${quote.partPrice}`;
                    quoteDetails.appendChild(quoteItem);
                });
                const quoteTotal = document.createElement('p');
                quoteTotal.textContent = `Total: $${totalQuotePrice.toFixed(2)}`;
                quoteDetails.appendChild(quoteTotal);
                listItem.appendChild(quoteDetails);

                quoteHeading.addEventListener('click', () => {
                    const isHidden = quoteDetails.style.display === 'none';
                    quoteDetails.style.display = isHidden ? 'block' : 'none';
                    addQuoteItemButton.style.display = isHidden ? 'block' : 'none';
                    [quoteItemNameInput, quoteItemCostInput, addQuoteItemSubmit].forEach(el => el.style.display = 'none');
                    deleteQuoteItemButton.style.display = isHidden ? 'block' : 'none';
                    [deleteQuoteItemNameInput, deleteQuoteItemSubmit].forEach(el => el.style.display = 'none');
                });

                const addQuoteItemButton = document.createElement('button');
                const quoteItemNameInput = document.createElement('input');
                const quoteItemCostInput = document.createElement('input');
                const addQuoteItemSubmit = document.createElement('button');

                // Set attributes and initial styles
                Object.assign(addQuoteItemButton, { textContent: 'Add Item', className: 'addMatBtn', style: 'display:none' });
                Object.assign(quoteItemNameInput, { placeholder: 'Item Name', style: 'display: none;' });
                Object.assign(quoteItemCostInput, { placeholder: 'Item Cost', style: 'display: none;' });
                Object.assign(addQuoteItemSubmit, { textContent: 'Submit', className: 'submitBtn', style: 'display: none;' });

                // Append elements to the job list item
                listItem.append(addQuoteItemButton, quoteItemNameInput, quoteItemCostInput, addQuoteItemSubmit);

                // Toggle visibility of inputs on "Add Material" button click
                addQuoteItemButton.addEventListener('click', () => {
                    const toggleDisplay = el => el.style.display = el.style.display === 'none' ? 'block' : 'none';
                    [quoteItemNameInput, quoteItemCostInput, addQuoteItemSubmit].forEach(toggleDisplay);
                });

                // Handle material submission
                addQuoteItemSubmit.addEventListener('click', () => {
                    const quoteItemName = quoteItemNameInput.value;
                    const quoteItemCost = quoteItemCostInput.value;

                    if (quoteItemName && quoteItemCost) {
                        fetch('/api/quote', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                part_name: quoteItemName,
                                part_price: quoteItemCost,
                                job_id: jobId, // Correctly pass job ID
                            }),
                        })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Failed to add quote');
                            }
                            return response.json();
                        })
                        .then(data => {
                            fetchJobs(); // Refresh the job list to reflect the new material
                        })
                        .catch(error => {
                            console.error('Error adding quote:', error);
                            alert('Failed to add quote.');
                        });
                    } else {
                        alert('Please fill out all fields.');
                    }
                });

// Delete Quote Item
                // Delete Material List
                const deleteQuoteItemButton = document.createElement('button');
                const deleteQuoteItemNameInput = document.createElement('input');
                const deleteQuoteItemSubmit = document.createElement('button');

                // Set attributes and initial styles
                Object.assign(deleteQuoteItemButton, { textContent: 'Delete Item', className: 'addMatBtn', style: 'display:none' });
                Object.assign(deleteQuoteItemNameInput, { placeholder: 'Item Name', style: 'display: none;' });
                Object.assign(deleteQuoteItemSubmit, { textContent: 'Submit', className: 'submitBtn', style: 'display: none;' });

                // Append elements to the job list item
                listItem.append(deleteQuoteItemButton, deleteQuoteItemNameInput, deleteQuoteItemSubmit);

                // Toggle visibility of inputs on "Delete Material" button click
                deleteQuoteItemButton.addEventListener('click', () => {
                    const toggleDisplay = el => el.style.display = el.style.display === 'none' ? 'block' : 'none';
                    [deleteQuoteItemNameInput, deleteQuoteItemSubmit].forEach(toggleDisplay);
                });

                // Handle material deletion
                deleteQuoteItemSubmit.addEventListener('click', () => {
                    const QuoteItemName = deleteQuoteItemNameInput.value;
                    if (QuoteItemName) {
                        fetch(`/api/deletequoteitem`, {
                            method: 'DELETE',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                part_name: QuoteItemName,
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                fetchJobs(); // Refresh the job list after deletion
                            } else {
                                alert(data.error || 'Failed to delete quote item.');
                            }
                        })
                        .catch(error => {
                            console.error('Error deleting quote item:', error);
                            alert('Failed to delete quote item.');
                        });
                    } else {
                        alert('Please enter a quote item name to delete.');
                    }
                });

                // Toggle visibility of customer, material, and list details
                jobButton.addEventListener('click', () => {
                    const isHidden = customerElement.style.display === 'none';
                    customerElement.style.display = isHidden ? 'block' : 'none';
                    materialsHeading.style.display = isHidden ? 'block' : 'none';
                    materialListHeading.style.display = isHidden ? 'block' : 'none';
                    quoteHeading.style.display = isHidden ? 'block' : 'none';
                    materials.style.display = 'none';
                    materialListDetails.style.display = 'none';
                    quoteDetails.style.display = 'none';
                    addMaterialButton.style.display = 'none';
                    [materialNameInput, materialQuantityInput, addMaterialSubmit].forEach(el => el.style.display = 'none');
                    deleteMaterialButton.style.display = 'none';
                    [deleteMaterialNameInput, deleteMaterialSubmit].forEach(el => el.style.display = 'none');
                    deleteMaterialListButton.style.display = 'none';
                    [deleteMaterialListNameInput, deleteMaterialListSubmit].forEach(el => el.style.display = 'none');
                    addQuoteItemButton.style.display = 'none';
                    [quoteItemNameInput, quoteItemCostInput, addQuoteItemSubmit].forEach(el => el.style.display = 'none');
                    deleteQuoteItemButton.style.display = 'none';
                    [deleteQuoteItemNameInput, deleteQuoteItemSubmit].forEach(el => el.style.display = 'none');
                    addMaterialListButton.style.display = 'none';
                    [materialListNameInput, materialListQuantityInput, addMaterialListSubmit].forEach(el => el.style.display = 'none');
                });

                jobListContainer.appendChild(listItem);
            }
        })
        .catch(error => {
            console.error('Error fetching jobs:', error);
            document.getElementById('jobs').textContent = 'Failed to load data.';
        });
        
}