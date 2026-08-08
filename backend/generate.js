const fs = require('fs');
const path = require('path');

let palpite = [
    {"question": "Quantos ossos tem um adulto humano?", "answer": 206},
    {"question": "Quantos dentes tem um adulto humano?", "answer": 32},
    {"question": "Qual a altura do aro de basquete em cm?", "answer": 305},
    {"question": "Quantos dias há em um ano bissexto?", "answer": 366},
    {"question": "Quantos graus tem um círculo completo?", "answer": 360},
    {"question": "Quantos minutos tem em uma hora?", "answer": 60},
    {"question": "Quantos segundos tem em um minuto?", "answer": 60},
    {"question": "Quantas cores tem o arco-íris?", "answer": 7},
    {"question": "Quantos jogadores de linha tem um time de futebol em campo?", "answer": 11},
    {"question": "Quantos estados tem o Brasil?", "answer": 26},
    {"question": "Quantos dedos tem um ser humano (mãos e pés)?", "answer": 20},
    {"question": "Quantas letras tem o alfabeto da língua portuguesa?", "answer": 26},
    {"question": "Em que ano a segunda guerra mundial acabou?", "answer": 1945},
    {"question": "Quantos centímetros tem em um metro?", "answer": 100},
    {"question": "Quantos continentes existem no mundo?", "answer": 6},
    {"question": "Quantos peões tem em um tabuleiro de xadrez inicialmente?", "answer": 16},
    {"question": "Quantas casas tem um tabuleiro de xadrez?", "answer": 64},
    {"question": "Quantos lados tem um dodecágono?", "answer": 12},
    {"question": "Quantos lados tem um heptágono?", "answer": 7}
];

for (let i = 2; i <= 300; i++) {
    palpite.push({"question": `Quantos meses existem em ${i} anos?`, "answer": i * 12});
    palpite.push({"question": `Quantos dias existem em ${i} semanas?`, "answer": i * 7});
    palpite.push({"question": `Quantas horas tem ${i} dias?`, "answer": i * 24});
    palpite.push({"question": `Quantos minutos tem ${i} horas?`, "answer": i * 60});
    palpite.push({"question": `Quantos centímetros tem ${i} metros?`, "answer": i * 100});
}

for (let i = 1; i <= 300; i++) {
    palpite.push({"question": `Qual o resultado de ${i} multiplicado por 15?`, "answer": i * 15});
    palpite.push({"question": `Qual o resultado de ${i} multiplicado por 25?`, "answer": i * 25});
    palpite.push({"question": `Qual o resultado de ${i} multiplicado por 50?`, "answer": i * 50});
    palpite.push({"question": `Qual o triplo de ${i}?`, "answer": i * 3});
}

let idx = 0;
while (palpite.length < 5000) {
    idx++;
    palpite.push({"question": `Qual é a raiz quadrada de ${idx * idx}?`, "answer": idx});
}

// --- DUVIDO ---
let duvido = [];
try {
    const pythonContent = fs.readFileSync(path.join(__dirname, 'generate_1000.py'), 'utf-8');
    const match = pythonContent.match(/"temas_duvido_duplas":\s*\[([\s\S]*?)\]/);
    if (match) {
        const lines = match[1].split('\n')
            .filter(l => l.trim().startsWith('"'))
            .map(l => l.match(/"([^"]+)"/)[1]);
        
        duvido = lines.map(line => `Cite 2 ${line.charAt(0).toLowerCase() + line.slice(1)}`);
        console.log(`Extracted ${duvido.length} duvido questions from generate_1000.py`);
    } else {
        console.warn('Could not find temas_duvido_duplas in generate_1000.py');
    }
} catch (err) {
    console.error('Error reading generate_1000.py:', err.message);
}

