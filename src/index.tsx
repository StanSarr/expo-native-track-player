import ExpoNativeTrackPlayer, {
  type RepeatMode,
  type State as NativeState,
  type TrackMetadata,
} from './NativeExpoNativeTrackPlayer';
import {
  AudioEvents,
  Event,
  TrackPlayerEvents,
  type PlaybackPositionEvent,
  type PlaybackStateEvent,
  type QueueUpdatedEvent,
  type TrackChangedEvent,
} from './events';
import type { EventName } from './events';
import {
  useCurrentTrack,
  useCurrentTrackIndex,
  usePlaybackState,
  useProgress,
  useQueue,
} from './hooks';
import type { AddTrack, Track } from './types/Track';
import type { PlaybackSnapshot } from './types/PlaybackSnapshot';
import type { ResourceObject } from './types/ResourceObject';
import type { TrackMetadataBase } from './types/TrackMetadataBase';
import { PitchAlgorithms, TrackTypes } from './constants';
import type {
  PitchAlgorithm,
  RepeatModeType,
  StateType,
  TrackType,
} from './constants';

export { State, RepeatModes } from './constants';

function resolveResourceUri(
  resource?: string | ResourceObject
): string | undefined {
  if (resource == null) return undefined;
  if (typeof resource === 'string') return resource;
  return resource.uri;
}

function toTrackMetadata(track: AddTrack): TrackMetadata {
  const { url, artwork, artworkUri, ...rest } = track;

  const resolvedUrl = resolveResourceUri(url);
  if (!resolvedUrl) {
    throw new Error('Track.url is required');
  }

  const resolvedArtwork = resolveResourceUri(artwork);
  const metadata: TrackMetadata = {
    ...(rest as TrackMetadata),
    url: resolvedUrl,
    artworkUri: resolvedArtwork ?? artworkUri,
  };

  return metadata;
}

function toTrackMetadataList(tracks: AddTrack[]): TrackMetadata[] {
  return tracks.map(toTrackMetadata);
}

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

export function addToQueue(track: AddTrack): Promise<void> {
  return callVoid(() =>
    ExpoNativeTrackPlayer.addToQueue(toTrackMetadata(track))
  );
}

export function addQueue(tracks: AddTrack[]): Promise<void> {
  return callVoid(() =>
    ExpoNativeTrackPlayer.addQueue(toTrackMetadataList(tracks))
  );
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

export function getCurrentTrack(): Promise<Track | null> {
  return callValue(
    () => ExpoNativeTrackPlayer.getCurrentTrack() as Track | null
  );
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

export function getPlaybackState(): Promise<NativeState> {
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

export function getLastPlaybackSnapshot(): Promise<PlaybackSnapshot | null> {
  return callValue(() => ExpoNativeTrackPlayer.getLastPlaybackSnapshot());
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
  getLastPlaybackSnapshot,
};

export default TrackPlayer;
export type {
  EventName,
  RepeatMode,
  NativeState as PlaybackState,
  Track,
  AddTrack,
  TrackMetadata,
  TrackMetadataBase,
  ResourceObject,
  TrackType,
  PitchAlgorithm,
  RepeatModeType,
  StateType,
  PlaybackSnapshot,
};
export {
  AudioEvents,
  Event,
  TrackPlayerEvents,
  PitchAlgorithms,
  TrackTypes,
  useCurrentTrack,
  useCurrentTrackIndex,
  usePlaybackState,
  useProgress,
  useQueue,
};
export type {
  PlaybackPositionEvent,
  PlaybackStateEvent,
  QueueUpdatedEvent,
  TrackChangedEvent,
};
