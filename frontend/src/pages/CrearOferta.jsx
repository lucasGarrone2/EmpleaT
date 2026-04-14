import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { Briefcase, ArrowLeft, CheckCircle2, X, FileSearch } from 'lucide-react';

export default function CrearOferta() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [empresaId, setEmpresaId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        modalidad: 'Remoto',
        salario_min_usd: '',
        salario_max_usd: '',
        limite_postulaciones: '',
        estado: 'Publicada'
    });

    const [skillsList, setSkillsList] = useState([]);
    const [skillInput, setSkillInput] = useState('');

    useEffect(() => {
        if (!user || user.user_metadata?.rol !== 'empresa') {
            navigate('/login');
            return;
        }

        const fetchEmpresa = async () => {
            const { data, error } = await supabase
                .from('empresas')
                .select('id')
                .eq('auth_id', user.id)
                .maybeSingle();

            if (error || !data) {
                navigate('/dashboard-empresa');
            } else {
                setEmpresaId(data.id);
                setLoading(false);
            }
        };

        fetchEmpresa();
    }, [user, navigate]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const val = skillInput.trim();
            if (val && !skillsList.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
                setSkillsList([...skillsList, val]);
            }
            setSkillInput('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setSkillsList(skillsList.filter(s => s !== skillToRemove));
    };

    const sugerirSkills = () => {
        if (!formData.descripcion.trim()) {
            setError('Escribe una descripción primero para poder extraer las habilidades.');
            setTimeout(() => setError(null), 4000);
            return;
        }

        const COMMON_SKILLS = [
            // CÓDIGO Y DESARROLLO
            'React', 'React.js', 'Node', 'Node.js', 'Python', 'Java', 'C#', 'C++', 'C', 'PHP', 'Ruby', 'Go', 'Golang', 'Swift', 'Kotlin', 'TypeScript', 'Javascript', 'JS', 'HTML', 'HTML5', 'CSS', 'CSS3', 'Sass', 'Less',
            'Angular', 'Vue', 'Vue.js', 'Svelte', 'Spring Boot', 'Django', 'Flask', 'FastAPI', 'Laravel', 'Express.js', 'Next.js', 'Nuxt.js', 'NestJS',
            'Desarrollo Web', 'Frontend', 'Backend', 'Fullstack', 'Full Stack', 'Programación', 'Software', 'Arquitectura de Software', 'Microservicios',

            // BASES DE DATOS Y DATOS
            'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Cassandra', 'Elasticsearch', 'GraphQL', 'REST API', 'API', 'Oracle', 'MariaDB', 'SQLite',
            'Machine Learning', 'Inteligencia Artificial', 'Data Science', 'Data Engineering', 'Big Data', 'Hadoop', 'Spark', 'Kafka', 'TensorFlow', 'PyTorch', 'Pandas',

            // CLOUD, DEVOPS E INFRAESTRUCTURA
            'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud', 'Cloud', 'Nube', 'Docker', 'Kubernetes', 'Terraform', 'Ansible', 'Jenkins', 
            'Git', 'GitHub', 'GitLab', 'Bitbucket', 'CI/CD', 'DevOps', 'Linux', 'Ubuntu', 'Windows Server', 'Bash', 'PowerShell', 'SysAdmin', 'Seguridad Informática', 'Ciberseguridad',

            // QA Y TESTING
            'QA', 'Testing', 'Selenium', 'Cypress', 'Jest', 'Mocha', 'Postman', 'Pruebas Unitarias', 'TDD', 'BDD',

            // METODOLOGÍAS Y SOFT SKILLS
            'Scrum', 'Agile', 'Ágil', 'Kanban', 'Jira', 'Trello', 'Confluence', 'Gestión de Proyectos', 'Project Management', 'Product Manager', 'Product Owner', 'Scrum Master',
            'Liderazgo', 'Team Lead', 'Gestión de Equipos', 'Comunicación', 'Resolución de Problemas',

            // DISEÑO Y UX/UI
            'Figma', 'Adobe XD', 'Sketch', 'Photoshop', 'Illustrator', 'InDesign', 'Premiere', 'After Effects', 'Lightroom', 'UI', 'UX', 'Diseño Web', 'Diseño Gráfico', 
            'Edición de Video', 'Animación', '3D', 'Blender', 'Cinema 4D', 'Fotografía', 'UX Research',

            // MARKETING, VENTAS Y SEO
            'Marketing', 'Marketing Digital', 'SEO', 'SEM', 'Google Ads', 'Facebook Ads', 'Meta Ads', 'Social Media', 'Redes Sociales', 'Community Manager',
            'Copywriting', 'Redacción', 'Inbound Marketing', 'Email Marketing', 'Mailchimp', 'HubSpot', 'Salesforce', 'CRM', 'Ventas', 'B2B', 'B2C', 'Atención al Cliente', 'Soporte',

            // NEGOCIOS, FINANZAS Y RRHH
            'Recursos Humanos', 'RRHH', 'Selección de Personal', 'IT Recruiter', 'Headhunting', 'Contabilidad', 'Finanzas', 'Auditoría', 'Facturación', 'Nóminas', 'SAP', 'ERP', 'Excel', 'Power BI', 'Tableau', 'Data Analytics',

            // INGENIERÍA TRADICIONAL Y OTROS
            'AutoCAD', 'SolidWorks', 'Revit', 'Ingeniería Civil', 'Ingeniería Industrial', 'Ingeniería Mecánica', 'Logística', 'Supply Chain', 'Traducción', 'Inglés Avanzado', 'Inglés Bilingüe'
        ];

        const extracted = [];
        const descLower = formData.descripcion.toLowerCase();
        
        COMMON_SKILLS.forEach(skill => {
            const skillLower = skill.toLowerCase();
            const safeSkill = skillLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
            const regex = new RegExp(`(?:^|\\s|_|[.,;!/?()])${safeSkill}(?:$|\\s|_|[.,;!/?()])`, 'i');
            
            if (regex.test(descLower)) {
                if (!skillsList.some(s => s.toLowerCase() === skillLower)) {
                    extracted.push(skill);
                }
            }
        });

        if (extracted.length > 0) {
            setSkillsList(prev => [...prev, ...extracted]);
        } else {
            setError('No se detectaron habilidades técnicas estándar en tu descripción.');
            setTimeout(() => setError(null), 4000);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);

        // Bug 007: Validar que el salario máximo no sea inferior al mínimo
        if (formData.salario_max_usd && parseInt(formData.salario_max_usd) < parseInt(formData.salario_min_usd)) {
            setError('El salario máximo no puede ser menor al salario mínimo.');
            setSaving(false);
            return;
        }

        try {
            // 1. Crear la Oferta
            const { data: ofertaData, error: ofertaError } = await supabase
                .from('ofertas')
                .insert({
                    empresa_id: empresaId,
                    titulo: formData.titulo,
                    descripcion: formData.descripcion,
                    modalidad: formData.modalidad,
                    salario_min_usd: parseInt(formData.salario_min_usd),
                    salario_max_usd: formData.salario_max_usd ? parseInt(formData.salario_max_usd) : null,
                    estado: formData.estado,
                    limite_postulaciones: formData.limite_postulaciones ? parseInt(formData.limite_postulaciones) : null,
                })
                .select()
                .single();

            if (ofertaError) throw new Error("Error creando oferta base: " + ofertaError.message);

            // 2. Procesar las Skills
            if (skillsList.length > 0) {
                const { data: matchedSkills, error: rpcError } = await supabase
                    .rpc('match_skills', { skill_names: skillsList });

                if (rpcError) throw new Error("Error consultando ESCO: " + rpcError.message);

                const bestMatchPerSkill = new Map();
                if (matchedSkills) {
                    const validSkills = matchedSkills.filter(m => m.similitud > 0.65);
                    validSkills.forEach(match => {
                        const currentBest = bestMatchPerSkill.get(match.original_skill);
                        if (!currentBest || currentBest.similitud < match.similitud) {
                            bestMatchPerSkill.set(match.original_skill, match);
                        }
                    });
                }

                const uniqueSkillsMap = new Map();
                Array.from(bestMatchPerSkill.values()).forEach(match => {
                    if (!uniqueSkillsMap.has(match.esco_id)) {
                        uniqueSkillsMap.set(match.esco_id, {
                            oferta_id: ofertaData.id,
                            skill_id: match.esco_id,
                            nivel_requerido: 3
                        });
                    }
                });

                // Rescatar las palabras que ESCO no reconoció
                const matchedNamesLower = new Set(Array.from(bestMatchPerSkill.keys()).map(k => k.toLowerCase()));
                const unmatchedWords = skillsList.filter(s => !matchedNamesLower.has(s.toLowerCase()));

                if (unmatchedWords.length > 0) {
                    // Si las empresas escriben tecnologías nuevas que ESCO aún no mapea (ej: Next.js),
                    // las insertamos en diccionario_skills para ampliar nuestro vocabulario y obtener un ID real.
                    const skillsAInsertar = unmatchedWords.map(word => ({
                        nombre_skill: word,
                        tipo: 'Personalizado'
                    }));

                    const { data: nuevasSkills, error: insertError } = await supabase
                        .from('diccionario_skills')
                        .insert(skillsAInsertar)
                        .select('id, nombre_skill');

                    if (!insertError && nuevasSkills) {
                        nuevasSkills.forEach(newSkill => {
                            uniqueSkillsMap.set(newSkill.id, {
                                oferta_id: ofertaData.id,
                                skill_id: newSkill.id,
                                nivel_requerido: 3
                            });
                        });
                    }
                }

                // Insert final list of skills to the offer
                const ofertaSkillsArray = Array.from(uniqueSkillsMap.values());
                if (ofertaSkillsArray.length > 0) {
                    const { error: skillsInsertError } = await supabase
                        .from('oferta_skills')
                        .insert(ofertaSkillsArray);

                    if (skillsInsertError) {
                        throw new Error("Error insertando en oferta_skills: " + skillsInsertError.message + " | " + skillsInsertError.details);
                    }
                }
            }

            navigate('/dashboard-empresa');
            
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return null;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
            <button 
                onClick={() => navigate('/dashboard-empresa')}
                style={{ 
                    background: 'none', border: 'none', color: 'var(--text-gray)', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 'bold', padding: 0, marginBottom: '2rem', fontSize: '1rem'
                }}
            >
                <ArrowLeft size={20} /> Volver a mis búsquedas
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '2rem' }}>
                <div style={{ background: 'rgba(0,214,107,0.1)', padding: '12px', borderRadius: '14px' }}>
                    <Briefcase size={28} color="var(--primary)" />
                </div>
                <h1 style={{ fontSize: '2.2rem', color: 'var(--text-dark)', margin: 0, letterSpacing: '-0.5px' }}>
                    Publicar Nueva Oferta
                </h1>
            </div>

            {error && <div className="message error" style={{marginBottom: '2rem', backgroundColor: '#ffebee', color: '#c62828', padding: '15px', borderRadius: '12px', border: '1px solid #ef9a9a'}}>{error}</div>}

            <form onSubmit={handleSubmit} style={{ 
                background: 'var(--bg-white)',
                padding: '3rem',
                borderRadius: '24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.8rem'
            }}>
                
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '2 1 300px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Título del Puesto *</label>
                        <input 
                            type="text" required maxLength={200}
                            value={formData.titulo}
                            onChange={e => setFormData({...formData, titulo: e.target.value})}
                            placeholder="Ej: Desarrollador Fullstack React/Node"
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', transition: 'border 0.2s', boxSizing: 'border-box' }}
                            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
                        />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Modalidad *</label>
                        <select 
                            value={formData.modalidad}
                            onChange={e => setFormData({...formData, modalidad: e.target.value})}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                        >
                            <option value="Remoto">Remoto</option>
                            <option value="Híbrido">Híbrido</option>
                            <option value="Presencial">Presencial</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Salario Mínimo (USD) *</label>
                        <input 
                            type="number" required min="1"
                            value={formData.salario_min_usd}
                            onChange={e => setFormData({...formData, salario_min_usd: e.target.value})}
                            placeholder="Ej: 1500"
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Salario Máximo (USD)</label>
                        <input 
                            type="number" min={formData.salario_min_usd}
                            value={formData.salario_max_usd}
                            onChange={e => setFormData({...formData, salario_max_usd: e.target.value})}
                            placeholder="Opcional"
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Descripción del Puesto *</label>
                    <textarea required
                        value={formData.descripcion} maxLength={3000}
                        onChange={e => setFormData({...formData, descripcion: e.target.value})}
                        placeholder="Escribe todo el detalle del anuncio..."
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', minHeight: '150px', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                </div>

                {/* TAG INPUT COMPONENT */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', margin: '0' }}>Habilidades Requeridas (Skills) *</label>
                        <button 
                            type="button" 
                            onClick={sugerirSkills}
                            style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', 
                                background: '#EAF9F1', color: 'var(--primary)', border: '1px solid #c2e8d4', 
                                borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' 
                            }}
                        >
                            <FileSearch size={16} /> Extraer de la Descripción
                        </button>
                    </div>
                    
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: 0, marginBottom: '12px' }}>
                        ¡Escribe tu anuncio arriba y usa el botón para extraer las tecnologías requeridas, o escríbelas y presiona <strong>ENTER</strong>!
                    </p>
                    
                    <div style={{ 
                        border: '1px solid rgba(0,0,0,0.1)', 
                        borderRadius: '12px', 
                        padding: '10px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        minHeight: '52px',
                        boxSizing: 'border-box',
                        transition: 'border 0.2s',
                        background: 'white'
                    }}>
                        {skillsList.map((skill, index) => (
                            <div key={index} style={{ 
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(0,214,107,0.1)', color: 'var(--primary)',
                                padding: '6px 14px', borderRadius: '20px', fontSize: '0.95rem', fontWeight: 'bold'
                            }}>
                                {skill}
                                <X 
                                    size={16} 
                                    style={{ cursor: 'pointer', opacity: 0.7 }} 
                                    onClick={() => removeSkill(skill)}
                                    title="Quitar"
                                />
                            </div>
                        ))}
                        <input 
                            type="text" maxLength={200}
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={skillsList.length === 0 ? "Ej: React, Node, SQL Server..." : "Agregar otra..."}
                            style={{ 
                                flex: '1', minWidth: '150px', border: 'none', outline: 'none', 
                                padding: '6px', fontSize: '1.05rem', background: 'transparent'
                            }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Límite de Postulaciones</label>
                        <input 
                            type="number" min="1"
                            value={formData.limite_postulaciones}
                            onChange={e => setFormData({...formData, limite_postulaciones: e.target.value})}
                            placeholder="Ej: 50 (Opcional)"
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ flex: '1 1 150px' }}>
                        <label style={{ display: 'block', color: 'var(--text-gray)', fontWeight: 'bold', marginBottom: '8px' }}>Publicar Inmediatamente</label>
                        <select 
                            value={formData.estado}
                            onChange={e => setFormData({...formData, estado: e.target.value})}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '1.05rem', outline: 'none', background: 'white', boxSizing: 'border-box' }}
                        >
                            <option value="Publicada">Sí, Publicar ahora</option>
                            <option value="Borrador">No, Guardar como Borrador</option>
                        </select>
                    </div>
                </div>

                <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)', margin: '1rem 0' }} />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button 
                        type="button"
                        onClick={() => navigate('/dashboard-empresa')}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-gray)', fontWeight: 'bold', cursor: 'pointer', padding: '14px 24px', borderRadius: '12px' }}
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button" 
                        onClick={handleSubmit}
                        disabled={saving}
                        style={{ 
                            background: 'var(--primary)', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '12px', 
                            padding: '14px 28px', 
                            fontSize: '1.1rem',
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            boxShadow: '0 8px 20px rgba(0,214,107,0.3)',
                        }}
                    >
                        {saving ? 'Publicando...' : <><CheckCircle2 size={22} /> Publicar Oferta</>}
                    </button>
                </div>

            </form>
        </div>
    );
}
