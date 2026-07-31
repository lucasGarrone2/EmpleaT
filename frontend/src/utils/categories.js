// Diccionario de Categorías Macro y Utilitarios de Gate de Rubro

export const CATEGORIAS_MACRO = {
    TECNOLOGIA_DEV: [
        'javascript', 'js', 'typescript', 'ts', 'react', 'reactjs', 'react.js', 'next.js', 'nextjs', 'vue', 'vuejs', 'angular',
        'node', 'nodejs', 'node.js', 'express', 'html', 'html5', 'css', 'css3', 'tailwind', 'bootstrap', 'sass', 'scss',
        'python', 'py', 'django', 'flask', 'fastapi', 'java', 'spring', 'spring boot', 'springboot', 'java ee', 'maven', 'hibernate',
        'c#', 'csharp', '.net', 'dotnet', 'asp.net', 'php', 'laravel', 'symfony', 'wordpress', 'ruby', 'go', 'golang',
        'mobile', 'movil', 'android', 'ios', 'react native', 'flutter', 'swift', 'kotlin',
        'sql', 'mysql', 'postgresql', 'postgres', 'sql server', 'oracle', 'mongodb', 'nosql', 'redis', 'base de datos', 'bases de datos', 'database',
        'cloud', 'aws', 'azure', 'gcp', 'google cloud', 'devops', 'docker', 'kubernetes', 'k8s', 'ci/cd', 'git', 'github', 'gitlab',
        'full stack', 'fullstack', 'full-stack', 'frontend', 'front-end', 'backend', 'back-end', 'desarrollo web', 'web development',
        'desarrollo de software', 'programacion', 'arquitectura', 'arquitectura de software', 'microservicios', 'rest api', 'api rest',
        'clean code', 'patrones de diseño', 'solid', 'testing', 'qa', 'ux', 'ui', 'figma', 'scrum', 'agile'
    ],
    SOPORTE_REDES: [
        'soporte tecnico', 'soporte', 'helpdesk', 'atencion al usuario', 'mantenimiento de pc', 'hardware', 'redes',
        'mesas de ayuda', 'soporte informatico', 'tecnico de pc', 'reparacion de pc', 'sysadmin', 'administracion de servidores',
        'windows server', 'linux', 'bash', 'shell', 'infraestructura', 'ciberseguridad', 'seguridad informatica'
    ],
    SALUD_MEDICINA: [
        'medicina', 'medico', 'medica', 'salud', 'clinica', 'medicina general', 'diagnostico clinico', 'atencion al paciente',
        'pediatria', 'enfermeria', 'guardia medica', 'urgencias', 'hospital', 'sanidad', 'diagnostico por imagenes',
        'tomografia', 'resonancia', 'mamografia', 'radiologia', 'ecografia', 'farmacologia', 'rcp'
    ],
    LEGAL_DERECHO: [
        'derecho', 'abogado', 'abogada', 'juridico', 'legal', 'leyes', 'legislacion', 'litigacion', 'letrado', 'compliance', 'normativa'
    ],
    ADMIN_FINANZAS: [
        'contabilidad', 'finanzas', 'impuestos', 'balance', 'auditoria', 'facturacion', 'excel', 'microsoft excel', 'contador', 'contadora',
        'administracion', 'gestion', 'secretariado', 'tramites', 'administrativo', 'ventas', 'comercial', 'telemarketing',
        'cierre de ventas', 'vendedor', 'vendedora', 'marketing', 'marketing digital', 'seo', 'sem', 'redes sociales', 'social media', 'office'
    ]
};

const normalizeStr = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

export const getCategoriaSkill = (skillName) => {
    const norm = normalizeStr(skillName);
    if (!norm) return 'OTRO';

    for (const [cat, skills] of Object.entries(CATEGORIAS_MACRO)) {
        if (skills.some(s => s === norm || norm.includes(s) || s.includes(norm))) {
            return cat;
        }
    }
    return 'OTRO';
};

export const hayOverlapCategorias = (candidatoSkills = [], ofertaCoreSkills = []) => {
    if (ofertaCoreSkills.length === 0) return true;

    const catsOferta = new Set();
    ofertaCoreSkills.forEach(s => {
        const name = s.nombre_original || s.diccionario_skills?.nombre_skill || s.nombre;
        const cat = getCategoriaSkill(name);
        if (cat !== 'OTRO') catsOferta.add(cat);
    });

    if (catsOferta.size === 0) return true;

    const catsCandidato = new Set();
    candidatoSkills.forEach(s => {
        const name = s.nombre_original || s.diccionario_skills?.nombre_skill || s.nombre;
        const cat = getCategoriaSkill(name);
        if (cat !== 'OTRO') catsCandidato.add(cat);
    });

    for (const cat of catsOferta) {
        if (catsCandidato.has(cat)) return true;
    }
    return false;
};
