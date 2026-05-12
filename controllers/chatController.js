import db from '../database.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Prompt del sistema: Valentina - Asesora Comercial de Escalab
const SYSTEM_PROMPT = `Eres Valentina, asesora comercial de Escalab. Tu misión no es solo vender, sino entender genuinamente el negocio de quien te habla para ver cómo Escalab puede ayudarlos a escalar de verdad.

## PERSONALIDAD
- Eres cálida, empática y profesional. Te apasiona el crecimiento de las empresas.
- Lenguaje latinoamericano natural (tuteo, cercano pero respetuoso).
- No respondas como un robot; si el usuario cuenta algo de su negocio, valida su esfuerzo y muestra curiosidad.
- UNA sola pregunta por mensaje para mantener la fluidez.

## FLUJO DE INTERÉS GENUINO

**Paso 1 — Conexión y Curiosidad**
Cuando alguien llega, interésate por su sector. No saltes a vender.
"¡Hola! Qué gusto saludarte. Cuéntame, ¿a qué se dedica tu empresa? Me encantaría conocer más."

**Paso 2 — Profundiza en el Desafío (Dolor)**
Escucha lo que dicen y haz preguntas que demuestren que entiendes su mundo:
- "¿Y cómo están manejando el volumen de leads que les llega hoy? ¿Sienten que se les escapa alguno?"
- "Ese es un sector movido. ¿Tienen a alguien dedicado 100% al seguimiento o lo haces tú mismo con otras tareas?"

**Paso 3 — Comparte Valor y Visión**
Solo cuando entiendas su problema, menciona cómo Escalab lo resuelve:
"Entiendo perfectamente. Justo eso es lo que atacamos: automatizamos ese seguimiento tedioso para que tú te enfoques en cerrar, no en perseguir."

**Paso 4 — Transición Natural al Formulario**
Cuando haya interés o el usuario pida asesoría, activa 'mostrar_formulario'.
NO dejes de ser cálida al hacerlo:
"Para darte una propuesta que de verdad te sirva, necesito que un especialista vea tus números. ¿Te parece si te contactamos? Completa estos datos y coordinamos:"

## REGLAS DE ORO
1. NUNCA des precios exactos; el valor es personalizado.
2. Muestra INTERÉS REAL. Si te dicen que venden zapatos, no digas "ok", di "¡Qué bien! El e-commerce de calzado ha crecido mucho, ¿cómo les va con el tráfico?".
3. El formulario es el cierre de una buena charla, no el inicio.
4. Si el usuario se siente frío, ofrece enviar info por WhatsApp como un gesto de ayuda, no de presión.`;

