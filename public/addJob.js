submitjobBtn.addEventListener('click', () => {
    const jobName = document.getElementById('jobName').value;
    const jobStart = document.getElementById('jobStart').value;
    const jobEnd = document.getElementById('jobEnd').value;
    const customerId = document.getElementById('customers').value;

    if (!jobName || !customerId) {
        return alert('Please fill in required fields.');
    }

    const jobData = {
        job_name: jobName,
        job_start: jobStart || null,
        job_end: jobEnd || null,
        customer_id: customerId
    };

    fetch('/api/jobs', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`, // Include the token
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            fetchJobs();  // Re-fetch all jobs to include the new one
            document.getElementById('addjobForm').style.display = 'none';
        } else {
            alert('Failed to add job.');
        }
    })
    .catch(error => {
        console.error('Error adding job:', error);
    });
});