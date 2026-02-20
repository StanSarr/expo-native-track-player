#import "ExpoNativeTrackPlayer.h"
#import <AVFoundation/AVFoundation.h>
#import <MediaPlayer/MediaPlayer.h>
#import <React/RCTBridge.h>

@interface ExpoNativeTrackPlayer ()

@property (nonatomic, strong) AVPlayer *player;
@property (nonatomic, strong) NSMutableArray<NSDictionary *> *queue;
@property (nonatomic, assign) NSInteger currentIndex;
@property (nonatomic, copy) NSString *repeatMode;
@property (nonatomic, strong, nullable) NSNumber *loopStartMs;
@property (nonatomic, strong, nullable) NSNumber *loopEndMs;
@property (nonatomic, copy) NSString *playbackState;
@property (nonatomic, assign) float playbackRate;
@property (nonatomic, strong, nullable) id timeObserver;
@property (nonatomic, strong, nullable) id endObserver;
@property (nonatomic, assign) double lastSnapshotSavedAtMs;

@end

@implementation ExpoNativeTrackPlayer

RCT_EXPORT_MODULE();
@synthesize bridge = _bridge;

static NSString *const ExpoNativeTrackPlayerEventPlaybackState = @"playback-state";
static NSString *const ExpoNativeTrackPlayerEventPlaybackProgress = @"playback-progress-updated";
static NSString *const ExpoNativeTrackPlayerEventPlaybackActiveTrackChanged =
  @"playback-active-track-changed";
static NSString *const ExpoNativeTrackPlayerEventPlaybackQueueEnded =
  @"playback-queue-ended";
static NSString *const ExpoNativeTrackPlayerEventQueueUpdated = @"queue-updated";
static NSString *const ExpoNativeTrackPlayerSnapshotKey =
  @"expo-native-track-player.snapshot";

- (instancetype)init
{
  if (self = [super init]) {
    _player = [[AVPlayer alloc] init];
    _queue = [NSMutableArray array];
    _currentIndex = -1;
    _repeatMode = @"off";
    _playbackState = @"stopped";
    _playbackRate = 1.0f;
    [self configureAudioSession];
    [self setupRemoteCommands];
    [self startLoopWatcher];
  }
  return self;
}

- (void)dealloc
{
  if (_timeObserver != nil) {
    [_player removeTimeObserver:_timeObserver];
    _timeObserver = nil;
  }
  if (_endObserver != nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:_endObserver];
    _endObserver = nil;
  }
}

- (NSDictionary *)dictionaryFromTrack:(JS::NativeExpoNativeTrackPlayer::TrackMetadata &)track
{
  NSMutableDictionary *dictionary = [NSMutableDictionary dictionary];
  dictionary[@"id"] = track.id_();
  dictionary[@"url"] = track.url();

  if (track.title().length > 0) dictionary[@"title"] = track.title();
  if (track.artist().length > 0) dictionary[@"artist"] = track.artist();
  if (track.albumName().length > 0) dictionary[@"albumName"] = track.albumName();
  if (track.artworkUri().length > 0) dictionary[@"artworkUri"] = track.artworkUri();
  if (track.type().length > 0) dictionary[@"type"] = track.type();
  if (track.userAgent().length > 0) dictionary[@"userAgent"] = track.userAgent();
  if (track.contentType().length > 0) dictionary[@"contentType"] = track.contentType();
  if (track.pitchAlgorithm().length > 0) dictionary[@"pitchAlgorithm"] = track.pitchAlgorithm();
  if (track.composer().length > 0) dictionary[@"composer"] = track.composer();
  if (track.conductor().length > 0) dictionary[@"conductor"] = track.conductor();
  if (track.genre().length > 0) dictionary[@"genre"] = track.genre();
  if (track.compilation().length > 0) dictionary[@"compilation"] = track.compilation();
  if (track.subtitle().length > 0) dictionary[@"subtitle"] = track.subtitle();
  if (track.description().length > 0) dictionary[@"description"] = track.description();
  if (track.station().length > 0) dictionary[@"station"] = track.station();
  if (track.trackNumber().has_value()) {
    dictionary[@"trackNumber"] = @(track.trackNumber().value());
  }
  if (track.duration().has_value()) {
    dictionary[@"duration"] = @(track.duration().value());
  }
  if (track.mediaType().has_value()) {
    dictionary[@"mediaType"] = @(track.mediaType().value());
  }

  return dictionary;
}

