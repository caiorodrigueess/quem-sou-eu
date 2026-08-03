const fs = require('fs');
const content = fs.readFileSync('backend/generate_1000.py', 'utf-8');
const match = content.match(/"temas_duvido_duplas":\s*\[([\s\S]*?)\]/);
if (match) {
    const lines = match[1].split('\n').filter(l => l.trim().startsWith('"')).map(l => l.match(/"([^"]+)"/)[1]);
    console.log('Found', lines.length, 'questions');
    
    const p = JSON.parse(fs.readFileSync('backend/data/perguntas.json', 'utf-8'));
    p.duvido = lines.map(line => `Cite 2 ${line.charAt(0).toLowerCase() + line.slice(1)}`);
    fs.writeFileSync('backend/data/perguntas.json', JSON.stringify(p, null, 2));
    console.log('Updated perguntas.json with new duvido list');
} else {
    console.log('Could not find temas_duvido_duplas array');
}
