import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { club, demoUpdates, gallery, navigation } from './data/content';
import './styles.css';

const Crest3D = lazy(() => import('./components/Crest3D'));
const crestUrl = `${import.meta.env.BASE_URL}crest.png`;
const arenaIllustrationUrl = `${import.meta.env.BASE_URL}arena-illustrative.webp`;
const footballIllustrationUrl = `${import.meta.env.BASE_URL}football-illustrative.webp`;

function BrandMark({ className = '' }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={`brand-mark ${className}`} aria-label="Emblema do Santo Alberto">
      {failed ? <span className="brand-mark-fallback">GSA</span> : <img src={crestUrl} alt="" onError={() => setFailed(true)} />}
    </span>
  );
}

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return <span aria-hidden="true" className="arrow-icon">{diagonal ? '↗' : '→'}</span>;
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuCloseRef = useRef<HTMLButtonElement>(null);
  const dragStartRef = useRef<number | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        setScrollProgress(maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0);
        setCompact(window.scrollY > 90);
      });
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    const sections = document.querySelectorAll<HTMLElement>('main section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -45% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const menuButton = menuButtonRef.current;
    document.body.style.overflow = 'hidden';
    menuCloseRef.current?.focus();
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
      if (event.key === 'Tab') {
        const focusables = Array.from(document.querySelectorAll<HTMLElement>('#mobile-menu button, #mobile-menu a'));
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      document.body.style.overflow = previousOverflow;
      menuButton?.focus();
    };
  }, [menuOpen]);

  function moveGallery(index: number) {
    const nextIndex = Math.max(0, Math.min(index, gallery.length - 1));
    setGalleryIndex(nextIndex);
    galleryRef.current?.querySelectorAll<HTMLElement>('.gallery-panel')[nextIndex]?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'nearest',
      inline: 'start',
    });
  }

  function onGalleryPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    dragStartRef.current = event.clientX;
  }

  function onGalleryPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;
    if (dragStartRef.current === null) return;
    const distance = dragStartRef.current - event.clientX;
    dragStartRef.current = null;
    if (Math.abs(distance) > 45) moveGallery(galleryIndex + (distance > 0 ? 1 : -1));
  }

  function onGalleryScroll() {
    if (!galleryRef.current) return;
    const trackLeft = galleryRef.current.getBoundingClientRect().left;
    const panels = Array.from(galleryRef.current.querySelectorAll<HTMLElement>('.gallery-panel'));
    const nearest = panels.reduce((best, panel, index) =>
      Math.abs(panel.getBoundingClientRect().left - trackLeft) < Math.abs(panels[best].getBoundingClientRect().left - trackLeft) ? index : best, 0);
    setGalleryIndex(nearest);
  }

  function onGalleryKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveGallery(galleryIndex + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveGallery(galleryIndex - 1);
    }
  }

  return (
    <>
      <a href="#conteudo" className="skip-link">Pular para o conteúdo</a>
      <div className="reading-progress" role="progressbar" aria-label="Progresso da página" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(scrollProgress)}>
        <span style={{ transform: `scaleX(${scrollProgress / 100})` }} />
      </div>
      <header className={`site-header ${compact ? 'is-compact' : ''}`}>
        <a className="header-identity" href="#inicio" aria-label="Santo Alberto, voltar ao início">
          <BrandMark />
          <span><strong>Santo Alberto</strong><small>Santo André, SP</small></span>
        </a>
        <nav className="desktop-nav" aria-label="Navegação principal">
          {navigation.filter((item) => ['historia', 'arena', 'futebol', 'momentos'].includes(item.href.slice(1))).map((item) => (
            <a key={item.href} href={item.href} aria-current={activeSection === item.href.slice(1) ? 'location' : undefined}>{item.label}</a>
          ))}
        </nav>
        <a className="header-contact" href="#contato">Acompanhe o clube <Arrow diagonal /></a>
        <button ref={menuButtonRef} type="button" className="menu-toggle" aria-label="Abrir menu" aria-expanded={menuOpen} aria-controls="mobile-menu" onClick={() => setMenuOpen(true)}>
          <span /><span />
        </button>
      </header>

      <div id="mobile-menu" className={`mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <div className="mobile-menu-top">
          <span>Explore o Santo Alberto</span>
          <button ref={menuCloseRef} type="button" aria-label="Fechar menu" tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)}>Fechar <span aria-hidden="true">×</span></button>
        </div>
        <nav aria-label="Navegação mobile">
          {navigation.map((item) => <a key={item.href} href={item.href} tabIndex={menuOpen ? 0 : -1} onClick={() => setMenuOpen(false)} aria-current={activeSection === item.href.slice(1) ? 'location' : undefined}>{item.label}<Arrow diagonal /></a>)}
        </nav>
        <p>Grêmio Esportivo Jardim Santo Alberto<br />Desde 1974 em Santo André.</p>
      </div>

      <main id="conteudo">
        <section className="hero section-dark" id="inicio" aria-labelledby="hero-title">
          <div className="hero-grid" aria-hidden="true" />
          <div className="hero-topline"><span className="status-dot" /> PROPOSTA CONCEITUAL • SITE DEMONSTRATIVO <span className="hero-topline-side">04.02.1974 / SANTO ANDRÉ</span></div>
          <div className="hero-stage">
            <p className="hero-kicker">Grêmio Esportivo Jardim Santo Alberto</p>
            <h1 id="hero-title"><span>SANTO</span><span>ALBERTO<span className="hero-period">.</span></span></h1>
            <div className="hero-medallion" aria-label="Escudo tridimensional do Santo Alberto">
              <Suspense fallback={<BrandMark className="hero-crest-fallback" />}><Crest3D /></Suspense>
            </div>
            <div className="hero-side-copy"><span>Desde 1974</span><span>Nossa história<br />entra em campo.</span></div>
          </div>
          <div className="hero-bottomline">
            <p>Um clube de bairro.<br />Uma história de todos.</p>
            <div className="hero-actions"><a className="button button-light" href="#historia">Nossa história <Arrow /></a><a className="text-link" href="#contato">Acompanhe o Grêmio <Arrow diagonal /></a></div>
            <a href="#historia" className="scroll-cue" aria-label="Descer para a história"><span />Role para descobrir</a>
          </div>
        </section>

        <section className="history section-light" id="historia" aria-labelledby="history-title">
          <div className="section-topline"><span>Nossa história</span><span>01 / 08</span></div>
          <div className="history-layout">
            <div className="history-intro"><p className="section-label">As raízes</p><h2 id="history-title">Uma data.<br />Muitas histórias.</h2><p className="history-copy">O Grêmio Esportivo Jardim Santo Alberto foi fundado em 4 de fevereiro de 1974, em Santo André. A data marca o começo de uma trajetória que merece ser contada por quem a viveu.</p><p className="content-note">Texto editorial proposto. Memórias, marcos e registros históricos aguardam confirmação do clube.</p></div>
            <div className="history-year" aria-label="Fundado em 1974"><span>19</span><span>74</span><div className="year-rule" /></div>
          </div>
          <div className="history-foot"><span>Fundação esportiva confirmada</span><strong>04 / 02 / 1974</strong><span>Santo André, São Paulo</span></div>
        </section>

        <section className="arena section-blue" id="arena" aria-labelledby="arena-title">
          <div className="section-topline"><span>Nossa casa</span><span>02 / 08</span></div>
          <div className="arena-content"><div><p className="section-label">Território</p><h2 id="arena-title">Arena<br />Santo<br />Alberto<span>.</span></h2></div><p>Um nome ligado ao lugar onde o futebol encontra o bairro. A imagem definitiva da Arena será definida com material autorizado pelo clube.</p></div>
          <div className="arena-visual">
            <img src={arenaIllustrationUrl} alt="Imagem ilustrativa de um campo de futebol, não representa a Arena Santo Alberto" loading="lazy" />
            <span className="arena-placeholder">Imagem ilustrativa • Placeholder visual</span>
          </div>
          <div className="arena-footer"><span>01 / Santo André</span><span>O campo é mais do que um endereço.</span></div>
        </section>

        <section className="football section-light" id="futebol" aria-labelledby="football-title">
          <div className="section-topline"><span>Nosso futebol</span><span>03 / 08</span></div>
          <div className="football-heading"><div><p className="section-label">A bola segue</p><h2 id="football-title">Todo jogo<br />começa aqui.</h2></div><p>Uma estrutura para apresentar equipes, categorias, horários e formas de participar quando essas informações forem confirmadas pelo clube.</p></div>
          <div className="football-roster" aria-label="Exemplo de módulos para o futebol do clube">
            <div><span className="roster-number">01</span><div><h3>Equipes</h3><p>Espaço para elencos e informações esportivas.</p></div><span className="roster-status">Conteúdo pendente</span></div>
            <div><span className="roster-number">02</span><div><h3>Categorias</h3><p>Atividades e faixas etárias a confirmar.</p></div><span className="roster-status">Conteúdo pendente</span></div>
            <div><span className="roster-number">03</span><div><h3>Participe</h3><p>Informações de inscrição e contato a confirmar.</p></div><span className="roster-status">Conteúdo pendente</span></div>
          </div>
          <figure className="football-visual"><img src={footballIllustrationUrl} alt="Imagem ilustrativa de futebol, sem relação com atletas ou partidas do Santo Alberto" loading="lazy" /><figcaption>Imagem ilustrativa • Não retrata atletas ou partidas do clube</figcaption></figure>
        </section>

        <section className="matches section-dark" id="em-campo" aria-labelledby="matches-title">
          <div className="section-topline"><span>Em campo</span><span>04 / 08</span></div>
          <div className="matches-heading"><div><p className="section-label">O futuro módulo esportivo</p><h2 id="matches-title">O jogo<br />continua.</h2></div><p className="demo-tag">DADOS DEMONSTRATIVOS</p></div>
          <div className="matches-list">{demoUpdates.map((item) => <article key={item.title} className="match-item"><div className="match-symbol">{item.symbol}</div><div><span>{item.type}</span><h3>{item.title}</h3><p>{item.detail}</p></div><span className="match-example">Exemplo de interface</span></article>)}</div>
          <p className="content-note">Os blocos acima ilustram uma futura agenda e área de notícias. Não representam partidas ou comunicados reais.</p>
        </section>

        <section className="moments section-light" id="momentos" aria-labelledby="moments-title">
          <div className="section-topline"><span>Momentos</span><span>05 / 08</span></div>
          <div className="moments-heading"><div><p className="section-label">Arquivo em construção</p><h2 id="moments-title">Vale a pena<br />guardar.</h2></div><div className="gallery-controls"><span>{String(galleryIndex + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}</span><button type="button" aria-label="Ilustração anterior" onClick={() => moveGallery(galleryIndex - 1)} disabled={galleryIndex === 0}>←</button><button type="button" aria-label="Próxima ilustração" onClick={() => moveGallery(galleryIndex + 1)} disabled={galleryIndex === gallery.length - 1}>→</button></div></div>
          <div ref={galleryRef} className="gallery-track" role="region" aria-label="Galeria de imagens ilustrativas" tabIndex={0} onScroll={onGalleryScroll} onKeyDown={onGalleryKeyDown} onPointerDown={onGalleryPointerDown} onPointerUp={onGalleryPointerUp} onPointerCancel={() => { dragStartRef.current = null; }}>
            {gallery.map((item, index) => <figure className={`gallery-panel gallery-${item.art}`} key={item.title}><div className="gallery-art"><img src={`${import.meta.env.BASE_URL}${item.image}`} alt={`Imagem ilustrativa: ${item.caption} Não retrata o clube.`} loading="lazy" draggable={false} /><span className="gallery-art-number">{String(index + 1).padStart(2, '0')}</span><span className="gallery-art-label">Arquivo visual proposto</span></div><figcaption><div><span>Imagem ilustrativa • Placeholder</span><h3>{item.title}</h3><p>{item.caption}</p></div><span>GSA / {String(index + 1).padStart(2, '0')}</span></figcaption></figure>)}
          </div>
          <p className="gallery-note">Imagens ilustrativas geradas para esta demonstração. Nenhuma imagem retrata a Arena, atletas ou partidas do clube.</p>
        </section>

        <section className="community section-blue" id="faca-parte" aria-labelledby="community-title">
          <div className="section-topline"><span>Faça parte da história</span><span>06 / 08</span></div>
          <div className="community-heading"><p className="section-label">O clube é feito de gente</p><h2 id="community-title">Aqui tem<br />lugar para você.</h2></div>
          <div className="community-links"><a href="#contato"><span>01</span><strong>Torça</strong><small>Acompanhe o clube</small><Arrow diagonal /></a><a href="#futebol"><span>02</span><strong>Jogue</strong><small>Conheça o futebol</small><Arrow diagonal /></a><a href="#parceiros"><span>03</span><strong>Apoie</strong><small>Imagine novas parcerias</small><Arrow diagonal /></a></div>
        </section>

        <section className="partners section-light" id="parceiros" aria-labelledby="partners-title">
          <div className="section-topline"><span>Parceiros</span><span>07 / 08</span></div>
          <div className="partners-layout"><div><p className="section-label">Uma vitrine possível</p><h2 id="partners-title">Juntos,<br />mais longe.</h2><p>Espaço conceitual para apresentar futuras marcas parceiras com respeito à identidade de cada uma.</p></div><div className="partner-slots" aria-label="Espaços demonstrativos para parceiros"><div><span>01</span><strong>Seu nome<br />aqui.</strong><small>Espaço reservado para parceiro</small></div><div><span>02</span><strong>O próximo<br />capítulo.</strong><small>Espaço reservado para parceiro</small></div></div></div>
          <p className="content-note">Exibição demonstrativa. Nenhum patrocínio ou parceria é declarado nesta proposta.</p>
        </section>

        <section className="contact section-dark" id="contato" aria-labelledby="contact-title">
          <div className="section-topline"><span>Contato</span><span>08 / 08</span></div>
          <p className="section-label">Continue perto</p><h2 id="contact-title">A história<br />segue lá fora<span>.</span></h2>
          <div className="contact-bottom"><p>Acompanhe o perfil do Grêmio Santo Alberto informado para esta proposta.</p><a href={club.instagram} target="_blank" rel="noopener noreferrer" className="instagram-link">Instagram <span>{club.instagramLabel}</span><Arrow diagonal /></a></div>
        </section>
      </main>

      <footer className="site-footer" id="rodape"><div className="footer-main"><div className="footer-identity"><BrandMark /><div><strong>SANTO<br />ALBERTO.</strong><p>{club.fullName}</p></div></div><div className="footer-facts"><span>Fundado em {club.foundation}</span><span>{club.city}</span><span>{club.arena}</span></div><nav aria-label="Navegação do rodapé"><a href="#inicio">Início</a><a href="#historia">História</a><a href="#momentos">Momentos</a><a href="#contato">Contato</a></nav></div><div className="footer-bottom"><p>Projeto demonstrativo independente, desenvolvido para apresentação ao Grêmio Esportivo Jardim Santo Alberto. Não representa o site oficial do clube.</p><a href={club.instagram} target="_blank" rel="noopener noreferrer">Instagram <Arrow diagonal /></a><p>Desenvolvido por <a href="https://www.linkedin.com/in/rbrecci" target="_blank" rel="noopener noreferrer">RBrecci</a></p></div></footer>
    </>
  );
}

export default App;
