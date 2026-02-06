import ExpoNativeTrackPlayer, {
  type PlaybackState,
  type RepeatMode,
  type TrackMetadata,
} from './NativeExpoNativeTrackPlayer';

function callVoid(action: () => void): Promise<void> {
  try {
    action();
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}

function callValue<T>(action: () => T): Promise<T> {
  try {
    return Promise.resolve(action());
  } catch (error) {
    return Promise.reject(error);
  }
}

export function addToQueue(track: TrackMetadata): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.addToQueue(track));
}

export function addQueue(tracks: TrackMetadata[]): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.addQueue(tracks));
}

export function getQueue(): Promise<TrackMetadata[]> {
  return callValue(() => ExpoNativeTrackPlayer.getQueue());
}

export function removeFromQueue(trackId: string): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.removeFromQueue(trackId));
}

export function clearQueue(): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.clearQueue());
}

export function play(index?: number | null): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.play(index ?? null));
}

export function pause(): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.pause());
}

export function stop(): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.stop());
}

export function skipToNext(): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.skipToNext());
}

export function skipToPrevious(): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.skipToPrevious());
}

export function skipToIndex(index: number): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.skipToIndex(index));
}

export function seekTo(positionMs: number): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.seekTo(positionMs));
}

export function reset(): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.reset());
}

export function setRepeatMode(
  mode: RepeatMode,
  startMs?: number | null,
  endMs?: number | null
): Promise<void> {
  return callVoid(() =>
    ExpoNativeTrackPlayer.setRepeatMode(mode, startMs ?? null, endMs ?? null)
  );
}

export function getRepeatMode(): Promise<RepeatMode> {
  return callValue(() => ExpoNativeTrackPlayer.getRepeatMode());
}

export function getCurrentTrack(): Promise<TrackMetadata | null> {
  return callValue(() => ExpoNativeTrackPlayer.getCurrentTrack());
}

export function getCurrentTrackIndex(): Promise<number> {
  return callValue(() => ExpoNativeTrackPlayer.getCurrentTrackIndex());
}

export function getPosition(): Promise<number> {
  return callValue(() => ExpoNativeTrackPlayer.getPosition());
}

export function getDuration(): Promise<number> {
  return callValue(() => ExpoNativeTrackPlayer.getDuration());
}

export function getPlaybackState(): Promise<PlaybackState> {
  return callValue(() => ExpoNativeTrackPlayer.getPlaybackState());
}

export function setVolume(volume: number): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.setVolume(volume));
}

export function getVolume(): Promise<number> {
  return callValue(() => ExpoNativeTrackPlayer.getVolume());
}

export function setRate(rate: number): Promise<void> {
  return callVoid(() => ExpoNativeTrackPlayer.setRate(rate));
}

export function getRate(): Promise<number> {
  return callValue(() => ExpoNativeTrackPlayer.getRate());
}

const TrackPlayer = {
  addToQueue,
  addQueue,
  getQueue,
  removeFromQueue,
  clearQueue,
  play,
  pause,
  stop,
  skipToNext,
  skipToPrevious,
  skipToIndex,
  seekTo,
  reset,
  setRepeatMode,
  getRepeatMode,
  getCurrentTrack,
  getCurrentTrackIndex,
  getPosition,
  getDuration,
  getPlaybackState,
  setVolume,
  getVolume,
  setRate,
  getRate,
};

export default TrackPlayer;
export type { PlaybackState, RepeatMode, TrackMetadata };
