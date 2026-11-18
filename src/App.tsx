import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Database,
  ExternalLink,
  LoaderCircle,
  Orbit,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Telescope,
  Trash2,
  X,
} from 'lucide-react';
import { firebaseConfigured } from './firebaseConfig';
import type { Observation, ObservationDraft } from './services/observations';
import { loadBodies } from './services/bodies';
import type { SolarBody } from './types';

const bodyLabel = (body: SolarBody) => body.englishName || body.name || body.id;

type Page = 'explore' | 'journal';
type Filter = 'all' | 'planet' | 'moon' | 'other';

function BodyOrb({ body, index }: { body: SolarBody; index: number }) {
  const art = (index % 6) + 1;
  return (
    <div className={`body-stage art-${art}`} aria-hidden="true">
      <span className="body-orbit orbit-one" />
      <span className="body-orbit orbit-two" />
      <span className={`body-globe${body.id.toLowerCase() === 'saturn' ? ' has-rings' : ''}`} />
      <span className="body-spark spark-one" />
      <span className="body-spark spark-two" />
    </div>
  );
}

function ObservationDialog({
  record,
  initialBodyId,
  bodies,
  onClose,
  onSave,
}: {
  record: Observation | null;
  initialBodyId: string;
  bodies: SolarBody[];
  onClose: () => void;
  onSave: (draft: ObservationDraft, recordId?: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(record?.title ?? '');
  const [notes, setNotes] = useState(record?.notes ?? '');
  const [bodyId, setBodyId] = useState(record?.bodyId ?? initialBodyId ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const selectedBody = bodies.find((body) => body.id === bodyId);
  const selectedName = selectedBody ? bodyLabel(selectedBody) : record?.bodyName ?? '';

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = bodies.find((body) => body.id === bodyId);
    const savedBodyName = chosen ? bodyLabel(chosen) : record?.bodyName;
    if (!title.trim()) {
      setError('O título não pode conter apenas espaços.');
      return;
    }
    if (!bodyId || !savedBodyName) {
      setError('Escolha um corpo celeste listado pela API antes de salvar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        notes: notes.trim(),
        bodyId,
        bodyName: savedBodyName,
        bodyType: chosen?.bodyType || record?.bodyType || 'Corpo celeste',
      }, record?.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível salvar sua observação.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="observation-modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <div className="modal-head">
          <div className="modal-emblem"><BookOpen size={19} /></div>
          <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Fechar formulário"><X size={19} /></button>
          <p className="eyebrow">CADERNO DE CAMPO</p>
          <h2 id="dialog-title">{record ? 'Editar observação' : 'Nova observação'}</h2>
          <p className="modal-subtitle">Guarde uma descoberta para encontrar de novo quando quiser.</p>
        </div>
        <form onSubmit={submit} className="observation-form">
          <label htmlFor="body-select">Corpo celeste <span>obrigatório</span></label>
          <div className="select-wrap">
            <select id="body-select" required value={bodyId} onChange={(event) => setBodyId(event.target.value)}>
              <option value="" disabled>Selecione um objeto da API</option>
              {record && !bodies.some((body) => body.id === record.bodyId) && (
                <option value={record.bodyId}>{selectedName || record.bodyId}</option>
              )}
              {bodies.map((body) => <option value={body.id} key={body.id}>{bodyLabel(body)}{body.bodyType ? ` · ${body.bodyType}` : ''}</option>)}
            </select>
            <ChevronDown size={16} aria-hidden="true" />
          </div>
          <label htmlFor="observation-title">Título <span>obrigatório</span></label>
          <input id="observation-title" required maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ex.: Júpiter em oposição" />
          <div className="label-row"><label htmlFor="observation-notes">Anotações</label><span className="counter">{notes.length}/500</span></div>
          <textarea id="observation-notes" rows={4} maxLength={500} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="O que você quer lembrar sobre esta observação?" />
          {error && <p className="form-error"><CircleAlert size={15} />{error}</p>}
          {!bodies.length && !record && <p className="form-helper">A API ainda não disponibilizou corpos celestes para associar. Configure o token e tente novamente.</p>}
          <div className="modal-actions">
            <button type="button" className="button button-quiet" onClick={onClose}>Cancelar</button>
            <button type="submit" className="button button-primary" disabled={saving || (!bodies.length && !record)}>
              {saving ? <LoaderCircle className="spin" size={16} /> : <Send size={15} />}
              {saving ? 'Salvando…' : record ? 'Salvar alterações' : 'Guardar no caderno'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function App() {
  const [page, setPage] = useState<Page>('explore');
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [bodies, setBodies] = useState<SolarBody[]>([]);
  const [apiLoading, setApiLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [uid, setUid] = useState<string | null>(null);
  const [firebaseState, setFirebaseState] = useState<'loading' | 'connected' | 'missing' | 'error'>(firebaseConfigured ? 'loading' : 'missing');
  const [firebaseError, setFirebaseError] = useState('');
  const [records, setRecords] = useState<Observation[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Observation | null>(null);
  const [newBodyId, setNewBodyId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Observation | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null);

  async function refreshBodies() {
    setApiLoading(true);
    setApiError('');
    try {
      const response = await loadBodies();
      setBodies(response.bodies);
    } catch (reason) {
      setApiError(reason instanceof Error ? reason.message : 'Não foi possível consultar a API agora.');
      setBodies([]);
    } finally {
      setApiLoading(false);
    }
  }

  useEffect(() => { void refreshBodies(); }, []);

  useEffect(() => {
    if (!firebaseConfigured) {
      setFirebaseState('missing');
      setRecordsLoading(false);
      return;
    }
    let active = true;
    let stopAuth: (() => void) | undefined;
    void Promise.all([import('firebase/auth'), import('./firebase')]).then(([authSdk, client]) => {
      if (!active) return;
      const firebaseAuth = client.auth;
      if (!firebaseAuth) {
        setFirebaseState('missing');
        setRecordsLoading(false);
        return;
      }
      stopAuth = authSdk.onAuthStateChanged(firebaseAuth, async (user) => {
        if (!active) return;
        if (user) {
          setUid(user.uid);
          setFirebaseState('connected');
          setFirebaseError('');
          return;
        }
        try {
          await authSdk.signInAnonymously(firebaseAuth);
        } catch (reason) {
          setFirebaseState('error');
          setFirebaseError(reason instanceof Error ? reason.message : 'Não foi possível iniciar a sessão anônima.');
          setRecordsLoading(false);
        }
      });
    }).catch((reason) => {
      if (!active) return;
      setFirebaseState('error');
      setFirebaseError(reason instanceof Error ? reason.message : 'Não foi possível conectar ao Firebase.');
      setRecordsLoading(false);
    });
    return () => { active = false; stopAuth?.(); };
  }, []);

  useEffect(() => {
    if (!uid) return;
    let active = true;
    let stopRecords: (() => void) | undefined;
    setRecordsLoading(true);
    void import('./services/observations').then(({ subscribeObservations }) => {
      if (!active) return;
      stopRecords = subscribeObservations(uid, (items) => {
        setRecords(items);
        setRecordsLoading(false);
        setFirebaseState('connected');
        setFirebaseError('');
      }, (error) => {
        setFirebaseState('error');
        setFirebaseError(error.message);
        setRecordsLoading(false);
      });
    }).catch((reason) => {
      if (!active) return;
      setFirebaseState('error');
      setFirebaseError(reason instanceof Error ? reason.message : 'Não foi possível abrir o caderno.');
      setRecordsLoading(false);
    });
    return () => { active = false; stopRecords?.(); };
  }, [uid]);

  const planets = useMemo(() => bodies.filter((body) => body.isPlanet), [bodies]);
  const moonsCount = useMemo(() => bodies.filter((body) => body.bodyType?.toLowerCase() === 'moon').length, [bodies]);
  const filteredBodies = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('pt-BR');
    return bodies.filter((body) => {
      const matchesSearch = !query || `${bodyLabel(body)} ${body.name ?? ''} ${body.bodyType ?? ''}`.toLocaleLowerCase('pt-BR').includes(query);
      const type = body.bodyType?.toLowerCase() ?? '';
      const matchesFilter = filter === 'all' || (filter === 'planet' && body.isPlanet) || (filter === 'moon' && type === 'moon') || (filter === 'other' && !body.isPlanet && type !== 'moon');
      return matchesSearch && matchesFilter;
    });
  }, [bodies, filter, search]);

  function openNew(bodyId = '') {
    setEditingRecord(null);
    setNewBodyId(bodyId);
    setNotice(null);
    setDialogOpen(true);
  }

  function openEdit(record: Observation) {
    setEditingRecord(record);
    setNewBodyId(record.bodyId);
    setNotice(null);
    setDialogOpen(true);
  }

  async function saveRecord(draft: ObservationDraft, recordId?: string) {
    if (!uid) throw new Error(firebaseError || 'Conecte o Firebase para salvar observações no Firestore.');
    const service = await import('./services/observations');
    if (recordId) await service.updateObservation(uid, recordId, draft);
    else await service.createObservation(uid, draft);
    setDialogOpen(false);
    setNotice({ text: recordId ? 'Observação atualizada no Firestore.' : 'Observação guardada no Firestore.' });
    window.setTimeout(() => setNotice(null), 4200);
  }

  async function confirmDelete() {
    if (!deleteTarget || !uid) return;
    setDeleteBusy(true);
    try {
      const service = await import('./services/observations');
      await service.removeObservation(uid, deleteTarget.id);
      setNotice({ text: 'Observação removida do Firestore.' });
      window.setTimeout(() => setNotice(null), 4200);
      setDeleteTarget(null);
    } catch (reason) {
      setNotice({ text: reason instanceof Error ? reason.message : 'Não foi possível remover o registro.', error: true });
    } finally {
      setDeleteBusy(false);
    }
  }

  const initials = firebaseState === 'connected' ? 'OC' : '—';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => setPage('explore')} aria-label="Ir para o início do Órbita">
          <span className="brand-mark"><Orbit size={20} strokeWidth={1.8} /></span>
          <span className="brand-word">ÓRBITA<span className="brand-period">.</span><small>OBSERVATÓRIO PESSOAL</small></span>
        </button>
        <div className="side-caption">ESPAÇO DE TRABALHO</div>
        <nav className="side-nav" aria-label="Navegação principal">
          <button className={`nav-item${page === 'explore' ? ' active' : ''}`} onClick={() => setPage('explore')}>
            <Telescope size={18} /><span>Explorar</span><ChevronRight className="nav-arrow" size={15} />
          </button>
          <button className={`nav-item${page === 'journal' ? ' active' : ''}`} onClick={() => setPage('journal')}>
            <BookOpen size={18} /><span>Meu caderno</span><span className="nav-count">{records.length}</span>
          </button>
        </nav>
        <div className="side-divider" />
        <div className="side-caption">NO SEU RADAR</div>
        <div className="sidebar-stats">
          <div className="side-stat"><span className="stat-dot dot-lilac" /><span>Planetas</span><strong>{planets.length || '—'}</strong></div>
          <div className="side-stat"><span className="stat-dot dot-mint" /><span>Satélites</span><strong>{bodies.length ? moonsCount : '—'}</strong></div>
          <div className="side-stat"><span className="stat-dot dot-peach" /><span>Observações</span><strong>{records.length}</strong></div>
        </div>
        <div className="sidebar-spacer" />
        <div className={`connection-card ${firebaseState}`}>
          <div className="connection-card-head"><span className="connection-light" />{firebaseState === 'connected' ? 'Sincronizado' : firebaseState === 'loading' ? 'Conectando' : 'Conexão pendente'}</div>
          <p>{firebaseState === 'connected' ? 'Seu caderno está guardado com segurança no Firestore.' : firebaseState === 'loading' ? 'Abrindo seu observatório…' : 'Configure o Firebase para ativar seu caderno.'}</p>
          <div className="connection-person"><span className="person-avatar">{initials}</span><span>Observador anônimo<small>{firebaseState === 'connected' ? 'Sessão segura' : 'Modo pessoal'}</small></span><ChevronDown size={15} /></div>
        </div>
        <p className="sidebar-foot">UMA JANELA PARA O COSMOS <span>v1.0</span></p>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb"><span>Órbita</span><ChevronRight size={14} /><strong>{page === 'explore' ? 'Exploração' : 'Meu caderno'}</strong></div>
          <div className="topbar-right">
            <div className="live-indicator"><span /> SISTEMA AO VIVO</div>
            <button className="top-avatar" type="button" title="Observador anônimo">{initials}</button>
          </div>
        </header>

        <div className="page-content">
          {notice && <div className={`notice ${notice.error ? 'notice-error' : ''}`} role="status"><Check size={16} />{notice.text}<button type="button" aria-label="Dispensar mensagem" onClick={() => setNotice(null)}><X size={15} /></button></div>}

          {page === 'explore' ? (
            <>
              <section className="hero-panel">
                <div className="hero-copy">
                  <div className="hero-kicker"><span className="kicker-line" /> SEU OBSERVATÓRIO DIGITAL</div>
                  <h1>O universo inteiro<br />no seu <span>radar.</span></h1>
                  <p>Descubra o que orbita por aí. Salve o que chama sua atenção.</p>
                  <div className="hero-actions">
                    <button className="button button-primary" onClick={() => openNew()}><Plus size={17} />Nova observação</button>
                    <button className="text-link" onClick={() => document.getElementById('corpos')?.scrollIntoView({ behavior: 'smooth' })}>Explorar objetos <ArrowRight size={15} /></button>
                  </div>
                  <div className="hero-footnote"><Sparkles size={14} /> Dados astronômicos atualizados pela API Le Système Solaire</div>
                </div>
                <div className="hero-graphic" aria-hidden="true">
                  <div className="hero-coordinate coord-a">SOL · 01</div><div className="hero-coordinate coord-b">18° 32′ 14″</div>
                  <div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" /><div className="hero-orbit orbit-c" />
                  <div className="hero-sun"><span /></div>
                  <span className="hero-planet planet-01" /><span className="hero-planet planet-02" /><span className="hero-planet planet-03" /><span className="hero-planet planet-04" />
                  <span className="hero-star star-01">✦</span><span className="hero-star star-02">·</span><span className="hero-star star-03">✧</span><span className="hero-star star-04">·</span>
                  <div className="hero-orbit-label label-a">TERRA</div><div className="hero-orbit-label label-b">JÚPITER</div>
                </div>
                <div className="hero-index">01 <span>/</span> 08</div>
              </section>

              <section className="metrics-row" aria-label="Resumo do sistema">
                <div className="metric-item"><div className="metric-icon icon-orbit"><Orbit size={17} /></div><div><span>OBJETOS NA API</span><strong>{apiLoading ? '···' : apiError ? '—' : bodies.length.toLocaleString('pt-BR')}</strong></div><small>no catálogo</small></div>
                <div className="metric-rule" />
                <div className="metric-item"><div className="metric-icon icon-mint"><Sparkles size={17} /></div><div><span>PLANETAS</span><strong>{apiLoading ? '···' : apiError ? '—' : planets.length.toLocaleString('pt-BR')}</strong></div><small>confirmados</small></div>
                <div className="metric-rule" />
                <div className="metric-item"><div className="metric-icon icon-peach"><BookOpen size={17} /></div><div><span>NO SEU CADERNO</span><strong>{recordsLoading ? '···' : records.length.toLocaleString('pt-BR')}</strong></div><small>suas observações</small></div>
                <div className="data-source"><span className="data-pulse" /> DADOS AO VIVO <ArrowUpRight size={13} /></div>
              </section>

              {(apiError || firebaseState === 'missing' || firebaseState === 'error') && (
                <section className="setup-banner">
                  <div className="setup-banner-icon"><CircleAlert size={18} /></div>
                  <div className="setup-banner-copy">
                    <strong>{apiError ? 'Falta conectar a API ou revisar seu token' : 'Conecte o Firebase para ativar o CRUD'}</strong>
                    <span>{apiError || firebaseError || 'Configure VITE_FIREBASE_* e ative Authentication anônima no Firebase Console.'}</span>
                  </div>
                  {apiError && <a href="https://api.le-systeme-solaire.net/generatekey.html" target="_blank" rel="noreferrer">Obter token <ExternalLink size={14} /></a>}
                  {!apiError && <span className="setup-hint">Consulte README.md</span>}
                </section>
              )}

              <section className="catalog-section" id="corpos">
                <div className="section-heading">
                  <div><p className="eyebrow">MAPA CELESTE</p><h2>Explore o Sistema Solar</h2><p className="section-subtitle">Corpos celestes direto da fonte. Toque em um para registrar sua descoberta.</p></div>
                  <button className="refresh-button" type="button" onClick={() => void refreshBodies()} disabled={apiLoading} aria-label="Atualizar catálogo"><RefreshCw className={apiLoading ? 'spin' : ''} size={16} /> Atualizar</button>
                </div>

                <div className="catalog-controls">
                  <div className="search-box"><Search size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar um planeta, lua ou objeto…" aria-label="Buscar corpos celestes" /><kbd>⌘ K</kbd></div>
                  <div className="filter-bar" aria-label="Filtros do catálogo">
                    <SlidersHorizontal size={16} />
                    {([
                      ['all', 'Todos'], ['planet', 'Planetas'], ['moon', 'Luas'], ['other', 'Outros'],
                    ] as [Filter, string][]).map(([key, label]) => <button key={key} className={filter === key ? 'filter-chip selected' : 'filter-chip'} onClick={() => setFilter(key)}>{label}</button>)}
                  </div>
                </div>

                {apiLoading ? (
                  <div className="state-panel"><LoaderCircle size={23} className="spin" /><strong>Alinhando os telescópios…</strong><span>Consultando a fonte pública de dados.</span></div>
                ) : apiError ? (
                  <div className="state-panel state-error"><div className="state-icon"><CircleAlert size={22} /></div><strong>O sinal ainda não chegou</strong><span>{apiError}</span><button className="button button-secondary" onClick={() => void refreshBodies()}><RefreshCw size={15} />Tentar de novo</button></div>
                ) : filteredBodies.length === 0 ? (
                  <div className="state-panel"><div className="state-icon"><Search size={20} /></div><strong>Nenhum corpo por aqui</strong><span>{bodies.length ? 'Tente outra busca ou filtro.' : 'A API não retornou corpos para esta consulta.'}</span></div>
                ) : (
                  <div className="body-grid">
                    {filteredBodies.map((body, index) => (
                      <article className="body-card" key={body.id}>
                        <div className="body-card-top"><span className="body-type">{body.bodyType || (body.isPlanet ? 'Planeta' : 'Corpo celeste')}</span><button className="card-add" type="button" aria-label={`Criar observação sobre ${bodyLabel(body)}`} onClick={() => openNew(body.id)}><Plus size={16} /></button></div>
                        <BodyOrb body={body} index={index} />
                        <div className="body-card-info">
                          <h3>{bodyLabel(body)}</h3><span className="body-id">{body.id.toUpperCase()}</span>
                          <div className="body-facts">
                            <span><i>RAIO MÉDIO</i><b>{body.meanRadius ? `${body.meanRadius.toLocaleString('pt-BR')} <small>km</small>` : '—'}</b></span>
                            <span><i>GRAVIDADE</i><b>{body.gravity ? `${body.gravity} <small>m/s²</small>` : '—'}</b></span>
                          </div>
                          <button className="card-action" type="button" onClick={() => openNew(body.id)}>Adicionar ao caderno <ArrowUpRight size={14} /></button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
                <div className="catalog-foot"><span><span className="data-pulse" /> FONTE: LE SYSTÈME SOLAIRE</span><span>Mostrando {filteredBodies.length} de {bodies.length} objetos</span></div>
              </section>

              {records.length > 0 && <section className="recent-section">
                <div className="section-heading compact-heading"><div><p className="eyebrow">SEU REGISTRO PESSOAL</p><h2>Observações recentes</h2></div><button className="text-link" onClick={() => setPage('journal')}>Abrir caderno <ArrowRight size={15} /></button></div>
                <div className="recent-row">{records.slice(0, 3).map((record) => <button className="recent-card" key={record.id} type="button" onClick={() => openEdit(record)}><span className="recent-moon"><Orbit size={17} /></span><span><strong>{record.title}</strong><small>{record.bodyName}</small></span><ArrowUpRight size={15} /></button>)}</div>
              </section>}
            </>
          ) : (
            <section className="journal-page">
              <div className="journal-hero">
                <div><p className="eyebrow"><span className="kicker-line" /> ARQUIVO PESSOAL</p><h1>Meu caderno<span>.</span></h1><p>Pequenas descobertas. Um universo de lembranças.</p></div>
                <div className="journal-orbit" aria-hidden="true"><span /><Orbit size={39} strokeWidth={1} /></div>
              </div>
              <div className="journal-toolbar"><div><span className="eyebrow">{records.length.toString().padStart(2, '0')} REGISTROS</span><h2>Suas observações</h2></div><button className="button button-primary" onClick={() => openNew()}><Plus size={17} />Nova observação</button></div>
              {firebaseState === 'missing' && <div className="journal-warning"><Database size={17} /><span>Conecte o Firebase para criar e consultar registros persistentes. Configure as variáveis `VITE_FIREBASE_*` e as regras em `firestore.rules`.</span></div>}
              {firebaseState === 'error' && <div className="journal-warning warning-error"><CircleAlert size={17} /><span>{firebaseError || 'O Firestore não conseguiu abrir este caderno. Revise suas regras e tente novamente.'}</span></div>}
              {recordsLoading ? <div className="state-panel"><LoaderCircle size={22} className="spin" /><strong>Carregando seu caderno…</strong></div> : !records.length ? (
                <div className="empty-journal"><div className="empty-orbit"><BookOpen size={24} /></div><p className="eyebrow">PÁGINA EM BRANCO</p><h3>Uma descoberta merece ser guardada.</h3><p>Crie uma observação e associe-a a um corpo celeste consultado na API.</p><button className="button button-primary" onClick={() => openNew()} disabled={firebaseState !== 'connected'}><Plus size={16} />Escrever primeira observação</button></div>
              ) : (
                <div className="journal-list">{records.map((record, index) => (
                  <article className="journal-record" key={record.id}>
                    <div className={`record-orb art-${(index % 6) + 1}`}><Orbit size={20} /></div>
                    <div className="record-main"><div className="record-meta"><span>{record.bodyName}</span><i />{record.bodyType}<i />{record.createdAt ? record.createdAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'agora mesmo'}</div><h3>{record.title}</h3><p>{record.notes || 'Sem anotações adicionais.'}</p></div>
                    <div className="record-actions"><button className="icon-button" type="button" onClick={() => openEdit(record)} aria-label={`Editar ${record.title}`}><Pencil size={16} /></button><button className="icon-button danger-icon" type="button" onClick={() => setDeleteTarget(record)} aria-label={`Excluir ${record.title}`}><Trash2 size={16} /></button></div>
                  </article>
                ))}</div>
              )}
            </section>
          )}
          <footer className="page-footer"><span>ÓRBITA © 2026</span><span>DESENVOLVIDO PARA EXPLORAR MAIS</span><button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>VOLTAR AO TOPO <ArrowDownRight size={13} /></button></footer>
        </div>
      </main>

      {dialogOpen && <ObservationDialog key={editingRecord?.id ?? `new-${newBodyId}`} record={editingRecord} initialBodyId={newBodyId} bodies={bodies} onClose={() => setDialogOpen(false)} onSave={saveRecord} />}
      {deleteTarget && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !deleteBusy && setDeleteTarget(null)}><section className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title"><button className="icon-button modal-close" type="button" onClick={() => setDeleteTarget(null)} aria-label="Fechar"><X size={18} /></button><div className="confirm-icon"><Trash2 size={19} /></div><p className="eyebrow">REMOVER REGISTRO</p><h2 id="delete-title">Excluir esta observação?</h2><p><strong>{deleteTarget.title}</strong> será removida do seu caderno. Esta ação não pode ser desfeita.</p><div className="modal-actions"><button className="button button-quiet" type="button" onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>Manter observação</button><button className="button button-danger" type="button" onClick={() => void confirmDelete()} disabled={deleteBusy}>{deleteBusy ? <LoaderCircle className="spin" size={16} /> : <Trash2 size={15} />}{deleteBusy ? 'Removendo…' : 'Excluir registro'}</button></div></section></div>}
    </div>
  );
}

export default App;
