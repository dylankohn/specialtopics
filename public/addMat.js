// function addMaterial(materialName, materialQuantity, jobId) {
//     console.log('Job ID:', jobId);
//     return fetch('/api/addMaterial', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify({
//             material_name: materialName,
//             material_amount: materialQuantity,
//             job_id: jobId
//         })
//     })
//     .then(response => response.json())
//     .then(data => {
//         return data;
//     })
//     .catch(error => {
//         console.error('Error adding material:', error);
//         throw error;
//     });
// }
