// taigaMCP/openaiClient.js
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import dotenv from 'dotenv';
import axios from 'axios';
import readline from 'readline';

// Cargar variables de entorno
dotenv.config();

// Crear interfaz de línea de comandos
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Función para interactuar con la API de OpenAI
async function queryOpenAI(prompt, purpose = 'tool-selection') {
    try {
        let systemPrompt = '';

        if (purpose === 'tool-selection') {
            systemPrompt = 'Eres un asistente que ayuda a interactuar con Taiga a través de un servidor MCP. Traduce las solicitudes del usuario a llamadas a herramientas específicas. Las herramientas disponibles son: listProjects, getProject, createUserStory, y listUserStories. NUNCA sugieras authenticate, ya que la autenticación se maneja automáticamente. Si el usuario menciona "como usuario quiero" o algo similar, responde con "createUserStory". Responde SOLO con el nombre de la herramienta que debe usarse, sin explicaciones adicionales ni código.';
        } else if (purpose === 'user-story-extraction') {
            systemPrompt = 'Eres un experto en metodologías ágiles y Taiga. Analiza el texto del usuario y extrae una historia de usuario bien formada. Responde en formato JSON con los campos "title" (título corto y descriptivo), "description" (descripción completa en formato "Como [rol], quiero [funcionalidad] para [beneficio]") y "project" (nombre del proyecto mencionado o "default" si no se menciona). Presta especial atención a cualquier mención de proyectos como "TR3_Comunitat", "2DAW_PROJECTEFINAL", etc. Asegúrate de que el título sea conciso y la descripción sea completa.';
        } else if (purpose === 'project-selection') {
            systemPrompt = 'Eres un asistente que ayuda a seleccionar el proyecto más adecuado para una historia de usuario. Dada una lista de proyectos y una descripción de historia de usuario, selecciona el proyecto más relevante. Responde solo con el slug del proyecto seleccionado.';
        } else if (purpose === 'task-creation') {
            systemPrompt = 'Eres un experto en desarrollo de software y metodologías ágiles. Dada una historia de usuario, genera una lista de tareas específicas necesarias para implementarla, separadas en tareas de FRONTEND y BACKEND. Responde en formato JSON con un array "tasks" donde cada tarea tiene "title" (título descriptivo), "description" (descripción detallada de la tarea), y "type" ("FRONT" o "BACK"). Incluye todas las tareas necesarias para una implementación completa, considerando aspectos como diseño, validación, seguridad, pruebas, etc.';
        }

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-4', // Puedes cambiar a otro modelo si lo prefieres
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3, // Temperatura más baja para respuestas más consistentes
            },
            {
                headers: {
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        return response.data.choices[0].message.content.trim();
    } catch (error) {
        console.error('Error al consultar OpenAI:', error.message);
        if (error.response) {
            console.error('Detalles del error:', error.response.data);
        }
        return 'No pude procesar tu solicitud. Por favor, intenta de nuevo.';
    }
}

// Función para analizar la respuesta de OpenAI y determinar qué herramienta usar
async function parseOpenAIResponse(response, client, originalPrompt) {
    console.log('\nAnálisis de OpenAI:');
    console.log(response);

    // Simplificar la respuesta para extraer solo el nombre de la herramienta
    const toolName = response.toLowerCase().includes('authenticate') ? 'authenticate' :
        response.toLowerCase().includes('listprojects') ? 'listProjects' :
            response.toLowerCase().includes('getproject') ? 'getProject' :
                response.toLowerCase().includes('createuserstory') ? 'createUserStory' :
                    response.toLowerCase().includes('listuserstories') ? 'listUserStories' :
                        null;

    if (!toolName) {
        return { content: [{ type: 'text', text: 'No pude determinar qué acción realizar. Por favor, sé más específico.' }] };
    }

    console.log(`\nEjecutando herramienta: ${toolName}`);

    switch (toolName) {
        case 'authenticate':
            // Usar las credenciales del archivo .env
            console.log('\nRealizando autenticación con credenciales del archivo .env...');
            return await client.callTool({
                name: 'authenticate',
                arguments: {
                    username: process.env.TAIGA_USERNAME,
                    password: process.env.TAIGA_PASSWORD
                }
            });

        case 'listProjects':
            console.log('\nListando proyectos...');
            return await client.callTool({
                name: 'listProjects',
                arguments: {}
            });

        case 'getProject':
            const projectId = await askQuestion('ID o slug del proyecto: ');
            console.log(`\nObteniendo detalles del proyecto ${projectId}...`);
            return await client.callTool({
                name: 'getProject',
                arguments: { projectIdentifier: projectId }
            });

        case 'createUserStory':
            // Verificar si el prompt parece una historia de usuario
            if (originalPrompt.toLowerCase().includes('como usuario') ||
                originalPrompt.toLowerCase().includes('como administrador') ||
                originalPrompt.toLowerCase().includes('como cliente') ||
                originalPrompt.toLowerCase().includes('quiero poder')) {

                console.log('\nDetectada posible historia de usuario. Extrayendo detalles...');

                // Extraer detalles de la historia de usuario usando OpenAI
                const userStoryDetails = await queryOpenAI(originalPrompt, 'user-story-extraction');
                let userStoryData;

                try {
                    userStoryData = JSON.parse(userStoryDetails);
                    console.log('\nDetalles extraídos:');
                    console.log(`Título: ${userStoryData.title}`);
                    console.log(`Descripción: ${userStoryData.description}`);
                    console.log(`Proyecto mencionado: ${userStoryData.project}`);

                    // Obtener la lista de proyectos para seleccionar el más adecuado
                    const projectsResult = await client.callTool({
                        name: 'listProjects',
                        arguments: {}
                    });

                    let projectsList = '';
                    let projects = [];

                    if (projectsResult && projectsResult.content) {
                        for (const item of projectsResult.content) {
                            if (item.type === 'text') {
                                projectsList = item.text;
                                // Extraer los proyectos de la respuesta
                                const lines = projectsList.split('\n').filter(line => line.trim().startsWith('-'));
                                projects = lines.map(line => {
                                    const match = line.match(/- (.+?) \(ID: (\d+), Slug: (.+?)\)/);
                                    if (match) {
                                        return {
                                            name: match[1],
                                            id: match[2],
                                            slug: match[3]
                                        };
                                    }
                                    return null;
                                }).filter(p => p !== null);
                            }
                        }
                    }

                    // Seleccionar el proyecto más adecuado
                    let selectedProjectSlug;

                    if (userStoryData.project && userStoryData.project !== 'default') {
                        // Buscar un proyecto que coincida con el nombre mencionado
                        const matchingProject = projects.find(p =>
                            p.name.toLowerCase().includes(userStoryData.project.toLowerCase()) ||
                            p.slug.toLowerCase().includes(userStoryData.project.toLowerCase())
                        );

                        if (matchingProject) {
                            selectedProjectSlug = matchingProject.slug;
                        }
                    }

                    // Si no se encontró un proyecto, preguntar a OpenAI
                    if (!selectedProjectSlug && projects.length > 0) {
                        const projectsInfo = projects.map(p => `${p.name} (${p.slug})`).join('\n');
                        const projectSelectionPrompt = `Historia de usuario: ${userStoryData.description}\n\nProyectos disponibles:\n${projectsInfo}\n\nSelecciona el proyecto más adecuado para esta historia de usuario.`;

                        const selectedProject = await queryOpenAI(projectSelectionPrompt, 'project-selection');

                        // Verificar si la respuesta es un slug válido
                        const matchingProject = projects.find(p =>
                            p.slug.toLowerCase() === selectedProject.toLowerCase() ||
                            p.slug.toLowerCase().includes(selectedProject.toLowerCase()) ||
                            selectedProject.toLowerCase().includes(p.slug.toLowerCase())
                        );

                        if (matchingProject) {
                            selectedProjectSlug = matchingProject.slug;
                        }
                    }

                    // Si aún no tenemos un proyecto, usar el primero de la lista o preguntar al usuario
                    if (!selectedProjectSlug) {
                        if (projects.length > 0) {
                            selectedProjectSlug = projects[0].slug;
                        } else {
                            selectedProjectSlug = await askQuestion('ID o slug del proyecto: ');
                        }
                    }

                    console.log(`\nCreando historia de usuario en proyecto: ${selectedProjectSlug}`);
                    console.log(`Título: ${userStoryData.title}`);
                    console.log(`Descripción: ${userStoryData.description}`);

                    // Crear la historia de usuario
                    const userStoryResult = await client.callTool({
                        name: 'createUserStory',
                        arguments: {
                            projectIdentifier: selectedProjectSlug,
                            subject: userStoryData.title,
                            description: userStoryData.description
                        }
                    });

                    // Extraer el ID de referencia de la historia de usuario creada
                    let userStoryRef = null;
                    if (userStoryResult && userStoryResult.content) {
                        for (const item of userStoryResult.content) {
                            if (item.type === 'text') {
                                const match = item.text.match(/Reference: #(\d+)/);
                                if (match) {
                                    userStoryRef = match[1];
                                }
                            }
                        }
                    }

                    // Si tenemos la referencia de la historia de usuario, generar tareas
                    if (userStoryRef) {
                        console.log(`\nGenerando tareas para la historia de usuario #${userStoryRef}...`);

                        // Obtener tecnologías del proyecto o usar valores predeterminados
                        const technologies = 'React, Node.js, Express, MongoDB'; // Valores predeterminados

                        // Generar tareas usando OpenAI
                        const taskPrompt = `Historia de usuario: ${userStoryData.description}\n\nTecnologías: ${technologies}\n\nGenera tareas específicas para implementar esta historia de usuario, separadas en tareas de FRONTEND y BACKEND.`;
                        const tasksResponse = await queryOpenAI(taskPrompt, 'task-creation');

                        try {
                            const tasksData = JSON.parse(tasksResponse);

                            if (tasksData.tasks && Array.isArray(tasksData.tasks)) {
                                console.log(`\nCreando ${tasksData.tasks.length} tareas para la historia de usuario #${userStoryRef}...`);

                                // Crear cada tarea
                                for (const task of tasksData.tasks) {
                                    const taskTitle = `[${task.type}] ${task.title}`;
                                    console.log(`\nCreando tarea: ${taskTitle}`);

                                    try {
                                        await client.callTool({
                                            name: 'createTask',
                                            arguments: {
                                                projectIdentifier: selectedProjectSlug,
                                                userStoryIdentifier: `#${userStoryRef}`,
                                                subject: taskTitle,
                                                description: task.description
                                            }
                                        });
                                    } catch (taskError) {
                                        console.error(`Error al crear tarea ${taskTitle}:`, taskError.message);
                                    }
                                }
                            }
                        } catch (parseError) {
                            console.error('Error al procesar las tareas:', parseError.message);
                        }
                    }

                    return userStoryResult;

                } catch (error) {
                    console.error('Error al procesar los detalles de la historia de usuario:', error.message);
                    console.log('Cambiando a modo manual...');
                }
            }

            // Si no se pudo procesar automáticamente, usar el modo manual
            const storyProjectId = await askQuestion('ID o slug del proyecto: ');
            const subject = await askQuestion('Título de la historia de usuario: ');
            const description = await askQuestion('Descripción (opcional, presiona Enter para omitir): ');

            console.log('\nCreando historia de usuario...');
            return await client.callTool({
                name: 'createUserStory',
                arguments: {
                    projectIdentifier: storyProjectId,
                    subject,
                    description: description || undefined
                }
            });

        case 'listUserStories':
            const usProjectId = await askQuestion('ID o slug del proyecto: ');
            console.log(`\nListando historias de usuario del proyecto ${usProjectId}...`);
            return await client.callTool({
                name: 'listUserStories',
                arguments: { projectIdentifier: usProjectId }
            });

        default:
            return { content: [{ type: 'text', text: 'No pude determinar qué acción realizar. Por favor, sé más específico.' }] };
    }
}

// Función auxiliar para hacer preguntas en la consola
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Función principal
async function main() {
    console.log('Cliente de Taiga MCP con OpenAI');
    console.log('===============================');

    // Verificar la clave API de OpenAI
    if (!process.env.OPENAI_API_KEY) {
        console.error('Error: No se encontró la clave API de OpenAI. Por favor, añádela a tu archivo .env');
        process.exit(1);
    }

    // Crear transporte para conectar con el servidor MCP
    const transport = new StdioClientTransport({
        command: 'node',
        args: ['src/index.js'],
    });

    // Crear cliente MCP
    const client = new Client(
        {
            name: 'Taiga MCP OpenAI Client',
            version: '1.0.0',
        },
        {
            capabilities: {
                resources: {},
                tools: {},
            },
        }
    );

    try {
        // Conectar al servidor
        await client.connect(transport);
        console.log('Conectado al servidor MCP de Taiga');

        // Autenticar automáticamente al inicio
        console.log('\nAutenticando con las credenciales del archivo .env...');
        const authResult = await client.callTool({
            name: 'authenticate',
            arguments: {
                username: process.env.TAIGA_USERNAME,
                password: process.env.TAIGA_PASSWORD
            }
        });

        if (authResult && authResult.content) {
            authResult.content.forEach(item => {
                if (item.type === 'text') {
                    console.log(item.text);
                }
            });
        }

        // Bucle principal de interacción
        while (true) {
            const userInput = await askQuestion('\n¿Qué quieres hacer con Taiga? (escribe "salir" para terminar): ');

            if (userInput.toLowerCase() === 'salir') {
                break;
            }

            // Consultar a OpenAI para interpretar la entrada del usuario
            console.log('\nConsultando a OpenAI...');
            const openaiResponse = await queryOpenAI(userInput);

            // Analizar la respuesta y ejecutar la herramienta correspondiente
            // Pasamos el prompt original para poder extraer detalles de historias de usuario
            const result = await parseOpenAIResponse(openaiResponse, client, userInput);

            // Mostrar el resultado
            console.log('\nResultado:');
            if (result && result.content) {
                result.content.forEach(item => {
                    if (item.type === 'text') {
                        console.log(item.text);
                    }
                });
            } else {
                console.log(result);
            }
        }

        console.log('\nGracias por usar el cliente de Taiga MCP. ¡Hasta pronto!');
        rl.close();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        rl.close();
        process.exit(1);
    }
}

main();