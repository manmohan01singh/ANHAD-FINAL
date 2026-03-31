/**
 * ANHAD Gurbani Radio — Track Durations
 *
 * TODO: Replace with real measured durations.
 * To measure: ffprobe -v error -show_entries format=duration
 *             -of default=noprint_wrappers=1:nokey=1 day-N.webm
 *
 * All durations are in SECONDS.
 * Default: 3600 (60 minutes) per track.
 */
const TRACK_DURATIONS = {
    1:  3600, 2:  3600, 3:  3600, 4:  3600, 5:  3600,
    6:  3600, 7:  3600, 8:  3600, 9:  3600, 10: 3600,
    11: 3600, 12: 3600, 13: 3600, 14: 3600, 15: 3600,
    16: 3600, 17: 3600, 18: 3600, 19: 3600, 20: 3600,
    21: 3600, 22: 3600, 23: 3600, 24: 3600, 25: 3600,
    26: 3600, 27: 3600, 28: 3600, 29: 3600, 30: 3600,
    31: 3600, 32: 3600, 33: 3600, 34: 3600, 35: 3600,
    36: 3600, 37: 3600, 38: 3600, 39: 3600, 40: 3600
};

module.exports = TRACK_DURATIONS;
