import json
import random
import os

# --- PALPITE (1000+ items) ---
palpite = []
# Base facts
base_palpite = [
    {"question": "Quantos ossos tem um adulto humano?", "answer": 206},
    {"question": "Quantos dentes tem um adulto humano?", "answer": 32},
    {"question": "Qual a altura do aro de basquete em cm?", "answer": 305},
    {"question": "Quantos dias há em um ano bissexto?", "answer": 366},
    {"question": "Quantos graus tem um círculo completo?", "answer": 360}
]
palpite.extend(base_palpite)

# Procedural generation for Palpite
for i in range(2, 151):
    palpite.append({"question": f"Quantos meses existem em {i} anos?", "answer": i * 12})
    palpite.append({"question": f"Quantos dias existem em {i} semanas?", "answer": i * 7})
    palpite.append({"question": f"Quantas horas tem {i} dias?", "answer": i * 24})

for i in range(1, 151):
    palpite.append({"question": f"Qual o resultado de {i} multiplicado por 15?", "answer": i * 15})
    palpite.append({"question": f"Qual o resultado de {i} multiplicado por 25?", "answer": i * 25})
    palpite.append({"question": f"Qual o resultado de {i} multiplicado por 50?", "answer": i * 50})
    palpite.append({"question": f"Quantos centímetros existem em {i} metros?", "answer": i * 100})

idx = 0
while len(palpite) < 1100:
    idx += 1
    palpite.append({"question": f"Qual é a raiz quadrada de {idx * idx}?", "answer": idx})


# --- DUVIDO (1300 items) ---
duvido = []
# Lista de categorias gerais
categorias = [
    "animais", "frutas", "cidades", "países", "objetos", "profissões", 
    "filmes", "marcas", "bandas", "instrumentos musicais", "esportes", 
    "comidas", "personagens", "jogos", "partes do corpo", "times de futebol", 
    "carros", "idiomas", "doces", "bebidas", "roupas", "eletrodomésticos", 
    "insetos", "pássaros", "peixes", "atores", "cantores", "séries de TV", 
    "desenhos animados", "super-heróis", "vilões", "brinquedos", "livros"
]

# Templates de desafios variados
templates_desafios = [
    # Restrições de Adjetivo / Cor / Tamanho
    "Cite 3 {cat} que são da cor vermelha ou amarela",
    "Cite 2 {cat} que cabem dentro de uma caixa de sapatos",
    "Cite 3 {cat} que são considerados gigantes ou muito grandes",
    "Cite 2 {cat} que são redondos ou ovais",
    "Cite 2 {cat} que cheiram muito bem",
    "Cite 2 {cat} que são perigosos ou assustadores",

    # Restrições de Contexto / Local / Uso
    "Cite 3 {cat} que você encontraria em uma praia",
    "Cite 3 {cat} que existem/faria em uma festa de aniversário",
    "Cite 2 {cat} que você usaria ou veria num dia de chuva",
    "Cite 3 {cat} que você costuma ver numa cozinha",
    "Cite 2 {cat} que são famosos nos anos 90 ou 2000",
    "Cite 2 {cat} que só existem fora do Brasil",

    # Restrições Estruturais / Gramaticais / Números
    "Cite 2 {cat} cujo nome tem exatamente 4 letras",
    "Cite 2 {cat} cujo nome tem pelo menos 3 sílabas",
    "Cite 2 {cat} que terminam com a letra 'A'",
    "Cite 2 {cat} cujo nome é composto por duas palavras",
    "Cite 2 {cat} que contêm a letra 'Z' ou 'X' no nome",

    # Desafios Rápido / Comparativos / Preferência
    "Cite 3 {cat} que a maioria das crianças adora",
    "Cite 2 {cat} que quase ninguém gosta ou acha chato",
    "Cite 3 {cat} que custam mais de 1000 reais",
    "Cite 2 {cat} que não usam eletricidade/bateria",
    "Cite 3 {cat} que você pode comprar no supermercado"
]

# Gerando as combinações
for cat in categorias:
    for t in templates_desafios:
        desafio = t.format(cat=cat)
        duvido.append(desafio)


# --- PROIBIDO (100+ items) ---
proibido = []