// Definición de la herramienta/función para OpenAI
const tools = [
  {
    type: "function",
    function: {
      name: "mostrar_formulario",
      description: "Muestra un formulario interactivo en el chat para capturar el Nombre, Correo, Empresa y Teléfono/WhatsApp del usuario, cuando este demuestra interés en contratar o saber más.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  }
];

// Obtener el historial de chat de una sesión específica
export const getMessages = async (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId) return res.json([]); // Si no hay sesión, devolver vacío

  try {
    const result = await db.query(
      'SELECT * FROM messages WHERE session_id = $1 ORDER BY id ASC',
      [sessionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los mensajes' });
  }
};

// Enviar un nuevo mensaje y recibir respuesta de la IA
export const sendMessage = async (req, res) => {
  const { text } = req.body;
  const sessionId = req.headers['x-session-id'];

  if (!text) return res.status(400).json({ error: 'El texto del mensaje es obligatorio' });
  if (!sessionId) return res.status(400).json({ error: 'El ID de sesión es obligatorio' });

  try {
    // 1. Guardar el mensaje del usuario con su sessionId
    const userInsertResult = await db.query(
      'INSERT INTO messages (text, sender, session_id) VALUES ($1, $2, $3) RETURNING id',
      [text, 'user', sessionId]
    );
    const userMessageId = userInsertResult.rows[0].id;

    // 2. Obtener historial reciente de ESTA SESIÓN para contexto
    const historyResult = await db.query(
      'SELECT * FROM messages WHERE session_id = $1 ORDER BY id DESC LIMIT 10',
      [sessionId]
    );
    
    const history = historyResult.rows.reverse().map(msg => ({
      role: msg.sender === 'ai' ? 'assistant' : 'user',
      content: msg.text
    }));

    const messagesForOpenAI = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history
    ];

    // 3. Llamar a la API de OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesForOpenAI,
      temperature: 0.7,
      tools: tools,
      tool_choice: "auto",
    });

    const responseMessage = completion.choices[0].message;
    let aiResponseText = responseMessage.content;

    // 4. Revisar si OpenAI decidió llamar a una función
    let isForm = false;
    
    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0];
      if (toolCall.function.name === "mostrar_formulario") {
        isForm = true;
        // Mantener el texto original de Valentina y añadir el disparador del formulario
        const originalText = aiResponseText || "¡Excelente decisión! Por favor, completa este breve formulario y un especialista te contactará de inmediato:";
        aiResponseText = originalText + "\n\n[FORMULARIO]";
      }
    }

    // 5. Si no hay texto (caso raro), asignar un fallback
    if (!aiResponseText) aiResponseText = "Entendido. ¿Cuéntame un poco más sobre tu negocio?";

    // 6. Guardar la respuesta de la IA vinculada a la sesión
    const aiInsertResult = await db.query(
      'INSERT INTO messages (text, sender, session_id, is_form) VALUES ($1, $2, $3, $4) RETURNING id',
      [aiResponseText, 'ai', sessionId, isForm]
    );
    const aiMessageId = aiInsertResult.rows[0].id;

    // 7. Responder al frontend
    res.json({
      success: true,
      userMessage: { id: userMessageId, text, sender: 'user' },
      aiMessage: { id: aiMessageId, text: aiResponseText, sender: 'ai', isForm }
    });

  } catch (error) {
    console.error('Error en sendMessage:', error);
    res.status(500).json({ error: 'Error procesando el mensaje' });
  }
};

// Generar una reacción ultra rápida basada en la categoría del negocio
export const getReaction = async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: 'Categoría requerida' });

  try {
    const prompt = `Eres una IA de ventas de Escalab. El usuario acaba de decir que su negocio es de la categoría: "${category}".
Da una reacción ultra corta (MÁXIMO 10 palabras) validando su sector con entusiasmo. 
NO HAGAS PREGUNTAS. Solo valida y motiva.
Ejemplo si es educación: "¡Increíble sector! La educación es clave para escalar hoy."
Ejemplo si es restaurante: "¡Delicioso! Los restaurantes tienen un potencial enorme de automatización."
Ejemplo si es real estate: "¡Excelente! El mercado inmobiliario se mueve rápido con Escalab."
Responde directo, corto y súper entusiasta.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.8,
      max_tokens: 30,
    });

    res.json({ reaction: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error en getReaction:', error);
    res.status(500).json({ error: 'Error generando reacción' });
  }
};

// Generar un análisis resumen de lo que el cliente quiere lograr
export const analyzeOnboarding = async (req, res) => {
  const { category, automationType, painPoint, clarification } = req.body;

  try {
    const prompt = `Actúa como un Consultor Senior de Estrategia Digital y Automatización en Escalab. 
Tu objetivo es generar una Propuesta de Valor Ejecutiva para un cliente potencial.

Información recopilada:
- Sector de Negocio: ${category}
- Objetivo de Automatización: ${automationType}
- Desafío Crítico (Pain Point): ${painPoint}
${clarification ? `- Detalles Adicionales/Ajustes: ${clarification}` : ''}

Escribe un resumen ejecutivo (MÁXIMO 3-4 líneas) que sea:
1. Profesional y elegante (Uso de lenguaje corporativo pero cercano).
2. Enfocado en resultados y transformación.
3. Personalizado al sector ${category}.

Estructura sugerida: "He analizado tu modelo de negocio en ${category}. Entiendo que tu prioridad es ${automationType} para resolver ${painPoint}. Con Escalab, transformaremos este desafío en una ventaja competitiva mediante..."

NO uses saludos iniciales. NO hagas preguntas al final. Sé directo y genera autoridad técnica.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.6,
    });

    res.json({ analysis: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error en analyzeOnboarding:', error);
    res.status(500).json({ error: 'Error generando análisis' });
  }
};
