# System Architecture Overview

## Audio System Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     AUDIO COORDINATOR                        │
│                  (audio-coordinator.js)                      │
│                                                              │
│  • Manages mutual exclusion                                 │
│  • Ensures only one audio plays at a time                   │
│  • Coordinates between all audio systems                    │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               │                          │
    ┌──────────▼──────────┐    ┌─────────▼──────────┐
    │  GlobalMiniPlayer   │    │    AnhadAudio      │
    │ (Darbar Sahib Live) │    │ (Amritvela Kirtan) │
    └──────────┬──────────┘    └─────────┬──────────┘
               │                          │
               │                          │
    ┌──────────▼──────────┐    ┌─────────▼──────────┐
    │   SGPC Live Stream  │    │  Render Backend    │
    │  (External Source)  │    │  /api/radio/live   │
    └─────────────────────┘    └─────────┬──────────┘
                                          │
                                ┌─────────▼──────────┐
                                │  Cloudflare R2     │
                                │  (Audio Files)     │
                                └────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS                                │
│              (Desktop, Mobile, Tablets)                      │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
    ┌──────────▼──────────┐    ┌─────────▼──────────┐
    │   Vercel (Frontend) │    │  Render (Backend)  │
    │                     │    │                    │
    │  • HTML/CSS/JS      │◄───┤  • Node.js/Express │
    │  • Audio Players    │    │  • API Endpoints   │
    │  • Coordinator      │    │  • Broadcast Engine│
    └─────────────────────┘    └────────────────────┘
```

## Request Flow for Amritvela Kirtan

```
1. User clicks "Play Amritvela"
   │
   ▼
2. AnhadAudio.play('amritvela')
   │
   ▼
3. AudioCoordinator.requestPlay('AnhadAudio')
   │
   ▼
4. Coordinator pauses GlobalMiniPlayer (Darbar)
   │
   ▼
5. AnhadAudio calls /api/radio/live
   │
   ▼
6. Backend returns: { trackIndex: 24, trackPosition: 1234.5 }
   │
   ▼
7. AnhadAudio loads day-25.webm from R2
   │
   ▼
8. Seeks to position 1234.5 seconds
   │
   ▼
9. Plays audio - synced with all other users!
```

## Key Components

### Frontend (Vercel)
- audio-coordinator.js: Mutual exclusion manager
- persistent-audio.js: Amritvela Kirtan player
- global-mini-player.js: Darbar Sahib Live player

### Backend (Render)
- server.js: Express API server
- BroadcastEngine: Virtual live sync engine
- /api/radio/live: Current position endpoint

### Storage
- Cloudflare R2: Audio file CDN
- SGPC: Live stream source
