// Banco de Preguntas Curadas de Nivel Medio para Potenciador de Match (+5%)

export const questionsBank = {
    react: {
        skillLabel: "React",
        questions: [
            {
                pregunta: "¿Cuál es el propósito principal del hook `useEffect` en React?",
                opciones: [
                    "Manipular el DOM del navegador directamente sin pasar por el Virtual DOM.",
                    "Manejar efectos secundarios como llamadas a APIs, suscripciones o manipulación manual del DOM.",
                    "Crear instancias de componentes basados en clases antiguas.",
                    "Declarar y actualizar estados reactivos locales en el componente."
                ],
                correcta: 1,
                explicacion: "`useEffect` está diseñado para ejecutar código en respuesta a cambios en el ciclo de vida del componente (montaje, actualización y desmontaje), lo cual abarca efectos secundarios fuera del renderizado puro."
            },
            {
                pregunta: "¿Qué es el 'Estado' (State) en un componente de React?",
                opciones: [
                    "Un objeto interno del componente que almacena datos dinámicos y privados que, al cambiar, disparan un re-renderizado.",
                    "Una variable global compartida de forma obligatoria por toda la aplicación.",
                    "Una propiedad estática e inmutable provista por el componente padre.",
                    "El archivo de configuración CSS que define los colores del componente."
                ],
                correcta: 0,
                explicacion: "El estado (`useState` en componentes funcionales) representa datos locales que pertenecen al componente y cuya modificación actualiza automáticamente la interfaz de usuario."
            },
            {
                pregunta: "En React, ¿para qué se utiliza la propiedad especial `key` al renderizar colecciones de elementos?",
                opciones: [
                    "Para encriptar la información de las tarjetas en la base de datos.",
                    "Para vincular hojas de estilo específicas a cada elemento individual.",
                    "Para ayudar al algoritmo de reconciliación de React a identificar qué elementos han cambiado, se han agregado o eliminado de forma eficiente.",
                    "Para registrar accesos y clics mediante herramientas de analítica."
                ],
                correcta: 2,
                explicacion: "La propiedad `key` proporciona una identidad estable a los elementos de una lista, lo que permite a React reutilizar componentes del DOM existentes en lugar de re-crearlos, optimizando el rendimiento."
            }
        ]
    },
    python: {
        skillLabel: "Python",
        questions: [
            {
                pregunta: "¿Qué tipo de estructura de datos en Python es inmutable por naturaleza?",
                opciones: [
                    "Lista (`list`)",
                    "Diccionario (`dict`)",
                    "Tupla (`tuple`)",
                    "Conjunto (`set`)"
                ],
                correcta: 2,
                explicacion: "Las tuplas en Python son secuencias inmutables, lo que significa que una vez creadas, sus elementos y su orden no pueden ser modificados, añadidos ni eliminados."
            },
            {
                pregunta: "En Python, ¿cuál es el propósito principal del bloque estructurado `try...except`?",
                opciones: [
                    "Crear bucles condicionales infinitos de alta eficiencia.",
                    "Capturar y gestionar excepciones o errores durante el tiempo de ejecución para evitar que el programa se detenga bruscamente.",
                    "Declarar funciones lambda anidadas de forma segura.",
                    "Optimizar el espacio de memoria RAM mediante la recolección automática de basura."
                ],
                correcta: 1,
                explicacion: "El bloque `try...except` permite implementar el manejo de errores, ejecutando código alternativo ante una falla y manteniendo el flujo continuo del programa."
            },
            {
                pregunta: "¿Qué retornará la expresión `len([10, 20, 30])` en el intérprete de Python?",
                opciones: [
                    "2",
                    "4",
                    "3",
                    "Dará un error de tipo (`TypeError`)"
                ],
                correcta: 2,
                explicacion: "`len()` cuenta el número de elementos de un iterable. La lista contiene exactamente tres números enteros, por lo que retorna 3."
            }
        ]
    },
    sql: {
        skillLabel: "SQL",
        questions: [
            {
                pregunta: "¿Qué comando se utiliza en SQL para filtrar los registros obtenidos en una consulta estructurada?",
                opciones: [
                    "GROUP BY",
                    "WHERE",
                    "ORDER BY",
                    "HAVING"
                ],
                correcta: 1,
                explicacion: "La cláusula `WHERE` especifica las condiciones de filtrado que deben cumplir las filas individuales antes de ser devueltas en el set de resultados."
            },
            {
                pregunta: "¿Cuál es la diferencia fundamental entre una unión `INNER JOIN` y una `LEFT JOIN`?",
                opciones: [
                    "LEFT JOIN solo permite unir tablas si los campos clave contienen cadenas de texto.",
                    "INNER JOIN devuelve solo las filas con coincidencias exactas en ambas tablas; LEFT JOIN devuelve todas las filas de la tabla izquierda y las filas coincidentes de la derecha (o NULL si no hay coincidencia).",
                    "No existe diferencia operativa; ambos términos son alias equivalentes en el motor de base de datos.",
                    "LEFT JOIN borra los datos duplicados de la tabla derecha de manera irreversible."
                ],
                correcta: 1,
                explicacion: "`INNER JOIN` es restrictivo y solo muestra intersecciones; `LEFT JOIN` preserva todos los registros del extremo izquierdo, agregando columnas con valores nulos (`NULL`) si la relación no existe en la derecha."
            },
            {
                pregunta: "¿Para qué sirve el comando de agrupación `GROUP BY` en SQL?",
                opciones: [
                    "Para ordenar los resultados finales en forma alfabética o numérica descendente.",
                    "Para agrupar filas de datos que tienen los mismos valores en columnas especificadas, usándose comúnmente con funciones de agregación (como `SUM`, `COUNT` o `AVG`).",
                    "Para eliminar filas duplicadas físicamente del almacenamiento del servidor.",
                    "Para cambiar temporalmente los nombres de las columnas en la salida."
                ],
                correcta: 1,
                explicacion: "`GROUP BY` reúne filas idénticas basadas en uno o más atributos para que el motor pueda resumir la información (por ejemplo, contar cuántos empleados pertenecen a cada departamento)."
            }
        ]
    },
    javascript: {
        skillLabel: "JavaScript",
        questions: [
            {
                pregunta: "¿Cuál es la diferencia principal entre declarar una variable con `let` en lugar de `var`?",
                opciones: [
                    "`let` define variables con ámbito (scope) de bloque; `var` las define con ámbito de función o globales, ignorando bloques como bucles o condicionales.",
                    "Las variables creadas con `let` son constantes y sus valores no pueden ser reasignados.",
                    "`let` consume el doble de memoria de ejecución que `var` en el motor V8 del navegador.",
                    "`let` es compatible con navegadores antiguos de forma nativa sin transpiladores."
                ],
                correcta: 0,
                explicacion: "`let` y `const` respetan los bloques delimitados por llaves `{}` (block scope), lo que previene errores comunes de variables que se filtran o sobreescriben debido al hoisting de `var`."
            },
            {
                pregunta: "¿Qué significa que una función retorne una `Promise` en JavaScript?",
                opciones: [
                    "Que la función terminará su ejecución sincrónica de forma instantánea liberando el procesador.",
                    "Que representa un valor que estará disponible ahora, en el futuro o nunca, sirviendo para gestionar tareas asíncronas.",
                    "Que el navegador garantiza al 100% que la operación de red nunca fallará.",
                    "Que la función ha sido bloqueada debido a políticas de seguridad CORS."
                ],
                correcta: 1,
                explicacion: "Las promesas son contenedores para una operación asíncrona cuyo resultado (éxito con `resolve` o error con `reject`) se resolverá de manera asíncrona en el futuro."
            },
            {
                pregunta: "¿Cuál es el resultado de ejecutar la operación `[1, 2, 3].map(x => x * 2)`?",
                opciones: [
                    "`[2, 4, 6]`, sin modificar la lista original.",
                    "`[2, 4, 6]`, sobreescribiendo los valores dentro del arreglo de entrada.",
                    "Retorna el valor total de la suma (`12`).",
                    "Genera una excepción de ejecución porque `.map()` es exclusivo de objetos."
                ],
                correcta: 0,
                explicacion: "El método `.map()` crea y retorna un *nuevo* arreglo con los resultados de aplicar la función callback a cada elemento, manteniendo intacto el arreglo original (inmutabilidad)."
            }
        ]
    },
    node: {
        skillLabel: "Node.js",
        questions: [
            {
                pregunta: "¿Qué es el 'Event Loop' (Bucle de Eventos) en Node.js?",
                opciones: [
                    "Un mecanismo de seguridad que previene ciclos infinitos en el backend.",
                    "Un motor de renderizado HTML que procesa plantillas en el servidor.",
                    "El componente central que permite a Node.js realizar operaciones de E/S no bloqueantes, ejecutando callbacks asíncronas en un único hilo.",
                    "Un bucle recursivo manual que el desarrollador debe programar al inicio del servidor."
                ],
                correcta: 2,
                explicacion: "El Event Loop es el corazón asíncrono de Node.js. Se encarga de delegar tareas pesadas (lectura de archivos, consultas de red) al sistema operativo o a un hilo auxiliar y recibir la respuesta en un hilo de ejecución principal."
            },
            {
                pregunta: "¿Qué función cumple el comando `npm install` ejecutado en una carpeta de proyecto?",
                opciones: [
                    "Compilar todo el código JavaScript a lenguaje de máquina para producción.",
                    "Descargar e instalar todas las dependencias listadas en el archivo `package.json` dentro del directorio `node_modules`.",
                    "Publicar la aplicación en los servidores oficiales de Node.js de forma gratuita.",
                    "Verificar fallos de sintaxis del código de manera interactiva."
                ],
                correcta: 1,
                explicacion: "`npm install` lee el archivo `package.json`, resuelve el árbol de dependencias requerido e instala las librerías necesarias en la carpeta local `node_modules`."
            },
            {
                pregunta: "En Node.js, ¿para qué sirve el objeto `process.env`?",
                opciones: [
                    "Para monitorear el consumo de CPU y memoria RAM del servidor.",
                    "Para definir variables globales exclusivas del navegador cliente.",
                    "Para acceder a las variables de entorno configuradas en el sistema operativo o en archivos `.env`.",
                    "Para limpiar directorios temporales de manera automática."
                ],
                correcta: 2,
                explicacion: "`process.env` almacena la configuración y claves del entorno del sistema de ejecución de Node.js, siendo fundamental para resguardar secretos (como tokens de bases de datos o APIs) fuera del código fuente."
            }
        ]
    },
    default: {
        skillLabel: "Desarrollo de Software",
        questions: [
            {
                pregunta: "En control de versiones con Git, ¿qué acción realiza el comando `git clone [url]`?",
                opciones: [
                    "Elimina permanentemente un repositorio de los servidores remotos de GitHub.",
                    "Crea una copia de seguridad local y comprimida de toda tu computadora.",
                    "Crea un clon local exacto de un repositorio remoto en tu sistema de archivos, incluyendo todo el historial de ramas y commits.",
                    "Une los commits de dos ramas de trabajo distintas de forma destructiva."
                ],
                correcta: 2,
                explicacion: "`git clone` descarga todo el repositorio remoto (historial, ramas y archivos) y lo configura localmente listo para trabajar de inmediato."
            },
            {
                pregunta: "¿Cuál es el objetivo principal del evento 'Daily Scrum' (reunión diaria) en metodologías ágiles?",
                opciones: [
                    "Aprobar presupuestos financieros con directivos de la empresa.",
                    "Realizar una reunión corta (generalmente 15 minutos) del equipo para sincronizar el trabajo del día, reportar bloqueos y alinear prioridades.",
                    "Revisar y reescribir todo el código fuente de forma presencial.",
                    "Entrevistar a nuevos candidatos para incorporarlos al equipo de trabajo."
                ],
                correcta: 1,
                explicacion: "El Daily Scrum promueve la comunicación rápida del equipo de desarrollo analizando qué se hizo ayer, qué se hará hoy y qué impedimentos o bloqueos existen."
            },
            {
                pregunta: "En Git, ¿cuál es el propósito de ejecutar `git checkout -b feature-nueva`?",
                opciones: [
                    "Crear una nueva rama local y cambiar inmediatamente el entorno de trabajo a ella.",
                    "Borrar de forma definitiva e irrecuperable la rama en la que estás posicionado.",
                    "Enviar todos tus cambios confirmados al servidor de GitHub.",
                    "Descargar la última versión de la rama principal descartando tus archivos locales modificados."
                ],
                correcta: 0,
                explicacion: "La bandera `-b` en `git checkout` (o en el moderno `git switch -c`) le ordena a Git crear una nueva rama a partir del commit actual y posicionarte sobre ella en un solo paso."
            }
        ]
    }
};

