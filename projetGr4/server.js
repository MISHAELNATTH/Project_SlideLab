import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static('.'));

const contentDir = path.join(__dirname, 'src', 'content');

// Ensure content directory exists
if (!fs.existsSync(contentDir)) {
  fs.mkdirSync(contentDir, { recursive: true });
}

// Save slide endpoint
app.post('/api/save-slide', (req, res) => {
  try {
    const { slideIndex, html } = req.body;
    
    if (slideIndex === undefined || !html) {
      return res.status(400).json({ error: 'Missing slideIndex or html' });
    }

    const filename = `slide-${slideIndex + 1}.html`;
    const filepath = path.join(contentDir, filename);

    fs.writeFileSync(filepath, html, 'utf8');
    
    res.json({ 
      success: true, 
      message: `Slide saved to ${filename}`,
      path: filename 
    });
  } catch (error) {
    console.error('Error saving slide:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all slides
app.get('/api/slides', (req, res) => {
  try {
    const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.html'));
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Slides will be saved to: ${contentDir}`);
});
