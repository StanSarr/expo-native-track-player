import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import TrackPlayer, {
  type AddTrack,
  AudioEvents,
  Event,
  type RepeatMode,
  TrackPlayerEvents,
  type Track,
  useCurrentTrack,
  useCurrentTrackIndex,
  usePlaybackState,
  useProgress,
  useQueue,
} from 'expo-native-track-player';

const tracks: AddTrack[] = [
  {
    id: '001',
    url: 'https://media.deenpocket.com/quran-audio/abdelaziz_al-ahmad/001.mp3',
    title: 'Al-Fatiha',
    artist: 'Abdelaziz Al-Ahmad',
    albumName: 'Quran',
    artworkUri:
      'https://www.assabile.com/media/person/200x256/abdul-rahman-al-sudais.png',
    trackNumber: 1,
    description: 'Test track 001',
    mediaType: 1,
    customTag: 'intro',
  },
  {
    id: '018',
    url: 'https://media.deenpocket.com/quran-audio/abdelaziz_al-ahmad/018.mp3',
    title: 'Al-Kahf',
    artist: 'Abdelaziz Al-Ahmad',
    albumName: 'Quran',
    trackNumber: 18,
    artworkUri:
      'https://www.assabile.com/media/person/200x256/abdul-rahman-al-sudais.png',
    description: 'Test track 018',
    mediaType: 1,
    customTag: 'long',
  },
  {
    id: '113',
    url: 'https://media.deenpocket.com/quran-audio/abdelaziz_al-ahmad/113.mp3',
    title: 'Al-Falaq',
    artist: 'Abdelaziz Al-Ahmad',
    albumName: 'Quran',
    trackNumber: 113,
    description: 'Test track 113',
    artworkUri:
      'https://www.assabile.com/media/person/200x256/abdul-rahman-al-sudais.png',
    mediaType: 1,
    customTag: 'short',
  },
  {
    id: '114',
    url: 'https://media.deenpocket.com/quran-audio/abdelaziz_al-ahmad/114.mp3',
    title: 'An-Nas',
    artist: 'Abdelaziz Al-Ahmad',
    albumName: 'Quran',
    trackNumber: 114,
    description: 'Test track 114',
    artworkUri:
      'https://www.assabile.com/media/person/200x256/abdul-rahman-al-sudais.png',
    mediaType: 1,
    customTag: 'short',
  },
  {
    id: '112',
    url: 'https://media.deenpocket.com/quran-audio/abdelaziz_al-ahmad/112.mp3',
    title: 'Al-Ikhlas',
    artist: 'Abdelaziz Al-Ahmad',
    albumName: 'Quran',
    trackNumber: 112,
    description: 'Test track 112',
    artworkUri:
      'https://www.assabile.com/media/person/200x256/abdul-rahman-al-sudais.png',
    mediaType: 1,
    customTag: 'short',
  },
];

function getLocalTrackPath(id: string): string {
  return `${RNFS.DocumentDirectoryPath}/expo-native-track-player-${id}.mp3`;
}

function getLocalTrackUrl(localPath: string): string {
  return `file://${localPath}`;
}

async function ensureLocalTrack(track: AddTrack): Promise<AddTrack> {
  const localPath = getLocalTrackPath(track.id);
  const exists = await RNFS.exists(localPath);
  if (!exists) {
    await RNFS.downloadFile({
      fromUrl: String(track.url),
      toFile: localPath,
    }).promise;
  }

  return {
    ...track,
    url: getLocalTrackUrl(localPath),
  };
}

async function buildLocalQueue(list: AddTrack[]): Promise<AddTrack[]> {
  const results: AddTrack[] = [];
  for (const item of list) {
    results.push(await ensureLocalTrack(item));
  }
  return results;
}