/**
 * Recibe una lista de skills requeridas de una oferta y busca cuál coincide con nuestro banco.
 * @param {Array} skillsList Lista de objetos u strings de skills de la oferta.
 * @returns {Object} El set de preguntas correspondiente (React, SQL, Python, etc.) o el set genérico.
 */
export function getQuestionsForSkills(skillsList = []) {
    if (!skillsList || skillsList.length === 0) {
        return questionsBank.default;
    }

    // Normalizar nombres de skills requeridas
    const normalizedList = skillsList.map(s => {
        const name = typeof s === 'string' 
            ? s 
            : (s.nombre_original || s.diccionario_skills?.nombre_skill || '');
        return name.toLowerCase().trim();
    });

    // Mapeos de búsqueda flexible (substrings)
    const mappings = [
        { key: 'react', keywords: ['react', 'react.js', 'reactjs'] },
        { key: 'python', keywords: ['python', 'py', 'python3'] },
        { key: 'sql', keywords: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'mariadb', 'oracle'] },
        { key: 'javascript', keywords: ['javascript', 'js', 'es6', 'typescript', 'ts'] },
        { key: 'node', keywords: ['node', 'node.js', 'nodejs', 'express'] }
    ];

    // Buscar coincidencia en orden de prioridad
    for (const map of mappings) {
        const found = normalizedList.some(skillName => 
            map.keywords.some(kw => skillName.includes(kw))
        );
        if (found) {
            return questionsBank[map.key];
        }
    }

    // Si no coincide ninguna skill, retorna default (Software general / Git / Scrum)
    return questionsBank.default;
}