- (NSNumber * _Nullable)nullableNumberFrom:(NSNumber *)value
{
  if (value == (id)kCFNull) return nil;
  return value;
}

- (void)addListener:(NSString *)eventName
{
}

- (void)removeListeners:(double)count
{
}

- (void)emitEvent:(NSString *)name body:(NSDictionary *)body
{
  if (self.bridge == nil || name.length == 0) return;
  NSArray *args = body != nil ? @[name, body] : @[name, [NSNull null]];
  [self.bridge enqueueJSCall:@"RCTDeviceEventEmitter" method:@"emit" args:args completion:NULL];
}

- (void)emitPlaybackState
{
  [self emitEvent:ExpoNativeTrackPlayerEventPlaybackState body:@{
    @"state": self.playbackState ?: @"stopped"
  }];
  [self updateNowPlayingInfo];
}

- (void)emitQueueUpdated
{
  NSDictionary *payload = @{
    @"count": @(self.queue.count),
    @"trackIndex": @(self.currentIndex),
    @"queue": [self.queue copy]
  };
  [self emitEvent:ExpoNativeTrackPlayerEventQueueUpdated body:payload];
}

- (void)emitTrackChanged
{
  NSDictionary *track = nil;
  if (self.currentIndex >= 0 && self.currentIndex < (NSInteger)self.queue.count) {
    track = self.queue[(NSUInteger)self.currentIndex];
  }
  NSDictionary *payload = @{
    @"trackIndex": @(self.currentIndex),
    @"track": track ?: (id)kCFNull
  };
  [self emitEvent:ExpoNativeTrackPlayerEventPlaybackActiveTrackChanged body:payload];
  [self updateNowPlayingInfo];
}

- (void)emitPlaybackPositionWithPosition:(double)position
                               duration:(double)duration
                              trackIndex:(NSInteger)trackIndex
{
  NSDictionary *payload = @{
    @"position": @(position),
    @"duration": @(duration),
    @"trackIndex": @(trackIndex)
  };
  [self emitEvent:ExpoNativeTrackPlayerEventPlaybackProgress body:payload];
  [self updateNowPlayingInfoWithPosition:position duration:duration];
  [self saveSnapshotIfNeededWithPosition:position duration:duration trackIndex:trackIndex force:NO];
}

- (void)emitPlaybackQueueEnded
{
  NSDictionary *payload = @{
    @"trackIndex": @(self.currentIndex),
    @"position": @([self getPosition].doubleValue)
  };
  [self emitEvent:ExpoNativeTrackPlayerEventPlaybackQueueEnded body:payload];
}

- (void)addToQueue:(JS::NativeExpoNativeTrackPlayer::TrackMetadata &)track
{
  NSDictionary *dictionary = [self dictionaryFromTrack:track];
  [self.queue addObject:dictionary];
  [self emitQueueUpdated];
}

- (void)addQueue:(NSArray *)tracks
{
  if (tracks == nil) return;
  for (NSDictionary *track in tracks) {
    if (![track isKindOfClass:[NSDictionary class]]) continue;
    [self.queue addObject:track];
  }
  [self emitQueueUpdated];
}

- (NSArray<NSDictionary *> *)getQueue
{
  return [self.queue copy];
}

- (void)removeFromQueue:(NSString *)trackId
{
  if (trackId.length == 0) return;
  __block NSInteger indexToRemove = NSNotFound;
  [self.queue enumerateObjectsUsingBlock:^(NSDictionary *track, NSUInteger idx, BOOL *stop) {
    if ([[track objectForKey:@"id"] isEqualToString:trackId]) {
      indexToRemove = (NSInteger)idx;
      *stop = YES;
    }
  }];
  if (indexToRemove == NSNotFound) return;

  [self.queue removeObjectAtIndex:indexToRemove];
  if (indexToRemove == self.currentIndex) {
    [self stopInternal];
    self.currentIndex = -1;
    [self emitTrackChanged];
  } else if (indexToRemove < self.currentIndex) {
    self.currentIndex -= 1;
    [self emitTrackChanged];
  }
  [self emitQueueUpdated];
}

