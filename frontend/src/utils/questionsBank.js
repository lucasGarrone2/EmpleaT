// Banco de Preguntas Curadas Generales y Sencillas para el Potenciador de Match (+5%)
// Cada categoría tiene un pool amplio, y el sistema elige 3 preguntas aleatorias en cada intento.

export const questionsBank = {
    react: {
        skillLabel: "React",
        questions: [
            {
                pregunta: "¿Qué es React en el desarrollo web?",
                opciones: [
                    "Una base de datos relacional para guardar contraseñas.",
                    "Una biblioteca de JavaScript para construir interfaces de usuario reutilizables.",
                    "Un sistema operativo de código abierto para servidores cloud.",
                    "Un editor de código visual enfocado en diseño gráfico."
                ],
                correcta: 1,
                explicacion: "React es una biblioteca de JavaScript de código abierto diseñada para crear interfaces de usuario interactivas a partir de componentes modulares."
            },
            {
                pregunta: "¿Qué es un 'Componente' en React?",
                opciones: [
                    "Una parte reutilizable de la interfaz que contiene su propia lógica y diseño.",
                    "Un cable de red físico que conecta las computadoras a internet.",
                    "Un comando de base de datos para borrar registros de usuarios.",
                    "La hoja de estilos CSS general de la aplicación."
                ],
                correcta: 0,
                explicacion: "Los componentes son los bloques fundamentales de React. Permiten separar la interfaz en piezas independientes, reutilizables y con estado propio."
            },
            {
                pregunta: "¿Cuál es el propósito principal de usar el 'Estado' (State) en React?",
                opciones: [
                    "Guardar la dirección IP física del cliente en el backend.",
                    "Almacenar datos locales dinámicos que, al cambiar, actualizan la pantalla automáticamente.",
                    "Elegir el país del servidor donde se hospeda la base de datos.",
                    "Crear copias de seguridad de los archivos CSS de la aplicación."
                ],
                correcta: 1,
                explicacion: "El estado local permite que un componente recuerde información y actualice la interfaz de usuario en tiempo real cuando esos datos cambian."
            },
            {
                pregunta: "¿Qué hook básico se utiliza en React para declarar una variable de estado?",
                opciones: [
                    "`useConnection`",
                    "`useRoute`",
                    "`useState`",
                    "`useEffect`"
                ],
                correcta: 2,
                explicacion: "`useState` es el hook estándar de React que permite añadir estado local a un componente funcional."
            },
            {
                pregunta: "¿Para qué sirve la propiedad especial `key` al renderizar listas en React?",
                opciones: [
                    "Para encriptar los datos del usuario en el navegador.",
                    "Para que React identifique qué elementos cambiaron, se agregaron o eliminaron de forma eficiente.",
                    "Para aplicar estilos de colores degradados a la pantalla.",
                    "Para acelerar la velocidad de descarga de la base de datos."
                ],
                correcta: 1,
                explicacion: "La propiedad `key` ayuda al Virtual DOM de React a asociar elementos estables con elementos de la interfaz, previniendo fallos visuales y optimizando el rendimiento."
            }
        ]
    },
    python: {
        skillLabel: "Python",
        questions: [
            {
                pregunta: "¿Qué caracteriza al lenguaje de programación Python?",
                opciones: [
                    "Es extremadamente difícil de leer y requiere compilarse en binarios crudos.",
                    "Es un lenguaje de alto nivel reconocido por su sintaxis limpia y facilidad de lectura.",
                    "Es una base de datos relacional para servidores de alto rendimiento.",
                    "Solo sirve para diseñar la interfaz visual de páginas web estáticas."
                ],
                correcta: 1,
                explicacion: "Python se destaca por su legibilidad, facilidad de aprendizaje y versatilidad en múltiples rubros (web, ciencia de datos, automatización, etc.)."
            },
            {
                pregunta: "¿Cuál de las siguientes es una estructura de datos inmutable (que no se puede modificar) en Python?",
                opciones: [
                    "Lista (`list`)",
                    "Diccionario (`dict`)",
                    "Tupla (`tuple`)",
                    "Conjunto (`set`)"
                ],
                correcta: 2,
                explicacion: "Las tuplas se definen entre paréntesis y son inmutables en Python: no se pueden agregar, quitar o reordenar elementos una vez creadas."
            },
            {
                pregunta: "¿Cómo se define una función en Python?",
                opciones: [
                    "Usando la palabra clave `def` seguida del nombre de la función.",
                    "Escribiendo la palabra clave `function` obligatoriamente.",
                    "Declarándola directamente como una variable de clase sin llaves.",
                    "Usando el símbolo de numeral `#` antes del nombre."
                ],
                correcta: 0,
                explicacion: "Las funciones en Python se declaran con la palabra reservada `def`, el nombre de la función, paréntesis y dos puntos."
            },
            {
                pregunta: "¿Cuál es la función del bloque `try...except` en Python?",
                opciones: [
                    "Crear un bucle condicional infinito muy rápido.",
                    "Capturar y manejar posibles errores durante la ejecución para evitar que el programa falle.",
                    "Importar librerías externas desde internet de forma automática.",
                    "Limpiar los archivos temporales y optimizar el uso de memoria RAM."
                ],
                correcta: 1,
                explicacion: "El bloque `try...except` permite atrapar excepciones de ejecución (como una división por cero o un archivo inexistente) y gestionarlas sin detener el software."
            },
            {
                pregunta: "¿Cuál es la forma correcta de agregar un elemento al final de una lista en Python?",
                opciones: [
                    "`lista.append(elemento)`",
                    "`lista.add(elemento)`",
                    "`lista.push(elemento)`",
                    "`lista.insert(elemento)`"
                ],
                correcta: 0,
                explicacion: "`append()` es el método integrado en las listas de Python para anexar un nuevo elemento al extremo final."
            }
        ]
    },
    sql: {
        skillLabel: "SQL",
        questions: [
            {
                pregunta: "¿Qué significa SQL?",
                opciones: [
                    "Structured Query Language (Lenguaje de Consulta Estructurado).",
                    "System Quality Level (Nivel de Calidad del Sistema).",
                    "Simple Queue Link (Enlace de Cola Simple).",
                    "Secure Quick Login (Acceso Rápido y Seguro)."
                ],
                correcta: 0,
                explicacion: "SQL es el lenguaje estándar utilizado para interactuar y realizar consultas sobre bases de datos relacionales."
            },
            {
                pregunta: "¿Qué instrucción SQL se utiliza para obtener o leer registros de una base de datos?",
                opciones: [
                    "`GET`",
                    "`SELECT`",
                    "`FIND`",
                    "`EXTRACT`"
                ],
                correcta: 1,
                explicacion: "La sentencia `SELECT` le indica al motor de base de datos qué columnas y filas deseamos recuperar de una o más tablas."
            },
            {
                pregunta: "¿Para qué sirve la cláusula `WHERE` en una consulta SQL?",
                opciones: [
                    "Para ordenar los resultados de forma alfabética.",
                    "Para filtrar registros según una o más condiciones especificadas.",
                    "Para unir dos o más tablas distintas.",
                    "Para limitar el número total de filas devueltas."
                ],
                correcta: 1,
                explicacion: "La cláusula `WHERE` permite aplicar un filtro sobre las filas del origen de datos antes de devolver los resultados."
            },
            {
                pregunta: "¿Qué es una Clave Primaria (Primary Key) en una tabla de base de datos?",
                opciones: [
                    "La contraseña del administrador de la base de datos.",
                    "Un campo que identifica de forma única a cada registro en la tabla.",
                    "Una columna que contiene texto de longitud ilimitada.",
                    "La primera línea del archivo de configuración del servidor."
                ],
                correcta: 1,
                explicacion: "Una clave primaria garantiza la unicidad e identidad única de cada fila en una tabla de base de datos."
            },
            {
                pregunta: "¿Qué tipo de unión (`JOIN`) devuelve únicamente los registros que tienen coincidencia en ambas tablas relacionadas?",
                opciones: [
                    "`INNER JOIN`",
                    "`LEFT JOIN`",
                    "`OUTER JOIN`",
                    "`FULL JOIN`"
                ],
                correcta: 0,
                explicacion: "`INNER JOIN` es una intersección exacta que solo muestra resultados si la relación existe en ambos lados de la consulta."
            }
        ]
    },
    javascript: {
        skillLabel: "JavaScript",
        questions: [
            {
                pregunta: "¿Qué es JavaScript?",
                opciones: [
                    "Un lenguaje de programación utilizado principalmente para dar interactividad a páginas web.",
                    "Una versión simplificada de Java exclusiva para sistemas de escritorio.",
                    "Un procesador de hojas de estilo CSS para celulares.",
                    "Un motor de bases de datos que no requiere código."
                ],
                correcta: 0,
                explicacion: "JavaScript es un lenguaje interpretado fundamental en el desarrollo web junto con HTML y CSS, permitiendo crear dinamismo en el navegador."
            },
            {
                pregunta: "¿Cuál es la diferencia básica entre `const` y `let` en JavaScript?",
                opciones: [
                    "Las variables con `const` no pueden reasignarse tras su creación; con `let` sí es posible cambiarlas.",
                    "`const` solo admite números enteros y `let` admite texto largo.",
                    "`let` funciona únicamente en navegadores y `const` en servidores.",
                    "`const` borra automáticamente la memoria RAM de forma periódica."
                ],
                correcta: 0,
                explicacion: "`const` se utiliza para declarar variables cuyo valor no variará en el ciclo de vida del bloque de ejecución, a diferencia de `let` que permite reasignación."
            },
            {
                pregunta: "¿Qué es una promesa (`Promise`) en JavaScript?",
                opciones: [
                    "Un objeto que representa el resultado (exitoso o fallido) de una operación asíncrona en el futuro.",
                    "Una función que garantiza al 100% que la conexión de red nunca fallará.",
                    "Una regla de estilo que obliga a usar llaves en las condicionales.",
                    "Un método para comprimir archivos JavaScript para subirlos al servidor."
                ],
                correcta: 0,
                explicacion: "Las promesas gestionan operaciones asíncronas, almacenando temporalmente el estado pendiente hasta que se resuelven o se rechazan."
            },
            {
                pregunta: "¿Qué método de arreglos se usa para transformar cada elemento de un array aplicando una función?",
                opciones: [
                    "`.map()`",
                    "`.filter()`",
                    "`.forEach()`",
                    "`.reduce()`"
                ],
                correcta: 0,
                explicacion: "El método `.map()` crea un nuevo arreglo con los resultados de la llamada a la función provista aplicada en cada uno de los elementos."
            },
            {
                pregunta: "¿Cómo se escribe un comentario de una sola línea en JavaScript?",
                opciones: [
                    "`// Comentario`",
                    "`/* Comentario`",
                    "`# Comentario`",
                    "`<!-- Comentario`"
                ],
                correcta: 0,
                explicacion: "En JavaScript, la doble barra inclinada `//` marca el resto de la línea de código como un comentario ignorado por el intérprete."
            }
        ]
    },
    node: {
        skillLabel: "Node.js",
        questions: [
            {
                pregunta: "¿Qué es Node.js?",
                opciones: [
                    "Un entorno de ejecución que permite ejecutar código JavaScript del lado del servidor.",
                    "Una librería frontend para maquetar estilos responsivos.",
                    "Un software de base de datos no relacional muy popular.",
                    "Un programa de compresión de archivos ZIP para hosting."
                ],
                correcta: 0,
                explicacion: "Node.js es un entorno de ejecución multiplataforma para JS fuera del navegador, enfocado en servicios de red y desarrollo de APIs de backend."
            },
            {
                pregunta: "¿Qué es `npm` en Node.js?",
                opciones: [
                    "El gestor de paquetes por defecto para instalar y administrar dependencias del proyecto.",
                    "Un tipo de base de datos en memoria sumamente veloz.",
                    "Un protocolo de comunicación en red cifrada.",
                    "Un comando que compila el código a lenguaje C++."
                ],
                correcta: 0,
                explicacion: "npm (Node Package Manager) permite buscar, descargar y actualizar librerías publicadas por otros desarrolladores e integrarlas a nuestra app."
            },
            {
                pregunta: "¿Para qué sirve el archivo `package.json` en un proyecto de Node?",
                opciones: [
                    "Guardar claves secretas y contraseñas de las bases de datos de forma pública.",
                    "Definir los metadatos del proyecto, scripts de arranque y la lista de dependencias requeridas.",
                    "Definir el diseño visual de la interfaz del frontend.",
                    "Almacenar el historial de navegación de los clientes."
                ],
                correcta: 1,
                explicacion: "El archivo `package.json` es el corazón del proyecto. Contiene configuraciones críticas, comandos y las librerías necesarias para que la app se construya e instale correctamente."
            },
            {
                pregunta: "En servidores web (ej. Express.js), ¿cuál es el propósito de un 'Middleware'?",
                opciones: [
                    "Un programa externo que balancea la carga de red en el hosting.",
                    "Una función intermedia que procesa, valida o modifica la solicitud antes de que llegue al controlador final.",
                    "La base de datos de respaldo que se sincroniza cada medianoche.",
                    "La hoja de estilos CSS de las páginas de error."
                ],
                correcta: 1,
                explicacion: "Los middlewares interceptan la petición entrante (por ejemplo para verificar tokens de sesión o formatear datos JSON) y deciden si continúan el flujo o responden inmediatamente."
            }
        ]
    },
    html_css: {
        skillLabel: "HTML y CSS",
        questions: [
            {
                pregunta: "¿Qué función cumple HTML en una página web?",
                opciones: [
                    "Dar estilos visuales, colores y animaciones complejas.",
                    "Definir la estructura básica y el contenido del sitio mediante etiquetas.",
                    "Conectarse a bases de datos relacionales en el servidor.",
                    "Asegurar el cifrado y seguridad de los pagos en línea."
                ],
                correcta: 1,
                explicacion: "HTML (HyperText Markup Language) es el esqueleto de la web, definiendo dónde van textos, títulos, imágenes, botones y enlaces."
            },
            {
                pregunta: "¿Para qué se utiliza CSS?",
                opciones: [
                    "Para dar estilo visual, color, diseño responsivo y presentación a la estructura HTML.",
                    "Para almacenar la información y registros de compras en tablas.",
                    "Para programar la lógica del servidor de correos electrónicos.",
                    "Para validar las contraseñas ingresadas por el usuario."
                ],
                correcta: 0,
                explicacion: "CSS (Cascading Style Sheets) es el lenguaje de diseño gráfico que transforma elementos planos en experiencias de usuario atractivas y adaptadas a pantallas."
            },
            {
                pregunta: "¿Qué etiqueta HTML se utiliza para insertar un enlace o hipervínculo?",
                opciones: [
                    "`<link>`",
                    "`<a>`",
                    "`<href>`",
                    "`<anchor>`"
                ],
                correcta: 1,
                explicacion: "La etiqueta `<a>` (anchor) con el atributo `href` se utiliza para redireccionar a los usuarios a otras páginas o secciones."
            },
            {
                pregunta: "¿Cómo se aplica una regla de estilos a una clase específica en CSS?",
                opciones: [
                    "Poniendo un punto antes del nombre (ej: `.mi-clase { ... }`).",
                    "Poniendo un numeral antes del nombre (ej: `#mi-clase { ... }`).",
                    "Escribiendo el nombre directamente sin símbolos (ej: `mi-clase { ... }`).",
                    "Escribiendo la etiqueta `@mi-clase { ... }`."
                ],
                correcta: 0,
                explicacion: "Los selectores de clase en CSS comienzan con un punto `.`, mientras que los selectores de identificador único (ID) usan el numeral `#`."
            }
        ]
    },
    devops_cloud: {
        skillLabel: "DevOps y Cloud",
        questions: [
            {
                pregunta: "¿Qué es la computación en la nube (Cloud)?",
                opciones: [
                    "Alquilar y acceder a servidores, bases de datos y almacenamiento a través de Internet en vez de tenerlos físicamente.",
                    "Un sistema de refrigeración por aire comprimido en los data centers.",
                    "Una red satelital que funciona sin cableado estructurado.",
                    "Un software que genera automáticamente el código de la aplicación."
                ],
                correcta: 0,
                explicacion: "La nube provee recursos tecnológicos bajo demanda por internet, eliminando la necesidad de adquirir, mantener y configurar servidores locales."
            },
            {
                pregunta: "¿Cuál es el beneficio de utilizar un sistema de control de versiones como Git?",
                opciones: [
                    "Permite rastrear cambios, colaborar en equipo y revertir código a versiones anteriores sin pérdida de información.",
                    "Aumenta de forma directa la velocidad de internet de la oficina.",
                    "Protege las computadoras contra fallas eléctricas locales.",
                    "Elimina los errores de sintaxis del código de manera automática."
                ],
                correcta: 0,
                explicacion: "Git registra el historial de modificaciones del código, facilitando el trabajo cooperativo mediante ramas e integraciones sin pisar el trabajo de otros."
            },
            {
                pregunta: "¿Qué beneficio principal ofrece Docker en el despliegue de software?",
                opciones: [
                    "Aísla la aplicación y sus dependencias en un contenedor para que corra idéntico en cualquier computadora o servidor.",
                    "Duplica la velocidad de los discos de almacenamiento físico.",
                    "Permite realizar compras en línea con descuentos exclusivos.",
                    "Genera automáticamente la documentación de desarrollo."
                ],
                correcta: 0,
                explicacion: "Docker encapsula todo el entorno de ejecución del software de forma que se ejecute de manera predecible tanto en el ambiente de desarrollo como en la nube."
            }
        ]
    },
    ventas: {
        skillLabel: "Ventas y Atención al Cliente",
        questions: [
            {
                pregunta: "¿Cuál es el objetivo principal de la atención al cliente?",
                opciones: [
                    "Resolver dudas, brindar asistencia y lograr la satisfacción y fidelidad del cliente.",
                    "Evitar que los clientes soliciten cambios de productos rotos.",
                    "Vender a toda costa productos de mala calidad sin escuchar al cliente.",
                    "Cobrar recargos adicionales ocultos en las facturas de venta."
                ],
                correcta: 0,
                explicacion: "Brindar una buena atención al cliente genera relaciones de confianza a largo plazo, resolviendo problemas y mejorando la reputación de la marca."
            },
            {
                pregunta: "En el área comercial, ¿a qué se refiere el 'cierre de ventas'?",
                opciones: [
                    "Terminar el horario de atención y cerrar las puertas de la tienda física.",
                    "El acuerdo final donde el cliente confirma y realiza la compra del producto o servicio.",
                    "Cancelar la cuenta de un cliente insatisfecho para evitar reclamos.",
                    "Realizar el arqueo y conteo de la caja registradora de forma diaria."
                ],
                correcta: 1,
                explicacion: "El cierre es la etapa del proceso de venta en la que se concreta la transacción comercial, logrando el compromiso del comprador."
            },
            {
                pregunta: "¿Qué es un CRM y para qué sirve en una empresa?",
                opciones: [
                    "Un sistema para administrar los datos de los clientes y hacer un seguimiento de las oportunidades de venta.",
                    "Una placa de hardware instalada dentro de los terminales de cobro electrónico.",
                    "Una técnica contable para calcular el balance de impuestos mensuales.",
                    "El sistema de seguridad contra incendios en oficinas corporativas."
                ],
                correcta: 0,
                explicacion: "El software CRM (Customer Relationship Management) centraliza las interacciones con los clientes, optimizando el seguimiento comercial y postventa."
            },
            {
                pregunta: "¿Cuál es la mejor actitud al recibir una queja de un cliente insatisfecho?",
                opciones: [
                    "Escuchar activamente con empatía, mantener la calma y proponer soluciones concretas.",
                    "Ignorar el reclamo o discutir firmemente con el cliente para defender a la empresa.",
                    "Pasarle la queja a otra área y cortar inmediatamente la comunicación.",
                    "Decirle que debe realizar una denuncia formal por carta antes de escucharlo."
                ],
                correcta: 0,
                explicacion: "La escucha activa y empatía desactivan tensiones y transforman un cliente insatisfecho en una oportunidad de mejora y fidelización."
            }
        ]
    },
    administracion: {
        skillLabel: "Administración y Finanzas",
        questions: [
            {
                pregunta: "¿Cuál es una tarea básica del sector administrativo de una empresa?",
                opciones: [
                    "Planificar, coordinar recursos, archivar documentación y organizar procesos internos.",
                    "Desarrollar el backend del sitio web corporativo.",
                    "Diseñar la gráfica de los folletos publicitarios del producto.",
                    "Conducir los camiones de reparto o embalar mercaderías."
                ],
                correcta: 0,
                explicacion: "La administración provee soporte organizativo, control y estructura a todas las áreas de la compañía."
            },
            {
                pregunta: "En Excel, ¿para qué se utiliza principalmente la fórmula `SUMA`?",
                opciones: [
                    "Para sumar los valores numéricos de un conjunto de celdas seleccionadas.",
                    "Para buscar datos específicos en una columna de texto.",
                    "Para cambiar el diseño y color de las fuentes de la hoja.",
                    "Para eliminar filas vacías en la hoja de cálculo."
                ],
                correcta: 0,
                explicacion: "La función `=SUMA(rango)` realiza la adición aritmética rápida de números en las celdas especificadas."
            },
            {
                pregunta: "¿Qué es la facturación en una empresa?",
                opciones: [
                    "El registro oficial de una venta de bienes o servicios detallando el importe, conceptos e impuestos aplicables.",
                    "El contrato de trabajo que firman los nuevos empleados.",
                    "La solicitud de un préstamo de dinero en una entidad bancaria.",
                    "El proceso de selección de personal para las oficinas."
                ],
                correcta: 0,
                explicacion: "La factura es el documento fiscal y legal obligatorio que respalda la realización de una transacción comercial entre partes."
            },
            {
                pregunta: "¿Qué es una conciliación bancaria?",
                opciones: [
                    "Comparar la información contable de la empresa con el extracto bancario para garantizar la consistencia de los fondos.",
                    "Pedir un descuento sobre las tasas de las tarjetas de crédito corporativas.",
                    "Firmar un contrato para abrir una cuenta corriente empresarial.",
                    "Cancelar deudas de impuestos de manera excepcional."
                ],
                correcta: 0,
                explicacion: "La conciliación detecta discrepancias, depósitos en tránsito o cargos bancarios no registrados, manteniendo el control de caja."
            }
        ]
    },
    logistica: {
        skillLabel: "Logística y Almacenamiento",
        questions: [
            {
                pregunta: "¿Qué es el control de stock o inventario?",
                opciones: [
                    "Registrar y verificar la cantidad de mercadería disponible para evitar faltantes de ventas o excesos de compras.",
                    "Ordenar alfabéticamente los correos de los clientes del área comercial.",
                    "Lavar y pintar las cajas de cartón vacías de las mercaderías.",
                    "Calcular la cotización del dólar para las ventas del día."
                ],
                correcta: 0,
                explicacion: "Controlar el inventario asegura el nivel óptimo de mercaderías para cumplir con la demanda, reduciendo costos de almacenamiento."
            },
            {
                pregunta: "¿Cuál es el fin del proceso de logística de distribución?",
                opciones: [
                    "Organizar y coordinar el transporte de productos para que lleguen al comprador final en tiempo y forma.",
                    "Diseñar los logotipos y colores publicitarios de las cajas.",
                    "Negociar el pago de salarios de los administrativos.",
                    "Fabricar las materias primas dentro de la planta."
                ],
                correcta: 0,
                explicacion: "La distribución abarca el almacenamiento, despacho y transporte, buscando la mayor eficiencia y puntualidad en la entrega."
            },
            {
                pregunta: "En depósitos, ¿qué es la conducción de un autoelevador o Clark?",
                opciones: [
                    "Manejar un vehículo industrial de carga diseñado para levantar y transportar pallets pesados.",
                    "Operar los softwares contables de administración del stock.",
                    "Supervisar el tiempo de descarga de buques cargueros.",
                    "Realizar tareas de soldadura eléctrica en estanterías rotas."
                ],
                correcta: 0,
                explicacion: "Los autoelevadores mueven y apilan verticalmente cargas pesadas de forma segura y veloz dentro de almacenes."
            },
            {
                pregunta: "En logística, ¿qué indica la regla FIFO (Primero en Entrar, Primero en Salir)?",
                opciones: [
                    "Los productos más antiguos en el stock deben venderse o despacharse primero para evitar su vencimiento o deterioro.",
                    "El primer cliente que compra del día recibe un descuento adicional.",
                    "Las facturas deben cobrarse de acuerdo al orden de numeración.",
                    "El primer transportista que llega al muelle tiene prioridad de carga."
                ],
                correcta: 0,
                explicacion: "FIFO (First In, First Out) es vital para la rotación de stock perecedero o susceptible de quedar obsoleto."
            }
        ]
    },
    gastronomia: {
        skillLabel: "Gastronomía y Cocina",
        questions: [
            {
                pregunta: "¿Por qué es tan importante la higiene y la manipulación segura de alimentos?",
                opciones: [
                    "Para evitar intoxicaciones alimentarias y cuidar la salud de los comensales.",
                    "Para acelerar la cocción y que los platos salgan antes del tiempo habitual.",
                    "Para que los platos tengan una presentación más brillante e vistosa.",
                    "Para poder cobrar precios más elevados por el menú."
                ],
                correcta: 0,
                explicacion: "Las buenas prácticas higiénicas eliminan o reducen riesgos biológicos, químicos y físicos en las comidas preparadas."
            },
            {
                pregunta: "¿Qué significa el término gastronómico 'Mise en place'?",
                opciones: [
                    "Tener listos y organizados todos los ingredientes, cortes y utensilios antes de comenzar a cocinar.",
                    "La limpieza profunda de las mesas y salones al finalizar la jornada.",
                    "El momento en que se retiran los platos vacíos de la mesa del cliente.",
                    "El menú especial del día recomendado por el chef."
                ],
                correcta: 0,
                explicacion: "Traducido como 'poner en su lugar', la mise en place optimiza el flujo en cocinas profesionales evitando demoras u olvidos durante el servicio."
            },
            {
                pregunta: "¿Qué tarea realiza principalmente un barista?",
                opciones: [
                    "Preparar, extraer y presentar cafés de alta calidad con técnicas específicas.",
                    "Limpiar los vidrios y barras de los restaurantes.",
                    "Fabricar cerveza artesanal en barriles de madera.",
                    "Controlar los ingresos monetarios de las cajas registradoras."
                ],
                correcta: 0,
                explicacion: "El barista se especializa en la preparación de expresos y el arte de la leche, conociendo sobre variedades y molido del grano."
            }
        ]
    },
    salud: {
        skillLabel: "Salud y Cuidado",
        questions: [
            {
                pregunta: "¿Qué es lo primero que se debe hacer al brindar Primeros Auxilios ante un accidente?",
                opciones: [
                    "Asegurar la zona para evitar que la víctima o nosotros mismos suframos más daños.",
                    "Mover bruscamente a la persona herida a una zona despejada.",
                    "Darle de beber abundante agua o alcohol de inmediato.",
                    "Buscar medicamentos analgésicos en el botiquín sin saber qué le pasa."
                ],
                correcta: 0,
                explicacion: "El protocolo PAS (Proteger, Alertar, Socorrer) indica que proteger el área y garantizar la seguridad propia y ajena es prioritario."
            },
            {
                pregunta: "¿Qué significan las siglas RCP en reanimación de emergencia?",
                opciones: [
                    "Reanimación Cardiopulmonar.",
                    "Revisión Corporal Preventiva.",
                    "Registro Clínico del Pulso.",
                    "Reanimación de Caminos y Puentes."
                ],
                correcta: 0,
                explicacion: "La RCP es una técnica de emergencia que combina compresiones y ventilación para mantener la oxigenación ante un paro cardíaco."
            },
            {
                pregunta: "¿Cuál es el propósito de realizar una desinfección y curación básica en una herida leve?",
                opciones: [
                    "Evitar infecciones y favorecer el inicio de una cicatrización limpia.",
                    "Detener el flujo de sangre de forma permanente en un segundo.",
                    "Quitar el dolor sin necesidad de vendajes o cremas.",
                    "Darle un color estético a la piel alrededor del raspón."
                ],
                correcta: 0,
                explicacion: "Limpiar con agua y antiséptico reduce la carga de microorganismos patógenos, previniendo complicaciones posteriores."
            }
        ]
    },
    oficios: {
        skillLabel: "Construcción y Oficios",
        questions: [
            {
                pregunta: "¿Qué medida de seguridad es indispensable al reparar una instalación eléctrica domiciliaria?",
                opciones: [
                    "Cortar el suministro eléctrico general desde la caja de térmicas/disyuntores.",
                    "Usar guantes de algodón húmedos para disipar corriente estática.",
                    "Sostener cables pelados con calzado sin suela de goma.",
                    "Utilizar destornilladores comunes con mangos metálicos descubiertos."
                ],
                correcta: 0,
                explicacion: "Trabajar sin tensión es la única forma 100% segura de evitar accidentes graves por electrocución."
            },
            {
                pregunta: "En plomería, ¿cuál es la función de un sifón colocado debajo del lavatorio?",
                opciones: [
                    "Almacenar agua limpia de respaldo para cortes de red.",
                    "Crear un tapón de agua constante que evita la salida de malos olores del desagüe.",
                    "Aumentar la presión del agua fría que llega a la grifería.",
                    "Filtrar el agua haciéndola bebible sin tratamiento previo."
                ],
                correcta: 1,
                explicacion: "El diseño en U del sifón retiene agua limpia formando un sello hidráulico contra los gases provenientes de la cañería de desagüe."
            },
            {
                pregunta: "¿Cuál es el objetivo principal del mantenimiento preventivo de herramientas o maquinarias?",
                opciones: [
                    "Realizar ajustes y limpiezas periódicas para evitar fallos futuros y alargar la vida útil.",
                    "Arreglar las máquinas solo cuando dejan de funcionar por completo.",
                    "Pintar las herramientas para cambiar su estética exterior.",
                    "Reemplazar todas las piezas cada fin de mes sin importar su estado."
                ],
                correcta: 0,
                explicacion: "El preventivo detecta desgastes de forma planificada antes de que se produzca una rotura imprevista y costosa en el taller."
            }
        ]
    },
    idiomas: {
        skillLabel: "Idiomas y Comunicación",
        questions: [
            {
                pregunta: "En inglés comercial o de negocios, ¿qué significa la sigla 'ASAP'?",
                opciones: [
                    "As Soon As Possible (Tan pronto como sea posible).",
                    "Always Send Another Paper (Siempre envía otro reporte).",
                    "Account Security Access Password (Clave de acceso y seguridad).",
                    "After Sale Agreement Protocol (Protocolo posterior a la venta)."
                ],
                correcta: 0,
                explicacion: "ASAP es un acrónimo muy utilizado en correos corporativos para denotar urgencia sobre una tarea."
            },
            {
                pregunta: "¿A qué se refiere el término comercial de uso extendido 'Deadline'?",
                opciones: [
                    "La fecha y hora límite establecida para la entrega de un proyecto o tarea.",
                    "El presupuesto total de gastos corrientes de la oficina.",
                    "El despido programado de empleados al final de temporada.",
                    "La línea telefónica directa con los directores de la empresa."
                ],
                correcta: 0,
                explicacion: "Deadline es la fecha tope acordada para finalizar un entregable, hito o etapa de un trabajo profesional."
            },
            {
                pregunta: "¿Qué significa el concepto de 'Feedback' en una comunicación profesional?",
                opciones: [
                    "Devolución, comentarios constructivos y opiniones sobre el desempeño de una tarea.",
                    "Un correo automatizado confirmando que se leyó el mensaje.",
                    "El contrato de confidencialidad que se firma al entrar a la empresa.",
                    "La comida compartida al final de la jornada laboral."
                ],
                correcta: 0,
                explicacion: "Dar feedback es retroalimentar a la otra persona, identificando puntos fuertes y oportunidades de mejora sobre sus tareas."
            }
        ]
    },
    default: {
        skillLabel: "Desarrollo Profesional",
        questions: [
            {
                pregunta: "¿Qué significa el término 'trabajo en equipo' en una oficina?",
                opciones: [
                    "La cooperación coordinada de personas para lograr un objetivo común, sumando talentos.",
                    "Dejar que un solo miembro haga las tareas mientras los demás se enfocan en otros asuntos personales.",
                    "Competir y ocultar información a los compañeros para sobresalir individualmente.",
                    "Trabajar sin comunicarse con nadie del equipo para no perder el enfoque."
                ],
                correcta: 0,
                explicacion: "El trabajo en equipo optimiza recursos y tiempos, mejorando los resultados a través del esfuerzo mutuo coordinado."
            },
            {
                pregunta: "¿Cuál es la principal ventaja de utilizar sistemas de almacenamiento y edición en la nube (como Google Drive u Office 365)?",
                opciones: [
                    "Permitir la edición colaborativa de archivos en tiempo real desde cualquier dispositivo con internet.",
                    "Proteger físicamente la oficina contra robos de mercadería.",
                    "Eliminar toda la información una vez que se cierra la sesión en el navegador.",
                    "Evitar que la empresa deba pagar los impuestos mensuales de software."
                ],
                correcta: 0,
                explicacion: "Las herramientas cloud facilitan el trabajo remoto y la coautoría simultánea de reportes y hojas de datos en tiempo real."
            },
            {
                pregunta: "¿Qué caracteriza a la comunicación asertiva en el trabajo?",
                opciones: [
                    "Expresar ideas, necesidades y críticas de forma clara, directa y respetuosa, con empatía.",
                    "Gritar o presionar para imponer las ideas personales a los demás.",
                    "Estar siempre de acuerdo con las decisiones de todos para evitar discusiones.",
                    "Comunicarse únicamente a través de notas anónimas y no hablar en persona."
                ],
                correcta: 0,
                explicacion: "La asertividad permite defender los puntos de vista personales respetando los de los demás, fomentando relaciones laborales sanas."
            }
        ]
    }
};

