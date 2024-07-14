import { io } from 'socket.io-client';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { v4 as uuidv4 } from 'uuid';
import setupScene from './lib/setupScene.js';

const savedFileURL = localStorage.getItem('modelFileURL');
if (savedFileURL) {
  console.log("Found a previously uploaded file, gonna try to render it")
  console.log('Found saved model:', savedFileURL);
  renderGLB(savedFileURL);
}

const playerId = localStorage.getItem('playerId') || uuidv4();
localStorage.setItem('playerId', playerId);

const socket = io('http://localhost:3000', {
  auth: { playerId }
});

socket.on('modelUploaded', (data) => {
  console.log(data)
  console.log("Websocket: model was uploaded by a client somewhere to here:", data.fileUrl)
  localStorage.setItem('modelFileURL', data.fileUrl); // Save URL to localStorage
  renderGLB(data.fileUrl);
});

function renderGLB(fileUrl) {
  console.log('Rendering GLB file from URL:', fileUrl); // Debugging line

  let {scene, camera, renderer, controls} = setupScene();

  const loader = new GLTFLoader();
  loader.load(fileUrl, (gltf) => {
    scene.add(gltf.scene);

    camera.position.set(0.08, 1.2, .7); // Start camera position

    // Raycaster for detecting cursor position on the model
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // TODO: So this is going to get loaded according to the initial cursors passed on connections
      // Add a sphere to represent the cursor position
      // const cursorGeometry = new THREE.SphereGeometry(0.02, 8, 8);
      // const cursorMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      // cursorMaterial.transparent = true;
      // cursorMaterial.opacity = 0.3;
      // const cursorMesh = new THREE.Mesh(cursorGeometry, cursorMaterial);
      // scene.add(cursorMesh);

    function onMouseMove(event) {

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Update the raycaster with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Calculate objects intersecting the raycaster
      const intersects = raycaster.intersectObject(gltf.scene, true);

      if (intersects.length > 0) {
        // Get cursor position and send to server
        const intersect = intersects[0];
        // console.log(intersect)
        // cursorMesh.position.copy(intersect.point); // this updates the cursor position
        socket.emit('cursorPosition', { playerId: playerId, x: intersect.point.x, y: intersect.point.y, z: intersect.point.z });
      }
    }

    window.addEventListener('mousemove', onMouseMove, false);

    // Listen for cursor positions from other clients
    // socket.on('cursorPosition', (data) => {
    //   cursorMesh.position.set(data.x, data.y, data.z);
    // });
    // TODO:
    // So this is where I need to receive an array of cursor positions and update each cursor position, maybe creating
    // New mesh as needed

    const animate = function () {
      requestAnimationFrame(animate);
      controls.update(); // Update controls
      renderer.render(scene, camera);
    };
    animate();
  }, undefined, (error) => {
    console.error('An error happened while loading the GLB file:', error);
  });
}

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
      if (!response.ok) {
        throw new Error('Network response was not ok ' + response.statusText);
      }
      const result = await response.json();
      console.log('3D model file uploaded successfully:', result);
      localStorage.setItem('modelFileURL', result.fileUrl); // Save URL to localStorage
      renderGLB(result.fileUrl);
    } catch (error) {
      console.error('Error uploading 3D model file:', error);
    }
  } else {
    console.log('No GLTF or GLB file selected');
  }
});