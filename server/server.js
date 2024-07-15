import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for simplicity, adjust as needed
    methods: ['GET', 'POST']
  }
});



app.use(express.static(path.join(__dirname, '../client/dist')));

let currentFile = null

let clients = {}

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

// Function to get the most recent file in the uploads folder
function getMostRecentFile() {
  const uploadsDir = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadsDir);
  
  if (files.length === 0) return null;

  const mostRecentFile = files.reduce((latest, file) => {
    const filePath = path.join(uploadsDir, file);
    const stats = fs.statSync(filePath);
    if (stats.mtime > latest.mtime) {
      return { file, mtime: stats.mtime };
    }
    return latest;
  }, { file: null, mtime: new Date(0) });

  return mostRecentFile.file ? `http://localhost:3000/uploads/${mostRecentFile.file}` : null;
}

// Set currentFile to the most recent file on server start
currentFile = getMostRecentFile();

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
  console.log("most recent file is", currentFile)
  const playerId = socket.handshake.auth.playerId;
  console.log(`New connection from player: ${playerId.substring(0, 5) + '...'}`);

  if (!clients[playerId]){
    clients[playerId] = {
      socket: socket.id,
      x: 0,
      y: 0,
      z: 0,
      color: '0x' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
    };
  }

  if (currentFile) {
    socket.emit('modelUploaded', { fileUrl: currentFile });
  }

  socket.emit('cursors', clients)

  socket.on('setCurrentFile', (data) => {
    currentFile = data
  })

  // Handle cursor position events
  socket.on('cursorPosition', (data) => {
    clients[data.playerId] = {...clients[data.playerId], ...data}
    socket.emit('cursors', clients)
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });

});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});