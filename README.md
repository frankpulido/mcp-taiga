# Guía Completa para Implementar Model Context Protocol (MCP)

## Introducción al Model Context Protocol (MCP)

El Model Context Protocol (MCP) es un protocolo abierto que estandariza cómo las aplicaciones proporcionan contexto a los modelos de lenguaje (LLMs). Podemos pensar en MCP como un "puerto USB-C para aplicaciones de IA" - proporciona una forma estandarizada de conectar modelos de IA con diferentes fuentes de datos y herramientas.

### ¿Por qué usar MCP?

MCP facilita la construcción de agentes y flujos de trabajo complejos basados en LLMs, ofreciendo:

- Una lista creciente de integraciones predefinidas que tu LLM puede usar directamente
- Flexibilidad para cambiar entre diferentes proveedores y vendedores de LLMs
- Buenas prácticas para asegurar tus datos dentro de tu infraestructura

### Arquitectura general

MCP sigue una arquitectura cliente-servidor donde una aplicación host puede conectarse a múltiples servidores:

- **Hosts MCP**: Programas como Claude Desktop, IDEs o herramientas de IA que quieren acceder a datos a través de MCP
- **Clientes MCP**: Clientes del protocolo que mantienen conexiones 1:1 con servidores
- **Servidores MCP**: Programas ligeros que exponen capacidades específicas a través del protocolo estandarizado
- **Fuentes de datos locales**: Archivos de tu computadora, bases de datos y servicios a los que los servidores MCP pueden acceder de forma segura
- **Servicios remotos**: Sistemas externos disponibles a través de internet (por ejemplo, a través de APIs) a los que los servidores MCP pueden conectarse

## Instalación y configuración

### Instalación del SDK de TypeScript

Para implementar MCP en TypeScript, necesitas instalar el SDK:

```bash
npm install @modelcontextprotocol/sdk
```

### Estructura básica de un servidor MCP

A continuación se muestra la estructura básica de un servidor MCP usando el SDK de TypeScript:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Crear un servidor MCP
const server = new McpServer({
  name: "Mi Servidor MCP",
  version: "1.0.0",
});

// Configurar recursos, herramientas y prompts
// ...

// Iniciar la comunicación a través de entrada/salida estándar
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Conceptos fundamentales de MCP

### 1. Recursos (Resources)

Los recursos son la forma de exponer datos a los LLMs, similares a endpoints GET en una API REST. Proporcionan datos pero no deberían realizar cálculos significativos o tener efectos secundarios.

#### Recurso estático

```typescript
server.resource(
  "config", // Nombre del recurso
  "config://app", // URI estática
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: "Configuración de la aplicación aquí",
      },
    ],
  })
);
```

#### Recurso dinámico con parámetros

```typescript
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";

server.resource(
  "perfil-usuario",
  new ResourceTemplate("usuarios://{userId}/perfil", { list: undefined }),
  async (uri, { userId }) => ({
    contents: [
      {
        uri: uri.href,
        text: `Datos del perfil para el usuario ${userId}`,
      },
    ],
  })
);
```

### 2. Herramientas (Tools)

Las herramientas permiten a los LLMs realizar acciones a través de tu servidor. A diferencia de los recursos, las herramientas están diseñadas para realizar cálculos y tener efectos secundarios.

#### Herramienta simple con parámetros

```typescript
import { z } from "zod";

server.tool(
  "calcular-imc", // Nombre de la herramienta
  {
    pesoKg: z.number(), // Esquema de validación para parámetros
    alturaM: z.number(),
  },
  async ({ pesoKg, alturaM }) => ({
    content: [
      {
        type: "text",
        text: String(pesoKg / (alturaM * alturaM)),
      },
    ],
  })
);
```

#### Herramienta asíncrona con llamada a API externa

```typescript
server.tool("obtener-clima", { ciudad: z.string() }, async ({ ciudad }) => {
  const response = await fetch(`https://api.clima.com/${ciudad}`);
  const data = await response.text();
  return {
    content: [{ type: "text", text: data }],
  };
});
```

### 3. Prompts

Los prompts son plantillas reutilizables que ayudan a los LLMs a interactuar eficazmente con tu servidor:

```typescript
server.prompt("revisar-codigo", { codigo: z.string() }, ({ codigo }) => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: `Por favor revisa este código:\n\n${codigo}`,
      },
    },
  ],
}));
```

## Implementando un servidor MCP

### Ejemplo completo: Servidor de calculadora

Vamos a crear un servidor MCP que expone una calculadora como herramienta y algunos datos como recursos:

```typescript
import {
  McpServer,
  ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Crear un servidor MCP
const server = new McpServer({
  name: "Calculadora MCP",
  version: "1.0.0",
});

// Añadir recursos
server.resource(
  "instrucciones",
  "docs://calculadora/instrucciones",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: "Esta calculadora puede realizar operaciones básicas: suma, resta, multiplicación y división.",
      },
    ],
  })
);

