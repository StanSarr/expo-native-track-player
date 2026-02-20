"use strict";

import { NativeEventEmitter } from 'react-native';
import ExpoNativeTrackPlayer from "./NativeExpoNativeTrackPlayer.js";
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
  AndroidConnectorDisconnected: 'android-controller-disconnected'
};
export const TrackPlayerEvents = {
  ...Event,
  QueueUpdated: 'queue-updated'
};
const emitter = new NativeEventEmitter(ExpoNativeTrackPlayer);
export function addEventListener(eventName, listener) {
  return emitter.addListener(eventName, event => listener(event));
}
export function addTypedEventListener(eventName, listener) {
  return emitter.addListener(eventName, event => listener(event));
}
export function removeAllEventListeners(eventName) {
  emitter.removeAllListeners(eventName);
}
export const AudioEvents = {
  addListener: addEventListener,
  addTypedListener: addTypedEventListener,
  removeAllListeners: removeAllEventListeners
};
//# sourceMappingURL=events.js.map