/**
 * Recibe una lista de skills requeridas de una oferta y busca cuál coincide con nuestro banco.
 * Elige 3 preguntas al azar de la categoría coincidente.
 * @param {Array} skillsList Lista de objetos u strings de skills de la oferta.
 * @returns {Object} El set de preguntas correspondiente con 3 preguntas aleatorias.
 */
export function getQuestionsForSkills(skillsList = []) {
    if (!skillsList || skillsList.length === 0) {
        return getRandomSubset(questionsBank.default);
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
        { key: 'node', keywords: ['node', 'node.js', 'nodejs', 'express'] },
        { key: 'html_css', keywords: ['html', 'css', 'sass', 'tailwind', 'flexbox', 'grid', 'frontend'] },
        { key: 'devops_cloud', keywords: ['docker', 'kubernetes', 'aws', 'azure', 'gcp', 'cloud', 'devops', 'ci/cd', 'git', 'github'] },
        { key: 'ventas', keywords: ['venta', 'atencion al cliente', 'atención al cliente', 'atencion al publico', 'atención al público', 'cajero', 'telemarketing', 'negociacion', 'crm', 'salesforce'] },
        { key: 'administracion', keywords: ['administracion', 'administración', 'contabilidad', 'excel', 'facturacion', 'facturación', 'cobranza', 'sueldo', 'nomina', 'nómina', 'sap', 'finanzas'] },
        { key: 'logistica', keywords: ['logistica', 'logística', 'stock', 'inventario', 'almacen', 'almacén', 'deposito', 'depósito', 'distribucion', 'autoelevador', 'clark'] },
        { key: 'gastronomia', keywords: ['cocina', 'gastronomia', 'gastronomía', 'pasteleria', 'pastelería', 'barman', 'barismo', 'chef', 'camarero', 'mozo', 'alimentos'] },
        { key: 'salud', keywords: ['enfermeria', 'enfermería', 'medicina', 'primeros auxilios', 'rcp', 'kinesiologia', 'kinesiología', 'salud'] },
        { key: 'oficios', keywords: ['electricidad', 'plomeria', 'plomería', 'carpinteria', 'carpintería', 'soldadura', 'refrigeracion', 'refrigeración', 'mecanica', 'mecánica', 'mantenimiento'] },
        { key: 'idiomas', keywords: ['ingles', 'inglés', 'english', 'traduccion', 'traducción', 'idiomas', 'idioma'] }
    ];

    // Buscar coincidencia en orden de prioridad
    for (const map of mappings) {
        const found = normalizedList.some(skillName => 
            map.keywords.some(kw => skillName.includes(kw))
        );
        if (found) {
            return getRandomSubset(questionsBank[map.key]);
        }
    }

    // Si no coincide ninguna skill, retorna default (Desarrollo Profesional / Trabajo en equipo / Cloud)
    return getRandomSubset(questionsBank.default);
}

/**
 * Mezcla y devuelve un subconjunto aleatorio de preguntas del banco para evitar repeticiones.
 */
function getRandomSubset(skillBank, limit = 3) {
    if (!skillBank || !skillBank.questions) {
        return { skillLabel: "General", questions: [] };
    }

    // Mezclar copia del array de preguntas (Fisher-Yates Shuffle)
    const shuffled = [...skillBank.questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
        skillLabel: skillBank.skillLabel,
        questions: shuffled.slice(0, limit)
    };
}