// Añadir recurso dinámico para historial de cálculos
const historialCalculos = [];
server.resource("historial", "historial://calculadora", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      text: `Historial de cálculos recientes:\n${historialCalculos.join("\n")}`,
    },
  ],
}));

// Añadir herramientas para operaciones matemáticas
server.tool("sumar", { a: z.number(), b: z.number() }, async ({ a, b }) => {
  const resultado = a + b;
  historialCalculos.push(`${a} + ${b} = ${resultado}`);
  return { content: [{ type: "text", text: String(resultado) }] };
});

server.tool("restar", { a: z.number(), b: z.number() }, async ({ a, b }) => {
  const resultado = a - b;
  historialCalculos.push(`${a} - ${b} = ${resultado}`);
  return { content: [{ type: "text", text: String(resultado) }] };
});

server.tool(
  "multiplicar",
  { a: z.number(), b: z.number() },
  async ({ a, b }) => {
    const resultado = a * b;
    historialCalculos.push(`${a} * ${b} = ${resultado}`);
    return { content: [{ type: "text", text: String(resultado) }] };
  }
);

server.tool("dividir", { a: z.number(), b: z.number() }, async ({ a, b }) => {
  if (b === 0) {
    return {
      content: [{ type: "text", text: "Error: División por cero" }],
      isError: true,
    };
  }
  const resultado = a / b;
  historialCalculos.push(`${a} / ${b} = ${resultado}`);
  return { content: [{ type: "text", text: String(resultado) }] };
});

// Añadir un prompt de ejemplo
server.prompt("calcular", { operacion: z.string() }, ({ operacion }) => ({
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: `Por favor calcula lo siguiente: ${operacion}`,
      },
    },
  ],
}));

// Iniciar la comunicación
const transport = new StdioServerTransport();
await server.connect(transport);
```

## Métodos de transporte para servidores MCP

Los servidores MCP en TypeScript necesitan conectarse a un transporte para comunicarse con los clientes. Hay varias opciones:

### 1. Entrada/Salida Estándar (stdio)

Ideal para herramientas de línea de comandos e integraciones directas:

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

### 2. HTTP con Server-Sent Events (SSE)

Para servidores remotos, se puede iniciar un servidor web con un endpoint SSE y otro endpoint para que el cliente envíe sus mensajes:

```typescript
import express, { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const server = new McpServer({
  name: "servidor-remoto",
  version: "1.0.0",
});

// Configurar recursos, herramientas y prompts...

const app = express();

// Para soportar múltiples conexiones simultáneas tenemos un objeto
// de búsqueda desde sessionId hasta transporte
const transports: { [sessionId: string]: SSEServerTransport } = {};

app.get("/sse", async (_: Request, res: Response) => {
  const transport = new SSEServerTransport("/messages", res);
  transports[transport.sessionId] = transport;
  res.on("close", () => {
    delete transports[transport.sessionId];
  });
  await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports[sessionId];
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send("No se encontró transporte para sessionId");
  }
});

app.listen(3001, () => {
  console.log("Servidor MCP escuchando en puerto 3001");
});
```

## Implementando clientes MCP

El SDK también proporciona una interfaz de cliente de alto nivel para conectarse a servidores MCP:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["servidor.js"],
});

const client = new Client(
  {
    name: "cliente-ejemplo",
    version: "1.0.0",
  },
  {
    capabilities: {
      prompts: {},
      resources: {},
      tools: {},
    },
  }
);

await client.connect(transport);

// Listar prompts
const prompts = await client.listPrompts();
console.log("Prompts disponibles:", prompts);

// Obtener un prompt
const prompt = await client.getPrompt("calcular", {
  operacion: "125 * 37",
});
console.log("Prompt generado:", prompt);

// Listar recursos
const resources = await client.listResources();
console.log("Recursos disponibles:", resources);

// Leer un recurso
const resource = await client.readResource("docs://calculadora/instrucciones");
console.log("Contenido del recurso:", resource);

// Llamar a una herramienta
const result = await client.callTool({
  name: "sumar",
  arguments: {
    a: 42,
    b: 58,
  },
});
console.log("Resultado de la herramienta:", result);
```

## Casos de uso avanzados

### Integrando con bases de datos: Explorador SQLite

