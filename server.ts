import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import mammoth from 'mammoth';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post('/api/parse-word', upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const result = await mammoth.extractRawText({ buffer: req.file.buffer });
      res.json({ text: result.value });
    } catch (error) {
      console.error('Error parsing word file:', error);
      res.status(500).json({ error: 'Failed to parse word file' });
    }
  });

  app.post('/api/generate-questions', async (req, res) => {
    try {
      const { topic, count } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
      }

      const genAI = new GoogleGenAI({ apiKey });
      const response = await genAI.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Hãy tạo ${count || 10} câu hỏi trắc nghiệm về chủ đề: ${topic}. 
        Mỗi câu hỏi có 4 phương án (A, B, C, D) và 1 đáp án đúng.
        Trả về kết quả dưới dạng JSON array với cấu trúc: 
        [
          {
            "question": "Nội dung câu hỏi",
            "options": ["A...", "B...", "C...", "D..."],
            "correctAnswer": 0 (index của đáp án đúng trong mảng options)
          }
        ]
        Chỉ trả về JSON, không kèm giải thích.`,
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      res.json(JSON.parse(text));
    } catch (error) {
      console.error('Error generating questions:', error);
      res.status(500).json({ error: 'Failed to generate questions' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
