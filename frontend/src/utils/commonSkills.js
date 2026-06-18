// Base de datos de Habilidades Comunes (Skills) de EmpleaT
// Cubre múltiples rubros: Tecnología, Salud, Administración, Gastronomía, Educación, Logística, Oficios, Estética y Turismo.

export const COMMON_SKILLS = [
    // 1. CÓDIGO, DESARROLLO Y TECNOLOGÍA
    'React', 'React.js', 'Node', 'Node.js', 'Python', 'Java', 'C#', 'C++', 'C', 'PHP', 'Ruby', 'Go', 'Golang', 'Swift', 'Kotlin', 'TypeScript', 'Javascript', 'JS', 'HTML', 'HTML5', 'CSS', 'CSS3', 'Sass', 'Less',
    'Angular', 'Vue', 'Vue.js', 'Svelte', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'Laravel', 'Express.js', 'Next.js', 'Nuxt.js', 'NestJS',
    'Desarrollo Web', 'Frontend', 'Backend', 'Fullstack', 'Full Stack', 'Programación', 'Software', 'Arquitectura de Software', 'Microservicios',

    // 2. BASES DE DATOS Y DATOS
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'Elasticsearch', 'GraphQL', 'REST API', 'API', 'Oracle', 'MariaDB', 'SQLite',
    'Machine Learning', 'Inteligencia Artificial', 'Data Science', 'Data Engineering', 'Big Data', 'Hadoop', 'Spark', 'Kafka', 'TensorFlow', 'PyTorch', 'Pandas',

    // 3. CLOUD, DEVOPS E INFRAESTRUCTURA
    'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud', 'Cloud', 'Nube', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'CI/CD', 'DevOps', 'Linux', 'Ubuntu', 'Windows Server', 'Bash', 'PowerShell', 'SysAdmin', 'Seguridad Informática', 'Ciberseguridad',

    // 4. QA, TESTING Y METODOLOGÍAS
    'QA', 'Testing', 'Selenium', 'Cypress', 'Jest', 'Mocha', 'Postman', 'Pruebas Unitarias', 'TDD', 'BDD',
    'Scrum', 'Agile', 'Ágil', 'Kanban', 'Jira', 'Trello', 'Confluence', 'Gestión de Proyectos', 'Project Management', 'Product Manager', 'Product Owner', 'Scrum Master',
    'Liderazgo', 'Team Lead', 'Gestión de Equipos', 'Comunicación', 'Resolución de Problemas',

    // 5. SALUD, MEDICINA Y CUIDADO
    'Enfermería', 'Primeros Auxilios', 'RCP', 'Medicina', 'Farmacia', 'Kinesiología', 'Nutrición', 'Pediatría', 'Odontología', 
    'Cuidado de Ancianos', 'Psiquiatría', 'Psicología', 'Terapia Ocupacional', 'Anatomía', 'Instrumentación Quirúrgica', 'Salud Pública',

    // 6. ADMINISTRACIÓN, CONTABILIDAD Y FINANZAS
    'Administración', 'Secretariado', 'Gestión Administrativa', 'Contabilidad', 'Finanzas', 'Auditoría', 'Impuestos', 'Liquidación de Sueldos', 'Nóminas', 
    'Excel Avanzado', 'SAP', 'ERP', 'Facturación', 'Cobranzas', 'Presupuestos', 'Conciliación Bancaria', 'Gestión Documental',

    // 7. VENTAS, COMERCIAL Y ATENCIÓN AL CLIENTE
    'Ventas', 'Atención al Cliente', 'Atención al Público', 'Telemarketing', 'Cajero', 'Fidelización de Clientes', 'Negociación', 
    'Cierre de Ventas', 'B2B', 'B2C', 'Venta Telefónica', 'Salesforce', 'CRM', 'Resolución de Conflictos',

    // 8. GASTRONOMÍA, COCINA Y SERVICIOS
    'Culinaria', 'Cocina', 'Pastelería', 'Panadería', 'Barman', 'Coctelería', 'Barismo', 'Cafetería', 'Higiene Alimentaria', 
    'Manipulación de Alimentos', 'Gestión de Restaurantes', 'Mozo', 'Camarero', 'Ayudante de Cocina', 'Chef', 'Cocina Internacional',

    // 9. EDUCACIÓN, DOCENCIA E IDIOMAS
    'Enseñanza', 'Docencia', 'Pedagogía', 'Didáctica', 'E-learning', 'Educación Especial', 'Tutoría',
    'Traducción', 'Inglés', 'Inglés Avanzado', 'Inglés Bilingüe', 'Español', 'Portugués', 'Francés', 'Italiano', 'Alemán',

    // 10. LOGÍSTICA, TRANSPORTE Y ALMACÉN
    'Logística', 'Supply Chain', 'Control de Inventario', 'Gestión de Stock', 'Distribución', 'Almacén', 'Depósito', 
    'Conducción de Autoelevadores', 'Manejo de Clark', 'Despacho', 'Comercio Exterior', 'Transporte', 'Planificación de Rutas',

    // 11. CONSTRUCCIÓN, OFICIOS E INGENIERÍA TRADICIONAL
    'Electricidad', 'Plomería', 'Carpintería', 'Albañilería', 'Soldadura', 'Pintura', 'Refrigeración', 'Aire Acondicionado', 'Herrería', 
    'Mecánica Automotriz', 'Mantenimiento Preventivo', 'Higiene y Seguridad', 'AutoCAD', 'SolidWorks', 'Revit', 'Ingeniería Civil', 'Ingeniería Industrial', 'Ingeniería Mecánica',

    // 12. ESTÉTICA Y CUIDADO PERSONAL
    'Peluquería', 'Estética', 'Manicuría', 'Pedicuría', 'Cosmetología', 'Masajes', 'Maquillaje', 'Depilación', 'Tratamientos Faciales',

    // 13. HOTELERÍA, TURISMO Y ENTRETENIMIENTO
    'Hotelería', 'Recepción', 'Conserjería', 'Reservas', 'Gestión Hotelera', 'Turismo', 'Guía de Turismo', 'Atención al Huésped',

    // 14. DISEÑO, MEDIOS, MARKETING Y COMUNICACIÓN
    'Diseño Gráfico', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'InDesign', 'Premiere', 'After Effects', 'Lightroom', 'UI', 'UX', 'Diseño Web', 
    'Edición de Video', 'Animación', '3D', 'Blender', 'Cinema 4D', 'Fotografía', 'UX Research', 'Ilustración', 'Redacción Creativa', 'Copywriting', 
    'Oratoria', 'Relaciones Públicas', 'Marketing', 'Marketing Digital', 'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Meta Ads', 'Social Media', 'Redes Sociales', 'Community Manager', 'Inbound Marketing', 'Email Marketing', 'Mailchimp', 'HubSpot'
];