Este ejemplo muestra cómo integrar un servidor MCP con una base de datos SQLite:

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import sqlite3 from "sqlite3";
import { promisify } from "util";
import { z } from "zod";

const server = new McpServer({
  name: "Explorador SQLite",
  version: "1.0.0",
});

// Helper para crear conexión a la DB
const getDb = () => {
  const db = new sqlite3.Database("database.db");
  return {
    all: promisify<string, any[]>(db.all.bind(db)),
    close: promisify(db.close.bind(db)),
  };
};

// Recurso para exponer el esquema de la base de datos
server.resource("schema", "schema://main", async (uri) => {
  const db = getDb();
  try {
    const tables = await db.all(
      "SELECT sql FROM sqlite_master WHERE type='table'"
    );
    return {
      contents: [
        {
          uri: uri.href,
          text: tables.map((t: { sql: string }) => t.sql).join("\n"),
        },
      ],
    };
  } finally {
    await db.close();
  }
});

// Herramienta para ejecutar consultas SQL
server.tool("consulta", { sql: z.string() }, async ({ sql }) => {
  const db = getDb();
  try {
    const results = await db.all(sql);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(results, null, 2),
        },
      ],
    };
  } catch (err: unknown) {
    const error = err as Error;
    return {
      content: [
        {
          type: "text",
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  } finally {
    await db.close();
  }
});

// Iniciar la comunicación
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Servidor de bajo nivel

Para mayor control, puedes usar la clase Server de bajo nivel directamente:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "servidor-ejemplo",
    version: "1.0.0",
  },
  {
    capabilities: {
      prompts: {},
    },
  }
);

server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: "prompt-ejemplo",
        description: "Una plantilla de prompt de ejemplo",
        arguments: [
          {
            name: "arg1",
            description: "Argumento de ejemplo",
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  if (request.params.name !== "prompt-ejemplo") {
    throw new Error("Prompt desconocido");
  }
  return {
    description: "Prompt de ejemplo",
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: "Texto del prompt de ejemplo",
        },
      },
    ],
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
```

## Pruebas y depuración

Para probar tu servidor MCP, puedes usar el [MCP Inspector](https://github.com/modelcontextprotocol/inspector), una herramienta interactiva de depuración.

### Pasos para depurar:

1. Inicia tu servidor MCP
2. Utiliza MCP Inspector para conectarte a tu servidor
3. Prueba los recursos, herramientas y prompts disponibles
4. Verifica el correcto funcionamiento y manejo de errores

## Mejores prácticas

Al construir servidores MCP, considera las siguientes prácticas recomendadas:

1. **Seguridad**: Valida todas las entradas y limita el acceso apropiadamente
2. **Modularidad**: Divide servidores complejos en piezas más pequeñas y manejables
3. **Pruebas**: Prueba cada componente a fondo antes de seguir adelante
4. **Documentación**: Documenta bien tu código para facilitar el mantenimiento futuro
5. **Cumplimiento**: Sigue cuidadosamente las especificaciones del protocolo MCP
6. **Manejo de errores**: Implementa un manejo robusto de errores y excepciones
7. **Desempeño**: Optimiza para operaciones asíncronas cuando sea posible

## Uso de LLMs para ayudar a construir servidores MCP

Puedes utilizar modelos como Claude para ayudarte a construir servidores MCP:

1. Proporciona al modelo la documentación relevante de MCP
2. Describe claramente qué tipo de servidor quieres construir, especificando:

   - Qué recursos expondrá tu servidor
   - Qué herramientas proporcionará
   - Cualquier prompt que deba ofrecer
   - Con qué sistemas externos necesita interactuar

3. Comienza con la funcionalidad principal y luego itera para añadir más características
4. Pide al modelo que explique cualquier parte del código que no entiendas
5. Solicita modificaciones o mejoras según sea necesario

## Recursos adicionales

- [Documentación oficial de MCP](https://modelcontextprotocol.io/)
- [Especificación MCP](https://spec.modelcontextprotocol.io/)
- [Repositorio de TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Ejemplos de servidores MCP](https://github.com/modelcontextprotocol/servers)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)

## Conclusión

El Model Context Protocol (MCP) proporciona un enfoque estandarizado para conectar modelos de lenguaje con datos y funcionalidades. Siguiendo esta guía, puedes crear servidores MCP personalizados que expongan recursos, herramientas y prompts, permitiendo interacciones más ricas y contextuales con LLMs como Claude.

Ya sea que estés construyendo integraciones simples o complejas arquitecturas de agentes, MCP ofrece un marco flexible y seguro para tus necesidades de IA.
