const express = require('express');
const app = express();
app.use(express.json());
app.set('json spaces', 2);

// ============ ARRAYS EM MEMÓRIA ============
let filmes = [
    { id: 1, titulo: "Matrix", genero: "Ficção Científica", ano_lancamento: 1999 },
    { id: 2, titulo: "O Poderoso Chefão", genero: "Drama", ano_lancamento: 1972 },
    { id: 3, titulo: "Parasita", genero: "Suspense", ano_lancamento: 2019 }
];

let usuarios = [
    { id: 1, nome: "João Silva", email: "joao@email.com", plano: "Premium" },
    { id: 2, nome: "Maria Santos", email: "maria@email.com", plano: "Básico" },
    { id: 3, nome: "Pedro Costa", email: "pedro@email.com", plano: "Premium" }
];

let favoritos = [
    { id: 1, id_usuario: 1, id_filme: 1 },
    { id: 2, id_usuario: 1, id_filme: 2 },
    { id: 3, id_usuario: 2, id_filme: 3 }
];

// Contadores para IDs
let nextFilmeId = 4;
let nextUsuarioId = 4;
let nextFavoritoId = 4;

// ============ GESTÃO DE FILMES ============

// GET /filmes - Listar todos os filmes
app.get('/filmes', (req, res) => {
    res.json(filmes);
});

// POST /filmes - Cadastrar novo filme
app.post('/filmes', (req, res) => {
    const { titulo, genero, ano_lancamento } = req.body;
    
    // Validação simples
    if (!titulo || !genero || !ano_lancamento) {
        return res.status(400).json({ erro: "Dados incompletos. Necessário: titulo, genero, ano_lancamento" });
    }
    
    const novoFilme = {
        id: nextFilmeId++,
        titulo,
        genero,
        ano_lancamento
    };
    
    filmes.push(novoFilme);
    res.status(201).json(novoFilme);
});

// DELETE /filmes/:id - Remover filme
app.delete('/filmes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = filmes.findIndex(f => f.id === id);
    
    if (index === -1) {
        return res.status(404).json({ erro: "Filme não encontrado" });
    }
    
    // Remove também dos favoritos
    favoritos = favoritos.filter(fav => fav.id_filme !== id);
    
    filmes.splice(index, 1);
    res.json({ mensagem: "Filme removido com sucesso" });
});

// ============ GESTÃO DE USUÁRIOS ============

// GET /usuarios - Listar todos os usuários
app.get('/usuarios', (req, res) => {
    res.json(usuarios);
});

// POST /usuarios - Cadastrar novo usuário
app.post('/usuarios', (req, res) => {
    const { nome, email, plano } = req.body;
    
    // Validação simples
    if (!nome || !email || !plano) {
        return res.status(400).json({ erro: "Dados incompletos. Necessário: nome, email, plano" });
    }
    
    // Validação de plano
    if (plano !== 'Básico' && plano !== 'Premium') {
        return res.status(400).json({ erro: "Plano inválido. Use 'Básico' ou 'Premium'" });
    }
    
    const novoUsuario = {
        id: nextUsuarioId++,
        nome,
        email,
        plano
    };
    
    usuarios.push(novoUsuario);
    res.status(201).json(novoUsuario);
});

// PUT /usuarios/:id - Atualizar usuário
app.put('/usuarios/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nome, email, plano } = req.body;
    const usuario = usuarios.find(u => u.id === id);
    
    if (!usuario) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    
    // Validação de plano
    if (plano && plano !== 'Básico' && plano !== 'Premium') {
        return res.status(400).json({ erro: "Plano inválido. Use 'Básico' ou 'Premium'" });
    }
    
    // Atualiza apenas campos fornecidos
    if (nome) usuario.nome = nome;
    if (email) usuario.email = email;
    if (plano) usuario.plano = plano;
    
    res.json(usuario);
});

// ============ SISTEMA DE FAVORITOS ============

// POST /favoritos - Adicionar favorito
app.post('/favoritos', (req, res) => {
    const { id_usuario, id_filme } = req.body;
    
    if (!id_usuario || !id_filme) {
        return res.status(400).json({ erro: "Dados incompletos. Necessário: id_usuario, id_filme" });
    }
    
    // Verifica se usuário existe
    const usuarioExiste = usuarios.some(u => u.id === id_usuario);
    if (!usuarioExiste) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    
    // Verifica se filme existe
    const filmeExiste = filmes.some(f => f.id === id_filme);
    if (!filmeExiste) {
        return res.status(404).json({ erro: "Filme não encontrado" });
    }
    
    // Verifica se já existe favorito (evita duplicatas)
    const favoritoExistente = favoritos.find(f => 
        f.id_usuario === id_usuario && f.id_filme === id_filme
    );
    
    if (favoritoExistente) {
        return res.status(409).json({ erro: "Este filme já está nos favoritos deste usuário" });
    }
    
    const novoFavorito = {
        id: nextFavoritoId++,
        id_usuario,
        id_filme
    };
    
    favoritos.push(novoFavorito);
    res.status(201).json(novoFavorito);
});

// GET /favoritos - Listar todos os favoritos
app.get('/favoritos', (req, res) => {
    // Enriquece os dados com informações de usuário e filme
    const favoritosEnriquecidos = favoritos.map(fav => {
        const usuario = usuarios.find(u => u.id === fav.id_usuario);
        const filme = filmes.find(f => f.id === fav.id_filme);
        
        return {
            id: fav.id,
            usuario: usuario ? { id: usuario.id, nome: usuario.nome } : null,
            filme: filme ? { id: filme.id, titulo: filme.titulo } : null
        };
    });
    
    res.json(favoritosEnriquecidos);
});

// GET /favoritos/usuario/:id_usuario - Listar favoritos de um usuário
app.get('/favoritos/usuario/:id_usuario', (req, res) => {
    const id_usuario = parseInt(req.params.id_usuario);
    
    // Verifica se usuário existe
    const usuarioExiste = usuarios.some(u => u.id === id_usuario);
    if (!usuarioExiste) {
        return res.status(404).json({ erro: "Usuário não encontrado" });
    }
    
    // Filtra favoritos do usuário
    const favoritosUsuario = favoritos
        .filter(fav => fav.id_usuario === id_usuario)
        .map(fav => {
            const filme = filmes.find(f => f.id === fav.id_filme);
            return filme || null;
        })
        .filter(filme => filme !== null); // Remove filmes que não existem mais
    
    res.json({
        usuario: usuarios.find(u => u.id === id_usuario),
        filmes_favoritos: favoritosUsuario
    });
});

// ============ INICIALIZAÇÃO ============
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 CineStream API rodando em http://localhost:${PORT}`);
    console.log('📁 Arrays em memória inicializados com dados de exemplo');
});

app.get('/', (req, res) => {
    res.json({
        mensagem: "Bem-vindo à CineStream API!",
        rotas_disponiveis: {
            filmes: "/filmes",
            usuarios: "/usuarios",
            favoritos: "/favoritos",
            favoritos_usuario: "/favoritos/usuario/:id"
        }
    });
});