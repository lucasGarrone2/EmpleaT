import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAlert } from '../context/AlertContext';
import { supabase } from '../supabase';
import { Filter, Star, MapPin, Briefcase, ChevronLeft, ChevronRight, Sparkles, Zap, Users, TrendingUp, BarChart3, DollarSign, Lock, Rocket, Trophy, ThumbsUp, Lightbulb } from 'lucide-react';
import MatchBadge from '../components/MatchBadge';
import PremiumActionZone from '../components/PremiumActionZone';
import InterviewModal from '../components/InterviewModal';
import BoostQuizModal from '../components/BoostQuizModal';
import OfertaCardSkeleton from '../components/OfertaCardSkeleton';
import AdaptarCvModal from '../components/AdaptarCvModal';
import { hayOverlapCategorias, getCategoriaSkill } from '../utils/categories';
import { fetchFeatureFlags, isFeatureActive } from '../utils/featureFlags';

function PremiumStats({ offerId, candidatoId, currentCandidateMatch, currentOfferSalary, esPremium, marketAvgSalary }) {
    const [stats, setStats] = useState({ totalPostulantes: 0, candidateRank: 0, avgMatch: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!esPremium) return;
            setLoading(true);
            try {
                const sessionRes = await supabase.auth.getSession();
                const token = sessionRes.data.session?.access_token;
                
                const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/premium/oferta-stats/${offerId}?currentMatch=${currentCandidateMatch}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) throw new Error("No se pudieron cargar las estadísticas");

                const statsData = await response.json();
                setStats({
                    totalPostulantes: statsData.totalPostulantes,
                    candidateRank: statsData.candidateRank,
                    avgMatch: statsData.avgMatch
                });
            } catch (e) {
                console.error("Error al obtener estadísticas premium de postulación:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [offerId, candidatoId, esPremium, currentCandidateMatch]);

    if (!esPremium) {
        return (
            <div style={{ marginTop: '2rem', position: 'relative', borderRadius: '16px', border: '1px solid rgba(255,215,0,0.3)', padding: '1.5rem', background: 'linear-gradient(135deg, rgba(255,215,0,0.02) 0%, rgba(255,215,0,0.05) 100%)', overflow: 'hidden' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#B7791F', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem', fontWeight: 'bold' }}>
                    <Sparkles size={18} fill="#B7791F" /> Estadísticas Competitivas de la Oferta
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', filter: 'blur(4px)', opacity: 0.5, pointerEvents: 'none', select: 'none' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #EAEAEA' }}>
                        <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Candidatos Totales</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '4px 0', color: '#333' }}>14 postulantes</div>
                    </div>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #EAEAEA' }}>
                        <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Puesto Estimado</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '4px 0', color: '#333' }}>#3 de 15</div>
                    </div>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #EAEAEA' }}>
                        <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Afinidad Promedio</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '4px 0', color: '#333' }}>72% (Por encima)</div>
                    </div>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #EAEAEA' }}>
                        <span style={{ fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 'bold' }}>Sueldo vs. Mercado</span>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '4px 0', color: '#333' }}>+12% vs. Mercado</div>
                    </div>
                </div>

                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '1rem', boxSizing: 'border-box', textAlign: 'center' }}>
                    <div style={{ background: '#FFFDF0', border: '1px solid #F6E05E', color: '#B7791F', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                        <Lock size={14} /> Exclusivo para Usuarios Premium
                    </div>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#4A5568', maxWidth: '380px', lineHeight: '1.4', fontWeight: '500' }}>
                        Accede a información estratégica en tiempo real de salarios, cantidad de postulantes y tu puesto en el ranking de candidatos.
                    </p>
                    <a href="/pricing" style={{ background: 'linear-gradient(90deg, #FFB020 0%, #FF9800 100%)', color: 'white', textDecoration: 'none', padding: '8px 18px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(255,176,32,0.3)', transition: 'transform 0.2s' }}>
                        Ver Planes Premium 👑
                    </a>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#F8F9FA', borderRadius: '16px', border: '1px solid #EAEAEA', textAlign: 'center', color: '#888', fontSize: '0.95rem' }}>
                Cargando estadísticas de competencia...
            </div>
        );
    }

    const currentSal = currentOfferSalary || 0;
    const salaryDiffPercent = marketAvgSalary > 0 ? Math.round(((currentSal - marketAvgSalary) / marketAvgSalary) * 100) : 0;
    const isSalaryAbove = salaryDiffPercent >= 0;

    return (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%)', borderRadius: '16px', border: '1px solid rgba(0,214,107,0.15)' }}>
            <h4 style={{ margin: '0 0 1.2rem 0', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 'bold' }}>
                <TrendingUp size={18} color="var(--primary)" /> Estadísticas Competitivas Premium
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.1)', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <Users size={14} /> Postulantes
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '6px 0 2px 0', color: 'var(--text-dark)' }}>
                        {stats.totalPostulantes} {stats.totalPostulantes === 1 ? 'postulante' : 'postulantes'}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Aplicados en total a este empleo</span>
                </div>

                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.1)', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <BarChart3 size={14} /> Posicionamiento
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '6px 0 2px 0', color: 'var(--primary)' }}>
                        {(() => {
                            const rank = stats.candidateRank;
                            const total = stats.totalPostulantes;
                            if (!total || total === 0) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Primer postulante <Rocket size={16} /></span>;
                            const pct = (rank / total) * 100;
                            if (pct <= 10) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Top 10% de afinidad <Trophy size={16} /></span>;
                            if (pct <= 25) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Top 25% de afinidad <Sparkles size={16} /></span>;
                            if (pct <= 50) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Top 50% de afinidad <ThumbsUp size={16} /></span>;
                            if (pct <= 75) return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Top 75% de afinidad <TrendingUp size={16} /></span>;
                            return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Top 100% de afinidad <Briefcase size={16} /></span>;
                        })()}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Ubicación estimada en el grupo</span>
                </div>

                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.1)', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <Zap size={14} /> Afinidad Promedio
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '6px 0 2px 0', color: 'var(--text-dark)' }}>
                        {stats.avgMatch}%
                    </div>
                    <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        color: currentCandidateMatch >= stats.avgMatch ? '#15803d' : '#b91c1c'
                    }}>
                        {currentCandidateMatch >= stats.avgMatch 
                            ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>¡Estás {currentCandidateMatch - stats.avgMatch}% por arriba! <Rocket size={14} /></span> 
                            : <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Estás {stats.avgMatch - currentCandidateMatch}% por debajo <Lightbulb size={14} /></span>}
                    </span>
                </div>

                <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0,214,107,0.1)', boxShadow: '0 4px 10px rgba(0,0,0,0.01)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <DollarSign size={14} /> Salario vs Mercado
                    </div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '6px 0 2px 0', color: 'var(--text-dark)' }}>
                        {currentSal ? `$${currentSal.toLocaleString()} USD` : 'N/A'}
                    </div>
                    <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: 'bold',
                        color: isSalaryAbove ? '#15803d' : '#b91c1c'
                    }}>
                        {currentSal === 0 
                            ? 'No especificado por la empresa'
                            : `${isSalaryAbove ? 'Por encima' : 'Por debajo'} del promedio ($${Math.round(marketAvgSalary).toLocaleString()} USD)`}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default function ListaOfertas() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const showAlert = useAlert();

    const [loading, setLoading] = useState(true);
    const [candidatoId, setCandidatoId] = useState(null);
    const [ofertas, setOfertas] = useState([]);
    const [postulacionesMap, setPostulacionesMap] = useState({});
    const [error, setError] = useState(null);
    const [applyingTo, setApplyingTo] = useState(null);
    const [expandedOferta, setExpandedOferta] = useState(null);
    const [candidatoData, setCandidatoData] = useState(null);
    const [showInterviewModalFor, setShowInterviewModalFor] = useState(null);
    const [boostQuizModalFor, setBoostQuizModalFor] = useState(null);
    const [adaptarCvModalFor, setAdaptarCvModalFor] = useState(null);
    const [marketAvgSalary, setMarketAvgSalary] = useState(0);
    const [featureFlags, setFeatureFlags] = useState(null);
    const viewedOffersRef = useRef(new Set());

    useEffect(() => {
        fetchFeatureFlags().then(({ flags }) => setFeatureFlags(flags));
    }, []);


    const locationRouter = useLocation();
    const queryParams = new URLSearchParams(locationRouter.search);

    // Filter states
    const [filtros, setFiltros] = useState({
        palabraClave: queryParams.get('q') || '',
        ubicacionTexto: queryParams.get('loc') || '',
        ubicacion: 'Todas',
        modalidad: { Remoto: false, Híbrido: false, Presencial: false },
        rubro: 'Todos',
        minMatch: 50
    });

    const [ordenamiento, setOrdenamiento] = useState('Mejor Match');
    const [paginaActual, setPaginaActual] = useState(1);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (user.user_metadata?.rol === 'empresa') {
            navigate('/dashboard-empresa');
            return;
        }

        const fetchDatos = async () => {
            try {
                const { data: candData, error: candError } = await supabase
                    .from('candidatos')
                    .select('id, es_premium, titulo_profesional, nombre_completo')
                    .eq('auth_id', user.id)
                    .maybeSingle();
                
                if (candError) throw candError;
                if (!candData) {
                    navigate('/perfil');
                    return;
                }
                
                // Confirmación de pago Mercado Pago fallback
                const paymentId = queryParams.get('payment_id');
                const paymentStatus = queryParams.get('status');
                let esPremiumLocal = candData.es_premium;

                if (paymentId && paymentStatus === 'approved') {
                    try {
                        const token = await supabase.auth.getSession().then(res => res.data.session?.access_token);
                        const confirmRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/confirm-payment`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ payment_id: paymentId })
                        });
                        
                        const confirmData = await confirmRes.json();
                        if (confirmData.success) {
                            esPremiumLocal = true;
                            // Limpiar URL reactivamente en React Router para no volver a ejecutar
                            navigate('/ofertas', { replace: true });
                            showAlert("¡Listo! Tu pago ya se acreditó. ¡Ya eres Premium!", "¡Éxito!", "success");
                        }
                    } catch (e) {
                        console.error("Error confirmando pago en frontend:", e);
                    }
                }

                candData.es_premium = esPremiumLocal;
                setCandidatoId(candData.id);
                setCandidatoData(candData);

                const { data: candSkills, error: skillsError } = await supabase
                    .from('candidato_skills')
                    .select(`
                        skill_id,
                        nombre_original,
                        nivel_estimado,
                        diccionario_skills(nombre_skill)
                    `)
                    .eq('candidato_id', candData.id);
                
                if (skillsError) throw skillsError;
                const arraySkillsCandidato = candSkills || [];

                const { data: misPostulaciones } = await supabase
                    .from('postulaciones')
                    .select('oferta_id, match_boost_estado')
                    .eq('candidato_id', candData.id);
                
                const mapPostuladas = {};
                (misPostulaciones || []).forEach(p => {
                    mapPostuladas[p.oferta_id] = p;
                });
                setPostulacionesMap(mapPostuladas);

                const { data: ofertasData, error: ofError } = await supabase
                    .from('ofertas')
                    .select(`
                        id, titulo, modalidad, descripcion, salario_min_usd, salario_max_usd, creada_en, porcentaje_match_minimo, ciudad, nombre_empresa_custom, oculta_admin, seniority, destacada, destacada_hasta,
                        empresas (nombre, ubicacion, logo_url, baneada),
                        oferta_skills (
                            skill_id,
                            nombre_original,
                            nivel_requerido,
                            diccionario_skills (nombre_skill)
                        )
                    `)
                    .eq('estado', 'Publicada');
                

                if (ofError) throw ofError;

                const ofertasValidas = (ofertasData || []).filter(o => !o.oculta_admin && (!o.empresas || !o.empresas.baneada));

                // Calcular salario promedio del mercado en base a las ofertas cargadas
                const salaries = ofertasValidas
                    .map(o => {
                        const min = o.salario_min_usd || 0;
                        const max = o.salario_max_usd || min;
                        return (min + max) / 2;
                    })
                    .filter(s => s > 0);
                const avgSal = salaries.length > 0 
                    ? salaries.reduce((acc, s) => acc + s, 0) / salaries.length 
                    : 0;
                setMarketAvgSalary(avgSal);

                const ofertasConMatch = ofertasValidas.map(oferta => {
                    const normalize = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : "";
                    
                    const isJuniorOffer = (oferta.seniority || '').toLowerCase().includes('junior') || 
                                          (oferta.seniority || '').toLowerCase().includes('trainee') || 
                                          (oferta.titulo || '').toLowerCase().includes('junior') || 
                                          (oferta.titulo || '').toLowerCase().includes('trainee');

                    const skillsRequeridas = oferta.oferta_skills || [];
                    const totalRequeridas = skillsRequeridas.length;
                    let confidenciasReales = 0;

                    const synonymMap = {
                        // === JAVASCRIPT / TYPESCRIPT ===
                        'javascript': ['js', 'ecmascript', 'typescript', 'ts'],
                        'js': ['javascript', 'ecmascript', 'typescript'],
                        'typescript': ['ts', 'javascript', 'js'],
                        'ts': ['typescript', 'javascript'],
                        'react': ['reactjs', 'react.js', 'jsx', 'redux'],
                        'reactjs': ['react', 'react.js'],
                        'react.js': ['react', 'reactjs'],
                        'next.js': ['nextjs', 'react'],
                        'nextjs': ['next.js', 'react'],
                        'vue': ['vuejs', 'vue.js'],
                        'vuejs': ['vue', 'vue.js'],
                        'angular': ['angularjs', 'angular.js'],
                        'node': ['nodejs', 'node.js', 'express'],
                        'nodejs': ['node', 'node.js', 'express'],
                        'node.js': ['node', 'nodejs', 'express'],
                        'express': ['expressjs', 'node', 'nodejs'],

                        // === HTML / CSS ===
                        'html': ['html5'],
                        'html5': ['html'],
                        'css': ['css3', 'sass', 'scss', 'less', 'tailwind', 'bootstrap'],
                        'css3': ['css'],
                        'tailwind': ['tailwindcss', 'css'],
                        'bootstrap': ['css'],
                        'sass': ['scss', 'css'],
                        'scss': ['sass', 'css'],

                        // === PYTHON ===
                        'python': ['py', 'django', 'flask', 'fastapi'],
                        'django': ['python'],
                        'flask': ['python'],
                        'fastapi': ['python'],

                        // === JAVA ===
                        'java': ['spring', 'spring boot', 'springboot', 'java ee', 'jee', 'j2ee', 'maven', 'gradle', 'hibernate', 'jpa'],
                        'spring': ['spring boot', 'springboot', 'java'],
                        'spring boot': ['springboot', 'spring', 'java'],
                        'springboot': ['spring boot', 'spring', 'java'],

                        // === .NET / C# ===
                        'c#': ['csharp', '.net', 'dotnet', 'asp.net'],
                        'csharp': ['c#', '.net', 'dotnet'],
                        '.net': ['dotnet', 'c#', 'csharp', 'asp.net'],
                        'dotnet': ['.net', 'c#', 'csharp'],
                        'asp.net': ['.net', 'c#'],

                        // === PHP ===
                        'php': ['laravel', 'symfony', 'wordpress'],
                        'laravel': ['php'],
                        'wordpress': ['php'],

                        // === MOBILE ===
                        'mobile': ['movil', 'android', 'ios', 'react native', 'flutter'],
                        'movil': ['mobile', 'android', 'ios'],
                        'android': ['kotlin', 'java', 'mobile'],
                        'ios': ['swift', 'objective-c', 'mobile', 'apple'],
                        'react native': ['mobile', 'react', 'javascript'],
                        'flutter': ['dart', 'mobile'],
                        'swift': ['ios'],
                        'kotlin': ['android', 'java'],

                        // === DATABASES ===
                        'sql': ['mysql', 'postgresql', 'postgres', 'sql server', 'oracle', 'pl/sql', 'sqlite', 'base de datos', 'database'],
                        'mysql': ['sql', 'base de datos', 'mariadb'],
                        'postgresql': ['postgres', 'sql', 'base de datos'],
                        'postgres': ['postgresql', 'sql', 'base de datos'],
                        'sql server': ['sql', 'base de datos', 'tsql'],
                        'oracle': ['sql', 'pl/sql', 'base de datos'],
                        'mongodb': ['nosql', 'base de datos', 'mongoose'],
                        'nosql': ['mongodb', 'redis', 'cassandra', 'dynamodb', 'firebase', 'base de datos'],
                        'redis': ['cache', 'nosql', 'base de datos'],

                        // === CLOUD / DEVOPS ===
                        'cloud': ['aws', 'azure', 'gcp', 'google cloud', 'nube'],
                        'aws': ['amazon web services', 'cloud', 's3', 'ec2', 'lambda'],
                        'amazon web services': ['aws', 'cloud'],
                        'azure': ['microsoft azure', 'cloud'],
                        'gcp': ['google cloud', 'cloud'],
                        'devops': ['ci/cd', 'docker', 'kubernetes', 'jenkins', 'github actions', 'gitlab', 'terraform'],
                        'docker': ['contenedores', 'devops', 'kubernetes'],
                        'kubernetes': ['k8s', 'docker', 'devops'],
                        'k8s': ['kubernetes', 'docker'],
                        'ci/cd': ['devops', 'jenkins', 'github actions', 'gitlab ci'],
                        'git': ['github', 'gitlab', 'bitbucket'],
                        'github': ['git'],
                        'gitlab': ['git'],

                        // === SOPORTE TECNICO / HELPDESK ===
                        'soporte tecnico': ['helpdesk', 'atencion al usuario', 'mantenimiento de pc', 'hardware', 'redes', 'soporte informatico', 'soporte'],
                        'soporte': ['soporte tecnico', 'helpdesk', 'mantenimiento de pc', 'hardware', 'redes'],
                        'helpdesk': ['soporte tecnico', 'atencion al usuario', 'soporte informatico', 'soporte'],

                        // === SALUD / MEDICINA ===
                        'medicina': ['medico', 'medica', 'salud', 'clinica', 'medicina general', 'diagnostico clinico', 'atencion al paciente'],
                        'medico': ['medicina', 'medica', 'salud', 'clinica', 'doctor'],
                        'diagnostico por imagenes': ['tomografia', 'resonancia', 'mamografia', 'radiologia', 'ecografia'],

                        // === DERECHO ===
                        'derecho': ['abogado', 'abogada', 'juridico', 'legal', 'leyes'],
                        'abogado': ['derecho', 'juridico', 'legal', 'leyes'],

                        // === FINANZAS / MARKETING ===
                        'contabilidad': ['finanzas', 'impuestos', 'balance', 'auditoria', 'facturacion', 'excel', 'contador'],
                        'ventas': ['comercial', 'atencion al cliente', 'telemarketing', 'cierre de ventas'],
                        'marketing': ['marketing digital', 'seo', 'sem', 'redes sociales', 'social media', 'google ads']
                    };

                    // Función para obtener sinónimos expandidos (2 niveles de profundidad)
                    const getExpandedSynonyms = (skillStr) => {
                        const direct = synonymMap[skillStr] || [];
                        const expanded = new Set(direct);
                        direct.forEach(syn => {
                            (synonymMap[syn] || []).forEach(syn2 => expanded.add(syn2));
                        });
                        expanded.add(skillStr);
                        return expanded;
                    };

                    // --- CAPA 1: GATE DE RUBRO ---
                    const coreSkillsOferta = skillsRequeridas.filter(s => s.es_core !== false);
                    const targetCoreSkills = coreSkillsOferta.length > 0 ? coreSkillsOferta : skillsRequeridas;
                    const hasMacroOverlap = hayOverlapCategorias(arraySkillsCandidato, targetCoreSkills);

                    if (!hasMacroOverlap) {
                        return { ...oferta, porcentajeMatch: Math.min(15, totalRequeridas > 0 ? 10 : 0) };
                    }

                    // --- CAPA 2: MATCH TÉCNICO PONDERADO (75% CORE + 25% SECUNDARIAS) ---
                    const candSkillSet = new Set(arraySkillsCandidato.map(cs => normalize(cs.nombre_original) || normalize(cs.diccionario_skills?.nombre_skill)));
                    const hasFrontend = ['react', 'reactjs', 'react.js', 'vue', 'angular', 'javascript', 'js', 'typescript', 'ts', 'html', 'css', 'frontend', 'front-end'].some(s => candSkillSet.has(s));
                    const hasBackend = ['node', 'nodejs', 'node.js', 'express', 'java', 'spring', 'spring boot', 'springboot', 'python', 'django', 'flask', 'fastapi', 'c#', '.net', 'php', 'backend', 'back-end', 'sql', 'mysql', 'postgresql', 'mongodb'].some(s => candSkillSet.has(s));
                    const hasDb = ['sql', 'mysql', 'postgresql', 'postgres', 'oracle', 'sql server', 'mongodb', 'nosql', 'redis', 'base de datos', 'bases de datos'].some(s => candSkillSet.has(s));

                    const evaluateSkillScore = (req) => {
                        const reqStr = normalize(req.nombre_original) || normalize(req.diccionario_skills?.nombre_skill);
                        const nivelReq = req.nivel_requerido ?? null;

                        const matchTarget = arraySkillsCandidato.find(cs => {
                            if (cs.skill_id && cs.skill_id === req.skill_id) return true;
                            const csStr = normalize(cs.nombre_original) || normalize(cs.diccionario_skills?.nombre_skill);
                            if (!csStr || !reqStr) return false;
                            if (csStr === reqStr) return true;
                            const minLen = Math.min(csStr.length, reqStr.length);
                            if (minLen >= 3 && (csStr.includes(reqStr) || reqStr.includes(csStr))) return true;
                            const reqSyns = synonymMap[reqStr] || [];
                            if (reqSyns.includes(csStr)) return true;
                            return false;
                        });

                        let isRoleInferred = false;
                        if (!matchTarget) {
                            if (['full stack', 'fullstack', 'full-stack', 'desarrollo web', 'web development'].includes(reqStr)) {
                                if ((hasFrontend && hasBackend) || candSkillSet.has('full stack') || candSkillSet.has('fullstack')) {
                                    isRoleInferred = true;
                                }
                            } else if (['backend', 'back-end'].includes(reqStr)) {
                                if (hasBackend) isRoleInferred = true;
                            } else if (['frontend', 'front-end'].includes(reqStr)) {
                                if (hasFrontend) isRoleInferred = true;
                            } else if (['base de datos', 'bases de datos', 'database'].includes(reqStr)) {
                                if (hasDb) isRoleInferred = true;
                            }
                        }

                        req.isMatch = !!matchTarget || isRoleInferred;

                        if (matchTarget || isRoleInferred) {
                            if (!nivelReq || isJuniorOffer) return 1.0;
                            const nivelCand = matchTarget ? (matchTarget.nivel_estimado || 3) : 3;
                            const diff = nivelReq - nivelCand;
                            if (diff <= 0) return 1.0;
                            if (diff === 1) return 0.85;
                            if (diff === 2) return 0.60;
                            return 0.30;
                        }

                        const reqExpanded = getExpandedSynonyms(reqStr);
                        const indirectMatch = arraySkillsCandidato.find(cs => {
                            const csStr = normalize(cs.nombre_original) || normalize(cs.diccionario_skills?.nombre_skill);
                            return csStr && reqExpanded.has(csStr);
                        });
                        if (indirectMatch) {
                            req.isMatch = true;
                            return 0.50;
                        }

                        return req.es_core !== false ? 0.10 : 0.30;
                    };

                    let matchTecnico = 1.0;
                    if (totalRequeridas > 0) {
                        const coreSkills = skillsRequeridas.filter(s => s.es_core !== false);
                        const secSkills = skillsRequeridas.filter(s => s.es_core === false);

                        const coreScores = coreSkills.length > 0
                            ? coreSkills.map(evaluateSkillScore)
                            : skillsRequeridas.map(evaluateSkillScore);
                        const coreAvg = coreScores.reduce((acc, v) => acc + v, 0) / coreScores.length;

                        if (secSkills.length > 0) {
                            const secScores = secSkills.map(evaluateSkillScore);
                            const secAvg = secScores.reduce((acc, v) => acc + v, 0) / secScores.length;
                            matchTecnico = 0.75 * coreAvg + 0.25 * secAvg;
                        } else {
                            matchTecnico = coreAvg;
                        }
                    }

                    // --- CAPA 3: FIT POR SENIORITY (85% TÉCNICO + 15% SENIORITY FIT) ---
                    const seniorityBucketOfferMap = {
                        'trainee': 1, 'inicial': 1, 'junior': 2, 'semi-senior': 3, 'ssr': 3, 'semi senior': 3, 'senior': 4, 'sr': 4, 'experto': 5, 'lead': 5
                    };
                    const offerSeniorityStr = (oferta.seniority || '').toLowerCase();
                    let offerBucket = 3;
                    for (const [key, val] of Object.entries(seniorityBucketOfferMap)) {
                        if (offerSeniorityStr.includes(key)) {
                            offerBucket = val;
                            break;
                        }
                    }

                    const candMaxLvl = arraySkillsCandidato.reduce((max, s) => Math.max(max, s.nivel_estimado || 3), 3);
                    const candBucket = candMaxLvl;
                    const senDiff = offerBucket - candBucket;

                    let seniorityFit = 1.0;
                    if (senDiff <= 0) seniorityFit = 1.0;
                    else if (senDiff === 1) seniorityFit = 0.70;
                    else if (senDiff === 2) seniorityFit = 0.35;
                    else seniorityFit = 0.10;

                    let score = Math.round((0.85 * matchTecnico + 0.15 * seniorityFit) * 100);

                    return { ...oferta, porcentajeMatch: score };
                });

                ofertasConMatch.sort((a, b) => b.porcentajeMatch - a.porcentajeMatch);
                setOfertas(ofertasConMatch);

            } catch (err) {
                console.error("Error obteniendo ofertas", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDatos();
    }, [user, navigate]);

    const handlePostularse = async (e, ofertaId, porcentajeMatch) => {
        e.stopPropagation();
        setApplyingTo(ofertaId);
        try {
            // VERIFICACIÓN JUST-IN-TIME DE LÍMITE DE POSTULACIONES
            const { data: ofertaInfo } = await supabase
                .from('ofertas')
                .select('limite_postulaciones')
                .eq('id', ofertaId)
                .single();

            if (ofertaInfo?.limite_postulaciones) {
                const { count } = await supabase
                    .from('postulaciones')
                    .select('*', { count: 'exact', head: true })
                    .eq('oferta_id', ofertaId);
                    
                if (count >= ofertaInfo.limite_postulaciones) {
                    showAlert("Lo sentimos. Esta oferta ha alcanzado su cupo máximo de postulantes.", "Cupo Máximo", "warning");
                    setApplyingTo(null);
                    return;
                }
            }

            const { error: postError } = await supabase
                .from('postulaciones')
                .insert({
                    candidato_id: candidatoId,
                    oferta_id: ofertaId,
                    porcentaje_match_calculado: porcentajeMatch,
                    estado: 'Postulado'
                });

            if (postError) {
                if (postError.code === '23505') {
                   // Ignoramos silenciosamente si la UI envió un spam click doble
                   console.warn("Intento de postulacion duplicada bloqueada.");
                } else {
                   throw postError;
                }
            }

            setPostulacionesMap(prev => ({
                ...prev,
                [ofertaId]: { oferta_id: ofertaId, match_boost_estado: 'pendiente' }
            }));
        } catch (err) {
            showAlert("Error del servidor: No pudimos procesar tu solicitud.", "Error", "error");
        } finally {
            setApplyingTo(null);
        }
    };

    const toggleFilter = (filterType, value) => {
        setFiltros(prev => ({
            ...prev,
            [filterType]: { ...prev[filterType], [value]: !prev[filterType][value] }
        }));
    };

    const getUbicacionesUnicas = () => ['Todas', ...new Set(ofertas.map(o => o.empresas?.ubicacion).filter(Boolean))];

    // Aplicar filtros
    const ofertasZ = ofertas.filter(o => {
        // Keyword filter
        if (filtros.palabraClave) {
            const qw = filtros.palabraClave.toLowerCase().trim();
            const title = (o.titulo || '').toLowerCase();
            const desc = (o.descripcion || '').toLowerCase();
            const empName = (o.empresas?.nombre || '').toLowerCase();
            const mod = (o.modalidad || '').toLowerCase();
            const loc = (o.empresas?.ubicacion || '').toLowerCase();
            
            const hasSkillMatch = (o.oferta_skills || []).some(sk => {
                const skName = (sk.nombre_original || sk.diccionario_skills?.nombre_skill || '').toLowerCase();
                return skName.includes(qw);
            });

            if (!title.includes(qw) && !desc.includes(qw) && !empName.includes(qw) && !mod.includes(qw) && !loc.includes(qw) && !hasSkillMatch) {
                return false;
            }
        }

        // Location text filter from Landing Page
        if (filtros.ubicacionTexto) {
             const locText = filtros.ubicacionTexto.toLowerCase().trim();
             const empLoc = (o.empresas?.ubicacion || '').toLowerCase();
             const modalidad = (o.modalidad || '').toLowerCase();
             if (!empLoc.includes(locText) && !modalidad.includes(locText)) {
                 return false;
             }
        }

        if (filtros.ubicacion !== 'Todas' && o.empresas?.ubicacion !== filtros.ubicacion) return false;
        
        const isCualquierModalidadFalse = !filtros.modalidad.Remoto && !filtros.modalidad.Híbrido && !filtros.modalidad.Presencial;
        if (!isCualquierModalidadFalse) {
            if (!filtros.modalidad[o.modalidad]) return false;
        }

        if (filtros.minMatch > 0 && o.porcentajeMatch < filtros.minMatch) {
            return false;
        }

        // Ocultar automáticamente si no se alcanza el porcentaje_match_minimo de la oferta
        if (o.porcentaje_match_minimo > 0 && o.porcentajeMatch < o.porcentaje_match_minimo) {
            return false;
        }

        return true;
    });

    // Paginación y Ordenamiento seguros (ofertas destacadas primero)
    const ofertasOrdenadas = [...ofertasZ].sort((a, b) => {
        // Boost: ofertas destacadas activas van primero
        const now = new Date();
        const aIsBoosted = a.destacada && a.destacada_hasta && new Date(a.destacada_hasta) > now ? 1 : 0;
        const bIsBoosted = b.destacada && b.destacada_hasta && new Date(b.destacada_hasta) > now ? 1 : 0;
        if (bIsBoosted !== aIsBoosted) return bIsBoosted - aIsBoosted;

        if (ordenamiento === 'Mejor Match') return b.porcentajeMatch - a.porcentajeMatch;
        if (ordenamiento === 'Más recientes') return new Date(b.creada_en) - new Date(a.creada_en);
        if (ordenamiento === 'Más antiguas') return new Date(a.creada_en) - new Date(b.creada_en);
        return 0;
    });

    const ITEMS_PER_PAGE = 12;
    const totalPages = Math.ceil(ofertasOrdenadas.length / ITEMS_PER_PAGE) || 1;
    const paginaSegura = paginaActual > totalPages ? totalPages : paginaActual;
    const ofertasPaginadas = ofertasOrdenadas.slice((paginaSegura - 1) * ITEMS_PER_PAGE, paginaSegura * ITEMS_PER_PAGE);

    // Cuando cambia un filtro o el ordenamiento, volvemos a la pagina 1
    useEffect(() => {
        setPaginaActual(1);
    }, [filtros, ordenamiento]);



    return (
        <div style={{ background: '#FAFAFB', minHeight: 'calc(100vh - 70px)', padding: '2rem 1rem' }}>
            <div className="ofertas-container" style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Botón de Hamburguesa para Filtros en Mobile */}
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="filter-toggle-btn"
                    style={{
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        background: 'white',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                        color: 'var(--text-dark)',
                        cursor: 'pointer',
                        marginBottom: '1rem',
                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                    }}
                >
                    <Filter size={18} /> {showMobileFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'}
                </button>

                {/* FILTROS LATERALES */}
                <aside 
                    className={`ofertas-sidebar ${showMobileFilters ? 'mobile-visible' : ''}`}
                    style={{ flex: '1 1 260px', maxWidth: '300px', background: 'white', padding: '1.8rem', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.05)' }}
                >
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--text-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Filter size={20} color="var(--primary)" /> Filtros
                    </h3>

                    {(filtros.palabraClave || filtros.ubicacionTexto) && (
                        <div style={{ marginBottom: '1.5rem', padding: '10px 12px', background: '#eef2ff', borderRadius: '10px', border: '1px solid #c7d2fe' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#4338ca', uppercase: 'true' }}>Filtro Activo:</span>
                            {filtros.palabraClave && <div style={{ fontSize: '0.9rem', color: '#333' }}>Buscar: <strong>"{filtros.palabraClave}"</strong></div>}
                            {filtros.ubicacionTexto && <div style={{ fontSize: '0.9rem', color: '#333' }}>Lugar: <strong>{filtros.ubicacionTexto}</strong></div>}
                            <button 
                                onClick={() => setFiltros({...filtros, palabraClave: '', ubicacionTexto: ''})} 
                                style={{ marginTop: '8px', fontSize: '0.8rem', color: '#0084FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>
                                Limpiar Búsqueda
                            </button>
                        </div>
                    )}

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', color: '#444', fontWeight: 'bold', marginBottom: '10px' }}>
                            <Sparkles size={16} color="var(--primary)" /> Match Mínimo deseado
                        </label>
                        <select 
                            value={filtros.minMatch} 
                            onChange={e => setFiltros({...filtros, minMatch: Number(e.target.value)})}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', background: 'white', fontWeight: '600', color: 'var(--primary)' }}
                        >
                            <option value={0}>Todas las Ofertas (0%+)</option>
                            <option value={30}>Básico (Match ≥ 30%)</option>
                            <option value={50}>Medio (Match ≥ 50%)</option>
                            <option value={70}>Alto (Match ≥ 70%)</option>
                            <option value={85}>Excelente (Match ≥ 85%)</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 'bold', marginBottom: '10px' }}>Ubicación</label>
                        <select 
                            value={filtros.ubicacion} 
                            onChange={e => setFiltros({...filtros, ubicacion: e.target.value})}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', background: 'white' }}
                        >
                            {getUbicacionesUnicas().map(ub => <option key={ub} value={ub}>{ub}</option>)}
                        </select>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 'bold', marginBottom: '10px' }}>Modalidad</label>
                        {['Remoto', 'Híbrido', 'Presencial'].map(mod => (
                            <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.95rem', color: '#444', cursor: 'pointer' }}>
                                <input type="checkbox" checked={filtros.modalidad[mod]} onChange={() => toggleFilter('modalidad', mod)} style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                                {mod}
                            </label>
                        ))}
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 'bold', marginBottom: '10px' }}>Ordenar por</label>
                        <select 
                            value={ordenamiento}
                            onChange={(e) => setOrdenamiento(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', background: 'white' }}
                        >
                            <option>Mejor Match</option>
                            <option>Más recientes</option>
                            <option>Más antiguas</option>
                        </select>
                    </div>


                    <div>
                        <label style={{ display: 'block', fontSize: '0.9rem', color: '#666', fontWeight: 'bold', marginBottom: '10px' }}>Rubro</label>
                        <select style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', background: 'white' }}>
                            <option>Todos los rubros</option>
                            <option>Tecnología</option>
                            <option>Finanzas</option>
                        </select>
                    </div>

                    {candidatoData && !candidatoData.es_premium && (
                        <div style={{
                            marginTop: '2rem',
                            background: 'linear-gradient(135deg, #102C21 0%, #1A4635 100%)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            color: 'white',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 10px 25px rgba(16,44,33,0.2)'
                        }}>
                            {/* Decorative glowing element */}
                            <div style={{
                                position: 'absolute',
                                right: '-20px',
                                top: '-20px',
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'rgba(0, 214, 107, 0.15)',
                                filter: 'blur(10px)'
                            }} />

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Sparkles size={20} color="#FF9D42" fill="#FF9D42" />
                                <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#FF9D42', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                    EmpleaT Premium
                                </span>
                            </div>

                            <h4 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px', lineHeight: '1.3' }}>
                                ¿Quieres conseguir trabajo 3 veces más rápido?
                            </h4>
                            
                            <p style={{ fontSize: '0.85rem', color: '#A3C7B5', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                                Practica entrevistas con IA personalizadas para cada oferta y obtén feedback instantáneo.
                            </p>

                            <button
                                onClick={() => navigate('/pricing')}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'linear-gradient(90deg, #FFB020 0%, #FF9800 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '10px',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(255,152,0,0.3)',
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    zIndex: 1
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <Zap size={14} fill="white" /> Ser Premium
                            </button>
                        </div>
                    )}
                </aside>

                {/* LISTA DE OFERTAS */}
                <main className="ofertas-main" style={{ flex: 1, minWidth: '0' }}>
                    {loading ? (
                        <div className="skeleton" style={{ width: '150px', height: '18px', marginBottom: '1.5rem', borderRadius: '4px' }} />
                    ) : (
                        <div style={{ marginBottom: '1.5rem', color: '#888', fontSize: '0.95rem' }}>
                            {ofertasOrdenadas.length} empleos encontrados
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {loading ? (
                            Array.from({ length: 4 }).map((_, idx) => (
                                <OfertaCardSkeleton key={idx} />
                            ))
                        ) : (
                            <>
                                {ofertasPaginadas.map(oferta => {
                            const matchColor = oferta.porcentajeMatch >= 75 ? '#00d66b' : (oferta.porcentajeMatch >= 40 ? '#FFB020' : '#d32f2f');
                             const isExpanded = expandedOferta === oferta.id;
                             const yaPostulado = !!postulacionesMap[oferta.id];
                             const boostEstado = postulacionesMap[oferta.id]?.match_boost_estado || 'pendiente';
                             const finalMatch = boostEstado === 'aprobado' ? Math.min(100, oferta.porcentajeMatch + 5) : oferta.porcentajeMatch;
                             const isOfertaDestacada = oferta.destacada && oferta.destacada_hasta && new Date(oferta.destacada_hasta) > new Date();
                             
                             // Extrae la primera letra de la empresa
                             const empLetra = (oferta.empresas?.nombre || 'E').charAt(0).toUpperCase();

                            return (
                                <div key={oferta.id} 
                                    onClick={() => {
                                        const wasExpanded = expandedOferta === oferta.id;
                                        setExpandedOferta(wasExpanded ? null : oferta.id);
                                        // Incrementar vista solo una vez por sesión al expandir
                                        if (!wasExpanded && !viewedOffersRef.current.has(oferta.id)) {
                                            viewedOffersRef.current.add(oferta.id);
                                            supabase.rpc('increment_vista_oferta', { p_oferta_id: oferta.id }).catch(() => {});
                                        }
                                    }}
                                    style={{ 
                                        background: isOfertaDestacada ? 'linear-gradient(135deg, #FFFDF5 0%, #FFFFFF 100%)' : 'white', 
                                        borderRadius: '12px', 
                                        border: `1px solid ${isOfertaDestacada ? 'rgba(255,176,32,0.4)' : (isExpanded ? 'var(--primary)' : '#EAEAEA')}`,
                                        padding: '1.5rem',
                                        boxShadow: isOfertaDestacada ? '0 4px 20px rgba(255,176,32,0.08)' : (isExpanded ? '0 8px 30px rgba(0,214,107,0.08)' : '0 2px 10px rgba(0,0,0,0.02)'),
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        position: 'relative'
                                    }}>
                                    {/* Boost Badge */}
                                    {isOfertaDestacada && (
                                        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'linear-gradient(90deg, #FFB020, #FF9800)', color: 'white', padding: '3px 10px', borderRadius: '8px', fontSize: '0.72rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', boxShadow: '0 2px 8px rgba(255,176,32,0.3)' }}>
                                            <Zap size={12} fill="white" /> Destacada
                                        </div>
                                    )}
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flex: 1 }}>
                                            {/* Circulo Inicial de Empresa */}
                                            <div style={{ width: '56px', height: '56px', background: '#F0F9F4', color: '#00B159', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', flexShrink: 0, overflow: 'hidden' }}>
                                                {oferta.empresas?.logo_url ? (
                                                    <img src={oferta.empresas.logo_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#ffffff', padding: '4px', boxSizing: 'border-box' }} />
                                                ) : (
                                                    empLetra
                                                )}
                                            </div>
                                                        {/* Info Basica */}
                                            <div style={{ flex: 1, minWidth: '0' }}>
                                                <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#222' }}>{oferta.titulo}</h3>
                                                
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px', color: '#666', fontSize: '0.95rem' }}>
                                                    <span style={{ fontWeight: '600', color: '#333' }}>{oferta.nombre_empresa_custom || oferta.empresas?.nombre}</span>
                                                    <span>•</span>
                                                    <span style={{ background: '#EAF9F1', color: '#00B159', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '500' }}>{oferta.modalidad}</span>
                                                    
                                                    {(oferta.modalidad === 'Presencial' || oferta.modalidad === 'Híbrido') && (
                                                        <>
                                                            <span>•</span>
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                                <MapPin size={12} />
                                                                {oferta.ciudad || oferta.empresas?.ubicacion || 'Ubicación a acordar'}
                                                            </span>
                                                        </>
                                                    )}
                                                    
                                                    {(oferta.seniority && oferta.seniority !== 'Indistinto') && (
                                                        <>
                                                            <span>•</span>
                                                            <span style={{ background: '#FFF4E5', color: '#E68A00', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                                                                {oferta.seniority}
                                                            </span>
                                                        </>
                                                    )}
                                                    
                                                    {(oferta.salario_min_usd > 0) && (
                                                        <>
                                                            <span>•</span>
                                                            <span style={{ background: '#E6F7FF', color: '#0084FF', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
                                                                ${oferta.salario_min_usd.toLocaleString()} - {oferta.salario_max_usd ? `$${oferta.salario_max_usd.toLocaleString()} USD` : '+ USD'}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>

                                                {/* Motivational Badges */}
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {oferta.porcentaje_match_minimo > 0 && (
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(255, 165, 0, 0.2)' }}>
                                                            <Star size={12} fill="white" /> Match Mínimo ({oferta.porcentaje_match_minimo}%) Superado
                                                        </div>
                                                    )}
                                                    {finalMatch >= 80 && (
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'linear-gradient(90deg, #FFB020 0%, #FF9800 100%)', color: 'white', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(255, 176, 32, 0.2)' }}>
                                                            <Sparkles size={12} fill="white" /> Simulación IA
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Match y Boton */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <MatchBadge percentage={finalMatch} size={64} />
                                            </div>
                                            
                                            <button 
                                                style={{ 
                                                    background: yaPostulado ? '#EAF9F1' : 'var(--primary)', 
                                                    color: yaPostulado ? '#00B159' : 'white', 
                                                    padding: '10px 24px', 
                                                    borderRadius: '8px', 
                                                    border: 'none', 
                                                    fontWeight: 'bold',
                                                    fontSize: '0.95rem',
                                                    cursor: 'pointer',
                                                    boxShadow: yaPostulado ? 'none' : '0 4px 12px rgba(0,214,107,0.2)'
                                                }}
                                            >
                                                {yaPostulado ? 'Postulado' : 'Ver Mas'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* EXPANDIDO: Muestra Descripción Completa y Skills (Estilo primer foto) */}
                                    {isExpanded && (
                                        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #EAEAEA' }} onClick={e => e.stopPropagation()}>
                                            <p style={{ color: '#555', lineHeight: '1.6', fontSize: '1rem', whiteSpace: 'pre-line' }}>{oferta.descripcion}</p>
                                            
                                            <div style={{ marginTop: '1.5rem' }}>
                                                <h4 style={{ fontSize: '0.85rem', color: '#333', letterSpacing: '1px', marginBottom: '12px' }}>SKILLS COINCIDENTES:</h4>
                                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                    {(() => {
                                                        const matchingSkills = (oferta.oferta_skills || []).filter(sk => sk.isMatch);
                                                        if (matchingSkills.length === 0) {
                                                            return (
                                                                <span style={{ color: '#999', fontSize: '0.9rem', fontStyle: 'italic' }}>Sin coincidencias registradas aún con las skills de la oferta</span>
                                                            );
                                                        }
                                                        return matchingSkills.map(sk => {
                                                            const label = sk.nombre_original || sk.diccionario_skills?.nombre_skill || 'Skill';
                                                            return (
                                                                <span key={sk.skill_id} style={{ 
                                                                    padding: '6px 14px', 
                                                                    background: 'rgba(0,214,107,0.1)', 
                                                                    borderRadius: '8px', 
                                                                    fontSize: '0.9rem', 
                                                                    color: 'var(--primary)', 
                                                                    border: '1px solid rgba(0,214,107,0.25)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    <span style={{ fontSize: '1.1rem' }}>✓</span> {label}
                                                                </span>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>

                                            <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {!yaPostulado && (
                                                    <button 
                                                        onClick={(e) => handlePostularse(e, oferta.id, oferta.porcentajeMatch)}
                                                        disabled={applyingTo === oferta.id}
                                                        style={{ background: '#00d66b', color: 'white', padding: '14px 28px', borderRadius: '10px', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,214,107,0.3)', width: 'fit-content' }}
                                                    >
                                                        {applyingTo === oferta.id ? 'Cargando...' : 'Postularme Ahora'}
                                                    </button>
                                                )}

                                                {candidatoData?.es_premium && (
                                                    <div style={{
                                                        padding: '1.2rem',
                                                        background: yaPostulado 
                                                            ? (boostEstado === 'aprobado' 
                                                                ? 'linear-gradient(135deg, rgba(0,214,107,0.1) 0%, rgba(0,214,107,0.03) 100%)' 
                                                                : boostEstado === 'desaprobado' 
                                                                    ? 'rgba(211,47,47,0.03)' 
                                                                    : 'linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.03) 100%)')
                                                            : 'linear-gradient(135deg, rgba(255,215,0,0.06) 0%, rgba(255,215,0,0.02) 100%)',
                                                        borderRadius: '12px',
                                                        border: `1px solid ${yaPostulado 
                                                            ? (boostEstado === 'aprobado' ? 'rgba(0,214,107,0.3)' : boostEstado === 'desaprobado' ? '#eaeaea' : 'rgba(255,215,0,0.3)')
                                                            : 'rgba(255,215,0,0.2)'}`,
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        flexWrap: 'wrap',
                                                        gap: '1rem'
                                                    }}>
                                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                                            <h4 style={{ 
                                                                margin: '0 0 6px 0', 
                                                                fontSize: '1rem', 
                                                                color: !yaPostulado 
                                                                    ? '#D48800'
                                                                    : (boostEstado === 'aprobado' ? '#00b159' : boostEstado === 'desaprobado' ? '#555' : '#D48800'), 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                gap: '8px',
                                                                fontWeight: 'bold' 
                                                            }}>
                                                                <Zap size={18} fill={(!yaPostulado || boostEstado === 'aprobado') ? '#D48800' : boostEstado === 'desaprobado' ? 'none' : '#D48800'} color={!yaPostulado ? '#D48800' : (boostEstado === 'aprobado' ? '#00b159' : boostEstado === 'desaprobado' ? '#555' : '#D48800')} /> 
                                                                {!yaPostulado 
                                                                    ? 'Potenciador de Match Premium (+5%) Disponible'
                                                                    : (boostEstado === 'aprobado' 
                                                                        ? '¡Match Potenciado Exitosamente! (+5% Activo)' 
                                                                        : boostEstado === 'desaprobado' 
                                                                            ? 'Desafío de Match Finalizado' 
                                                                            : 'Potenciador de Match Premium (+5%)')}
                                                            </h4>
                                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#666', lineHeight: '1.4' }}>
                                                                {!yaPostulado 
                                                                    ? 'Postúlate primero a esta oferta para desbloquear el cuestionario de 3 preguntas de nivel medio y potenciar tu afinidad.'
                                                                    : (boostEstado === 'aprobado' 
                                                                        ? 'Tu afinidad final subió un 5%. Apareces más arriba en el panel de la empresa con la insignia de proactividad.' 
                                                                        : boostEstado === 'desaprobado' 
                                                                            ? 'Completaste el cuestionario de la oferta pero no obtuviste el boost. Tu postulación original sigue activa.' 
                                                                            : 'Demuestra tus conocimientos respondiendo 3 preguntas rápidas de nivel medio sobre los requisitos de esta oferta para destacar.')}
                                                            </p>
                                                        </div>
                                                        
                                                        {yaPostulado && boostEstado === 'pendiente' && (
                                                            <button
                                                                onClick={() => setBoostQuizModalFor(oferta)}
                                                                style={{
                                                                    background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 100%)',
                                                                    color: 'white',
                                                                    padding: '10px 20px',
                                                                    borderRadius: '8px',
                                                                    border: 'none',
                                                                    fontWeight: 'bold',
                                                                    fontSize: '0.9rem',
                                                                    cursor: 'pointer',
                                                                    boxShadow: '0 4px 12px rgba(255,165,0,0.3)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    transition: 'transform 0.2s'
                                                                }}
                                                            >
                                                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                    <Zap size={16} fill="white" /> Iniciar Desafío
                                                                </span>
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                {candidatoData?.es_premium && !yaPostulado && isFeatureActive(featureFlags, 'adaptacion_cv', false) && (
                                                    <div style={{
                                                        padding: '1.2rem',
                                                        background: 'linear-gradient(135deg, rgba(0, 214, 107, 0.08) 0%, rgba(0, 214, 107, 0.02) 100%)',
                                                        borderRadius: '12px',
                                                        border: '1px solid rgba(0, 214, 107, 0.15)',
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        flexWrap: 'wrap',
                                                        gap: '1rem'
                                                    }}>
                                                        <div style={{ flex: 1, minWidth: '200px' }}>
                                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                                                <Sparkles size={18} fill="var(--primary)" /> Adaptación de CV con IA Habilitada
                                                            </h4>
                                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: '1.4' }}>
                                                                Optimiza tu extracto y perfil profesional exclusivamente para esta vacante antes de postularte.
                                                            </p>
                                                        </div>
                                                        <button 
                                                            onClick={() => setAdaptarCvModalFor(oferta)}
                                                            style={{ 
                                                                background: 'var(--primary)', 
                                                                color: 'white', 
                                                                padding: '10px 20px', 
                                                                borderRadius: '8px', 
                                                                border: 'none', 
                                                                fontWeight: 'bold', 
                                                                fontSize: '0.9rem', 
                                                                cursor: 'pointer', 
                                                                boxShadow: '0 4px 12px rgba(0, 214, 107, 0.2)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '6px'
                                                            }}
                                                        >
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                                <Sparkles size={16} /> Adaptar CV
                                                            </span>
                                                        </button>
                                                    </div>
                                                )}

                                                <PremiumActionZone 
                                                    matchScore={finalMatch} 
                                                    isPremium={candidatoData?.es_premium} 
                                                    onSimulateClick={() => setShowInterviewModalFor({ ...oferta, porcentajeMatch: finalMatch })} 
                                                />

                                                <PremiumStats 
                                                    offerId={oferta.id}
                                                    candidatoId={candidatoId}
                                                    currentCandidateMatch={finalMatch}
                                                    currentOfferSalary={(oferta.salario_min_usd + (oferta.salario_max_usd || oferta.salario_min_usd)) / 2}
                                                    esPremium={candidatoData?.es_premium}
                                                    marketAvgSalary={marketAvgSalary}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}

                        {ofertasPaginadas.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#888', background: 'white', borderRadius: '12px', border: '1px dashed #ddd' }}>
                                No hay resultados con los filtros actuales.
                            </div>
                        )}
                            </>
                        )}
                        
                        {/* Controles de Paginación */}
                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '15px' }}>
                                <button 
                                    onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                                    disabled={paginaSegura === 1}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '8px',
                                        background: paginaSegura === 1 ? '#f5f5f5' : 'white', 
                                        border: '1px solid #ddd', color: paginaSegura === 1 ? '#aaa' : '#333',
                                        cursor: paginaSegura === 1 ? 'not-allowed' : 'pointer', transition: '0.2s', fontWeight: 'bold'
                                    }}
                                >
                                    <ChevronLeft size={18} style={{ marginRight: '5px' }} /> Anterior
                                </button>
                                
                                <span style={{ fontWeight: 'bold', color: '#555' }}>
                                    Página {paginaSegura} de {totalPages}
                                </span>
                                
                                <button 
                                    onClick={() => setPaginaActual(p => Math.min(totalPages, p + 1))}
                                    disabled={paginaSegura === totalPages}
                                    style={{ 
                                        display: 'flex', alignItems: 'center', padding: '8px 16px', borderRadius: '8px',
                                        background: paginaSegura === totalPages ? '#f5f5f5' : 'white', 
                                        border: '1px solid #ddd', color: paginaSegura === totalPages ? '#aaa' : '#333',
                                        cursor: paginaSegura === totalPages ? 'not-allowed' : 'pointer', transition: '0.2s', fontWeight: 'bold'
                                    }}
                                >
                                    Siguiente <ChevronRight size={18} style={{ marginLeft: '5px' }} />
                                </button>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {showInterviewModalFor && (
                <InterviewModal
                    candidatoId={candidatoId}
                    ofertaId={showInterviewModalFor.id}
                    porcentajeMatch={showInterviewModalFor.porcentajeMatch}
                    onClose={() => setShowInterviewModalFor(null)}
                />
            )}

            {boostQuizModalFor && (
                <BoostQuizModal
                    candidatoId={candidatoId}
                    oferta={boostQuizModalFor}
                    onClose={() => setBoostQuizModalFor(null)}
                    onSuccess={(nuevoEstado) => {
                        setPostulacionesMap(prev => ({
                            ...prev,
                            [boostQuizModalFor.id]: {
                                ...prev[boostQuizModalFor.id],
                                match_boost_estado: nuevoEstado
                            }
                        }));
                    }}
                />
            )}

            <AdaptarCvModal 
                isOpen={!!adaptarCvModalFor}
                onClose={() => setAdaptarCvModalFor(null)}
                candidatoId={candidatoId}
                ofertaId={adaptarCvModalFor?.id}
            />
        </div>
    );
}