- (void)clearQueue
{
  [self.queue removeAllObjects];
  [self stopInternal];
  self.currentIndex = -1;
  [self emitQueueUpdated];
  [self emitTrackChanged];
}

- (void)play:(NSNumber *)index
{
  [self playInternal:[self nullableNumberFrom:index]];
}

- (void)pause
{
  [self.player pause];
  [self setPlaybackState:@"paused"];
}

- (void)stop
{
  [self stopInternal];
}

- (void)skipToNext
{
  [self playInternal:@(self.currentIndex + 1)];
}

- (void)skipToPrevious
{
  [self playInternal:@(self.currentIndex - 1)];
}

- (void)skipToIndex:(double)index
{
  [self playInternal:@((NSInteger)index)];
}

- (void)seekTo:(double)positionMs
{
  CMTime position = CMTimeMakeWithSeconds(positionMs / 1000.0, 600);
  [self.player seekToTime:position];
}

- (void)reset
{
  [self.queue removeAllObjects];
  [self stopInternal];
  self.currentIndex = -1;
  [self emitQueueUpdated];
  [self emitTrackChanged];
}

- (void)setRepeatMode:(NSString *)mode startMs:(NSNumber *)startMs endMs:(NSNumber *)endMs
{
  self.repeatMode = mode ?: @"off";
  self.loopStartMs = [self nullableNumberFrom:startMs];
  self.loopEndMs = [self nullableNumberFrom:endMs];
}

- (NSString *)getRepeatMode
{
  return self.repeatMode;
}

- (NSDictionary * _Nullable)getCurrentTrack
{
  if (self.currentIndex < 0 || self.currentIndex >= (NSInteger)self.queue.count) return nil;
  return self.queue[self.currentIndex];
}

- (NSNumber *)getCurrentTrackIndex
{
  return @(self.currentIndex);
}

- (NSNumber *)getPosition
{
  return @(CMTimeGetSeconds([self.player currentTime]) * 1000.0);
}

- (NSNumber *)getDuration
{
  double duration = CMTimeGetSeconds(self.player.currentItem.duration);
  return @(isfinite(duration) ? duration * 1000.0 : 0.0);
}

- (NSString *)getPlaybackState
{
  return self.playbackState;
}

- (void)setVolume:(double)volume
{
  self.player.volume = (float)volume;
}

- (NSNumber *)getVolume
{
  return @(self.player.volume);
}

- (void)setRate:(double)rate
{
  self.playbackRate = (float)rate;
  if ([self.playbackState isEqualToString:@"playing"]) {
    [self.player playImmediatelyAtRate:self.playbackRate];
  }
}

- (NSNumber *)getRate
{
  return @(self.playbackRate);
}

- (void)playInternal:(NSNumber * _Nullable)index
{
  if (self.queue.count == 0) return;
  if (index != nil) {
    NSInteger target = [index integerValue];
    if (target < 0 || target >= (NSInteger)self.queue.count) return;
    [self loadTrackAtIndex:target];
  } else if (self.currentIndex < 0) {
    [self loadTrackAtIndex:0];
  }
  [self.player playImmediatelyAtRate:self.playbackRate];
  [self setPlaybackState:@"playing"];
}

- (void)loadTrackAtIndex:(NSInteger)index
{
  NSDictionary *track = self.queue[index];
  NSString *urlString = [track objectForKey:@"url"];
  if (urlString.length == 0) return;
  NSURL *url = [NSURL URLWithString:urlString];
  if (!url) return;

  AVPlayerItem *item = [AVPlayerItem playerItemWithURL:url];
  [self.player replaceCurrentItemWithPlayerItem:item];
  self.currentIndex = index;
  [self observeItemEnd:item];
  [self emitTrackChanged];
}

- (void)observeItemEnd:(AVPlayerItem *)item
{
  if (self.endObserver != nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:self.endObserver];
  }
  __weak ExpoNativeTrackPlayer *weakSelf = self;
  self.endObserver = [[NSNotificationCenter defaultCenter]
    addObserverForName:AVPlayerItemDidPlayToEndTimeNotification
                object:item
                 queue:[NSOperationQueue mainQueue]
            usingBlock:^(NSNotification *note) {
              [weakSelf handleTrackEnded];
            }];
}

