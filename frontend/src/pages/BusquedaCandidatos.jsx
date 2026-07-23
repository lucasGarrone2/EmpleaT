import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../supabase';
import { Search, Briefcase, MapPin, Star, ChevronDown, Lock, Sparkles, Users, X, MessageCircle, Loader2, Send, AlertTriangle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function BusquedaCandidatos() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const showAlert = useAlert();

    const [isPremium, setIsPremium] = useState(false);
    const [empresa, setEmpresa] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState([]);
    const [searched, setSearched] = useState(false);

    // Search filters
    const [skillInput, setSkillInput] = useState('');
    const [selectedSkills, setSelectedSkills] = useState([]);
    const [experienciaMin, setExperienciaMin] = useState(0);
    const [suggestions, setSuggestions] = useState([]);

    // Contact modal state
    const [ofertasActivas, setOfertasActivas] = useState([]);
    const [contactModal, setContactModal] = useState(null); // { candidato_id, titulo_profesional }
    const [selectedOferta, setSelectedOferta] = useState('');
    const [contactando, setContactando] = useState(false);

    useEffect(() => {
        if (!user || user.user_metadata?.rol !== 'empresa') {
            navigate('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const { data: miembro, error: mErr } = await supabase
                    .from('empresa_miembros')
                    .select('empresa_id, rol, empresas(id, nombre, plan, premium_hasta)')
                    .eq('auth_id', user.id)
                    .maybeSingle();

                if (mErr || !miembro) return;

                const emp = miembro.empresas;
                setEmpresa(emp);
                const premium = emp.plan === 'premium' && emp.premium_hasta && new Date(emp.premium_hasta) > new Date();
                setIsPremium(premium);

                // Cargar ofertas activas de la empresa para el modal de contacto
                if (premium) {
                    const { data: ofertas } = await supabase
                        .from('ofertas')
                        .select('id, titulo')
                        .eq('empresa_id', miembro.empresa_id)
                        .eq('estado', 'Publicada')
                        .order('creada_en', { ascending: false });
                    setOfertasActivas(ofertas || []);
                }
            } catch (err) {
                console.error("Error loading empresa data:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user, navigate]);

    // Skill autocomplete with debounce
    useEffect(() => {
        if (skillInput.length < 2) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const { data, error } = await supabase
                    .from('diccionario_skills')
                    .select('nombre_skill')
                    .ilike('nombre_skill', `%${skillInput}%`)
                    .limit(8);

                if (!error && data) {
                    setSuggestions(data.map(d => d.nombre_skill).filter(s => !selectedSkills.includes(s)));
                }
            } catch (err) {
                console.error("Error fetching skill suggestions:", err);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [skillInput, selectedSkills]);

    const addSkill = (skill) => {
        if (!selectedSkills.includes(skill) && selectedSkills.length < 10) {
            setSelectedSkills([...selectedSkills, skill]);
        }
        setSkillInput('');
        setSuggestions([]);
    };

    const removeSkill = (skill) => {
        setSelectedSkills(selectedSkills.filter(s => s !== skill));
    };

    const handleSearch = async () => {
        if (!isPremium) return;
        setSearching(true);
        setSearched(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API_URL}/api/empresa/buscar-candidatos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    skills: selectedSkills,
                    experiencia_min: experienciaMin,
                    limit: 30
                })
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Error en la búsqueda.");
            }

            const data = await res.json();
            setResults(data.candidatos || []);
        } catch (err) {
            console.error("Error searching candidates:", err);
            setResults([]);
        } finally {
            setSearching(false);
        }
    };

    const handleContactar = (candidato) => {
        setContactModal(candidato);
        setSelectedOferta(ofertasActivas.length > 0 ? ofertasActivas[0].id : '');
    };

    const handleConfirmarContacto = async () => {
        if (!selectedOferta || !contactModal) return;
        setContactando(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch(`${API_URL}/api/empresa/iniciar-contacto`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    candidato_id: contactModal.candidato_id,
                    oferta_id: selectedOferta
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al iniciar contacto.');

            setContactModal(null);
            navigate('/mis-chats', { state: { selectPostulacionId: data.postulacion_id } });
        } catch (err) {
            console.error('Error iniciando contacto:', err);
            showAlert(err.message, 'Error al contactar', 'error');
        } finally {
            setContactando(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div style={{ color: 'var(--primary)', fontSize: '1.3rem', fontWeight: 'bold' }}>Cargando...</div>
            </div>
        );
    }

    // Premium Paywall
    if (!isPremium) {
        return (
            <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
                <div style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                    borderRadius: '24px', padding: '3rem', color: 'white',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(0,214,107,0.1)', filter: 'blur(20px)' }} />
                    <Lock size={48} color="#FFB020" style={{ marginBottom: '1.5rem' }} />
                    <h2 style={{fontSize: '2rem', margin: '0 0 1rem', fontWeight: '800' }}>
                        Búsqueda Avanzada de Talento
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 2rem' }}>
                        Encontrá candidatos por habilidades y experiencia sin necesidad de que se postulen primero. Solo candidatos que optaron por ser visibles aparecerán en los resultados.
                    </p>
                    <button onClick={() => navigate('/pricing-empresa')} style={{
                        background: 'linear-gradient(90deg, #FFB020, #FF9800)', color: 'white',
                        border: 'none', padding: '14px 32px', borderRadius: '14px',
                        fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
                        boxShadow: '0 8px 25px rgba(255,176,32,0.3)', display: 'inline-flex',
                        alignItems: 'center', gap: '8px'
                    }}>
                        <Sparkles size={18} /> Activar Premium Empresa
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Search size={28} color="var(--primary)" />
                    <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--text-dark)' }}>
                        Búsqueda Avanzada de Candidatos
                    </h1>
                    <span style={{ background: 'linear-gradient(90deg, #FFB020, #FF9800)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        PREMIUM
                    </span>
                </div>
                <p style={{ color: 'var(--text-gray)', fontSize: '1.05rem', margin: 0 }}>
                    Solo aparecen candidatos que activaron la visibilidad en búsquedas. Los datos de contacto no se muestran — usá el chat de la plataforma para iniciar contacto.
                </p>
            </div>

            {/* Search Controls */}
            <div style={{
                background: 'white', borderRadius: '20px', padding: '2rem',
                border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                marginBottom: '2rem'
            }}>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    {/* Skill input */}
                    <div style={{ flex: '1 1 300px', position: 'relative' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Skills Requeridas
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: selectedSkills.length > 0 ? '8px' : '0' }}>
                            {selectedSkills.map(skill => (
                                <span key={skill} style={{
                                    background: 'rgba(0,214,107,0.1)', color: 'var(--primary)',
                                    padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem',
                                    fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px'
                                }}>
                                    {skill}
                                    <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeSkill(skill)} />
                                </span>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && skillInput.trim()) {
                                    addSkill(skillInput.trim());
                                }
                            }}
                            placeholder="Ej: React, Python, Liderazgo..."
                            style={{
                                width: '100%', padding: '12px 14px', borderRadius: '12px',
                                border: '1px solid rgba(0,214,107,0.3)', fontSize: '1rem',
                                outline: 'none', boxSizing: 'border-box'
                            }}
                        />
                        {suggestions.length > 0 && (
                            <div style={{
                                position: 'absolute', top: '100%', left: 0, right: 0,
                                background: 'white', borderRadius: '12px', border: '1px solid #eee',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.1)', zIndex: 10,
                                maxHeight: '200px', overflowY: 'auto', marginTop: '4px'
                            }}>
                                {suggestions.map(s => (
                                    <div key={s} onClick={() => addSkill(s)} style={{
                                        padding: '10px 14px', cursor: 'pointer', fontSize: '0.95rem',
                                        borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = '#f8fffe'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        {s}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Experience filter */}
                    <div style={{ flex: '0 0 180px' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#64748b', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Experiencia Mínima
                        </label>
                        <select
                            value={experienciaMin}
                            onChange={(e) => setExperienciaMin(parseInt(e.target.value))}
                            style={{
                                width: '100%', padding: '12px 14px', borderRadius: '12px',
                                border: '1px solid rgba(0,214,107,0.3)', fontSize: '1rem',
                                outline: 'none', background: 'white'
                            }}
                        >
                            <option value={0}>Cualquiera</option>
                            <option value={1}>1+ año</option>
                            <option value={2}>2+ años</option>
                            <option value={3}>3+ años</option>
                            <option value={5}>5+ años</option>
                            <option value={8}>8+ años</option>
                        </select>
                    </div>

                    {/* Search button */}
                    <button
                        onClick={handleSearch}
                        disabled={searching}
                        style={{
                            background: 'var(--primary)', color: 'white', border: 'none',
                            padding: '12px 28px', borderRadius: '12px', fontWeight: 'bold',
                            fontSize: '1rem', cursor: searching ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            boxShadow: '0 4px 15px rgba(0,214,107,0.3)',
                            opacity: searching ? 0.7 : 1, transition: 'all 0.2s',
                            flexShrink: 0
                        }}
                    >
                        {searching ? <Loader2 size={18} className="spin" /> : <Search size={18} />}
                        {searching ? 'Buscando...' : 'Buscar Candidatos'}
                    </button>
                </div>
            </div>

            {/* Results */}
            {searched && (
                <div>
                    <div style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.95rem', fontWeight: '600' }}>
                        {results.length} candidato{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                    </div>

                    {results.length === 0 ? (
                        <div style={{
                            textAlign: 'center', padding: '4rem 2rem',
                            background: 'white', borderRadius: '20px',
                            border: '1px solid rgba(0,0,0,0.06)'
                        }}>
                            <Users size={48} color="#94a3b8" style={{ marginBottom: '1rem' }} />
                            <h3 style={{ color: 'var(--text-dark)', margin: '0 0 8px' }}>Sin resultados</h3>
                            <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '0 auto' }}>
                                No se encontraron candidatos con los criterios seleccionados que hayan activado la visibilidad en búsquedas.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.2rem' }}>
                            {results.map(candidato => (
                                <div key={candidato.candidato_id} style={{
                                    background: 'white', borderRadius: '16px', padding: '1.5rem',
                                    border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    transition: 'all 0.2s', cursor: 'default'
                                }}
                                onMouseOver={e => { e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,214,107,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,214,107,0.3)'; }}
                                onMouseOut={e => { e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'rgba(0,0,0,0.06)'; }}
                                >
                                    <div style={{ marginBottom: '12px' }}>
                                        <h3 style={{ margin: '0 0 4px', fontSize: '1.15rem', color: 'var(--text-dark)' }}>
                                            {candidato.titulo_profesional || 'Profesional'}
                                        </h3>
                                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', fontSize: '0.88rem', color: '#64748b' }}>
                                            {candidato.anios_experiencia !== null && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Briefcase size={14} /> {candidato.anios_experiencia} año{candidato.anios_experiencia !== 1 ? 's' : ''} exp.
                                                </span>
                                            )}
                                            {candidato.ubicacion && (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <MapPin size={14} /> {candidato.ubicacion}
                                                </span>
                                            )}
                                            {candidato.modalidad_preferida && (
                                                <span style={{ background: '#EAF9F1', color: 'var(--primary)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '600' }}>
                                                    {candidato.modalidad_preferida}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Skills */}
                                    {candidato.skills_match && Array.isArray(candidato.skills_match) && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                                            {candidato.skills_match.slice(0, 8).map((skill, i) => {
                                                const isSearched = selectedSkills.some(s => 
                                                    skill.nombre?.toLowerCase().includes(s.toLowerCase()) ||
                                                    s.toLowerCase().includes(skill.nombre?.toLowerCase())
                                                );
                                                return (
                                                    <span key={i} style={{
                                                        padding: '3px 8px', borderRadius: '6px',
                                                        fontSize: '0.78rem', fontWeight: '600',
                                                        background: isSearched ? 'rgba(0,214,107,0.12)' : '#f1f5f9',
                                                        color: isSearched ? 'var(--primary)' : '#64748b',
                                                        border: isSearched ? '1px solid rgba(0,214,107,0.3)' : '1px solid transparent'
                                                    }}>
                                                        {skill.nombre} {skill.nivel ? `(${skill.nivel}/5)` : ''}
                                                    </span>
                                                );
                                            })}
                                            {candidato.skills_match.length > 8 && (
                                                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', color: '#94a3b8', background: '#f8fafc' }}>
                                                    +{candidato.skills_match.length - 8} más
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button
                                            onClick={() => handleContactar(candidato)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                background: 'var(--primary)', color: 'white',
                                                border: 'none', padding: '8px 16px', borderRadius: '10px',
                                                fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(0,214,107,0.25)',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 18px rgba(0,214,107,0.35)'; }}
                                            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,214,107,0.25)'; }}
                                        >
                                            <MessageCircle size={15} /> Contactar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modal de contacto */}
            {contactModal && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, backdropFilter: 'blur(4px)'
                }} onClick={() => !contactando && setContactModal(null)}>
                    <div style={{
                        background: 'white', borderRadius: '20px', padding: '2rem',
                        maxWidth: '500px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
                        position: 'relative'
                    }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => !contactando && setContactModal(null)} style={{
                            position: 'absolute', top: '16px', right: '16px', background: 'none',
                            border: 'none', cursor: 'pointer', color: '#94a3b8'
                        }}><X size={20} /></button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                background: 'rgba(0,214,107,0.1)', display: 'flex',
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Send size={20} color="var(--primary)" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-dark)' }}>Contactar candidato</h3>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: '#64748b' }}>
                                    {contactModal.titulo_profesional || 'Profesional'}
                                </p>
                            </div>
                        </div>

                        {ofertasActivas.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#FFF7ED', borderRadius: '12px', border: '1px solid #FFEDD5' }}>
                                <AlertTriangle size={32} color="#F59E0B" style={{ marginBottom: '8px' }} />
                                <p style={{ margin: '0 0 12px', fontWeight: '600', color: '#92400E' }}>No tenés ofertas activas</p>
                                <p style={{ margin: '0 0 16px', fontSize: '0.88rem', color: '#B45309' }}>Publicá una oferta de trabajo para poder contactar candidatos.</p>
                                <button onClick={() => navigate('/crear-oferta')} style={{
                                    background: 'var(--primary)', color: 'white', border: 'none',
                                    padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold',
                                    cursor: 'pointer', fontSize: '0.9rem'
                                }}>Crear Oferta</button>
                            </div>
                        ) : (
                            <>
                                <label style={{ display: 'block', fontSize: '0.88rem', color: '#64748b', fontWeight: '600', marginBottom: '8px' }}>
                                    Seleccioná la oferta por la que le escribís:
                                </label>
                                <select
                                    value={selectedOferta}
                                    onChange={e => setSelectedOferta(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 14px', borderRadius: '12px',
                                        border: '1px solid rgba(0,214,107,0.3)', fontSize: '1rem',
                                        outline: 'none', background: 'white', marginBottom: '1rem'
                                    }}
                                >
                                    {ofertasActivas.map(o => (
                                        <option key={o.id} value={o.id}>{o.titulo}</option>
                                    ))}
                                </select>

                                {selectedOferta && (
                                    <div style={{
                                        background: '#f8fffe', border: '1px solid rgba(0,214,107,0.15)',
                                        borderRadius: '12px', padding: '14px', marginBottom: '1.5rem'
                                    }}>
                                        <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vista previa del mensaje:</p>
                                        <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-dark)', lineHeight: '1.5', fontStyle: 'italic' }}>
                                            &quot;¡Hola! Nos interesa tu perfil para nuestra búsqueda &quot;{ofertasActivas.find(o => o.id === selectedOferta)?.titulo}&quot;. ¿Tenés un momento para charlar sobre esta oportunidad?&quot;
                                        </p>
                                    </div>
                                )}

                                <button
                                    onClick={handleConfirmarContacto}
                                    disabled={contactando || !selectedOferta}
                                    style={{
                                        width: '100%', padding: '14px', borderRadius: '12px',
                                        background: contactando ? '#94a3b8' : 'var(--primary)',
                                        color: 'white', border: 'none', fontWeight: 'bold',
                                        fontSize: '1rem', cursor: contactando ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        boxShadow: '0 4px 15px rgba(0,214,107,0.3)', transition: 'all 0.2s'
                                    }}
                                >
                                    {contactando ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
                                    {contactando ? 'Enviando...' : 'Enviar mensaje y contactar'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .spin { animation: spin 1s linear infinite; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
