/* PERF FIX: Deterministic virtual-live radio math shared by the radio page and audio singleton. */
(function () {
  'use strict';

  const DEFAULT_EPOCH_START = 1735689600; // 2025-01-01 00:00:00 UTC

  function normalizePlaylist(playlist) {
    return (playlist || [])
      .map((track, index) => ({
        ...track,
        index,
        duration: Math.max(1, Math.round(Number(track.duration) || 3600))
      }))
      .filter(track => track.url && track.duration > 0);
  }

  function getTotalDuration(playlist) {
    return normalizePlaylist(playlist).reduce((sum, track) => sum + track.duration, 0);
  }

  function getTrackStart(playlist, trackIndex) {
    const tracks = normalizePlaylist(playlist);
    let start = 0;
    for (let i = 0; i < tracks.length; i += 1) {
      if (i === trackIndex) return start;
      start += tracks[i].duration;
    }
    return 0;
  }

  function calculateLivePosition(playlist, epochStart = DEFAULT_EPOCH_START, nowSeconds = Math.floor(Date.now() / 1000)) {
    const tracks = normalizePlaylist(playlist);
    const totalDuration = getTotalDuration(tracks);
    if (!tracks.length || totalDuration <= 0) {
      return {
        currentTrack: null,
        currentTrackIndex: 0,
        seekTo: 0,
        elapsed: 0,
        totalDuration,
        trackAccumulatedStart: 0
      };
    }

    const elapsed = ((nowSeconds - epochStart) % totalDuration + totalDuration) % totalDuration;
    let accumulated = 0;

    for (let i = 0; i < tracks.length; i += 1) {
      const track = tracks[i];
      if (elapsed < accumulated + track.duration) {
        return {
          currentTrack: track,
          currentTrackIndex: i,
          seekTo: elapsed - accumulated,
          elapsed,
          totalDuration,
          trackAccumulatedStart: accumulated
        };
      }
      accumulated += track.duration;
    }

    return {
      currentTrack: tracks[0],
      currentTrackIndex: 0,
      seekTo: 0,
      elapsed: 0,
      totalDuration,
      trackAccumulatedStart: 0
    };
  }

  function calculateDrift(playlist, epochStart, currentTrackIndex, currentTime, nowSeconds) {
    const tracks = normalizePlaylist(playlist);
    const live = calculateLivePosition(tracks, epochStart, nowSeconds);
    if (!live.currentTrack) return { driftSeconds: 0, isLive: true, live };

    const userPosition = getTrackStart(tracks, currentTrackIndex) + (Number(currentTime) || 0);
    let driftSeconds = live.elapsed - userPosition;
    if (driftSeconds < -10) driftSeconds += live.totalDuration;
    if (driftSeconds < 0) driftSeconds = 0;

    return {
      driftSeconds,
      isLive: driftSeconds <= 10,
      live
    };
  }

  function useVirtualLive(playlist, epochStart = DEFAULT_EPOCH_START) {
    const live = calculateLivePosition(playlist, epochStart);
    return {
      currentTrack: live.currentTrack,
      currentTrackIndex: live.currentTrackIndex,
      seekTo: live.seekTo,
      driftSeconds: 0,
      jumpToLive: () => calculateLivePosition(playlist, epochStart),
      isLive: true,
      totalDuration: live.totalDuration
    };
  }

  window.AnhadVirtualLive = {
    DEFAULT_EPOCH_START,
    useVirtualLive,
    calculateLivePosition,
    calculateDrift,
    getTrackStart,
    getTotalDuration,
    normalizePlaylist
  };
})();
