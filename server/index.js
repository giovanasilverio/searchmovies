import express from 'express';
import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const OMDB_API_KEY = process.env.OMDB_API_KEY; 

// Rota que o Angular vai chamar
app.get('/api/omdb', async (req, res) => {
  const { title } = req.query;

  if (!title) {
    return res.status(400).json({ error: 'Parâmetro "title" é obrigatório.' });
  }

  try {
    const response = await axios.get('http://www.omdbapi.com/', {
      params: {
        apikey: OMDB_API_KEY,
        t: title,
        type: 'movie' // filtra só filmes
      }
    });

    const data = response.data;

    if (data.Response === 'False') {
      return res.status(404).json({ error: data.Error });
    }

    // Enviamos pro front só o que você quer
    res.json({
      title: data.Title,
      rating: data.imdbRating,
      plot: data.Plot,
      poster: data.Poster
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao consultar OMDb.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor Express rodando na porta ${PORT}`);
});
