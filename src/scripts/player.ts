import { emitir, escuchar } from '../lib/bus';

declare global { interface Window { YT: any; onYouTubeIframeAPIReady: () => void } }

export function initPlayer(): void {
  const main = document.getElementById('experiencia')!;
  const vinilo = document.getElementById('vinilo')!;
  const ids = [main.dataset.videoId!, ...(main.dataset.alternativos ?? '').split(',').filter(Boolean)];
  let intento = 0;
  let player: any = null;

  function cargarAPI(): Promise<void> {
    return new Promise((res) => {
      if (window.YT?.Player) return res();
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => res();
    });
  }

  function sinAudio() {
    document.body.classList.add('sin-audio');
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
        onError: () => { intento++; player.destroy(); crear(); },
        onStateChange: (e: any) => {
          const sonando = e.data === window.YT.PlayerState.PLAYING;
          vinilo.classList.toggle('girando', sonando);
          emitir('player:estado', { sonando });
        },
      },
    });
  }

  escuchar('experiencia:entrar', async () => { await cargarAPI(); crear(); });
  escuchar('player:seek', ({ segundos }) => { player?.seekTo(segundos, true); player?.playVideo(); });
  vinilo.addEventListener('click', () => {
    if (!player?.getPlayerState) return;
    player.getPlayerState() === window.YT.PlayerState.PLAYING ? player.pauseVideo() : player.playVideo();
  });
}
