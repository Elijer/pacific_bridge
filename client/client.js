// import io from 'socket.io-client';

// const socket = io('http://localhost:3000');

document.getElementById('uploadButton').addEventListener('click', async () => {
  const fileInput = document.getElementById('fileInput');
  const file = fileInput.files[0];
  
  if (file && (file.name.toLowerCase().endsWith('.gltf') || file.name.toLowerCase().endsWith('.glb'))) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:3000/upload-3d-model', {
        method: 'POST',
        body: formData
      });
      const result = await response.json();
      console.log('3D model file uploaded successfully:', result);
      // Optionally, you can emit a socket event here to notify other clients
      // socket.emit('modelUploaded', { filename: file.name });
    } catch (error) {
      console.error('Error uploading 3D model file:', error);
    }
  } else {
    console.log('No GLTF or GLB file selected');
  }
});