"use strict";

import { useEffect, useState } from 'react';
import ExpoNativeTrackPlayer from "./NativeExpoNativeTrackPlayer.js";
import { addEventListener, Event, TrackPlayerEvents } from "./events.js";
export function usePlaybackState() {
  const [state, setState] = useState('none');
  useEffect(() => {
    const subscription = addEventListener(Event.PlaybackState, event => setState(event.state));
    return () => subscription.remove();
  }, []);
  return state;
}
export function useProgress(intervalMs = 1000) {
  const [progress, setProgress] = useState({
    position: 0,
    duration: 0,
    trackIndex: -1
  });
  useEffect(() => {
    if (!Number.isFinite(intervalMs) || intervalMs <= 0) return;
    let isActive = true;
    const update = () => {
      if (!isActive) return;
      try {
        const position = ExpoNativeTrackPlayer.getPosition();
        const duration = ExpoNativeTrackPlayer.getDuration();
        const trackIndex = ExpoNativeTrackPlayer.getCurrentTrackIndex();
        setProgress({
          position,
          duration,
          trackIndex
        });
      } catch (error) {
        setProgress({
          position: 0,
          duration: 0,
          trackIndex: -1
        });
      }
    };
    update();
    const timer = setInterval(update, intervalMs);
    return () => {
      isActive = false;
      clearInterval(timer);
    };
  }, [intervalMs]);
  return progress;
}
export function useQueue() {
  const [queue, setQueue] = useState([]);
  useEffect(() => {
    let isActive = true;
    try {
      const result = ExpoNativeTrackPlayer.getQueue();
      if (isActive) setQueue(result);
    } catch (error) {
      if (isActive) setQueue([]);
    }
    const subscription = addEventListener(TrackPlayerEvents.QueueUpdated, event => setQueue(event.queue));
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);
  return queue;
}
export function useCurrentTrack() {
  const [track, setTrack] = useState(null);
  useEffect(() => {
    let isActive = true;
    try {
      const result = ExpoNativeTrackPlayer.getCurrentTrack();
      if (isActive) setTrack(result);
    } catch (error) {
      if (isActive) setTrack(null);
    }
    const subscription = addEventListener(Event.PlaybackActiveTrackChanged, event => setTrack(event.track));
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);
  return track;
}
export function useCurrentTrackIndex() {
  const [index, setIndex] = useState(-1);
  useEffect(() => {
    let isActive = true;
    try {
      const result = ExpoNativeTrackPlayer.getCurrentTrackIndex();
      if (isActive) setIndex(result);
    } catch (error) {
      if (isActive) setIndex(-1);
    }
    const subscription = addEventListener(Event.PlaybackActiveTrackChanged, event => setIndex(event.trackIndex));
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);
  return index;
}
//# sourceMappingURL=hooks.js.map