import React, { useEffect, useReducer } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import TrackPlayer, {
  type PlaybackState,
  type RepeatMode,
  type TrackMetadata,
} from 'expo-native-track-player';

interface PlayerState {
  queue: TrackMetadata[];
  currentIndex: number;
  currentTrack: TrackMetadata | null;
  positionMs: number;
  durationMs: number;
  playbackState: PlaybackState;
  repeatMode: RepeatMode;
  volume: number;
  rate: number;
  loopStartMs: number;
  loopEndMs: number;
}

type Action =
  | { type: 'setQueue'; payload: TrackMetadata[] }
  | { type: 'setCurrentTrack'; payload: TrackMetadata | null }
  | { type: 'setCurrentIndex'; payload: number }
  | { type: 'setPosition'; payload: number }
  | { type: 'setDuration'; payload: number }
  | { type: 'setPlaybackState'; payload: PlaybackState }
  | { type: 'setRepeatMode'; payload: RepeatMode }
  | { type: 'setVolume'; payload: number }
  | { type: 'setRate'; payload: number }
  | { type: 'setLoopStart'; payload: number }
  | { type: 'setLoopEnd'; payload: number };

const initialState: PlayerState = {
  queue: [],
  currentIndex: -1,
  currentTrack: null,
  positionMs: 0,
  durationMs: 0,
  playbackState: 'stopped',
  repeatMode: 'off',
  volume: 1,
  rate: 1,
  loopStartMs: 2000,
  loopEndMs: 10000,
};

function reducer(state: PlayerState, action: Action): PlayerState {
  switch (action.type) {
    case 'setQueue':
      return { ...state, queue: action.payload };
    case 'setCurrentTrack':
      return { ...state, currentTrack: action.payload };
    case 'setCurrentIndex':
      return { ...state, currentIndex: action.payload };
    case 'setPosition':
      return { ...state, positionMs: action.payload };
    case 'setDuration':
      return { ...state, durationMs: action.payload };
    case 'setPlaybackState':
      return { ...state, playbackState: action.payload };
    case 'setRepeatMode':
      return { ...state, repeatMode: action.payload };
    case 'setVolume':
      return { ...state, volume: action.payload };
    case 'setRate':
      return { ...state, rate: action.payload };
    case 'setLoopStart':
      return { ...state, loopStartMs: action.payload };
    case 'setLoopEnd':
      return { ...state, loopEndMs: action.payload };
    default:
      return state;
  }
}

const tracks: TrackMetadata[] = [
  {
    id: '001',
    url: 'https://media.deenpocket.com/quran-audio/islâm_subhî/001.mp3',
    title: 'Al-Fatihah',
    artist: 'Islam Sobhi',
  },
  {
    id: '018',
    url: 'https://media.deenpocket.com/quran-audio/islâm_subhî/018.mp3',
    title: 'Al-Kahf',
    artist: 'Islam Sobhi',
  },
  {
    id: '002',
    url: 'https://media.deenpocket.com/quran-audio/islâm_subhî/002.mp3',
    title: 'Al-Baqarah',
    artist: 'Islam Sobhi',
  },
  {
    id: '112',
    url: 'https://media.deenpocket.com/quran-audio/islâm_subhî/112.mp3',
    title: 'Al-Ikhlas',
    artist: 'Islam Sobhi',
  },
  {
    id: '113',
    url: 'https://media.deenpocket.com/quran-audio/islâm_subhî/113.mp3',
    title: 'Al-Falaq',
    artist: 'Islam Sobhi',
  },
];

