import { NativeEventEmitter, type EmitterSubscription } from 'react-native';
import ExpoNativeTrackPlayer, {
  type State,
  type TrackMetadata,
} from './NativeExpoNativeTrackPlayer';

export const Event = {
  PlayerError: 'player-error',
  PlaybackState: 'playback-state',
  PlaybackError: 'playback-error',
  PlaybackQueueEnded: 'playback-queue-ended',
  PlaybackActiveTrackChanged: 'playback-active-track-changed',
  PlaybackPlayWhenReadyChanged: 'playback-play-when-ready-changed',
  PlaybackProgressUpdated: 'playback-progress-updated',
  PlaybackResume: 'android-playback-resume',
  RemotePlay: 'remote-play',
  RemotePlayPause: 'remote-play-pause',
  RemotePause: 'remote-pause',
  RemoteStop: 'remote-stop',
  RemoteNext: 'remote-next',
  RemotePrevious: 'remote-previous',
  RemoteJumpForward: 'remote-jump-forward',
  RemoteJumpBackward: 'remote-jump-backward',
  RemoteSeek: 'remote-seek',
  RemoteSetRating: 'remote-set-rating',
  RemoteDuck: 'remote-duck',
  RemoteLike: 'remote-like',
  RemoteDislike: 'remote-dislike',
  RemoteBookmark: 'remote-bookmark',
  RemotePlayId: 'remote-play-id',
  RemotePlaySearch: 'remote-play-search',
  RemoteSkip: 'remote-skip',
  MetadataChapterReceived: 'metadata-chapter-received',
  MetadataTimedReceived: 'metadata-timed-received',
  MetadataCommonReceived: 'metadata-common-received',
  AndroidConnectorConnected: 'android-controller-connected',
  AndroidConnectorDisconnected: 'android-controller-disconnected',
} as const;

export type EventName = (typeof Event)[keyof typeof Event];

export const TrackPlayerEvents = {
  ...Event,
  QueueUpdated: 'queue-updated',
} as const;

export type TrackPlayerEventName =
  (typeof TrackPlayerEvents)[keyof typeof TrackPlayerEvents];

export interface PlaybackStateEvent {
  state: State;
}

export interface PlaybackPositionEvent {
  position: number;
  duration: number;
  trackIndex: number;
}

export interface TrackChangedEvent {
  trackIndex: number;
  track: TrackMetadata | null;
}

export interface QueueUpdatedEvent {
  count: number;
  trackIndex: number;
  queue: TrackMetadata[];
}

export interface PlaybackQueueEndedEvent {
  trackIndex: number;
  position: number;
}

export type EventPayloadMap = {
  [Event.PlayerError]: { message?: string } | undefined;
  [Event.PlaybackState]: PlaybackStateEvent;
  [Event.PlaybackError]: { message?: string } | undefined;
  [Event.PlaybackQueueEnded]: PlaybackQueueEndedEvent;
  [Event.PlaybackActiveTrackChanged]: TrackChangedEvent;
  [Event.PlaybackPlayWhenReadyChanged]: { playWhenReady: boolean };
  [Event.PlaybackProgressUpdated]: PlaybackPositionEvent;
  [Event.PlaybackResume]: undefined;
  [Event.RemotePlay]: undefined;
  [Event.RemotePlayPause]: undefined;
  [Event.RemotePause]: undefined;
  [Event.RemoteStop]: undefined;
  [Event.RemoteNext]: undefined;
  [Event.RemotePrevious]: undefined;
  [Event.RemoteJumpForward]: { interval?: number } | undefined;
  [Event.RemoteJumpBackward]: { interval?: number } | undefined;
  [Event.RemoteSeek]: { position: number };
  [Event.RemoteSetRating]: { rating: number };
  [Event.RemoteDuck]: { paused: boolean; permanent: boolean };
  [Event.RemoteLike]: undefined;
  [Event.RemoteDislike]: undefined;
  [Event.RemoteBookmark]: undefined;
  [Event.RemotePlayId]: { id: string };
  [Event.RemotePlaySearch]: { query: string };
  [Event.RemoteSkip]: { interval: number };
  [Event.MetadataChapterReceived]: { title?: string; startTime?: number };
  [Event.MetadataTimedReceived]: { value: string };
  [Event.MetadataCommonReceived]: { title?: string; artist?: string };
  [Event.AndroidConnectorConnected]: undefined;
  [Event.AndroidConnectorDisconnected]: undefined;
  [TrackPlayerEvents.QueueUpdated]: QueueUpdatedEvent;
};

const emitter = new NativeEventEmitter(ExpoNativeTrackPlayer);

export function addEventListener<T>(
  eventName: TrackPlayerEventName,
  listener: (event: T) => void
): EmitterSubscription {
  return emitter.addListener(eventName, (event: any) => listener(event as T));
}

export function addTypedEventListener<E extends TrackPlayerEventName>(
  eventName: E,
  listener: (event: EventPayloadMap[E]) => void
): EmitterSubscription {
  return emitter.addListener(eventName, (event: any) =>
    listener(event as EventPayloadMap[E])
  );
}

export function removeAllEventListeners(eventName: TrackPlayerEventName): void {
  emitter.removeAllListeners(eventName);
}

export const AudioEvents = {
  addListener: addEventListener,
  addTypedListener: addTypedEventListener,
  removeAllListeners: removeAllEventListeners,
};
