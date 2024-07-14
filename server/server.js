import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

const app = express();
app.use(cors()); // Enable CORS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Existing routes and middleware...

// New route for handling 3D model uploads (GLTF and GLB)
app.post('/upload-3d-model', upload.single('file'), (req, res) => {
  console.log(req.file)
  if (!req.file) {
    console.log("NO FILE UPLOADED")
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileExtension = path.extname(req.file.originalname).toLowerCase();
  if (fileExtension !== '.gltf' && fileExtension !== '.glb') {
    console.log("INVALID FILE TYPE")
    return res.status(400).json({ error: 'Invalid file type. Only GLTF and GLB files are allowed.' });
  }

  res.json({
    message: '3D model file uploaded successfully',
    filename: req.file.filename
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});