// --- PROIBIDO ---
let proibido = [];
const words_list = [
    ["Gato", ["Miar", "Animal", "Rato", "Leite", "Felino"]],
    ["Cachorro", ["Latir", "Osso", "Animal", "Melhor amigo", "Mordida"]],
    ["Elefante", ["Tromba", "Grande", "África", "Peso", "Marfim"]],
    ["Leão", ["Rei", "Selva", "Rugido", "Juba", "Carnívoro"]],
    ["Tigre", ["Listras", "Feroz", "Gato", "Asiático", "Laranja"]],
    ["Macaco", ["Banana", "Árvore", "Pular", "Gorila", "Chimpanzé"]],
    ["Urso", ["Mel", "Inverno", "Hibernar", "Polar", "Pardo"]],
    ["Coelho", ["Cenoura", "Orelhas", "Pular", "Páscoa", "Rápido"]],
    ["Pássaro", ["Voar", "Asas", "Pena", "Ninho", "Céu"]],
    ["Peixe", ["Água", "Nadar", "Mar", "Aquário", "Escamas"]],
    ["Tubarão", ["Mar", "Dentes", "Perigo", "Sangue", "Filme"]],
    ["Baleia", ["Oceano", "Enorme", "Mamífero", "Água", "Azul"]],
    ["Cavalo", ["Cavalgar", "Sela", "Fazenda", "Relinchar", "Crina"]],
    ["Galinha", ["Ovo", "Pena", "Fazenda", "Cacarejar", "Galo"]],
    ["Vaca", ["Leite", "Muu", "Fazenda", "Pasto", "Queijo"]],
    ["Porco", ["Lama", "Rosa", "Bacon", "Fazenda", "Gordo"]],
    ["Cobra", ["Veneno", "Rastejar", "Picar", "Língua", "Cascavel"]],
    ["Aranha", ["Teia", "Inseto", "Oito patas", "Picar", "Medo"]],
    ["Sapo", ["Pular", "Verde", "Brejo", "Língua", "Mosca"]],
    ["Jacaré", ["Lagoa", "Dentes", "Couro", "Réptil", "Boca"]],
    ["Maçã", ["Fruta", "Branca de Neve", "Vermelha", "Árvore", "Comer"]],
    ["Banana", ["Macaco", "Amarela", "Casca", "Fruta", "Comer"]],
    ["Laranja", ["Suco", "Fruta", "Cor", "Vitamina C", "Cítrica"]],
    ["Uva", ["Vinho", "Roxa", "Cacho", "Fruta", "Suco"]],
    ["Morango", ["Vermelho", "Fruta", "Semente", "Doce", "Bolo"]],
    ["Melancia", ["Verde", "Vermelha", "Grande", "Fruta", "Caroço"]],
    ["Pizza", ["Massa", "Queijo", "Italiana", "Redonda", "Forno"]],
    ["Hambúrguer", ["Pão", "Carne", "Fast food", "Sanduíche", "Queijo"]],
    ["Batata Frita", ["Óleo", "Salgada", "Ketchup", "Fast food", "McDonalds"]],
    ["Sorvete", ["Gelado", "Doce", "Casquinha", "Sabor", "Verão"]],
    ["Chocolate", ["Cacau", "Doce", "Marrom", "Páscoa", "Derreter"]],
    ["Bolo", ["Aniversário", "Festa", "Vela", "Fatia", "Doce"]],
    ["Pão", ["Padaria", "Manteiga", "Trigo", "Comer", "Francês"]],
    ["Queijo", ["Leite", "Rato", "Amarelo", "Minas", "Comer"]],
    ["Arroz", ["Feijão", "Branco", "Grão", "Panela", "Comida"]],
    ["Feijão", ["Arroz", "Marrom", "Preto", "Caldo", "Panela"]],
    ["Macarrão", ["Massa", "Molho", "Espaguete", "Italiano", "Comer"]],
    ["Sopa", ["Quente", "Colher", "Caldo", "Frio", "Legumes"]],
    ["Salada", ["Alface", "Tomate", "Verde", "Saudável", "Dieta"]],
    ["Churrasco", ["Carne", "Fogo", "Fim de semana", "Espeto", "Carvão"]],
    ["Mesa", ["Cadeira", "Madeira", "Comer", "Sentar", "Móvel"]],
    ["Cadeira", ["Sentar", "Mesa", "Pernas", "Móvel", "Costas"]],
    ["Sofá", ["Sala", "Sentar", "Televisão", "Descansar", "Confortável"]],
    ["Cama", ["Dormir", "Quarto", "Colchão", "Travesseiro", "Deitar"]],
    ["Geladeira", ["Frio", "Comida", "Cozinha", "Gelo", "Guardar"]],
    ["Fogão", ["Fogo", "Cozinhar", "Panela", "Cozinha", "Gás"]],
    ["Televisão", ["Assistir", "Tela", "Controle", "Sala", "Canal"]],
    ["Computador", ["Internet", "Teclado", "Mouse", "Tela", "Trabalho"]],
    ["Celular", ["Ligar", "Telefone", "Tela", "Mensagem", "Internet"]],
    ["Relógio", ["Hora", "Tempo", "Pulso", "Ponteiro", "Minuto"]],
    ["Óculos", ["Olho", "Enxergar", "Lente", "Rosto", "Míope"]],
    ["Espelho", ["Reflexo", "Rosto", "Vidro", "Quebrar", "Ver"]],
    ["Livro", ["Ler", "Páginas", "História", "Papel", "Biblioteca"]],
    ["Caderno", ["Escrever", "Escola", "Folha", "Anotar", "Caneta"]],
    ["Caneta", ["Escrever", "Tinta", "Papel", "Lápis", "Azul"]],
    ["Lápis", ["Escrever", "Borracha", "Grafite", "Papel", "Apontador"]],
    ["Borracha", ["Apagar", "Lápis", "Erro", "Escola", "Papel"]],
    ["Tesoura", ["Cortar", "Papel", "Lâmina", "Cabeleireiro", "Ferramenta"]],
    ["Faca", ["Cortar", "Cozinha", "Comida", "Garfo", "Afiada"]],
    ["Garfo", ["Faca", "Comer", "Cozinha", "Dentes", "Talher"]],
    ["Colher", ["Sopa", "Comer", "Sobremesa", "Talher", "Cozinha"]],
    ["Prato", ["Comida", "Comer", "Mesa", "Vidro", "Cozinha"]],
    ["Copo", ["Beber", "Água", "Vidro", "Suco", "Boca"]],
    ["Chave", ["Porta", "Abrir", "Fechadura", "Carro", "Casa"]],
    ["Dinheiro", ["Comprar", "Banco", "Nota", "Moeda", "Rico"]],
    ["Carteira", ["Dinheiro", "Documento", "Bolso", "Guardar", "Cartão"]],
    ["Bolsa", ["Mulher", "Carregar", "Ombro", "Guardar", "Mochila"]],
    ["Mochila", ["Costas", "Escola", "Carregar", "Caderno", "Viagem"]],
    ["Guarda-chuva", ["Chuva", "Água", "Proteger", "Abrir", "Molhar"]],
    ["Toalha", ["Banho", "Secar", "Água", "Corpo", "Rosto"]],
    ["Praia", ["Areia", "Mar", "Sol", "Verão", "Onda"]],
    ["Escola", ["Estudar", "Professor", "Aluno", "Aula", "Caderno"]],
    ["Hospital", ["Médico", "Doente", "Enfermeira", "Saúde", "Remédio"]],
    ["Cinema", ["Filme", "Pipoca", "Tela", "Escuro", "Assistir"]],
    ["Parque", ["Brincar", "Árvore", "Grama", "Criança", "Ao ar livre"]],
    ["Igreja", ["Rezar", "Deus", "Missa", "Padre", "Religião"]],
    ["Banco", ["Dinheiro", "Sacar", "Conta", "Fila", "Cartão"]],
    ["Supermercado", ["Comprar", "Comida", "Carrinho", "Prateleira", "Caixa"]],
    ["Farmácia", ["Remédio", "Comprar", "Doente", "Saúde", "Receita"]],
    ["Padaria", ["Pão", "Comprar", "Manteiga", "Doce", "Leite"]],
    ["Restaurante", ["Comer", "Garçom", "Comida", "Mesa", "Conta"]],
    ["Aeroporto", ["Avião", "Viajar", "Mala", "Passagem", "Voo"]],
    ["Rodoviária", ["Ônibus", "Viajar", "Passagem", "Mala", "Estação"]],
    ["Shopping", ["Lojas", "Comprar", "Passear", "Praça de alimentação", "Cinema"]],
    ["Academia", ["Malhar", "Peso", "Exercício", "Músculo", "Suor"]],
    ["Sol", ["Calor", "Dia", "Amarelo", "Céu", "Queimar"]],
    ["Lua", ["Noite", "Céu", "Branca", "Estrela", "Lobisomem"]],
    ["Estrela", ["Céu", "Noite", "Brilhar", "Espaço", "Sol"]],
    ["Nuvem", ["Céu", "Chuva", "Branca", "Algodão", "Alto"]],
    ["Chuva", ["Água", "Cair", "Molhar", "Céu", "Nuvem"]],
    ["Vento", ["Ar", "Soprar", "Forte", "Frio", "Brisa"]],
    ["Neve", ["Frio", "Branco", "Gelo", "Inverno", "Boneco"]],
    ["Fogo", ["Queimar", "Quente", "Chama", "Incêndio", "Fumaça"]],
    ["Água", ["Beber", "Líquido", "Sede", "Molhar", "Rio"]],
    ["Terra", ["Chão", "Planeta", "Plantar", "Sujeira", "Marrom"]],
    ["Árvore", ["Planta", "Folha", "Madeira", "Verde", "Raiz"]],
    ["Flor", ["Pétala", "Jardim", "Cheiro", "Rosa", "Planta"]],
    ["Música", ["Tocar", "Ouvir", "Cantar", "Som", "Banda"]],
    ["Festa", ["Música", "Dança", "Comemorar", "Bolo", "Bebida"]],
    ["Casamento", ["Noiva", "Festa", "Igreja", "Aliança", "Amor"]],
    ["Guitarra", ["Instrumento", "Corda", "Tocar", "Rock", "Banda"]],
    ["Bateria", ["Instrumento", "Tocar", "Banda", "Baqueta", "Som"]],
    ["Piano", ["Teclado", "Tocar", "Música", "Preto", "Branco"]],
    ["Violão", ["Acústico", "Tocar", "Corda", "Música", "Cantor"]],
    ["Bicicleta", ["Pedalar", "Roda", "Andar", "Guidão", "Pneu"]],
    ["Carro", ["Dirigir", "Roda", "Motor", "Veículo", "Volante"]],
    ["Avião", ["Voar", "Céu", "Piloto", "Viagem", "Asa"]],
    ["Navio", ["Mar", "Água", "Barco", "Oceano", "Cruzeiro"]],
    ["Trem", ["Trilho", "Vagão", "Estação", "Viagem", "Locomotiva"]],
    ["Helicóptero", ["Voar", "Hélice", "Céu", "Piloto", "Ar"]],
    ["Caminhão", ["Carga", "Estrada", "Dirigir", "Motorista", "Grande"]],
    ["Foguete", ["Espaço", "Astronauta", "Lua", "Planeta", "Lançar"]],
    ["Computador", ["Teclado", "Mouse", "Tela", "Internet", "Trabalhar"]],
    ["Mouse", ["Computador", "Clicar", "Seta", "Botão", "Rato"]],
    ["Teclado", ["Digitar", "Computador", "Letras", "Escrever", "Botão"]],
    ["Câmera", ["Foto", "Tirar", "Imagem", "Lente", "Flash"]],
    ["Microfone", ["Falar", "Cantar", "Som", "Voz", "Áudio"]]
];

for (let [word, forb] of words_list) {
    proibido.push({"word": word, "forbidden": forb});
}

// --- IMPOSTOR ---
const impostor = [
    "Qual é a sua relação com isso?",
    "Onde você costuma encontrar isso?",
    "Quando foi a última vez que você viu ou usou isso?",
    "Que cor ou forma isso costuma ter?",
    "Se você pudesse descrever isso em uma palavra, qual seria?",
    "Qual o tamanho aproximado disso?",
    "Isso é mais usado por adultos ou crianças?",
    "Isso faz algum tipo de barulho?",
    "Você acha que isso é algo caro ou barato?",
    "Você levaria isso para uma viagem?"
];

// Preserve 'nota'
let nota = [];
const dataFilePath = path.join(__dirname, 'data', 'perguntas.json');
if (fs.existsSync(dataFilePath)) {
    const oldData = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
    nota = oldData.nota || [];
}

const data = {
    palpite,
    duvido,
    proibido,
    impostor,
    nota
};

if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
}
fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');

console.log(`Generated ${palpite.length} palpite, ${duvido.length} duvido, ${proibido.length} proibido items.`);
