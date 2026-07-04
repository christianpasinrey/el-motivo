import { emitir, escuchar } from '../lib/bus';

declare global { interface Window { YT: any; onYouTubeIframeAPIReady: () => void } }

export function initPlayer(): void {
  const main = document.getElementById('experiencia')!;
  const vinilo = document.getElementById('vinilo')! as HTMLButtonElement;
  const ids = [main.dataset.videoId!, ...(main.dataset.alternativos ?? '').split(',').filter(Boolean)];
  let intento = 0;
  let player: any = null;
  let sinAudioLlamado = false;
  let temporizadorPulso: ReturnType<typeof setTimeout> | null = null;

  function cargarAPI(): Promise<boolean> {
    return new Promise((resolve) => {
      if (window.YT?.Player) return resolve(true);
      let asentado = false;
      const asentar = (ok: boolean) => {
        if (asentado) return;
        asentado = true;
        resolve(ok);
      };
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.onerror = () => asentar(false);
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => asentar(true);
      setTimeout(() => asentar(false), 8000);
    });
  }

  function actualizarAriaVinilo(sonando: boolean) {
    vinilo.setAttribute('aria-label', sonando ? 'Pausar la música' : 'Reproducir la música');
  }

  function sinAudio() {
    if (sinAudioLlamado) return;
    sinAudioLlamado = true;
    player = null;
    document.body.classList.add('sin-audio');
    vinilo.classList.remove('pulsa');
    vinilo.innerHTML = '<p class="ui" style="font-size:.6rem;opacity:.6">Audio no disponible en tu región — la historia continúa</p>';
  }

  function crear() {
    if (intento >= ids.length) return sinAudio();
    const div = document.createElement('div');
    div.id = 'yt-player';
    vinilo.appendChild(div);
    player = new window.YT.Player('yt-player', {
      videoId: ids[intento], width: 120, height: 120,
      playerVars: { autoplay: 1, controls: 0, rel: 0, playsinline: 1 },
      events: {
        onReady: () => {
          if (temporizadorPulso) clearTimeout(temporizadorPulso);
          temporizadorPulso = setTimeout(() => {
            if (player?.getPlayerState && player.getPlayerState() !== window.YT.PlayerState.PLAYING) {
              vinilo.classList.add('pulsa');
            }
          }, 2500);
        },
        onError: (e: any) => {
          const muerto = player;
          muerto.destroy();
          if ([100, 101, 150].includes(e.data)) { intento++; crear(); }
          else { player = null; sinAudio(); }
        },
        onStateChange: (e: any) => {
          const sonando = e.data === window.YT.PlayerState.PLAYING;
          vinilo.classList.toggle('girando', sonando);
          if (sonando) { vinilo.classList.remove('pulsa'); if (temporizadorPulso) clearTimeout(temporizadorPulso); }
          actualizarAriaVinilo(sonando);
          emitir('player:estado', { sonando });
        },
      },
    });
  }

  escuchar('experiencia:entrar', async () => {
    const ok = await cargarAPI();
    ok ? crear() : sinAudio();
  });
  escuchar('player:seek', ({ segundos }) => { player?.seekTo(segundos, true); player?.playVideo(); });
  vinilo.addEventListener('click', () => {
    if (!player?.getPlayerState) return;
    player.getPlayerState() === window.YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo();
  });
}
