const express = require('express');
const mysql = require('mysql');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 5005;

app.use(cors());

// Configuring file storage with multer
const storage = multer.diskStorage({
  // Definition of the destination folder
  destination: function (req, file, cb) {
    cb(null, './uploads'); 
  },
  // Definition of the filename
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); 
  }
});

// Create a multer instance with the storage configuration defined before
const upload = multer({ storage: storage });

// Connexion to the Databases Mysql
const db = mysql.createConnection({
  host: '', 
  user: '', 
  password: '', 
  database: ''
});

// Checking the database connection
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à la base de données: ', err);
    return;
  }
  console.log('Connecté à la base de données MySQL');
});

// Middleware to protect and authorize only one IP for request POST
const allowedIP = 'The ip adress u want for post';
app.use((req, res, next) => {
  // Get the client's IP address, using 'x-forwarded-for' if behind a proxy, or direct IP adresse.
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log('Adresse IP du client :', clientIP);
  // if the IP of the request POST is not authorize, return an error messages
  if (req.method == 'POST' && !clientIP.includes(allowedIP)) {
    return res.status(403).json({ message: "Accès refusé : IP non autorisée" });
  }
  next();
});

// Get the images stored in the folder, which are defined in the database
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

// Route to get the projects
app.get('/api/projects', (req, res) => {
  const query = 'SELECT * FROM projects';
  db.query(query, (err, result) => {
    if (err) {
      console.error('Erreur lors de la récupération des projets:', err);
      return res.status(500).send('Erreur serveur');
    }
    res.json(result);
  });
});

// Route to add a new project in the BDD
app.post('/api/projects', upload.single('image'), (req, res) => {
  const { title, description, type } = req.body;
  const image = req.file ? req.file.filename : null;

  if (!title || !description) {
    return res.status(400).send('Le titre et la description sont requis');
  }

  const query = 'INSERT INTO projects (title, description, image, type) VALUES (?, ?, ?, ?)';
  db.query(query, [title, description, image, type], (err, result) => {
    if (err) {
      console.error('Erreur d\'insertion dans la base de données:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err });
    }
    res.status(200).send('Projet ajouté');
  });
});

// Starting Express server
app.listen(port, '0.0.0.0', () => {
  console.log(`Serveur backend démarré sur http://votrenomdedomaine:${port}`);
});