- (void)handleTrackEnded
{
  if ([self.repeatMode isEqualToString:@"track"]) {
    [self.player seekToTime:kCMTimeZero];
    [self.player playImmediatelyAtRate:self.playbackRate];
    return;
  }
  if ([self.repeatMode isEqualToString:@"queue"]) {
    NSInteger nextIndex = self.currentIndex + 1;
    if (nextIndex >= (NSInteger)self.queue.count) {
      [self loadTrackAtIndex:0];
    } else {
      [self loadTrackAtIndex:nextIndex];
    }
    [self.player playImmediatelyAtRate:self.playbackRate];
    return;
  }
  if ([self.repeatMode isEqualToString:@"loop_portion"]) {
    [self seekToLoopStart];
    [self.player playImmediatelyAtRate:self.playbackRate];
    return;
  }
  NSInteger nextIndex = self.currentIndex + 1;
  if (nextIndex < (NSInteger)self.queue.count) {
    [self loadTrackAtIndex:nextIndex];
    [self.player playImmediatelyAtRate:self.playbackRate];
  } else {
    [self setPlaybackState:@"ended"];
    [self emitPlaybackQueueEnded];
  }
}

- (void)startLoopWatcher
{
  __weak ExpoNativeTrackPlayer *weakSelf = self;
  CMTime interval = CMTimeMakeWithSeconds(0.1, 600);
  self.timeObserver = [self.player addPeriodicTimeObserverForInterval:interval
                                                                queue:dispatch_get_main_queue()
                                                           usingBlock:^(CMTime time) {
    double positionMs = CMTimeGetSeconds(time) * 1000.0;
    [weakSelf handleLoopPortionIfNeeded:positionMs];
    double durationMs = 0.0;
    AVPlayerItem *item = weakSelf.player.currentItem;
    if (item != nil) {
      durationMs = CMTimeGetSeconds(item.duration) * 1000.0;
      if (isnan(durationMs) || isinf(durationMs)) {
        durationMs = 0.0;
      }
    }
    [weakSelf emitPlaybackPositionWithPosition:positionMs
                                      duration:durationMs
                                     trackIndex:weakSelf.currentIndex];
  }];
}

- (void)handleLoopPortionIfNeeded:(double)positionMs
{
  if (![self.repeatMode isEqualToString:@"loop_portion"]) return;
  if (self.loopStartMs == nil || self.loopEndMs == nil) return;
  double startMs = [self.loopStartMs doubleValue];
  double endMs = [self.loopEndMs doubleValue];
  if (endMs <= startMs) return;
  if (positionMs >= endMs) {
    [self seekToLoopStart];
  }
}

- (void)seekToLoopStart
{
  double startMs = self.loopStartMs != nil ? [self.loopStartMs doubleValue] : 0.0;
  CMTime position = CMTimeMakeWithSeconds(startMs / 1000.0, 600);
  [self.player seekToTime:position];
}

- (void)stopInternal
{
  [self.player pause];
  [self.player seekToTime:kCMTimeZero];
  [self setPlaybackState:@"stopped"];
}

- (void)setPlaybackState:(NSString *)state
{
  NSString *nextState = state ?: @"stopped";
  _playbackState = [nextState copy];
  [self emitPlaybackState];
  [self saveSnapshotWithCurrentValuesForce:YES];
}

- (NSDictionary *)currentSnapshotWithPosition:(double)position
                                      duration:(double)duration
                                     trackIndex:(NSInteger)trackIndex
{
  NSString *trackId = nil;
  if (trackIndex >= 0 && trackIndex < (NSInteger)self.queue.count) {
    NSDictionary *track = self.queue[(NSUInteger)trackIndex];
    if ([track[@"id"] isKindOfClass:[NSString class]]) {
      trackId = track[@"id"];
    }
  }
  double savedAt = [[NSDate date] timeIntervalSince1970] * 1000.0;
  double safePosition = isfinite(position) ? position : 0.0;
  double safeDuration = isfinite(duration) ? duration : 0.0;
  NSMutableDictionary *snapshot = [@{
    @"state": self.playbackState ?: @"stopped",
    @"position": @(safePosition),
    @"duration": @(safeDuration),
    @"trackIndex": @(trackIndex),
    @"rate": @(self.playbackRate),
    @"volume": @(self.player.volume),
    @"repeatMode": self.repeatMode ?: @"off",
    @"savedAt": @(savedAt)
  } mutableCopy];
  if (trackId != nil) {
    snapshot[@"trackId"] = trackId;
  }
  return snapshot;
}