function toSeconds(valueMs: number): number {
  if (!isFinite(valueMs)) return 0;
  return Math.round(valueMs / 1000);
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <AppContent />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const isDarkMode = useColorScheme() === 'dark';
  const { width } = useWindowDimensions();
  const isWide = width >= 800;
  const colors = getColors(isDarkMode);

  const playbackState = usePlaybackState();
  const currentTrack = useCurrentTrack();
  const currentTrackIndex = useCurrentTrackIndex();
  const queue = useQueue();
  const { position, duration } = useProgress(100);

  const [lastEvent, setLastEvent] = useState('none');
  const [loopStartMs, setLoopStartMs] = useState(2000);
  const [loopEndMs, setLoopEndMs] = useState(10000);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [volume, setVolumeValue] = useState(1);
  const [rate, setRateValue] = useState(1);
  const [queueSnapshot, setQueueSnapshot] = useState<Track[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    let isActive = true;

    function loadInitialState() {
      TrackPlayer.getRepeatMode()
        .then(mode => {
          if (!isActive) return;
          setRepeatMode(mode);
        })
        .catch(() => null);
      TrackPlayer.getVolume()
        .then(value => {
          if (!isActive) return;
          setVolumeValue(value);
        })
        .catch(() => null);
      TrackPlayer.getRate()
        .then(value => {
          if (!isActive) return;
          setRateValue(value);
        })
        .catch(() => null);
    }

    loadInitialState();

    const stateSubscription = AudioEvents.addTypedListener(
      Event.PlaybackState,
      payload => setLastEvent(`state: ${payload.state}`),
    );
    const progressSubscription = AudioEvents.addTypedListener(
      Event.PlaybackProgressUpdated,
      payload =>
        setLastEvent(
          `progress: ${toSeconds(payload.position)}s / ${toSeconds(
            payload.duration,
          )}s`,
        ),
    );
    const trackSubscription = AudioEvents.addTypedListener(
      Event.PlaybackActiveTrackChanged,
      payload =>
        setLastEvent(
          `track: ${payload.trackIndex ?? -1} → ${payload.trackIndex ?? -1}`,
        ),
    );
    const queueEndedSubscription = AudioEvents.addTypedListener(
      Event.PlaybackQueueEnded,
      payload => setLastEvent(`queue ended at #${payload.trackIndex + 1}`),
    );
    const queueUpdatedSubscription = AudioEvents.addTypedListener(
      TrackPlayerEvents.QueueUpdated,
      payload => setLastEvent(`queue updated (${payload.queue.length})`),
    );

    return () => {
      isActive = false;
      stateSubscription.remove();
      progressSubscription.remove();
      trackSubscription.remove();
      queueEndedSubscription.remove();
      queueUpdatedSubscription.remove();
    };
  }, []);

  const queueLabel = useMemo(
    () => queue.map(track => `${track.title ?? track.id}`).join(', '),
    [queue],
  );

  async function handleLoadQueue(): Promise<void> {
    console.log('handleLoadQueue');
    await TrackPlayer.reset();
    await TrackPlayer.addQueue(tracks);
    setQueueSnapshot(tracks);
  }

  async function handleLoadQueueLocal(): Promise<void> {
    setIsDownloading(true);
    try {
      const localQueue = await buildLocalQueue(tracks);
      await TrackPlayer.reset();
      await TrackPlayer.addQueue(localQueue);
      setQueueSnapshot(localQueue);
      setLastEvent('queue loaded from local files');
    } finally {
      setIsDownloading(false);
    }
  }

  async function handleAddOne(): Promise<void> {
    const firstTrack = tracks[0];
    if (!firstTrack) return;
    await TrackPlayer.addToQueue(firstTrack);
  }

  async function handleClearQueue(): Promise<void> {
    await TrackPlayer.clearQueue();
    setQueueSnapshot([]);
  }

  async function handleRemoveCurrent(): Promise<void> {
    if (!currentTrack?.id) return;
    await TrackPlayer.removeFromQueue(currentTrack.id);
  }

  async function handleRefreshQueue(): Promise<void> {
    const list = await TrackPlayer.getQueue();
    setQueueSnapshot(list as Track[]);
  }

  async function handlePlay(index?: number): Promise<void> {
    await TrackPlayer.play(index ?? null);
  }

  async function handlePause(): Promise<void> {
    await TrackPlayer.pause();
  }

  async function handleStop(): Promise<void> {
    await TrackPlayer.stop();
  }

  async function handleNext(): Promise<void> {
    await TrackPlayer.skipToNext();
  }

  async function handlePrevious(): Promise<void> {
    await TrackPlayer.skipToPrevious();
  }

  async function handleSeek(offsetSeconds: number): Promise<void> {
    const next = Math.max(0, position + offsetSeconds * 1000);
    await TrackPlayer.seekTo(next);
  }

  async function handleSetRepeatMode(mode: RepeatMode): Promise<void> {
    setRepeatMode(mode);
    if (mode === 'loop_portion') {
      await TrackPlayer.setRepeatMode(mode, loopStartMs, loopEndMs);
      return;
    }
    await TrackPlayer.setRepeatMode(mode);
  }

  async function handleSetLoopBounds(): Promise<void> {
    await TrackPlayer.setRepeatMode('loop_portion', loopStartMs, loopEndMs);
  }

  async function handleReset(): Promise<void> {
    await TrackPlayer.reset();
  }

  async function handleSetVolume(value: number): Promise<void> {
    setVolumeValue(value);
    await TrackPlayer.setVolume(value);
  }

  async function handleSetRate(value: number): Promise<void> {
    setRateValue(value);
    await TrackPlayer.setRate(value);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.screenContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.title }]}>
            Expo Native Track Player
          </Text>
          <Text style={[styles.subtitle, { color: colors.subtitle }]}>
            State: {playbackState} · Queue: {queue.length} · Index:{' '}
            {currentTrackIndex}
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.label }]}>
              Track
            </Text>
            <Text style={[styles.infoValue, { color: colors.value }]}>
              {currentTrack?.title ?? currentTrack?.id ?? 'none'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.label }]}>
              Position
            </Text>
            <Text style={[styles.infoValue, { color: colors.value }]}>
              {toSeconds(position)}s / {toSeconds(duration)}s
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.label }]}>
              Repeat
            </Text>
            <Text style={[styles.infoValue, { color: colors.value }]}>
              {repeatMode}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.label }]}>
              Loop
            </Text>
            <Text style={[styles.infoValue, { color: colors.value }]}>
              {toSeconds(loopStartMs)}s → {toSeconds(loopEndMs)}s
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.label }]}>
              Last event
            </Text>
            <Text style={[styles.infoValue, { color: colors.value }]}>
              {lastEvent}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>
            Queue
          </Text>
          <View style={[styles.buttonRow, isWide && styles.buttonRowWide]}>
            <Pressable style={styles.actionButton} onPress={handleLoadQueue}>
              <Text style={styles.actionText}>Load Queue</Text>
            </Pressable>
            <Pressable
              style={[
                styles.actionButton,
                isDownloading && styles.actionButtonDisabled,
              ]}
              disabled={isDownloading}
              onPress={handleLoadQueueLocal}
            >
              <Text style={styles.actionText}>
                {isDownloading ? 'Downloading...' : 'Load Local Queue'}
              </Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={async () => {
                const queue = await TrackPlayer.getQueue();
                console.log(queue);
              }}
            >
              <Text style={styles.actionText}>get Queue Console</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleAddOne}>
              <Text style={styles.actionText}>Add First</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleClearQueue}>
              <Text style={styles.actionText}>Clear</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={handleRemoveCurrent}
            >
              <Text style={styles.actionText}>Remove Current</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleRefreshQueue}>
              <Text style={styles.actionText}>Refresh Queue</Text>
            </Pressable>
          </View>
          <Text style={[styles.infoSubText, { color: colors.muted }]}>
            Live: {queueLabel || 'empty'}
          </Text>
          <Text style={[styles.infoSubText, { color: colors.muted }]}>
            Snapshot: {queueSnapshot.map(item => item.id).join(', ') || 'empty'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>
            Playback
          </Text>
          <View style={[styles.buttonRow, isWide && styles.buttonRowWide]}>
            <Pressable style={styles.actionButton} onPress={() => handlePlay()}>
              <Text style={styles.actionText}>Play</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handlePlay(0)}
            >
              <Text style={styles.actionText}>Play #1</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handlePause}>
              <Text style={styles.actionText}>Pause</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleStop}>
              <Text style={styles.actionText}>Stop</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handlePrevious}>
              <Text style={styles.actionText}>Prev</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleNext}>
              <Text style={styles.actionText}>Next</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSeek(-10)}
            >
              <Text style={styles.actionText}>Seek -10s</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSeek(10)}
            >
              <Text style={styles.actionText}>Seek +10s</Text>
            </Pressable>
            <Pressable style={styles.actionButton} onPress={handleReset}>
              <Text style={styles.actionText}>Reset</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>
            Repeat
          </Text>
          <View style={[styles.buttonRow, isWide && styles.buttonRowWide]}>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSetRepeatMode('off')}
            >
              <Text style={styles.actionText}>Off</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSetRepeatMode('track')}
            >
              <Text style={styles.actionText}>Track</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSetRepeatMode('queue')}
            >
              <Text style={styles.actionText}>Queue</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSetRepeatMode('loop_portion')}
            >
              <Text style={styles.actionText}>Loop Portion</Text>
            </Pressable>
          </View>
          <View style={[styles.buttonRow, isWide && styles.buttonRowWide]}>
            <Pressable
              style={styles.actionButton}
              onPress={() => setLoopStartMs(value => value + 1000)}
            >
              <Text style={styles.actionText}>Start +1s</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => setLoopStartMs(value => Math.max(0, value - 1000))}
            >
              <Text style={styles.actionText}>Start -1s</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => setLoopEndMs(value => value + 1000)}
            >
              <Text style={styles.actionText}>End +1s</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() =>
                setLoopEndMs(value =>
                  Math.max(loopStartMs + 1000, value - 1000),
                )
              }
            >
              <Text style={styles.actionText}>End -1s</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={handleSetLoopBounds}
            >
              <Text style={styles.actionText}>Apply Loop</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>
            Audio
          </Text>
          <View style={[styles.buttonRow, isWide && styles.buttonRowWide]}>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSetVolume(0)}
            >
              <Text style={styles.actionText}>Mute</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSetVolume(0.5)}
            >
              <Text style={styles.actionText}>Volume 0.5</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSetVolume(1)}
            >
              <Text style={styles.actionText}>Volume 1.0</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSetRate(0.75)}
            >
              <Text style={styles.actionText}>Rate 0.75</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSetRate(1)}
            >
              <Text style={styles.actionText}>Rate 1.0</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleSetRate(1.25)}
            >
              <Text style={styles.actionText}>Rate 1.25</Text>
            </Pressable>
          </View>
          <Text style={[styles.infoSubText, { color: colors.muted }]}>
            Volume: {volume.toFixed(2)} · Rate: {rate.toFixed(2)}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function getColors(isDarkMode: boolean) {
  return {
    background: isDarkMode ? '#0b0b0b' : '#f5f5f5',
    card: isDarkMode ? '#141414' : '#ffffff',
    title: isDarkMode ? '#ffffff' : '#0b0b0b',
    subtitle: isDarkMode ? '#c4c4c4' : '#444444',
    sectionTitle: isDarkMode ? '#ffffff' : '#1a1a1a',
    label: isDarkMode ? '#bdbdbd' : '#606060',
    value: isDarkMode ? '#ffffff' : '#141414',
    muted: isDarkMode ? '#9b9b9b' : '#666666',
  };
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screenContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 6,
  },
  infoCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {},
  infoValue: {
    fontWeight: '600',
  },
  infoSubText: {
    marginTop: 6,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  buttonRowWide: {
    justifyContent: 'flex-start',
  },
  actionButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#1f6feb',
    marginRight: 10,
    marginBottom: 10,
  },
  actionText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
});

export default App;
