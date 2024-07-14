import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import cors from 'cors';

const app = express();
app.use(cors());
const server = createServer(app);
const io = new Server(server);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, 'gltf-' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage, fileFilter: (req, file, cb) => {
  if (path.extname(file.originalname).toLowerCase() !== '.gltf') {
    return cb(new Error('Only GLTF files are allowed'));
  }
  cb(null, true);
}});

app.get('/', (req, res) => {
  res.send('3D Modeling Server is running');
});

// Add a new route for file uploads
app.post('/upload-gltf', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  res.json({ message: 'GLTF file uploaded successfully', filename: req.file.filename });
});

io.on('connection', (socket) => {
  console.log('A user connected');

  // Handle incoming annotations
  socket.on('annotation', (data) => {
    console.log('Annotation received:', data);
    // Broadcast the annotation to all connected clients
    socket.broadcast.emit('annotation', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});