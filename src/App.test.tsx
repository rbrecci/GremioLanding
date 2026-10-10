// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const crestState = vi.hoisted(() => ({ renders: 0, throws: false }));

vi.mock('./components/Crest3D', () => ({
  default: function MockCrest3D() {
    crestState.renders += 1;
    if (crestState.throws) throw new Error('Falha no renderer WebGL');
    return <div data-testid="crest-3d" />;
  },
}));

class MockIntersectionObserver implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly thresholds = [];
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}

beforeEach(() => {
  crestState.renders = 0;
  crestState.throws = false;
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 1;
  });
  vi.stubGlobal('cancelAnimationFrame', () => undefined);
  vi.stubGlobal('matchMedia', () => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  Element.prototype.scrollIntoView = vi.fn();
  Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 2000 });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('navegação e conteúdo', () => {
  it('abre o menu mobile, navega e devolve o foco ao botão', async () => {
    render(<App />);
    const open = screen.getByRole('button', { name: 'Abrir menu' });
    fireEvent.click(open);

    const menu = document.getElementById('mobile-menu')!;
    expect(open.getAttribute('aria-expanded')).toBe('true');
    expect(menu.getAttribute('aria-hidden')).toBe('false');
    expect(document.activeElement).toBe(within(menu).getByRole('button', { name: /Fechar menu/ }));

    fireEvent.click(within(menu).getByRole('link', { name: /Nossa casa/ }));
    expect(open.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(open);

    fireEvent.click(open);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(open.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(open);
  });

  it('mantém as chamadas internas válidas e identifica o conteúdo demonstrativo', () => {
    render(<App />);

    const history = screen.getByRole('link', { name: /Nossa história/ });
    expect(history.getAttribute('href')).toBe('#historia');
    expect(document.getElementById('historia')).not.toBeNull();
    expect(screen.getByText('DADOS DEMONSTRATIVOS')).toBeTruthy();
    expect(screen.getByText(/Não representam partidas ou comunicados reais/)).toBeTruthy();
    expect(screen.getByText(/Nenhum patrocínio ou parceria é declarado/)).toBeTruthy();
    expect(screen.getByRole('link', { name: /Instagram @gremiosantoalberto/ }).getAttribute('rel')).toBe('noopener noreferrer');
  });
});

describe('galeria', () => {
  it('avança por controles e teclado sem ultrapassar as extremidades', () => {
    render(<App />);
    const gallery = screen.getByRole('region', { name: 'Galeria de imagens ilustrativas' });
    const previous = screen.getByRole('button', { name: 'Ilustração anterior' }) as HTMLButtonElement;
    const next = screen.getByRole('button', { name: 'Próxima ilustração' }) as HTMLButtonElement;
    const counter = next.parentElement!.querySelector('span')!;

    expect(previous.disabled).toBe(true);
    expect(counter.textContent).toBe('01 / 04');
    fireEvent.click(next);
    expect(counter.textContent).toBe('02 / 04');
    fireEvent.keyDown(gallery, { key: 'ArrowRight' });
    fireEvent.click(next);
    expect(counter.textContent).toBe('04 / 04');
    expect(next.disabled).toBe(true);
    fireEvent.keyDown(gallery, { key: 'ArrowRight' });
    expect(counter.textContent).toBe('04 / 04');
    fireEvent.click(previous);
    expect(counter.textContent).toBe('03 / 04');
  });

  it('captura o ponteiro ao iniciar o arraste com mouse', () => {
    render(<App />);
    const gallery = screen.getByRole('region', { name: 'Galeria de imagens ilustrativas' });
    const capture = vi.fn();
    gallery.setPointerCapture = capture;

    fireEvent.pointerDown(gallery, { pointerType: 'mouse', button: 0, clientX: 180, pointerId: 7 });

    expect(capture).toHaveBeenCalledWith(7);
  });

  it('descarta o gesto quando a captura do ponteiro é perdida', () => {
    render(<App />);
    const gallery = screen.getByRole('region', { name: 'Galeria de imagens ilustrativas' });
    const counter = screen.getByRole('button', { name: 'Próxima ilustração' }).parentElement!.querySelector('span')!;
    gallery.setPointerCapture = vi.fn();

    fireEvent.pointerDown(gallery, { pointerType: 'mouse', button: 0, clientX: 180, pointerId: 7 });
    fireEvent.lostPointerCapture(gallery, { pointerId: 7 });
    fireEvent.pointerUp(gallery, { pointerType: 'mouse', button: 0, clientX: 40, pointerId: 7 });

    expect(counter.textContent).toBe('01 / 04');
  });
});

describe('resiliência e desempenho', () => {
  it.each([
    ['movimento reduzido', '(prefers-reduced-motion: reduce)'],
    ['ponteiro coarse', '(pointer: coarse)'],
  ])('mostra o escudo estático sem renderizar o módulo 3D com %s', async (_, preference) => {
    vi.stubGlobal('matchMedia', (media: string) => ({
      matches: media === preference,
      media,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));

    await act(async () => {
      render(<App />);
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(document.querySelector('.hero-medallion img')).not.toBeNull();
    expect(crestState.renders).toBe(0);
  });

  it('preserva o conteúdo e exibe o escudo estático após falha de renderização do módulo 3D', async () => {
    crestState.throws = true;
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      render(<App />);
      await waitFor(() => {
        const medallion = document.querySelector('.hero-medallion');
        expect(medallion?.querySelector('img')).not.toBeNull();
        expect(screen.getByRole('main')).toBeTruthy();
      });
    } finally {
      consoleError.mockRestore();
    }
  });

  it('atualiza o progresso da leitura sem renderizar novamente o módulo 3D', async () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 100 });
    render(<App />);
    await screen.findByTestId('crest-3d');
    const renders = crestState.renders;

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 300 });
    act(() => fireEvent.scroll(window));

    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe('25');
    expect(crestState.renders).toBe(renders);
  });
});