words_list = [
    # Animais
    ("Gato", ["Miar", "Animal", "Rato", "Leite", "Felino"]),
    ("Cachorro", ["Latir", "Osso", "Animal", "Melhor amigo", "Mordida"]),
    ("Elefante", ["Tromba", "Grande", "África", "Peso", "Marfim"]),
    ("Leão", ["Rei", "Selva", "Rugido", "Juba", "Carnívoro"]),
    ("Tigre", ["Listras", "Feroz", "Gato", "Asiático", "Laranja"]),
    ("Macaco", ["Banana", "Árvore", "Pular", "Gorila", "Chimpanzé"]),
    ("Urso", ["Mel", "Inverno", "Hibernar", "Polar", "Pardo"]),
    ("Coelho", ["Cenoura", "Orelhas", "Pular", "Páscoa", "Rápido"]),
    ("Pássaro", ["Voar", "Asas", "Pena", "Ninho", "Céu"]),
    ("Peixe", ["Água", "Nadar", "Mar", "Aquário", "Escamas"]),
    ("Tubarão", ["Mar", "Dentes", "Perigo", "Sangue", "Filme"]),
    ("Baleia", ["Oceano", "Enorme", "Mamífero", "Água", "Azul"]),
    ("Cavalo", ["Cavalgar", "Sela", "Fazenda", "Relinchar", "Crina"]),
    ("Galinha", ["Ovo", "Pena", "Fazenda", "Cacarejar", "Galo"]),
    ("Vaca", ["Leite", "Muu", "Fazenda", "Pasto", "Queijo"]),
    ("Porco", ["Lama", "Rosa", "Bacon", "Fazenda", "Gordo"]),
    ("Cobra", ["Veneno", "Rastejar", "Picar", "Língua", "Cascavel"]),
    ("Aranha", ["Teia", "Inseto", "Oito patas", "Picar", "Medo"]),
    ("Sapo", ["Pular", "Verde", "Brejo", "Língua", "Mosca"]),
    ("Jacaré", ["Lagoa", "Dentes", "Couro", "Réptil", "Boca"]),
    
    # Comidas
    ("Maçã", ["Fruta", "Branca de Neve", "Vermelha", "Árvore", "Comer"]),
    ("Banana", ["Macaco", "Amarela", "Casca", "Fruta", "Comer"]),
    ("Laranja", ["Suco", "Fruta", "Cor", "Vitamina C", "Cítrica"]),
    ("Uva", ["Vinho", "Roxa", "Cacho", "Fruta", "Suco"]),
    ("Morango", ["Vermelho", "Fruta", "Semente", "Doce", "Bolo"]),
    ("Melancia", ["Verde", "Vermelha", "Grande", "Fruta", "Caroço"]),
    ("Pizza", ["Massa", "Queijo", "Italiana", "Redonda", "Forno"]),
    ("Hambúrguer", ["Pão", "Carne", "Fast food", "Sanduíche", "Queijo"]),
    ("Batata Frita", ["Óleo", "Salgada", "Ketchup", "Fast food", "McDonalds"]),
    ("Sorvete", ["Gelado", "Doce", "Casquinha", "Sabor", "Verão"]),
    ("Chocolate", ["Cacau", "Doce", "Marrom", "Páscoa", "Derreter"]),
    ("Bolo", ["Aniversário", "Festa", "Vela", "Fatia", "Doce"]),
    ("Pão", ["Padaria", "Manteiga", "Trigo", "Comer", "Francês"]),
    ("Queijo", ["Leite", "Rato", "Amarelo", "Minas", "Comer"]),
    ("Arroz", ["Feijão", "Branco", "Grão", "Panela", "Comida"]),
    ("Feijão", ["Arroz", "Marrom", "Preto", "Caldo", "Panela"]),
    ("Macarrão", ["Massa", "Molho", "Espaguete", "Italiano", "Comer"]),
    ("Sopa", ["Quente", "Colher", "Caldo", "Frio", "Legumes"]),
    ("Salada", ["Alface", "Tomate", "Verde", "Saudável", "Dieta"]),
    ("Churrasco", ["Carne", "Fogo", "Fim de semana", "Espeto", "Carvão"]),
    
    # Objetos
    ("Mesa", ["Cadeira", "Madeira", "Comer", "Sentar", "Móvel"]),
    ("Cadeira", ["Sentar", "Mesa", "Pernas", "Móvel", "Costas"]),
    ("Sofá", ["Sala", "Sentar", "Televisão", "Descansar", "Confortável"]),
    ("Cama", ["Dormir", "Quarto", "Colchão", "Travesseiro", "Deitar"]),
    ("Geladeira", ["Frio", "Comida", "Cozinha", "Gelo", "Guardar"]),
    ("Fogão", ["Fogo", "Cozinhar", "Panela", "Cozinha", "Gás"]),
    ("Televisão", ["Assistir", "Tela", "Controle", "Sala", "Canal"]),
    ("Computador", ["Internet", "Teclado", "Mouse", "Tela", "Trabalho"]),
    ("Celular", ["Ligar", "Telefone", "Tela", "Mensagem", "Internet"]),
    ("Relógio", ["Hora", "Tempo", "Pulso", "Ponteiro", "Minuto"]),
    ("Óculos", ["Olho", "Enxergar", "Lente", "Rosto", "Míope"]),
    ("Espelho", ["Reflexo", "Rosto", "Vidro", "Quebrar", "Ver"]),
    ("Livro", ["Ler", "Páginas", "História", "Papel", "Biblioteca"]),
    ("Caderno", ["Escrever", "Escola", "Folha", "Anotar", "Caneta"]),
    ("Caneta", ["Escrever", "Tinta", "Papel", "Lápis", "Azul"]),
    ("Lápis", ["Escrever", "Borracha", "Grafite", "Papel", "Apontador"]),
    ("Borracha", ["Apagar", "Lápis", "Erro", "Escola", "Papel"]),
    ("Tesoura", ["Cortar", "Papel", "Lâmina", "Cabeleireiro", "Ferramenta"]),
    ("Faca", ["Cortar", "Cozinha", "Comida", "Garfo", "Afiada"]),
    ("Garfo", ["Faca", "Comer", "Cozinha", "Dentes", "Talher"]),
    ("Colher", ["Sopa", "Comer", "Sobremesa", "Talher", "Cozinha"]),
    ("Prato", ["Comida", "Comer", "Mesa", "Vidro", "Cozinha"]),
    ("Copo", ["Beber", "Água", "Vidro", "Suco", "Boca"]),
    ("Chave", ["Porta", "Abrir", "Fechadura", "Carro", "Casa"]),
    ("Dinheiro", ["Comprar", "Banco", "Nota", "Moeda", "Rico"]),
    ("Carteira", ["Dinheiro", "Documento", "Bolso", "Guardar", "Cartão"]),
    ("Bolsa", ["Mulher", "Carregar", "Ombro", "Guardar", "Mochila"]),
    ("Mochila", ["Costas", "Escola", "Carregar", "Caderno", "Viagem"]),
    ("Guarda-chuva", ["Chuva", "Água", "Proteger", "Abrir", "Molhar"]),
    ("Toalha", ["Banho", "Secar", "Água", "Corpo", "Rosto"]),
    
    # Lugares
    ("Praia", ["Areia", "Mar", "Sol", "Verão", "Onda"]),
    ("Escola", ["Estudar", "Professor", "Aluno", "Aula", "Caderno"]),
    ("Hospital", ["Médico", "Doente", "Enfermeira", "Saúde", "Remédio"]),
    ("Cinema", ["Filme", "Pipoca", "Tela", "Escuro", "Assistir"]),
    ("Parque", ["Brincar", "Árvore", "Grama", "Criança", "Ao ar livre"]),
    ("Igreja", ["Rezar", "Deus", "Missa", "Padre", "Religião"]),
    ("Banco", ["Dinheiro", "Sacar", "Conta", "Fila", "Cartão"]),
    ("Supermercado", ["Comprar", "Comida", "Carrinho", "Prateleira", "Caixa"]),
    ("Farmácia", ["Remédio", "Comprar", "Doente", "Saúde", "Receita"]),
    ("Padaria", ["Pão", "Comprar", "Manteiga", "Doce", "Leite"]),
    ("Restaurante", ["Comer", "Garçom", "Comida", "Mesa", "Conta"]),
    ("Aeroporto", ["Avião", "Viajar", "Mala", "Passagem", "Voo"]),
    ("Rodoviária", ["Ônibus", "Viajar", "Passagem", "Mala", "Estação"]),
    ("Shopping", ["Lojas", "Comprar", "Passear", "Praça de alimentação", "Cinema"]),
    ("Academia", ["Malhar", "Peso", "Exercício", "Músculo", "Suor"]),
    
    # Natureza / Diversos
    ("Sol", ["Calor", "Dia", "Amarelo", "Céu", "Queimar"]),
    ("Lua", ["Noite", "Céu", "Branca", "Estrela", "Lobisomem"]),
    ("Estrela", ["Céu", "Noite", "Brilhar", "Espaço", "Sol"]),
    ("Nuvem", ["Céu", "Chuva", "Branca", "Algodão", "Alto"]),
    ("Chuva", ["Água", "Cair", "Molhar", "Céu", "Nuvem"]),
    ("Vento", ["Ar", "Soprar", "Forte", "Frio", "Brisa"]),
    ("Neve", ["Frio", "Branco", "Gelo", "Inverno", "Boneco"]),
    ("Fogo", ["Queimar", "Quente", "Chama", "Incêndio", "Fumaça"]),
    ("Água", ["Beber", "Líquido", "Sede", "Molhar", "Rio"]),
    ("Terra", ["Chão", "Planeta", "Plantar", "Sujeira", "Marrom"]),
    ("Árvore", ["Planta", "Folha", "Madeira", "Verde", "Raiz"]),
    ("Flor", ["Pétala", "Jardim", "Cheiro", "Rosa", "Planta"]),
    ("Música", ["Tocar", "Ouvir", "Cantar", "Som", "Banda"]),
    ("Festa", ["Música", "Dança", "Comemorar", "Bolo", "Bebida"]),
    ("Casamento", ["Noiva", "Festa", "Igreja", "Aliança", "Amor"]),
]

for word, forb in words_list:
    proibido.append({"word": word, "forbidden": forb})

# Impostor
impostor = [
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
]

data = {
    "palpite": palpite,
    "duvido": duvido,
    "proibido": proibido,
    "impostor": impostor
}

os.makedirs('data', exist_ok=True)
with open('data/perguntas.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Generated {len(palpite)} palpite, {len(duvido)} duvido, {len(proibido)} proibido items.")