- (void)saveSnapshotIfNeededWithPosition:(double)position
                                duration:(double)duration
                               trackIndex:(NSInteger)trackIndex
                                   force:(BOOL)force
{
  if (trackIndex < 0) {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:ExpoNativeTrackPlayerSnapshotKey];
    return;
  }
  if (!isfinite(position) || !isfinite(duration)) {
    return;
  }
  double nowMs = [[NSDate date] timeIntervalSince1970] * 1000.0;
  if (!force && nowMs - self.lastSnapshotSavedAtMs < 1000.0) return;
  self.lastSnapshotSavedAtMs = nowMs;
  NSDictionary *snapshot =
    [self currentSnapshotWithPosition:position duration:duration trackIndex:trackIndex];
  if (![NSPropertyListSerialization propertyList:snapshot
                                        isValidForFormat:NSPropertyListBinaryFormat_v1_0]) {
    return;
  }
  [[NSUserDefaults standardUserDefaults] setObject:snapshot
                                            forKey:ExpoNativeTrackPlayerSnapshotKey];
}

- (void)saveSnapshotWithCurrentValuesForce:(BOOL)force
{
  if (self.currentIndex < 0) {
    [[NSUserDefaults standardUserDefaults] removeObjectForKey:ExpoNativeTrackPlayerSnapshotKey];
    return;
  }
  double position = CMTimeGetSeconds([self.player currentTime]) * 1000.0;
  if (!isfinite(position)) {
    position = 0.0;
  }
  double duration = 0.0;
  AVPlayerItem *item = self.player.currentItem;
  if (item != nil) {
    duration = CMTimeGetSeconds(item.duration) * 1000.0;
    if (!isfinite(duration)) {
      duration = 0.0;
    }
  }
  [self saveSnapshotIfNeededWithPosition:position
                                duration:duration
                               trackIndex:self.currentIndex
                                   force:force];
}

- (NSDictionary * _Nullable)getLastPlaybackSnapshot
{
  NSDictionary *snapshot =
    [[NSUserDefaults standardUserDefaults] objectForKey:ExpoNativeTrackPlayerSnapshotKey];
  if (![snapshot isKindOfClass:[NSDictionary class]]) return nil;
  return snapshot;
}

- (void)configureAudioSession
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
  NSError *error = nil;
  [session setCategory:AVAudioSessionCategoryPlayback error:&error];
  [session setActive:YES error:&error];
}

- (void)setupRemoteCommands
{
  MPRemoteCommandCenter *commandCenter = [MPRemoteCommandCenter sharedCommandCenter];
  commandCenter.playCommand.enabled = YES;
  commandCenter.pauseCommand.enabled = YES;
  commandCenter.nextTrackCommand.enabled = YES;
  commandCenter.previousTrackCommand.enabled = YES;
  commandCenter.changePlaybackPositionCommand.enabled = YES;
  commandCenter.skipForwardCommand.enabled = YES;
  commandCenter.skipBackwardCommand.enabled = YES;
  commandCenter.skipForwardCommand.preferredIntervals = @[@(15)];
  commandCenter.skipBackwardCommand.preferredIntervals = @[@(15)];

  __weak ExpoNativeTrackPlayer *weakSelf = self;
  [commandCenter.playCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    [weakSelf playInternal:nil];
    return MPRemoteCommandHandlerStatusSuccess;
  }];
  [commandCenter.pauseCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    [weakSelf pause];
    return MPRemoteCommandHandlerStatusSuccess;
  }];
  [commandCenter.nextTrackCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    [weakSelf skipToNext];
    return MPRemoteCommandHandlerStatusSuccess;
  }];
  [commandCenter.previousTrackCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    [weakSelf skipToPrevious];
    return MPRemoteCommandHandlerStatusSuccess;
  }];
  [commandCenter.changePlaybackPositionCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    if (![event isKindOfClass:[MPChangePlaybackPositionCommandEvent class]]) {
      return MPRemoteCommandHandlerStatusCommandFailed;
    }
    MPChangePlaybackPositionCommandEvent *seekEvent = (MPChangePlaybackPositionCommandEvent *)event;
    double positionMs = seekEvent.positionTime * 1000.0;
    [weakSelf seekTo:positionMs];
    return MPRemoteCommandHandlerStatusSuccess;
  }];
  [commandCenter.skipForwardCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    double position = CMTimeGetSeconds([weakSelf.player currentTime]) * 1000.0;
    [weakSelf seekTo:(position + 15000.0)];
    return MPRemoteCommandHandlerStatusSuccess;
  }];
  [commandCenter.skipBackwardCommand addTargetWithHandler:^MPRemoteCommandHandlerStatus(MPRemoteCommandEvent *event) {
    double position = CMTimeGetSeconds([weakSelf.player currentTime]) * 1000.0;
    [weakSelf seekTo:MAX(0.0, position - 15000.0)];
    return MPRemoteCommandHandlerStatusSuccess;
  }];
}

