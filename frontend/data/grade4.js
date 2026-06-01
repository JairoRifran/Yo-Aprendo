export const grade4Data = {
  grade: 4,
  title: "Mapa de aventuras - 4.o",
  worlds: [
    {
      id: "world-sequences",
      number: 1,
      title: "Isla de las Secuencias",
      short: "Secuencias",
      description: "El primer faro solo despierta si cada accion ocurre en el orden correcto. Aqui aprenderas que una secuencia es un algoritmo: pasos claros que preparan el siguiente paso.",
      status: "current",
      type: "portal",
      x: 0.18,
      y: 0.68,
      labelOffsetY: 112,
      reward: { coins: 180, gems: 8 },
      missions: [
        {
          id: "4-1-1",
          number: 1,
          title: "Primeros pasos",
          status: "completed",
          difficulty: "Facil",
          coins: 20,
          gems: 1,
          challenge: {
            type: "reorder",
            prompt: "Ordena los pasos para que el robot pueda preparar su mochila antes de salir.",
            items: [
              "Cerrar la mochila",
              "Guardar la cantimplora",
              "Abrir la mochila",
              "Poner el cuaderno"
            ],
            solution: [
              "Abrir la mochila",
              "Poner el cuaderno",
              "Guardar la cantimplora",
              "Cerrar la mochila"
            ],
            successMessage: "Tu algoritmo dejo la mochila lista."
          }
        },
        {
          id: "4-1-2",
          number: 2,
          title: "Orden correcto",
          status: "current",
          difficulty: "Facil",
          coins: 20,
          gems: 1,
          challenge: {
            type: "reorder",
            prompt: "Ordena los pasos para lavarse las manos antes de entrar al laboratorio.",
            items: [
              "Ponerse jabon",
              "Secarse las manos",
              "Abrir la canilla",
              "Enjuagarse",
              "Mojarse las manos",
              "Frotarse bien"
            ],
            solution: [
              "Abrir la canilla",
              "Mojarse las manos",
              "Ponerse jabon",
              "Frotarse bien",
              "Enjuagarse",
              "Secarse las manos"
            ],
            successMessage: "La secuencia quedo perfecta."
          }
        },
        {
          id: "4-1-3",
          number: 3,
          title: "Camino guiado",
          status: "locked",
          difficulty: "Facil",
          coins: 25,
          gems: 1,
          challenge: {
            type: "path-program",
            prompt: "Programa el camino para que la exploradora llegue al faro.",
            maxSteps: 6,
            turnMoves: true,
            palette: ["forward", "right", "left"],
            board: {
              rows: 4,
              cols: 4,
              start: { row: 3, col: 0, facing: "right" },
              goal: { row: 0, col: 3 },
              obstacles: [
                { row: 1, col: 2 },
                { row: 2, col: 2 }
              ]
            },
            successMessage: "La exploradora encontro la ruta al faro."
          }
        },
        {
          id: "4-1-4",
          number: 4,
          title: "Encontrar el error",
          status: "locked",
          difficulty: "Media",
          coins: 25,
          gems: 1,
          challenge: {
            type: "multiple-choice",
            prompt: "El robot quiere preparar una limonada. Elige la secuencia que no tiene errores.",
            options: [
              {
                id: "a",
                text: "Exprimir limones -> poner azucar -> buscar jarra -> mezclar"
              },
              {
                id: "b",
                text: "Buscar jarra -> exprimir limones -> poner agua -> mezclar"
              },
              {
                id: "c",
                text: "Mezclar -> buscar jarra -> poner agua -> exprimir limones"
              }
            ],
            correctOptionId: "b",
            successMessage: "Detectaste la secuencia mas logica."
          }
        },
        {
          id: "4-1-5",
          number: 5,
          title: "Secuencia con obstaculos",
          status: "locked",
          difficulty: "Media",
          coins: 30,
          gems: 2,
          challenge: {
            type: "multiple-choice",
            prompt: "Hay una roca en el camino. Elige la ruta que permite llegar al puente sin chocar.",
            options: [
              { id: "a", text: "Avanzar -> avanzar -> avanzar" },
              { id: "b", text: "Avanzar -> girar derecha -> avanzar -> girar izquierda -> avanzar" },
              { id: "c", text: "Girar izquierda -> girar derecha -> avanzar" }
            ],
            correctOptionId: "b",
            successMessage: "Evitaste el obstaculo con una buena secuencia."
          }
        },
        {
          id: "4-1-6",
          number: 6,
          title: "Crea tu algoritmo",
          status: "locked",
          difficulty: "Media",
          coins: 30,
          gems: 2,
          challenge: {
            type: "reorder",
            prompt: "Ordena los pasos para encender una linterna y revisar la cueva.",
            items: [
              "Mirar el camino",
              "Poner las pilas",
              "Abrir la linterna",
              "Cerrar la tapa",
              "Encender la linterna"
            ],
            solution: [
              "Abrir la linterna",
              "Poner las pilas",
              "Cerrar la tapa",
              "Encender la linterna",
              "Mirar el camino"
            ],
            successMessage: "Construiste un algoritmo completo."
          }
        },
        {
          id: "4-1-final",
          number: 7,
          title: "Desafio final: Mision del robot",
          status: "locked",
          difficulty: "Media",
          coins: 30,
          gems: 2,
          final: true,
          challenge: {
            type: "path-program",
            prompt: "Programa al robot para salir del taller, esquivar el muro y llegar a la caja brillante.",
            maxSteps: 7,
            palette: ["forward", "right", "left"],
            board: {
              rows: 5,
              cols: 5,
              start: { row: 4, col: 0, facing: "right" },
              goal: { row: 2, col: 3 },
              obstacles: [
                { row: 4, col: 2 },
                { row: 3, col: 2 }
              ]
            },
            successMessage: "El robot cumplio la mision final."
          }
        }
      ]
    },
    {
      id: "world-loops",
      number: 2,
      title: "Isla de los Bucles",
      short: "Bucles",
      description: "Las olas y los molinos repiten ritmos secretos. Aqui aprenderas que un bucle permite repetir instrucciones y transformar patrones largos en programas mas simples.",
      status: "locked",
      type: "loop",
      x: 0.34,
      y: 0.52,
      labelOffsetY: 120,
      reward: { coins: 200, gems: 9 },
      missions: [
        {
          id: "4-2-1",
          number: 1,
          title: "Lo que se repite",
          status: "locked",
          difficulty: "Facil",
          coins: 20,
          gems: 1,
          challenge: {
            type: "multiple-choice",
            prompt: "Elige la opcion donde se ve un patron que se repite 3 veces.",
            options: [
              { id: "a", text: "Saltar, avanzar, saltar, avanzar, saltar, avanzar" },
              { id: "b", text: "Avanzar, girar, detenerse" },
              { id: "c", text: "Saltar, saltar, girar, avanzar" }
            ],
            correctOptionId: "a",
            successMessage: "Viste la repeticion enseguida."
          }
        },
        {
          id: "4-2-2",
          number: 2,
          title: "Repetir movimientos",
          status: "locked",
          difficulty: "Facil",
          coins: 20,
          gems: 1,
          challenge: {
            type: "loop-builder",
            prompt: "El robot debe avanzar 4 casillas seguidas. Arma el bucle correcto.",
            repeatOptions: [2, 3, 4, 5],
            actionOptions: [
              { id: "forward", label: "Avanzar una casilla" },
              { id: "turn-right", label: "Girar a la derecha" },
              { id: "jump", label: "Saltar" }
            ],
            correctLoop: {
              repeatCount: 4,
              actionId: "forward"
            },
            successMessage: "Usaste un bucle para simplificar."
          }
        },
        {
          id: "4-2-3",
          number: 3,
          title: "Patron escondido",
          status: "locked",
          difficulty: "Media",
          coins: 25,
          gems: 1,
          challenge: {
            type: "multiple-choice",
            prompt: "Elige el patron que se repite en las baldosas del puente.",
            options: [
              { id: "a", text: "Rojo, azul, rojo, azul, rojo, azul" },
              { id: "b", text: "Rojo, rojo, azul, verde" },
              { id: "c", text: "Azul, verde, rojo, rojo" }
            ],
            correctOptionId: "a",
            successMessage: "Encontraste el patron del puente."
          }
        },
        {
          id: "4-2-4",
          number: 4,
          title: "Elige el bucle correcto",
          status: "locked",
          difficulty: "Media",
          coins: 25,
          gems: 1,
          challenge: {
            type: "loop-builder",
            prompt: "Hay 5 plantas iguales. Construye el bucle que riega una planta en cada paso.",
            repeatOptions: [3, 4, 5, 6],
            actionOptions: [
              { id: "water", label: "Regar una planta" },
              { id: "turn-left", label: "Girar a la izquierda" },
              { id: "clap", label: "Aplaudir" }
            ],
            correctLoop: {
              repeatCount: 5,
              actionId: "water"
            },
            successMessage: "Elegiste el bucle adecuado."
          }
        },
        {
          id: "4-2-5",
          number: 5,
          title: "Ahorra pasos",
          status: "locked",
          difficulty: "Media",
          coins: 30,
          gems: 2,
          challenge: {
            type: "multiple-choice",
            prompt: "Que programa es mas corto para recoger 3 estrellas en linea recta?",
            options: [
              { id: "a", text: "Repetir 3 veces: avanzar y recoger" },
              { id: "b", text: "Avanzar, recoger, girar" },
              { id: "c", text: "Recoger, recoger, recoger" }
            ],
            correctOptionId: "a",
            successMessage: "Encontraste la solucion mas eficiente."
          }
        },
        {
          id: "4-2-6",
          number: 6,
          title: "Ruta eficiente",
          status: "locked",
          difficulty: "Media",
          coins: 30,
          gems: 2,
          challenge: {
            type: "loop-builder",
            prompt: "Las aspas del molino repiten el mismo giro 4 veces. Arma el bucle mas eficiente.",
            repeatOptions: [2, 3, 4, 5],
            actionOptions: [
              { id: "spin", label: "Girar aspas" },
              { id: "stop", label: "Detener molino" },
              { id: "wave", label: "Mover bandera" }
            ],
            correctLoop: {
              repeatCount: 4,
              actionId: "spin"
            },
            successMessage: "Convertiste una repeticion en un bucle."
          }
        },
        {
          id: "4-2-final",
          number: 7,
          title: "Desafio final: Circuito infinito",
          status: "locked",
          difficulty: "Media",
          coins: 50,
          gems: 2,
          final: true,
          challenge: {
            type: "loop-builder",
            prompt: "El guardian debe repetir el mismo paso 4 veces para patrullar el circuito. Arma el primer bucle del plan.",
            repeatOptions: [2, 3, 4, 5],
            actionOptions: [
              { id: "patrol-step", label: "Avanzar un tramo del circuito" },
              { id: "rest", label: "Descansar" },
              { id: "turn", label: "Girar una vez" }
            ],
            correctLoop: {
              repeatCount: 4,
              actionId: "patrol-step"
            },
            successMessage: "Tu patrulla automatica recorrio todo el circuito."
          }
        }
      ]
    },
    {
      id: "world-decisions",
      number: 3,
      title: "Isla de las Decisiones",
      short: "Decisiones",
      description: "Las puertas de esta isla cambian segun lo que ocurre. Aqui aprenderas a usar condiciones: si se cumple una regla, eliges un camino; si no, pruebas otro.",
      status: "locked",
      type: "crossroad",
      x: 0.52,
      y: 0.47,
      labelOffsetY: 120,
      reward: { coins: 210, gems: 9 },
      missions: [
        {
          id: "4-3-1",
          number: 1,
          title: "Elige el camino",
          status: "locked",
          difficulty: "Facil",
          coins: 20,
          gems: 1,
          challenge: {
            type: "multiple-choice",
            prompt: "Si el camino tiene un charco, que debe hacer el personaje?",
            options: [
              { id: "a", text: "Si hay charco, doblar por el camino seco" },
              { id: "b", text: "Avanzar siempre recto" },
              { id: "c", text: "Dar media vuelta y terminar" }
            ],
            correctOptionId: "a",
            successMessage: "Tomaste una decision segun la situacion."
          }
        },
        {
          id: "4-3-2",
          number: 2,
          title: "Si pasa esto...",
          status: "locked",
          difficulty: "Facil",
          coins: 20,
          gems: 1,
          challenge: {
            type: "multiple-choice",
            prompt: "El puente se abre solo si la luz esta verde. Que regla sirve?",
            options: [
              { id: "a", text: "Si la luz esta verde, cruzar" },
              { id: "b", text: "Repetir 3 veces: cruzar" },
              { id: "c", text: "Abrir mochila y cruzar" }
            ],
            correctOptionId: "a",
            successMessage: "Usaste una condicion correcta."
          }
        },
        {
          id: "4-3-3",
          number: 3,
          title: "Reglas del puente",
          status: "locked",
          difficulty: "Media",
          coins: 25,
          gems: 1,
          challenge: {
            type: "multiple-choice",
            prompt: "Si el puente esta levantado, que debe hacer el robot?",
            options: [
              { id: "a", text: "Esperar hasta que baje" },
              { id: "b", text: "Cruzar igual" },
              { id: "c", text: "Repetir 4 veces: saltar" }
            ],
            correctOptionId: "a",
            successMessage: "Aplicaste la regla mas segura."
          }
        },
        {
          id: "4-3-4",
          number: 4,
          title: "Senales y respuestas",
          status: "locked",
          difficulty: "Media",
          coins: 25,
          gems: 1,
          challenge: {
            type: "multiple-choice",
            prompt: "Si aparece una senal roja, cual es la mejor respuesta?",
            options: [
              { id: "a", text: "Detenerse" },
              { id: "b", text: "Acelerar" },
              { id: "c", text: "Seguir sin mirar" }
            ],
            correctOptionId: "a",
            successMessage: "Relacionaste la condicion con la accion."
          }
        },
        {
          id: "4-3-5",
          number: 5,
          title: "Condicion correcta",
          status: "locked",
          difficulty: "Media",
          coins: 30,
          gems: 2,
          challenge: {
            type: "multiple-choice",
            prompt: "Para entrar al refugio, elige la regla correcta.",
            options: [
              { id: "a", text: "Si tienes llave, abrir puerta; si no, pedir ayuda" },
              { id: "b", text: "Repetir 2 veces: abrir puerta" },
              { id: "c", text: "Saltar y girar" }
            ],
            correctOptionId: "a",
            successMessage: "Planteaste una condicion completa."
          }
        },
        {
          id: "4-3-6",
          number: 6,
          title: "Resolver con opciones",
          status: "locked",
          difficulty: "Media",
          coins: 30,
          gems: 2,
          challenge: {
            type: "multiple-choice",
            prompt: "Si llueve, van por adentro; si no, por el patio. Que opcion lo representa?",
            options: [
              { id: "a", text: "Si llueve -> adentro; si no -> patio" },
              { id: "b", text: "Avanzar, avanzar, avanzar" },
              { id: "c", text: "Repetir 3 veces: correr" }
            ],
            correctOptionId: "a",
            successMessage: "Resolviste un camino con dos posibilidades."
          }
        },
        {
          id: "4-3-final",
          number: 7,
          title: "Desafio final: Laberinto logico",
          status: "locked",
          difficulty: "Dificil",
          coins: 60,
          gems: 3,
          final: true,
          challenge: {
            type: "multiple-choice",
            prompt: "En el laberinto, si la puerta azul esta abierta entras; si no, sigues a la verde. Que programa conviene?",
            options: [
              { id: "a", text: "Si azul abierta -> entrar; si no -> ir a verde" },
              { id: "b", text: "Repetir 5 veces: entrar" },
              { id: "c", text: "Girar sin mirar las puertas" }
            ],
            correctOptionId: "a",
            successMessage: "Tu logica resolvio el laberinto."
          }
        }
      ]
    },
    {
      id: "world-data",
      number: 4,
      title: "Isla de los Datos y la Creacion",
      short: "Datos y creacion",
      description: "El faro final necesita pistas ordenadas. Aqui aprenderas a clasificar datos, comparar informacion y usarla para crear una solucion propia.",
      status: "locked",
      type: "house",
      x: 0.7,
      y: 0.61,
      labelOffsetY: 114,
      reward: { coins: 220, gems: 10 },
      missions: [
        {
          id: "4-4-1",
          number: 1,
          title: "Clasifica objetos",
          status: "locked",
          difficulty: "Facil",
          coins: 20,
          gems: 1,
          challenge: {
            type: "categorize",
            prompt: "Haz click en cada objeto para dejarlo en la categoria correcta.",
            categories: ["Utiles", "Juguetes"],
            items: [
              { label: "Lapiz", correctCategory: "Utiles" },
              { label: "Pelota", correctCategory: "Juguetes" },
              { label: "Cuaderno", correctCategory: "Utiles" },
              { label: "Trompo", correctCategory: "Juguetes" }
            ],
            successMessage: "Ordenaste los objetos con criterio."
          }
        },
        {
          id: "4-4-2",
          number: 2,
          title: "Agrupa y cuenta",
          status: "locked",
          difficulty: "Facil",
          coins: 20,
          gems: 1,
          challenge: {
            type: "categorize",
            prompt: "Clasifica los elementos para luego poder contarlos mejor.",
            categories: ["Frutas", "Verduras"],
            items: [
              { label: "Manzana", correctCategory: "Frutas" },
              { label: "Zanahoria", correctCategory: "Verduras" },
              { label: "Banana", correctCategory: "Frutas" },
              { label: "Lechuga", correctCategory: "Verduras" }
            ],
            successMessage: "Agrupaste la informacion correctamente."
          }
        },
        {
          id: "4-4-3",
          number: 3,
          title: "Lee los datos",
          status: "locked",
          difficulty: "Media",
          coins: 25,
          gems: 1,
          challenge: {
            type: "multiple-choice",
            prompt: "En la tabla del puerto hay 5 barcos azules y 3 rojos. Cual color aparece mas?",
            options: [
              { id: "a", text: "Azules" },
              { id: "b", text: "Rojos" },
              { id: "c", text: "Son iguales" }
            ],
            correctOptionId: "a",
            successMessage: "Leiste y comparaste los datos."
          }
        },
        {
          id: "4-4-4",
          number: 4,
          title: "Compara resultados",
          status: "locked",
          difficulty: "Media",
          coins: 25,
          gems: 1,
          challenge: {
            type: "multiple-choice",
            prompt: "Si una caja tiene 8 piezas y otra tiene 6, cual tiene mas?",
            options: [
              { id: "a", text: "La caja de 8" },
              { id: "b", text: "La caja de 6" },
              { id: "c", text: "Las dos tienen lo mismo" }
            ],
            correctOptionId: "a",
            successMessage: "Comparaste cantidades sin problema."
          }
        },
        {
          id: "4-4-5",
          number: 5,
          title: "Muestra informacion",
          status: "locked",
          difficulty: "Media",
          coins: 30,
          gems: 2,
          challenge: {
            type: "multiple-choice",
            prompt: "Si quieres mostrar cuantas semillas hay de cada color, que conviene hacer primero?",
            options: [
              { id: "a", text: "Agruparlas por color" },
              { id: "b", text: "Mezclarlas todas" },
              { id: "c", text: "Guardarlas sin mirar" }
            ],
            correctOptionId: "a",
            successMessage: "Preparaste los datos para mostrarlos."
          }
        },
        {
          id: "4-4-6",
          number: 6,
          title: "Crea tu solucion",
          status: "locked",
          difficulty: "Media",
          coins: 30,
          gems: 2,
          challenge: {
            type: "categorize",
            prompt: "Organiza el taller para que todo quede facil de encontrar.",
            categories: ["Herramientas", "Materiales"],
            items: [
              { label: "Martillo", correctCategory: "Herramientas" },
              { label: "Pintura", correctCategory: "Materiales" },
              { label: "Destornillador", correctCategory: "Herramientas" },
              { label: "Madera", correctCategory: "Materiales" }
            ],
            successMessage: "Creaste una organizacion util."
          }
        },
        {
          id: "4-4-final",
          number: 7,
          title: "Desafio final: Proyecto explorador",
          status: "locked",
          difficulty: "Dificil",
          coins: 70,
          gems: 3,
          final: true,
          challenge: {
            type: "multiple-choice",
            prompt: "Para ayudar a toda la isla, que conviene hacer primero con la informacion recolectada?",
            options: [
              { id: "a", text: "Ordenarla y agruparla" },
              { id: "b", text: "Ignorarla" },
              { id: "c", text: "Mezclarla sin criterio" }
            ],
            correctOptionId: "a",
            successMessage: "Usaste los datos para tomar una buena decision."
          }
        }
      ]
    }
  ]
};