function toRoundedSeconds(milliseconds: number): number {
  return Math.round(milliseconds / 1000);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    let isActive = true;
    async function bootstrap() {
      await TrackPlayer.reset();
      dispatch({ type: 'setQueue', payload: tracks });
      await TrackPlayer.addQueue(tracks);
      await delay(50);
      const queue = await TrackPlayer.getQueue();
      const repeatMode = await TrackPlayer.getRepeatMode();
      const volume = await TrackPlayer.getVolume();
      const rate = await TrackPlayer.getRate();
      if (!isActive) return;
      dispatch({
        type: 'setQueue',
        payload: queue.length > 0 ? queue : tracks,
      });
      dispatch({ type: 'setRepeatMode', payload: repeatMode });
      dispatch({ type: 'setVolume', payload: volume });
      dispatch({ type: 'setRate', payload: rate });
    }

    const interval = setInterval(async () => {
      const [positionMs, durationMs, currentIndex, playbackState] =
        await Promise.all([
          TrackPlayer.getPosition(),
          TrackPlayer.getDuration(),
          TrackPlayer.getCurrentTrackIndex(),
          TrackPlayer.getPlaybackState(),
        ]);
      const currentTrack = await TrackPlayer.getCurrentTrack();
      if (!isActive) return;
      dispatch({ type: 'setPosition', payload: positionMs });
      dispatch({ type: 'setDuration', payload: durationMs });
      dispatch({ type: 'setCurrentIndex', payload: currentIndex });
      dispatch({ type: 'setCurrentTrack', payload: currentTrack });
      dispatch({ type: 'setPlaybackState', payload: playbackState });
    }, 500);

    bootstrap();

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, []);

  async function handlePlay() {
    await TrackPlayer.play(null);
  }

  async function handlePause() {
    await TrackPlayer.pause();
  }

  async function handleStop() {
    await TrackPlayer.stop();
  }

  async function handleNext() {
    await TrackPlayer.skipToNext();
  }

  async function handlePrevious() {
    await TrackPlayer.skipToPrevious();
  }

  async function handleSeekToStart() {
    await TrackPlayer.seekTo(0);
  }

  async function handleRepeatMode(mode: RepeatMode) {
    await TrackPlayer.setRepeatMode(mode, state.loopStartMs, state.loopEndMs);
    dispatch({ type: 'setRepeatMode', payload: mode });
  }

  async function handleSetLoopStart() {
    const nextStart = Math.max(0, state.positionMs - 1000);
    dispatch({ type: 'setLoopStart', payload: nextStart });
    await TrackPlayer.setRepeatMode(
      state.repeatMode,
      nextStart,
      state.loopEndMs
    );
  }

  async function handleSetLoopEnd() {
    const nextEnd = Math.max(state.loopStartMs + 2000, state.positionMs + 1000);
    dispatch({ type: 'setLoopEnd', payload: nextEnd });
    await TrackPlayer.setRepeatMode(
      state.repeatMode,
      state.loopStartMs,
      nextEnd
    );
  }

  async function handleVolumeChange(direction: 'up' | 'down') {
    const nextVolume =
      direction === 'up'
        ? Math.min(1, state.volume + 0.1)
        : Math.max(0, state.volume - 0.1);
    dispatch({ type: 'setVolume', payload: nextVolume });
    await TrackPlayer.setVolume(nextVolume);
  }

  async function handleRateChange(direction: 'up' | 'down') {
    const nextRate =
      direction === 'up'
        ? Math.min(2, state.rate + 0.1)
        : Math.max(0.5, state.rate - 0.1);
    dispatch({ type: 'setRate', payload: nextRate });
    await TrackPlayer.setRate(nextRate);
  }

  async function handlePlayIndex(index: number) {
    await TrackPlayer.play(index);
  }

  const progress =
    state.durationMs > 0 ? state.positionMs / state.durationMs : 0;

  console.log(state.queue);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Expo Native Track Player</Text>
      <Text style={styles.subtitle}>
        {state.currentTrack?.title ?? 'No track loaded'}
      </Text>
      <Text style={styles.meta}>
        {state.currentTrack?.artist ?? 'Add tracks to start'}
      </Text>

      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>State</Text>
        <Text style={styles.infoValue}>{state.playbackState}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Repeat</Text>
        <Text style={styles.infoValue}>{state.repeatMode}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Position</Text>
        <Text style={styles.infoValue}>
          {toRoundedSeconds(state.positionMs)} s
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Duration</Text>
        <Text style={styles.infoValue}>
          {toRoundedSeconds(state.durationMs)} s
        </Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.buttonRow}>
        <ActionButton label="Prev" onPress={handlePrevious} />
        <ActionButton label="Play" onPress={handlePlay} />
        <ActionButton label="Pause" onPress={handlePause} />
        <ActionButton label="Stop" onPress={handleStop} />
        <ActionButton label="Next" onPress={handleNext} />
      </View>

      <View style={styles.buttonRow}>
        <ActionButton label="Seek 0" onPress={handleSeekToStart} />
        <ActionButton
          label={`Loop Start ${toRoundedSeconds(state.loopStartMs)}s`}
          onPress={handleSetLoopStart}
        />
        <ActionButton
          label={`Loop End ${toRoundedSeconds(state.loopEndMs)}s`}
          onPress={handleSetLoopEnd}
        />
      </View>

      <View style={styles.buttonRow}>
        {(['off', 'track', 'queue', 'loop_portion'] as RepeatMode[]).map(
          (mode) => (
            <ActionButton
              key={mode}
              label={mode}
              isActive={state.repeatMode === mode}
              onPress={() => handleRepeatMode(mode)}
            />
          )
        )}
      </View>

      <View style={styles.buttonRow}>
        <ActionButton
          label={`Vol - (${state.volume.toFixed(1)})`}
          onPress={() => handleVolumeChange('down')}
        />
        <ActionButton
          label={`Vol + (${state.volume.toFixed(1)})`}
          onPress={() => handleVolumeChange('up')}
        />
        <ActionButton
          label={`Rate - (${state.rate.toFixed(1)})`}
          onPress={() => handleRateChange('down')}
        />
        <ActionButton
          label={`Rate + (${state.rate.toFixed(1)})`}
          onPress={() => handleRateChange('up')}
        />
      </View>

      <Text style={styles.sectionTitle}>Queue</Text>
      {state.queue.map((track, index) => (
        <View key={track.id} style={styles.queueItem}>
          <View style={styles.queueMeta}>
            <Text style={styles.queueTitle}>{track.title ?? track.id}</Text>
            <Text style={styles.queueSubtitle}>{track.artist ?? '-'}</Text>
          </View>
          <ActionButton
            label={`Play #${index + 1}`}
            isActive={state.currentIndex === index}
            onPress={() => handlePlayIndex(index)}
          />
        </View>
      ))}
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  isActive,
}: {
  label: string;
  onPress: () => void;
  isActive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.button, isActive ? styles.buttonActive : undefined]}
    >
      <Text style={styles.buttonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#101114',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f1f5',
  },
  subtitle: {
    fontSize: 16,
    color: '#c5c7d0',
    marginTop: 6,
  },
  meta: {
    fontSize: 13,
    color: '#9aa0b5',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    color: '#a5a9b6',
  },
  infoValue: {
    color: '#f1f1f5',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#2b2f3c',
    marginVertical: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#5b7bff',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1d2130',
  },
  buttonActive: {
    backgroundColor: '#5b7bff',
  },
  buttonLabel: {
    color: '#e9ecf5',
    fontWeight: '600',
    fontSize: 12,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 8,
    color: '#f1f1f5',
    fontWeight: '700',
  },
  queueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  queueMeta: {
    flex: 1,
    marginRight: 12,
  },
  queueTitle: {
    color: '#e8ebf3',
    fontWeight: '600',
  },
  queueSubtitle: {
    color: '#9aa0b5',
    fontSize: 12,
  },
});
