
const http = require('http');

const PUERTO = 3001;
const VERSION = 'DOMOTIBOT_SOLO_COLONIA_4';

// INFORMACION DE NUESTRA COLONIA

const CASAS = {
  1: 'La casa 1 tiene luces LED, una puerta con servomotor y una ventana automatizada.',
  2: 'La casa 2 tiene luces LED, una puerta con servomotor y una ventana automatizada.',
  3: 'La casa 3 tiene luces LED, una puerta con servomotor y un tendedero retractil.',
  4: 'La casa 4 es premium: tiene terraza, luces LED, una puerta con servomotor y un tendedero retractil.'
};

// NORMALIZAR PREGUNTAS

function normalizar(texto) {
  return String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// PREGUNTAS PERMITIDAS DE LA COLONIA

const REGLAS = [
  {
    patron: /^(?:que es|de que trata|explicame|hablame de|cuentame sobre|como funciona) (?:la |mi |nuestra )?(?:colonia domotica|colonia domotica inteligente|maqueta domotica)(?: de mi proyecto)?$/,
    respuesta: 'Nuestra Colonia Domotica Inteligente es una maqueta con 4 casas, 6 postes de luz, luces LED y mecanismos automatizados con servomotores.'
  },
  {
    patron: /^(?:cuantas casas (?:hay|tiene|tenemos|son)|cuantas viviendas (?:hay|tiene|tenemos))(?: en (?:la |mi |nuestra )?colonia(?: domotica)?)?$/,
    respuesta: 'Nuestra colonia tiene 4 casas inteligentes. Las casas 1 y 2 tienen ventanas automatizadas; las casas 3 y 4, tendederos.'
  },
  {
    patron: /^(?:que tienen (?:todas las |las cuatro |las )?casas|que tiene cada casa|todas las casas tienen (?:luces|puertas)|caracteristicas de las (?:cuatro )?casas)$/,
    respuesta: 'Todas tienen luces LED y puertas con servomotor. Las casas 1 y 2 tienen ventanas; las casas 3 y 4 tienen tendederos.'
  },
  {
    patron: /^(?:que casas|cuales casas|cuales|cuantas casas) (?:tienen|cuentan con) (?:los? )?tendederos?(?: automatizados?)?(?: de (?:la |mi )?colonia)?$/,
    respuesta: 'Las casas 3 y 4 tienen tendederos retractiles que funcionan con servomotores.'
  },
  {
    patron: /^(?:que casas|cuales casas|cuales|cuantas casas) (?:tienen|cuentan con) (?:las? )?ventanas?(?: automatizadas?)?(?: de (?:la |mi )?colonia)?$/,
    respuesta: 'Las casas 1 y 2 tienen ventanas automatizadas con servomotores.'
  },
  {
    patron: /^(?:que casas|cuales casas|cuales) (?:tienen|cuentan con) (?:las? )?(?:luces|puertas)(?: de (?:la |mi )?colonia)?$/,
    respuesta: 'Las cuatro casas tienen luces LED y puertas automatizadas con servomotores.'
  },
  {
    patron: /^(?:que casa es|cual es|cual es la) (?:la )?casa premium$|^(?:que casa|cual casa|cual) tiene (?:la )?terraza$/,
    respuesta: CASAS[4]
  },
  {
    patron: /^(?:cuantos postes(?: de luz)? (?:hay|tiene|tenemos)|cuantos postes son)(?: en (?:la |mi |nuestra )?colonia(?: domotica)?)?$/,
    respuesta: 'La colonia tiene 6 postes de alumbrado publico.'
  },
  {
    patron: /^(?:como funcionan|como funciona|para que sirven|para que sirve) (?:los? )?tendederos?(?: automatizados?)?(?: de (?:la |mi )?colonia)?$/,
    respuesta: 'Los tendederos de las casas 3 y 4 pueden extenderse y recogerse mediante servomotores.'
  },
  {
    patron: /^(?:como funcionan|como funciona|para que sirven|para que sirve) (?:las? )?ventanas?(?: automatizadas?)?(?: de (?:la |mi )?colonia)?$/,
    respuesta: 'Las ventanas de las casas 1 y 2 utilizan servomotores para abrirse y cerrarse.'
  },
  {
    patron: /^(?:como funcionan|como funciona|para que sirven|para que sirve) (?:las? )?puertas?(?: automatizadas?)?(?: de (?:la |mi )?colonia)?$/,
    respuesta: 'Todas las casas tienen puertas con servomotores para abrirlas y cerrarlas.'
  },
  {
    patron: /^(?:que tecnologia usa|que componentes (?:usa|tiene)|que dispositivos (?:usa|utiliza)|que materiales electronicos usa) (?:la |mi |nuestra )?(?:colonia|colonia domotica|maqueta)(?: inteligente)?$/,
    respuesta: 'El proyecto utiliza un Arduino Uno, servomotores y luces LED. La app esta desarrollada con React Native y Expo Go.'
  },
  {
    patron: /^(?:como funciona|para que sirve|que hace|que funciones tiene) (?:la )?(?:aplicacion|app)(?: de (?:la |mi |nuestra )?colonia(?: domotica)?)?$/,
    respuesta: 'La app permite registro, inicio de sesion y acceso a los controles simulados de la casa asignada.'
  },
  {
    patron: /^(?:que hace|que puede hacer|cuales son las funciones de) (?:el )?administrador(?: de (?:la |mi |nuestra )?colonia)?$/,
    respuesta: 'El administrador puede gestionar los controles simulados de las cuatro casas y los seis postes.'
  },
  {
    patron: /^(?:que hace|que puede hacer|cuales son las funciones de) (?:el )?(?:residente|usuario)(?: de (?:la |mi |nuestra )?colonia)?$/,
    respuesta: 'Cada residente puede ver y manejar los controles simulados de su casa asignada en la app.'
  }
];

// FUNCION PRINCIPAL DEL CHATBOT

function responder(texto, historial) {

  const q = normalizar(texto);

  if (!q || q.length > 180) {
    return '';
  }

  // SALUDOS AMIGABLES

  if (/^(hola+|holi+|buenas|buenos dias|buenas tardes|buenas noches|hola domotibot)$/.test(q)) {
    return '¡Hola! Soy DomotiBot, el asistente de tu Colonia Domótica Inteligente. 🏡 ¿Querés conocer nuestras cuatro casas?';
  }

  if (/^(gracias|muchas gracias)$/.test(q)) {
    return '¡Con gusto! 😊 Preguntame sobre nuestra colonia.';
  }

  if (/^(adios|hasta luego|chao|nos vemos)$/.test(q)) {
    return '¡Hasta pronto! 👋 Gracias por visitar nuestra colonia.';
  }

  if (/^(quien eres|como te llamas|que puedes hacer)$/.test(q)) {
    return 'Soy DomotiBot. Te puedo explicar las casas, ventanas, tendederos, luces, postes y la aplicación de la colonia.';
  }

  // INFORMACION DE UNA CASA ESPECIFICA

  const casa = q.match(
    /^(?:que tiene|que incluye|como es|describe|hablame de|dame informacion (?:de|sobre)|cuales son las caracteristicas de|caracteristicas de) (?:la )?casa ([1-4])(?: de (?:la |mi |nuestra )?colonia)?$/
  );

  if (casa) {
    return CASAS[Number(casa[1])];
  }

  // SEGUIMIENTO COMO "Y LA CASA 2"

  const seguimiento = q.match(
    /^(?:y )?(?:la )?casa ([1-4])$/
  );

  if (seguimiento && Array.isArray(historial)) {

    const previas = historial
      .slice(0, -1)
      .filter(m => m && m.role === 'user');

    const anterior = previas.length
      ? normalizar(previas[previas.length - 1].content)
      : '';

    const preguntaAnterior =
      /^(?:que tiene|que incluye|como es|describe|hablame de|dame informacion (?:de|sobre)|cuales son las caracteristicas de|caracteristicas de) (?:la )?casa [1-4](?: de (?:la |mi |nuestra )?colonia)?$/;

    if (preguntaAnterior.test(anterior)) {
      return CASAS[Number(seguimiento[1])];
    }
  }

  // COMPROBAR PREGUNTAS PERMITIDAS

  for (const regla of REGLAS) {

    if (regla.patron.test(q)) {
      return regla.respuesta;
    }
  }

  // CUALQUIER OTRO TEMA:
  // NO ENVIAR NINGUNA RESPUESTA

  return '';
}

// RESPUESTAS JSON

function enviar(res, codigo, datos) {
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  res.end(JSON.stringify(datos));
}

// SERVIDOR PRINCIPAL

const servidor = http.createServer(async (req, res) => {

  if (req.method === 'OPTIONS') {
    return enviar(res, 200, {});
  }

  if (req.method === 'GET' && req.url === '/salud') {
    return enviar(res, 200, {
      servidor: 'funcionando',
      version: VERSION
    });
  }

  if (req.method !== 'POST' || req.url !== '/chat') {
    return enviar(res, 404, {
      error: 'Ruta no encontrada'
    });
  }

  try {

    let cuerpo = '';

    for await (const parte of req) {

      cuerpo += parte.toString();

      if (cuerpo.length > 20000) {
        return enviar(res, 413, {
          error: 'Mensaje demasiado largo'
        });
      }
    }

    const datos = JSON.parse(cuerpo);

    if (!Array.isArray(datos.mensajes)) {
      return enviar(res, 400, {
        error: 'Faltan mensajes'
      });
    }

    const ultimo =
      datos.mensajes[datos.mensajes.length - 1];

    if (
      !ultimo ||
      ultimo.role !== 'user' ||
      typeof ultimo.content !== 'string'
    ) {
      return enviar(res, 400, {
        error: 'Falta la pregunta'
      });
    }

    const respuesta = responder(
      ultimo.content,
      datos.mensajes
    );

    return enviar(res, 200, {
      respuesta: respuesta,
      fueraDeTema: respuesta === ''
    });

  } catch (error) {

    console.error('Error DomotiBot:', error.message);

    return enviar(res, 400, {
      error: 'Solicitud incorrecta'
    });
  }

});

// INICIAR SERVIDOR

servidor.listen(PUERTO, '0.0.0.0', () => {

  console.log('DOMOTIBOT - SOLO COLONIA');
  console.log('Version:', VERSION);
  console.log('Puerto:', PUERTO);

  console.log(
    'http://localhost:' + PUERTO + '/salud'
  );

});
      