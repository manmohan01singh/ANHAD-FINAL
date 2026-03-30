/**
 * iOS 17 Music Player - Exact Replica
 * Player controller with play/pause, volume, and keyboard shortcuts
 */

class iOS17Player {
    constructor() {
        this.isPlaying = false;
        this.isFavorite = false;
        this.volume = 60;

        // Elements
        this.audio = document.getElementById('audio');
        this.artwork = document.getElementById('artwork');
        this.artworkImg = document.getElementById('artworkImg');
        this.bgArt = document.getElementById('bgArt');
        this.title = document.getElementById('title');
        this.artist = document.getElementById('artist');
        this.playBtn = document.getElementById('playBtn');
        this.playIcon = document.getElementById('playIcon');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');
        this.starBtn = document.getElementById('starBtn');
        this.volumeInput = document.getElementById('volumeInput');
        this.volumeFill = document.getElementById('volumeFill');
        this.progress = document.getElementById('progress');

        // Streams
        this.streams = [
            {
                title: 'Live Kirtan',
                artist: 'Live Kirtan from Amritvela Smagam',
                url: 'https://live.sgpc.net:8443/;nocache=889869',
                art: '../assets/icons/image.png'
            }
        ];
        this.currentIndex = 0;

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateVolume(this.volume);
        this.loadStream(0);
    }

    bindEvents() {
        // Play/Pause
        this.playBtn?.addEventListener('click', () => this.togglePlay());

        // Skip
        this.prevBtn?.addEventListener('click', () => this.skip(-1));
        this.nextBtn?.addEventListener('click', () => this.skip(1));

        // Favorite
        this.starBtn?.addEventListener('click', () => this.toggleFavorite());

        // Volume
        this.volumeInput?.addEventListener('input', (e) => {
            this.updateVolume(parseInt(e.target.value));
        });

        // Audio events
        if (this.audio) {
            this.audio.addEventListener('play', () => this.onPlay());
            this.audio.addEventListener('pause', () => this.onPause());
            this.audio.addEventListener('error', () => this.onError());
        }

        // Keyboard
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
    }

    loadStream(index) {
        const stream = this.streams[index];
        if (!stream) return;

        this.currentIndex = index;

        if (this.audio) {
            this.audio.src = stream.url;
        }

        if (this.title) this.title.textContent = stream.title;
        if (this.artist) this.artist.textContent = stream.artist;
        if (this.artworkImg) this.artworkImg.src = stream.art;
        if (this.bgArt) this.bgArt.src = stream.art;
    }

    togglePlay() {
        if (this.isPlaying) {
            this.audio?.pause();
        } else {
            this.audio?.play().catch(() => { });
        }
    }

    onPlay() {
        this.isPlaying = true;
        this.updatePlayButton();
        this.artwork?.classList.remove('ios17-artwork--paused');
    }

    onPause() {
        this.isPlaying = false;
        this.updatePlayButton();
        this.artwork?.classList.add('ios17-artwork--paused');
    }

    onError() {
        console.error('Stream error');
    }

    updatePlayButton() {
        if (!this.playIcon) return;

        if (this.isPlaying) {
            // Pause icon
            this.playIcon.innerHTML = `
                <rect x="6" y="4" width="4" height="16" rx="1"/>
                <rect x="14" y="4" width="4" height="16" rx="1"/>
            `;
            this.playBtn?.setAttribute('aria-label', 'Pause');
        } else {
            // Play icon
            this.playIcon.innerHTML = `
                <path d="M8 5v14l11-7L8 5z"/>
            `;
            this.playBtn?.setAttribute('aria-label', 'Play');
        }
    }

    skip(direction) {
        const newIndex = this.currentIndex + direction;
        if (newIndex >= 0 && newIndex < this.streams.length) {
            this.loadStream(newIndex);
            if (this.isPlaying) {
                setTimeout(() => this.audio?.play().catch(() => { }), 100);
            }
        }
    }

    toggleFavorite() {
        this.isFavorite = !this.isFavorite;
        this.starBtn?.classList.toggle('active', this.isFavorite);
    }

    updateVolume(value) {
        this.volume = Math.max(0, Math.min(100, value));

        if (this.audio) {
            this.audio.volume = this.volume / 100;
        }

        if (this.volumeFill) {
            this.volumeFill.style.width = `${this.volume}%`;
        }
    }

    onKeyDown(e) {
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                this.togglePlay();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.skip(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.skip(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.updateVolume(this.volume + 5);
                if (this.volumeInput) this.volumeInput.value = this.volume;
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.updateVolume(this.volume - 5);
                if (this.volumeInput) this.volumeInput.value = this.volume;
                break;
            case 'KeyM':
                e.preventDefault();
                this.updateVolume(this.volume > 0 ? 0 : 60);
                if (this.volumeInput) this.volumeInput.value = this.volume;
                break;
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.player = new iOS17Player();
});
