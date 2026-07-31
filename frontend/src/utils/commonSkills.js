// Base de datos de Habilidades Comunes (Skills) Multidisciplinarias de EmpleaT
// Cubre de forma exhaustiva: Salud/Medicina, Derecho, Administración, Finanzas, Ventas, Gastronomía, Educación, Logística, Oficios, Construcción, Estética, Turismo, Diseño y Tecnología.

export const COMMON_SKILLS = [
    // 1. SALUD, MEDICINA Y CUIDADO
    'Medicina', 'Medicina General', 'Diagnóstico Clínico', 'Atención al Paciente', 'Urgencias Médicas', 'Guardia Médica', 'Pediatría', 'Ginecología', 'Obstetricia', 'Cardiología', 
    'Neurología', 'Traumatología', 'Oncología', 'Anestesiología', 'Radiología', 'Ecografía', 'Farmacología', 'Infectología', 'Dermatología', 'Psiquiatría', 
    'Psicología', 'Psicología Clínica', 'Terapia Intensiva', 'UCI', 'Cuidados Paliativos', 'Flebotomía', 'Signos Vitales', 'Administración de Medicamentos', 'Vacunación', 
    'Historia Clínica', 'Historia Clínica Electrónica', 'Telemedicina', 'Epidemiología', 'Salud Pública', 'Triage', 'Triaje', 'Bioquímica', 'Laboratorio Clínico', 
    'Nutrición', 'Nutrición Clínica', 'Kinesiología', 'Fisioterapia', 'Rehabilitación', 'Instrumentación Quirúrgica', 'Enfermería', 'Enfermería Neonatal', 
    'Enfermería Quirúrgica', 'Enfermería Comunitaria', 'Primeros Auxilios', 'RCP', 'Bioseguridad', 'Esterilización', 'Odontología', 'Periodoncia', 'Ortodoncia', 'Veterinaria', 'Cuidado de Ancianos', 'Terapia Ocupacional',

    // 2. DERECHO, LEGALES Y NORMATIVA
    'Derecho', 'Derecho Laboral', 'Derecho Civil', 'Derecho Comercial', 'Derecho Penal', 'Derecho Tributario', 'Derecho Administrativo', 'Contratos', 'Redacción de Contratos', 
    'Negociación Colectiva', 'Mediación', 'Litigación', 'Propiedad Intelectual', 'Compliance', 'Protección de Datos', 'GDPR', 'Ley de Contrato de Trabajo', 'Dictámenes', 'Procuración', 'Asesoría Legal', 'Derecho Corporativo',

    // 3. ADMINISTRACIÓN, CONTABILIDAD, RECURSOS HUMANOS Y FINANZAS
    'Administración', 'Gestión Administrativa', 'Secretariado', 'Asistente Ejecutivo', 'Contabilidad', 'Contabilidad General', 'Conciliación Bancaria', 'Impuestos', 'IVA', 
    'Impuesto a las Ganancias', 'Ingresos Brutos', 'Liquidación de Sueldos', 'Nóminas', 'Payroll', 'CCT', 'Recursos Humanos', 'RRHH', 'Selección de Personal', 'Recruiting', 
    'Headhunting', 'Onboarding', 'Evaluación del Desempeño', 'Clima Laboral', 'Auditoría', 'Auditoría Contable', 'Control de Gestión', 'Presupuestos', 'Flujo de Caja', 
    'Tesorería', 'Facturación', 'Cobranzas', 'Cuentas por Cobrar', 'Cuentas por Pagar', 'SAP', 'Tango Gestión', 'Bejerman', 'Holistor', 'Excel', 'Excel Avanzado', 'Tablas Dinámicas', 'Power BI',

    // 4. VENTAS, COMERCIAL, E-COMMERCE Y ATENCIÓN AL CLIENTE
    'Ventas', 'Ventas B2B', 'Ventas B2C', 'Venta Consultiva', 'Telemarketing', 'Venta Telefónica', 'Captación de Clientes', 'Prospectación', 'Cierre de Ventas', 'Fidelización', 
    'Customer Success', 'Atención al Cliente', 'Atención al Público', 'Help Desk', 'Soporte Técnico', 'Cajero', 'CRM', 'Salesforce', 'HubSpot', 'Zoho', 'Mercado Libre', 
    'WooCommerce', 'Shopify', 'Resolución de Conflictos', 'Negociación Comercial',

    // 5. GASTRONOMÍA, COCINA, HOTELERÍA Y SERVICIOS
    'Culinaria', 'Cocina', 'Cocina Internacional', 'Cocina Argentina', 'Pastelería', 'Panadería', 'Manipulación de Alimentos', 'BPM', 'HACCP', 'Barismo', 'Cafetería', 
    'Barman', 'Coctelería', 'Sommelier', 'Costos Gastronómicos', 'Servicio de Mesa', 'Protocolo', 'Mozo', 'Camarero', 'Ayudante de Cocina', 'Chef', 'Sous Chef', 
    'Gestión de Restaurantes', 'Hotelería', 'Recepción', 'Recepción Hotelera', 'Conserjería', 'Reservas', 'PMS', 'Opera', 'Check-in', 'Check-out', 'Housekeeping', 'Turismo', 'Eventos',

    // 6. EDUCACIÓN, DOCENCIA E IDIOMAS
    'Enseñanza', 'Docencia', 'Docencia Primaria', 'Docencia Secundaria', 'Educación Universitaria', 'Pedagogía', 'Psicopedagogía', 'Didáctica', 'Diseño Curricular', 
    'Evaluación Educativa', 'E-learning', 'Moodle', 'Google Classroom', 'Educación Especial', 'Tutoría', 'Traducción', 'Inglés', 'Inglés Técnico', 'Inglés Avanzado', 
    'Inglés Bilingüe', 'Español', 'Portugués', 'Francés', 'Italiano', 'Alemán', 'Chino Mandarín',

    // 7. LOGÍSTICA, ALMACÉN Y TRANSPORTE
    'Logística', 'Supply Chain', 'Cadena de Suministro', 'Control de Stock', 'Inventario', 'Control de Inventario', 'WMS', 'Layout de Almacén', 'Pick and Pack', 'Picking', 
    'Packing', 'Autoelevador', 'Manejo de Clark', 'Zorra Eléctrica', 'Despacho', 'Despacho Aduanero', 'Comercio Exterior', 'Importación', 'Exportación', 'Incoterms', 
    'Transporte', 'Transporte Terrestre', 'Gestión de Flotas', 'Planificación de Rutas',

    // 8. ARQUITECTURA, INGENIERÍA Y CONSTRUCCIÓN
    'Arquitectura', 'AutoCAD', 'Revit', 'BIM', 'SketchUp', '3ds Max', 'Dirección de Obra', 'Cómputo y Presupuesto', 'Estructuras', 'Instalaciones Eléctricas', 'Instalaciones Sanitarias', 
    'Plomería', 'Topografía', 'Higiene y Seguridad', 'Higiene y Seguridad Laboral', 'EPP', 'Normas ISO', 'ISO 9001', 'ISO 14001', 'ISO 45001', 'Seis Sigma', 'Six Sigma', 
    'Lean Manufacturing', '5S', 'Kaizen', 'Ingeniería Civil', 'Ingeniería Industrial', 'Ingeniería Mecánica', 'Ingeniería Eléctrica', 'Ingeniería Química',

    // 9. OFICIOS, MECÁNICA Y MANTENIMIENTO
    'Electricidad', 'Electricidad Industrial', 'Tableros Eléctricos', 'PLC', 'Plomería', 'Carpintería', 'Albañilería', 'Soldadura', 'Soldadura TIG', 'Soldadura MIG', 
    'Pintura', 'Refrigeración', 'Aire Acondicionado', 'HVAC', 'Herrería', 'Mecánica Automotriz', 'Mecánica Ligera', 'Mecánica Pesada', 'Diagnóstico Computarizado', 
    'Inyección Electrónica', 'Neumática', 'Hidráulica', 'Mantenimiento Preventivo', 'Mantenimiento Correctivo', 'Grupo Electrógeno',

    // 10. ESTÉTICA Y CUIDADO PERSONAL
    'Peluquería', 'Colorimetría', 'Corte de Cabello', 'Barbería', 'Estética', 'Manicuría', 'Uñas Esculpidas', 'Pedicuría', 'Cosmetología', 'Cosmiatría', 
    'Dermatocosmiatría', 'Microblading', 'Masajes', 'Masoterapia', 'Drenaje Linfático', 'Maquillaje', 'Depilación', 'Tratamientos Faciales',

    // 11. DISEÑO, MEDIOS, MARKETING Y COMUNICACIÓN
    'Diseño Gráfico', 'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'InDesign', 'Premiere', 'After Effects', 'Lightroom', 'UI', 'UX', 'Diseño Web', 
    'Edición de Video', 'Animación', '3D', 'Blender', 'Cinema 4D', 'Fotografía', 'UX Research', 'Ilustración', 'Redacción Creativa', 'Copywriting', 'Oratoria', 
    'Relaciones Públicas', 'Marketing', 'Marketing Digital', 'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Meta Ads', 'Social Media', 'Redes Sociales', 'Community Manager', 'Inbound Marketing', 'Email Marketing', 'Mailchimp', 'HubSpot',

    // 12. CÓDIGO, DESARROLLO Y TECNOLOGÍA
    'React', 'React.js', 'Node', 'Node.js', 'Python', 'Java', 'C#', 'C++', 'C', 'PHP', 'Ruby', 'Go', 'Golang', 'Swift', 'Kotlin', 'TypeScript', 'Javascript', 'JS', 'HTML', 'HTML5', 'CSS', 'CSS3', 'Sass', 'Less',
    'Angular', 'Vue', 'Vue.js', 'Svelte', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'Laravel', 'Express.js', 'Next.js', 'Nuxt.js', 'NestJS',
    'Desarrollo Web', 'Frontend', 'Backend', 'Fullstack', 'Full Stack', 'Programación', 'Software', 'Arquitectura de Software', 'Microservicios',

    // 13. BASES DE DATOS, CLOUD, DEVOPS Y TESTING
    'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'Elasticsearch', 'GraphQL', 'REST API', 'API', 'Oracle', 'MariaDB', 'SQLite',
    'Machine Learning', 'Inteligencia Artificial', 'Data Science', 'Data Engineering', 'Big Data', 'Hadoop', 'Spark', 'Kafka', 'TensorFlow', 'PyTorch', 'Pandas',
    'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud', 'Cloud', 'Nube', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'CI/CD', 'DevOps', 'Linux', 'Ubuntu', 'Windows Server', 'Bash', 'PowerShell', 'SysAdmin', 'Ciberseguridad',
    'QA', 'Testing', 'Selenium', 'Cypress', 'Jest', 'Mocha', 'Postman', 'Pruebas Unitarias', 'TDD', 'BDD', 'Scrum', 'Agile', 'Kanban', 'Jira', 'Trello', 'Confluence', 'Project Management'
];
