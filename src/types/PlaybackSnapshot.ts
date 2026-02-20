import type { RepeatMode, State } from '../NativeExpoNativeTrackPlayer';

export interface PlaybackSnapshot {
  state: State;
  position: number;
  duration: number;
  trackIndex: number;
  trackId?: string;
  rate: number;
  volume: number;
  repeatMode: RepeatMode;
  savedAt: number;
}
