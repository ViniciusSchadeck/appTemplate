require('dotenv').config();   // instale com: npm install dotenv

const JWT_SECRET = process.env.JWT_SECRET || "minha_chave_temporaria_para_teste";

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
app.use(bodyParser.json());
app.use(cookieParser());

// CORS configurado corretamente para o seu caso
app.use(cors({
  origin: 'http://localhost:30555',   // ← mude se sua porta for diferente
  credentials: true,                 // ← essencial para cookies httpOnly
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Segredo hardcoded (só para desenvolvimento local)
// const JWT_SECRET = "minha_chave_super_secreta_123456789_mude_essa_em_producao";

// ... seu código existente (mongoose, rotas, etc.)

// // ←←← ADICIONE ESSAS LINHAS AQUI ↓↓↓
// app.use(express.static(path.join(__dirname, 'frontend')));

// Por esta (desabilita cache completamente em desenvolvimento):
// app.use(express.static(path.join(__dirname, 'frontend'), {
//   maxAge: 0,           // não cacheia
//   etag: false,         // desabilita ETag (que causa cache)
//   lastModified: false,
//   cacheControl: false
// }));
app.use(express.static(path.join(__dirname, 'frontend')));

// 1. Connect to MongoDB (Local or Atlas)
// Replace with your MongoDB Atlas URI if using cloud hosting
const mongoURI = 'mongodb://localhost:27017/InsulinCotnrol'; 
mongoose.connect(mongoURI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Connection error:', err));

// 2. Define User Schema and Model
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const insulinSchema = new mongoose.Schema({
    insulinName: { type: String, required: true },
    insulinType: { type: String, required: true },
    InitialValue: { type: Number, required: true }
});
const Insulin = mongoose.model('Insulin', insulinSchema);

const prickSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    amount: { type: Number, required: true },
    insulin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Insulin' // Links to the User model
    }
});
const Prick = mongoose.model('Prick', prickSchema);

// 3. Registration Route
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).send('User already exists');

        // Create and save new user
        const newUser = new User({ username, email, password });
        await newUser.save();

        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(500).send('Error registering user: ' + error.message);
    }
});
app.post('/insulin', async (req, res) => {
    try {
        const { houseAmount, userId, betHouseList } = req.body;

        // Create and save new bet
        const newBet = new Bet({ houseAmount, userId, betHouseList });
        await newBet.save();

        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(500).send('Error registering user: ' + error.message);
    }
});
app.post('/prick', async (req, res) => {
    try {
        const { houseAmount, userId, betHouseList } = req.body;

        // Create and save new bet
        const newBet = new Bet({ houseAmount, userId, betHouseList });
        await newBet.save();

        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(500).send('Error registering user: ' + error.message);
    }
});

app.post('/auth/login', async (req, res) => {


  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios' });
  }

  try {
    const user = await User.findOne({ email });   // ajuste para seu model
    if (!user) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos' });
    }

    console.log(password + ' = ' + user.password);
    const senhaValida = password == user.password;

    // const senhaValida = await bcrypt.compare(password, user.password);
    if (!senhaValida) {
      return res.status(401).json({ message: 'E-mail ou senha incorretos' });
    }

    // Gera o JWT
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        name: user.name || ''
      },
      JWT_SECRET,                    // ← aqui está o segredo
      { expiresIn: '24h' }
    );

    // Define o cookie httpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: false,          // mude para true quando for HTTPS
      sameSite: 'lax',//'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.status(200).json({ 
      message: 'Login realizado com sucesso',
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno no servidor' });
  }

});

// ====================== MIDDLEWARE DE AUTENTICAÇÃO ======================
const authenticateToken = (req, res, next) => {
  const token = req.cookies?.token;     // cookie-parser deve estar ativo

  if (!token) {
    console.log('❌ Nenhum token encontrado');
    return res.status(401).json({ message: 'Não autenticado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);   // JWT_SECRET que você usou no login
    req.user = decoded;
    next();
  } catch (err) {
    console.log('❌ Token inválido:', err.message);
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

// ====================== ROTA /auth/me ======================
app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.userId,
    name: req.user.name || req.user.email,
    email: req.user.email
  });
});

// ====================== ROTA DE LOGOUT ======================
app.post('/auth/logout', (req, res) => {
  // Limpa o cookie do token
  res.clearCookie('token', {
    httpOnly: true,
    secure: false,       // mantenha false em desenvolvimento
    sameSite: 'lax'
  });

  console.log('✅ Logout realizado - cookie removido');

  res.status(200).json({ 
    message: 'Logout realizado com sucesso' 
  });
});

// Rota para abrir a página de login automaticamente na raiz
app.get('/*splat', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

const PORT = 30555;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));