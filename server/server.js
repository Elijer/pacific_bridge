import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { __dirname } from './utils.js'; // Import the helper function

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for simplicity, adjust as needed
    methods: ['GET', 'POST']
  }
});

let currentFile = null

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname(import.meta.url), 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.post('/upload-3d-model', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  if (fileExtension !== '.gltf' && fileExtension !== '.glb') {
    return res.status(400).json({ error: 'Invalid file type. Only GLTF and GLB files are allowed.' });
  }

  const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  currentFile = fileUrl
  res.json({
    message: '3D model file uploaded successfully',
    fileUrl: fileUrl
  });

  // Broadcast the file URL to all connected clients
  io.emit('modelUploaded', { fileUrl });
});

io.on('connection', (socket) => {
  if (currentFile) {
    socket.emit('modelUploaded', { fileUrl: currentFile });
  }
  console.log('a user connected');

  // Handle cursor position events
  socket.on('cursorPosition', (data) => {
    socket.broadcast.emit('cursorPosition', data);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});