- (void)updateNowPlayingInfo
{
  NSDictionary *track = nil;
  if (self.currentIndex >= 0 && self.currentIndex < (NSInteger)self.queue.count) {
    track = self.queue[(NSUInteger)self.currentIndex];
  }
  NSMutableDictionary *info = [NSMutableDictionary dictionary];
  if (track[@"title"]) info[MPMediaItemPropertyTitle] = track[@"title"];
  if (track[@"artist"]) info[MPMediaItemPropertyArtist] = track[@"artist"];
  if (track[@"albumName"]) info[MPMediaItemPropertyAlbumTitle] = track[@"albumName"];
  if (track[@"artworkUri"] && [track[@"artworkUri"] isKindOfClass:[NSString class]]) {
    NSString *artworkUri = track[@"artworkUri"];
    NSURL *url = [NSURL URLWithString:artworkUri];
    if (url != nil) {
      dispatch_async(dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0), ^{
        NSData *data = [NSData dataWithContentsOfURL:url];
        UIImage *image = data != nil ? [UIImage imageWithData:data] : nil;
        if (image != nil) {
          MPMediaItemArtwork *artwork =
            [[MPMediaItemArtwork alloc] initWithBoundsSize:image.size
                                             requestHandler:^UIImage * _Nonnull(CGSize size) {
            return image;
          }];
          dispatch_async(dispatch_get_main_queue(), ^{
            NSMutableDictionary *updated = [info mutableCopy];
            updated[MPMediaItemPropertyArtwork] = artwork;
            [MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = updated;
          });
        }
      });
    }
  }
  double position = CMTimeGetSeconds([self.player currentTime]);
  double duration = 0.0;
  AVPlayerItem *item = self.player.currentItem;
  if (item != nil) {
    duration = CMTimeGetSeconds(item.duration);
    if (!isfinite(duration)) {
      duration = 0.0;
    }
  }
  if (isfinite(position)) {
    info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = @(position);
  }
  info[MPMediaItemPropertyPlaybackDuration] = @(duration);
  info[MPNowPlayingInfoPropertyPlaybackRate] =
    [self.playbackState isEqualToString:@"playing"] ? @(self.playbackRate) : @(0);
  [MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = info;
}

- (void)updateNowPlayingInfoWithPosition:(double)positionMs duration:(double)durationMs
{
  NSMutableDictionary *info =
    [[MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo mutableCopy];
  if (info == nil) {
    [self updateNowPlayingInfo];
    return;
  }
  double position = positionMs / 1000.0;
  double duration = durationMs / 1000.0;
  if (isfinite(position)) {
    info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = @(position);
  }
  if (isfinite(duration)) {
    info[MPMediaItemPropertyPlaybackDuration] = @(duration);
  }
  info[MPNowPlayingInfoPropertyPlaybackRate] =
    [self.playbackState isEqualToString:@"playing"] ? @(self.playbackRate) : @(0);
  [MPNowPlayingInfoCenter defaultCenter].nowPlayingInfo = info;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeExpoNativeTrackPlayerSpecJSI>(params);
}

@end
