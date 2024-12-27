const confirmjobBtn = document.getElementById('confirmjobBtn');
const token = localStorage.getItem('token');
confirmjobBtn.addEventListener('click', () => {
    const removeJobName = document.getElementById('removeJobName').value;

    if (removeJobName) {
        fetch('/api/deletejob', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`, // Include the token
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ job_name: removeJobName }), // Send job name in the request body
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                alert(data.message); // Show success message
            })
            .catch(err => {
                console.error('Error deleting job:', err);
                alert('Failed to delete the job. Please try again.');
            })
        }
    });
