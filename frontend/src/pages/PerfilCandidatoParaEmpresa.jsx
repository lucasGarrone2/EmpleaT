import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { User, Briefcase, Clock, FileText, ArrowLeft, BrainCircuit, MapPin, CheckCircle, XCircle } from 'lucide-react';
import './Register.css'; // Mantenemos los estilos consistentes

export default function PerfilCandidatoParaEmpresa() {
    const { ofertaId, candidatoId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [candidato, setCandidato] = useState(null);
    const [candidatoSkills, setCandidatoSkills] = useState([]);
    const [ofertaSkills, setOfertaSkills] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user || user.user_metadata?.rol !== 'empresa') {
            navigate('/login');
            return;
        }

        const fetchDetalle = async () => {
            try {
                // 1. Obtener la oferta para ver las skills deseadas 
                const { data: ofData, error: ofError } = await supabase
                    .from('ofertas')
                    .select(`
                        id, empresa_id,
                        oferta_skills (
                            skill_id,
                            nombre_original,
                            diccionario_skills (nombre_skill)
                        )
                    `)
                    .eq('id', ofertaId)
                    .single();

                if (ofError || !ofData) throw new Error("Oferta no encontrada");

                // Verificar que esta oferta pertenezca a la empresa que está logueada
                const { data: empData } = await supabase
                    .from('empresas')
                    .select('id')
                    .eq('auth_id', user.id)
                    .single();

                if (empData?.id !== ofData.empresa_id) {
                    throw new Error("No tienes permiso para ver esta información");
                }

                setOfertaSkills(ofData.oferta_skills || []);

                // 2. Obtener la info general del candidato
                const { data: candData, error: candError } = await supabase
                    .from('candidatos')
                    .select('*')
                    .eq('id', candidatoId)
                    .single();

                if (candError || !candData) throw new Error("Candidato no encontrado");
                setCandidato(candData);

                // 3. Obtener las skills del candidato
                const { data: skillsData, error: skillsError } = await supabase
                    .from('candidato_skills')
                    .select(`
                        skill_id,
                        nivel_estimado,
                        nombre_original,
                        diccionario_skills ( nombre_skill )
                    `)
                    .eq('candidato_id', candidatoId);

                if (!skillsError && skillsData) {
                    setCandidatoSkills(skillsData);
                } else if (skillsError) {
                    console.error("Error fetching skills", skillsError);
                }
                
            } catch (err) {
                console.error("Error al obtener perfil del candidato", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDetalle();
    }, [ofertaId, candidatoId, user, navigate]);


    if (loading) {
        return (
            <div className="register-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.5rem', fontWeight: 'bold' }}>Cargando perfil del postulante...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '4rem', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--text-dark)' }}>{error}</h2>
                <Link to={`/oferta-empresa/${ofertaId}`} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Volver a la oferta</Link>
            </div>
        );
    }

    // Calcular match de skills
    const synonymMap = {
        'sql': ['mysql', 'postgresql', 'sql server', 'oracle', 'pl/sql'],
        'mysql': ['sql', 'base de datos', 'mariadb'],
        'postgresql': ['sql', 'base de datos'],
        'cloud': ['aws', 'azure', 'gcp', 'google cloud', 'nube'],
        'aws': ['cloud', 'nube', 'amazon web services'],
        'azure': ['cloud', 'nube', 'microsoft azure'],
        'gcp': ['cloud', 'nube', 'google cloud'],
        'frontend': ['react', 'vue', 'angular', 'html', 'css', 'javascript', 'js'],
        'backend': ['node', 'java', 'python', 'c#', 'php', 'ruby', 'go', 'express'],
        'javascript': ['js', 'typescript', 'react', 'node', 'vue', 'angular', 'frontend'],
        'js': ['javascript', 'typescript', 'frontend'],
        'react': ['javascript', 'frontend', 'reactjs', 'react.js'],
        'java': ['spring', 'backend', 'java ee', 'springboot'],
        'python': ['django', 'flask', 'backend', 'machine learning', 'data science', 'fastapi']
    };

    const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";

    const clasificarSkills = () => {
        return candidatoSkills.map(cs => {
            const csStr = normalize(cs.nombre_original) || normalize(cs.diccionario_skills?.preferred_label) || normalize(cs.diccionario_skills?.nombre_skill);
            const csNameDisplay = cs.nombre_original || cs.diccionario_skills?.preferred_label || cs.diccionario_skills?.nombre_skill || 'Habilidad Desconocida';
            
            if (ofertaSkills.length === 0) return { ...cs, isMatch: false, displayName: csNameDisplay };

            let isMatch = false;

            for (const req of ofertaSkills) {
                if (cs.skill_id && cs.skill_id === req.skill_id) {
                    isMatch = true;
                    break;
                }
                const reqStr = normalize(req.nombre_original) || normalize(req.diccionario_skills?.nombre_skill);
                
                if (!csStr || !reqStr) continue;
                if (csStr === reqStr) {
                    isMatch = true;
                    break;
                }
                
                const minLen = Math.min(csStr.length, reqStr.length);
                if (minLen >= 3 && (csStr.includes(reqStr) || reqStr.includes(csStr))) {
                    isMatch = true;
                    break;
                }

                const reqSynonyms = synonymMap[reqStr] || [];
                const csSynonyms = synonymMap[csStr] || [];

                if (reqSynonyms.some(syn => csStr.includes(syn) || syn.includes(csStr))) {
                    isMatch = true; break;
                }
                if (csSynonyms.some(syn => reqStr.includes(syn) || syn.includes(reqStr))) {
                    isMatch = true; break;
                }
            }

            return { ...cs, isMatch, displayName: csNameDisplay };
        });
    };

    const skillsClasificadas = clasificarSkills();

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>
            <button 
                onClick={() => navigate(`/oferta-empresa/${ofertaId}`)}
                style={{ 
                    background: 'none', border: 'none', color: 'var(--text-gray)', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontWeight: 'bold', padding: 0, marginBottom: '2rem', fontSize: '1rem'
                }}
            >
                <ArrowLeft size={20} /> Volver a postulantes
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                
                {/* Cabecera del Candidato */}
                <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.02)', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ 
                        width: '90px', height: '90px', borderRadius: '50%', 
                        background: 'linear-gradient(135deg, rgba(0,214,107,0.1) 0%, rgba(0,153,77,0.1) 100%)',
                        color: 'var(--primary)', display: 'flex', justifyContent: 'center', alignItems: 'center',
                        fontSize: '2.5rem', fontWeight: 'bold', overflow: 'hidden'
                    }}>
                        {candidato.foto_url ? (
                            <img src={candidato.foto_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            candidato.nombre_completo.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <h1 style={{ margin: '0 0 5px 0', fontSize: '2rem', color: 'var(--text-dark)' }}>{candidato.nombre_completo}</h1>
                        <div style={{ color: 'var(--text-gray)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Briefcase size={18}/> {candidato.titulo_profesional || 'Profesional'}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={18}/> {candidato.anios_experiencia} años exp.</span>
                            {candidato.ubicacion && <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={18}/> {candidato.ubicacion}</span>}
                        </div>
                    </div>
                </div>

                {/* Sobre Mí */}
                <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', marginBottom: '1.5rem', fontSize: '1.3rem', margin: '0 0 1rem 0' }}>
                        <User size={24} /> Sobre el Candidato
                    </h3>
                    <p style={{ color: 'var(--text-gray)', fontSize: '1.1rem', lineHeight: '1.7', margin: 0, whiteSpace: 'pre-wrap' }}>
                        {candidato.sobre_mi ? candidato.sobre_mi : <span style={{ fontStyle: 'italic', opacity: 0.6 }}>El candidato no ha añadido una descripción personal.</span>}
                    </p>
                </div>

                {/* Skills Match */}
                <div style={{ background: 'var(--bg-white)', padding: '2.5rem', borderRadius: '24px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 5px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', margin: 0, fontSize: '1.3rem' }}>
                            <BrainCircuit size={24} /> Habilidades Detectadas
                        </h3>
                    </div>
                    
                    {skillsClasificadas.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            {skillsClasificadas.map((sk, index) => {
                                const isMatch = sk.isMatch;
                                return (
                                    <span key={index} style={{
                                        backgroundColor: isMatch ? 'rgba(0,214,107,0.05)' : 'rgba(0,0,0,0.02)',
                                        padding: '10px 18px',
                                        borderRadius: '30px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: isMatch ? 'var(--primary)' : 'var(--text-gray)',
                                        border: isMatch ? '1px solid rgba(0,214,107,0.3)' : '1px solid rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}>
                                        {isMatch ? <CheckCircle size={16} /> : <XCircle size={16} opacity={0.5} />}
                                        {sk.displayName}
                                    </span>
                                );
                            })}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-gray)', fontSize: '1.05rem', fontStyle: 'italic' }}>
                            No se encontraron habilidades registradas para este candidato.
                        </p>
                    )}
                </div>

            </div>
        </div>
    );
}
