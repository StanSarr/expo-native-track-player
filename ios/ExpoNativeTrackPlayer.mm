#import "ExpoNativeTrackPlayer.h"
#import <AVFoundation/AVFoundation.h>

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

@end

@implementation ExpoNativeTrackPlayer

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

- (void)addToQueue:(JS::NativeExpoNativeTrackPlayer::TrackMetadata &)track
{
  NSDictionary *dictionary = [self dictionaryFromTrack:track];
  [self.queue addObject:dictionary];
}

- (void)addQueue:(NSArray *)tracks
{
  if (tracks == nil) return;
  for (NSDictionary *track in tracks) {
    if (![track isKindOfClass:[NSDictionary class]]) continue;
    [self.queue addObject:track];
  }
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
  } else if (indexToRemove < self.currentIndex) {
    self.currentIndex -= 1;
  }
}

- (void)clearQueue
{
  [self.queue removeAllObjects];
  [self stopInternal];
  self.currentIndex = -1;
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
    [self setPlaybackState:@"stopped"];
  }
}

- (void)startLoopWatcher
{
  __weak ExpoNativeTrackPlayer *weakSelf = self;
  CMTime interval = CMTimeMakeWithSeconds(0.25, 600);
  self.timeObserver = [self.player addPeriodicTimeObserverForInterval:interval
                                                                queue:dispatch_get_main_queue()
                                                           usingBlock:^(CMTime time) {
    double positionMs = CMTimeGetSeconds(time) * 1000.0;
    [weakSelf handleLoopPortionIfNeeded:positionMs];
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
}

- (void)configureAudioSession
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
  NSError *error = nil;
  [session setCategory:AVAudioSessionCategoryPlayback error:&error];
  [session setActive:YES error:&error];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeExpoNativeTrackPlayerSpecJSI>(params);
}

+ (NSString *)moduleName
{
  return @"ExpoNativeTrackPlayer";
}

@end
