"use strict";

export const TrackTypes = {
  Default: 'default',
  Dash: 'dash',
  Hls: 'hls',
  SmoothStreaming: 'smoothstreaming'
};
export const PitchAlgorithms = {
  Linear: 'linear',
  Music: 'music',
  Voice: 'voice'
};
export const State = {
  None: 'none',
  Ready: 'ready',
  Playing: 'playing',
  Paused: 'paused',
  Stopped: 'stopped',
  Loading: 'loading',
  Buffering: 'buffering',
  Error: 'error',
  Ended: 'ended'
};
export const RepeatModes = {
  Off: 'off',
  Track: 'track',
  Queue: 'queue',
  LoopPortion: 'loop_portion'
};
//# sourceMappingURL=constants.js.map