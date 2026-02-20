"use strict";

import ExpoNativeTrackPlayer from "./NativeExpoNativeTrackPlayer.js";
import { AudioEvents, Event, TrackPlayerEvents } from "./events.js";
import { useCurrentTrack, useCurrentTrackIndex, usePlaybackState, useProgress, useQueue } from "./hooks.js";
import { PitchAlgorithms, TrackTypes } from "./constants.js";
export { State, RepeatModes } from "./constants.js";
function resolveResourceUri(resource) {
  if (resource == null) return undefined;
  if (typeof resource === 'string') return resource;
  return resource.uri;
}
function toTrackMetadata(track) {
  const {
    url,
    artwork,
    artworkUri,
    ...rest
  } = track;
  const resolvedUrl = resolveResourceUri(url);
  if (!resolvedUrl) {
    throw new Error('Track.url is required');
  }
  const resolvedArtwork = resolveResourceUri(artwork);
  const metadata = {
    ...rest,
    url: resolvedUrl,
    artworkUri: resolvedArtwork ?? artworkUri
  };
  return metadata;
}
function toTrackMetadataList(tracks) {
  return tracks.map(toTrackMetadata);
}
function callVoid(action) {
  try {
    action();
    return Promise.resolve();
  } catch (error) {
    return Promise.reject(error);
  }
}
function callValue(action) {
  try {
    return Promise.resolve(action());
  } catch (error) {
    return Promise.reject(error);
  }
}
export function addToQueue(track) {
  return callVoid(() => ExpoNativeTrackPlayer.addToQueue(toTrackMetadata(track)));
}
export function addQueue(tracks) {
  return callVoid(() => ExpoNativeTrackPlayer.addQueue(toTrackMetadataList(tracks)));
}
export function getQueue() {
  return callValue(() => ExpoNativeTrackPlayer.getQueue());
}
export function removeFromQueue(trackId) {
  return callVoid(() => ExpoNativeTrackPlayer.removeFromQueue(trackId));
}
export function clearQueue() {
  return callVoid(() => ExpoNativeTrackPlayer.clearQueue());
}
export function play(index) {
  return callVoid(() => ExpoNativeTrackPlayer.play(index ?? null));
}
export function pause() {
  return callVoid(() => ExpoNativeTrackPlayer.pause());
}
export function stop() {
  return callVoid(() => ExpoNativeTrackPlayer.stop());
}
export function skipToNext() {
  return callVoid(() => ExpoNativeTrackPlayer.skipToNext());
}
export function skipToPrevious() {
  return callVoid(() => ExpoNativeTrackPlayer.skipToPrevious());
}
export function skipToIndex(index) {
  return callVoid(() => ExpoNativeTrackPlayer.skipToIndex(index));
}
export function seekTo(positionMs) {
  return callVoid(() => ExpoNativeTrackPlayer.seekTo(positionMs));
}
export function reset() {
  return callVoid(() => ExpoNativeTrackPlayer.reset());
}
export function setRepeatMode(mode, startMs, endMs) {
  return callVoid(() => ExpoNativeTrackPlayer.setRepeatMode(mode, startMs ?? null, endMs ?? null));
}
export function getRepeatMode() {
  return callValue(() => ExpoNativeTrackPlayer.getRepeatMode());
}
export function getCurrentTrack() {
  return callValue(() => ExpoNativeTrackPlayer.getCurrentTrack());
}
export function getCurrentTrackIndex() {
  return callValue(() => ExpoNativeTrackPlayer.getCurrentTrackIndex());
}
export function getPosition() {
  return callValue(() => ExpoNativeTrackPlayer.getPosition());
}
export function getDuration() {
  return callValue(() => ExpoNativeTrackPlayer.getDuration());
}
export function getPlaybackState() {
  return callValue(() => ExpoNativeTrackPlayer.getPlaybackState());
}
export function setVolume(volume) {
  return callVoid(() => ExpoNativeTrackPlayer.setVolume(volume));
}
export function getVolume() {
  return callValue(() => ExpoNativeTrackPlayer.getVolume());
}
export function setRate(rate) {
  return callVoid(() => ExpoNativeTrackPlayer.setRate(rate));
}
export function getRate() {
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
  getRate
};
export default TrackPlayer;
export { AudioEvents, Event, TrackPlayerEvents, PitchAlgorithms, TrackTypes, useCurrentTrack, useCurrentTrackIndex, usePlaybackState, useProgress, useQueue };
//# sourceMappingURL=index.js.map