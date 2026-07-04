require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const config = require('./config');

const app = express();

// CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8080'],
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/houses', require('./routes/houses'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: '服务器内部错误' });
});

// Connect to MongoDB with in-memory fallback
async function start() {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('MongoDB 连接成功');
  } catch (err) {
    console.warn('MongoDB 连接失败，尝试使用内存数据库...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri);
      console.log('MongoDB 内存数据库启动成功');
    } catch (memErr) {
      console.error('内存数据库启动失败:', memErr);
      process.exit(1);
    }
  }

  app.listen(config.port, () => {
    console.log(`服务器启动成功 http://localhost:${config.port}`);
  });
}

start();

// Handle mongoose connection error after initial connection
mongoose.connection.on('error', (err) => {
  console.error('MongoDB 连接异常:', err);
});

module.exports = app;
