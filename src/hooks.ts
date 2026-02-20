import { useEffect, useState } from 'react';
import ExpoNativeTrackPlayer, {
  type State,
  type TrackMetadata,
} from './NativeExpoNativeTrackPlayer';
import {
  addEventListener,
  Event,
  type PlaybackStateEvent,
  type QueueUpdatedEvent,
  type TrackChangedEvent,
  TrackPlayerEvents,
} from './events';

export interface PlaybackProgress {
  position: number;
  duration: number;
  trackIndex: number;
}

export function usePlaybackState(): State {
  const [state, setState] = useState<State>('none');

  useEffect(() => {
    const subscription = addEventListener<PlaybackStateEvent>(
      Event.PlaybackState,
      (event) => setState(event.state)
    );
    return () => subscription.remove();
  }, []);

  return state;
}

export function useProgress(intervalMs: number = 1000): PlaybackProgress {
  const [progress, setProgress] = useState<PlaybackProgress>({
    position: 0,
    duration: 0,
    trackIndex: -1,
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
        setProgress({ position, duration, trackIndex });
      } catch {
        setProgress({ position: 0, duration: 0, trackIndex: -1 });
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

export function useQueue(): TrackMetadata[] {
  const [queue, setQueue] = useState<TrackMetadata[]>([]);

  useEffect(() => {
    let isActive = true;

    try {
      const result = ExpoNativeTrackPlayer.getQueue();
      if (isActive) setQueue(result);
    } catch {
      if (isActive) setQueue([]);
    }

    const subscription = addEventListener<QueueUpdatedEvent>(
      TrackPlayerEvents.QueueUpdated,
      (event) => setQueue(event.queue)
    );

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);

  return queue;
}

export function useCurrentTrack(): TrackMetadata | null {
  const [track, setTrack] = useState<TrackMetadata | null>(null);

  useEffect(() => {
    let isActive = true;

    try {
      const result = ExpoNativeTrackPlayer.getCurrentTrack();
      if (isActive) setTrack(result);
    } catch {
      if (isActive) setTrack(null);
    }

    const subscription = addEventListener<TrackChangedEvent>(
      Event.PlaybackActiveTrackChanged,
      (event) => setTrack(event.track)
    );

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);

  return track;
}

export function useCurrentTrackIndex(): number {
  const [index, setIndex] = useState<number>(-1);

  useEffect(() => {
    let isActive = true;

    try {
      const result = ExpoNativeTrackPlayer.getCurrentTrackIndex();
      if (isActive) setIndex(result);
    } catch {
      if (isActive) setIndex(-1);
    }

    const subscription = addEventListener<TrackChangedEvent>(
      Event.PlaybackActiveTrackChanged,
      (event) => setIndex(event.trackIndex)
    );

    return () => {
      isActive = false;
      subscription.remove();
    };
  }, []);

  return index;
}
