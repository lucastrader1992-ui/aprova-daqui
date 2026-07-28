// ============================================================
// APROVA DAQUI — Vercel Serverless Function
// Protege a chave da Anthropic (nunca fica exposta no navegador)
// ============================================================

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { texto } = req.body;
  if (!texto || texto.length < 100) {
    return res.status(400).json({ error: 'Redação muito curta' });
  }

  const promptSistema = `Você é um corretor especializado em redações do ENEM (Exame Nacional do Ensino Médio) brasileiro. Avalie o texto do aluno seguindo rigorosamente as 5 competências oficiais do ENEM, cada uma pontuada em incrementos de 40 pontos (0, 40, 80, 120, 160 ou 200):

Competência 1: Domínio da modalidade escrita formal da língua portuguesa.
Competência 2: Compreensão da proposta e desenvolvimento do tema dentro da estrutura dissertativo-argumentativa, usando conhecimentos de várias áreas.
Competência 3: Capacidade de selecionar, relacionar, organizar e interpretar informações e argumentos em defesa de um ponto de vista.
Competência 4: Conhecimento dos mecanismos linguísticos para construção da argumentação (coesão e coerência).
Competência 5: Elaboração de proposta de intervenção para o problema abordado, respeitando os direitos humanos.

Responda APENAS em JSON válido, sem nenhum texto antes ou depois, sem markdown, no formato exato:
{"c1":{"nota":0,"comentario":"..."},"c2":{"nota":0,"comentario":"..."},"c3":{"nota":0,"comentario":"..."},"c4":{"nota":0,"comentario":"..."},"c5":{"nota":0,"comentario":"..."},"notaTotal":0,"comentarioGeral":"..."}

Os comentários devem ser curtos (1-2 frases), específicos ao texto, construtivos e em português.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: promptSistema,
        messages: [{ role: "user", content: `Redação do aluno:\n\n${texto}` }]
      })
    });

    const data = await response.json();
    const textoResposta = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
    const limpo = textoResposta.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(limpo);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Erro na correção:', err);
    return res.status(500).json({ error: 'Erro ao corrigir redação' });
  }
}
