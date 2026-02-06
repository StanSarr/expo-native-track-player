package com.exponativetrackplayer

import android.os.Handler
import android.os.Looper
import androidx.media3.common.AudioAttributes
import androidx.media3.common.C
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.PlaybackException
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.util.concurrent.CountDownLatch
import java.util.concurrent.atomic.AtomicReference

class ExpoNativeTrackPlayerModule(reactContext: ReactApplicationContext) :
  NativeExpoNativeTrackPlayerSpec(reactContext) {

  private val handler = Handler(Looper.getMainLooper())
  private val queue = mutableListOf<Map<String, Any?>>()
  private var currentIndex: Int = -1
  private var repeatMode: String = "off"
  private var loopStartMs: Long? = null
  private var loopEndMs: Long? = null
  private var playbackState: String = "stopped"
  private var playbackRate: Float = 1f

  private val player: ExoPlayer by lazy {
    val audioAttributes = AudioAttributes.Builder()
      .setUsage(C.USAGE_MEDIA)
      .setContentType(C.CONTENT_TYPE_MUSIC)
      .build()
    ExoPlayer.Builder(reactContext)
      .setAudioAttributes(audioAttributes, true)
      .setHandleAudioBecomingNoisy(true)
      .build()
      .apply {
      addListener(object : Player.Listener {
        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) {
          currentIndex = currentMediaItemIndex
        }

        override fun onPlaybackStateChanged(state: Int) {
          if (state == Player.STATE_ENDED) {
            handleTrackEnded()
          }
        }

        override fun onPlayerError(error: PlaybackException) {
          Log.e(TAG, "playerError code=${error.errorCode}", error)
        }
      })
    }
  }

  init {
    startLoopWatcher()
  }

  override fun addToQueue(track: ReadableMap) {
    val storedTrack = toStoredMap(track)
    queue.add(storedTrack)
    runOnMainBlocking {
      player.addMediaItem(mediaItemFor(storedTrack))
      if (player.mediaItemCount == 1) {
        player.prepare()
      }
    }
  }

  override fun addQueue(tracks: ReadableArray) {
    val storedTracks = mutableListOf<Map<String, Any?>>()
    for (index in 0 until tracks.size()) {
      val track = tracks.getMap(index) ?: continue
      storedTracks.add(toStoredMap(track))
    }
    queue.addAll(storedTracks)
    runOnMainBlocking {
      storedTracks.forEach { storedTrack ->
        player.addMediaItem(mediaItemFor(storedTrack))
      }
      if (storedTracks.isNotEmpty()) {
        player.prepare()
      }
    }
  }

  override fun getQueue(): WritableArray {
    val array = Arguments.createArray()
    queue.forEach { array.pushMap(toWritableMap(it)) }
    return array
  }

  override fun removeFromQueue(trackId: String) {
    val index = queue.indexOfFirst { (it["id"] as? String) == trackId }
    if (index == -1) return
    queue.removeAt(index)
    runOnMainBlocking {
      player.removeMediaItem(index)
      if (index == currentIndex) {
        stopInternal()
        currentIndex = -1
      } else if (index < currentIndex) {
        currentIndex -= 1
      }
    }
  }

  override fun clearQueue() {
    queue.clear()
    runOnMainBlocking {
      player.clearMediaItems()
      stopInternal()
      currentIndex = -1
    }
  }

  override fun play(index: Double?) {
    runOnMainBlocking {
      val targetIndex = index?.toInt()
      playInternal(targetIndex)
    }
  }

  override fun pause() {
    runOnMainBlocking {
      player.pause()
      setPlaybackState("paused")
    }
  }

  override fun stop() {
    runOnMainBlocking { stopInternal() }
  }

  override fun skipToNext() {
    runOnMainBlocking {
      if (player.hasNextMediaItem()) {
        player.seekToNext()
        player.play()
        setPlaybackState("playing")
      }
    }
  }

  override fun skipToPrevious() {
    runOnMainBlocking {
      if (player.hasPreviousMediaItem()) {
        player.seekToPrevious()
        player.play()
        setPlaybackState("playing")
      }
    }
  }

  override fun skipToIndex(index: Double) {
    runOnMainBlocking { playInternal(index.toInt()) }
  }

  override fun seekTo(positionMs: Double) {
    runOnMainBlocking { player.seekTo(positionMs.toLong()) }
  }

  override fun reset() {
    queue.clear()
    runOnMainBlocking {
      player.clearMediaItems()
      stopInternal()
      currentIndex = -1
    }
  }

  override fun setRepeatMode(mode: String, startMs: Double?, endMs: Double?) {
    runOnMainBlocking {
      repeatMode = mode
      loopStartMs = startMs?.toLong()
      loopEndMs = endMs?.toLong()
      applyRepeatMode()
    }
  }

  override fun getRepeatMode(): String {
    return repeatMode
  }

  override fun getCurrentTrack(): WritableMap? {
    val track = queue.getOrNull(currentIndex) ?: return null
    return toWritableMap(track)
  }

  override fun getCurrentTrackIndex(): Double {
    return currentIndex.toDouble()
  }

  override fun getPosition(): Double {
    return runOnMainBlocking { player.currentPosition.toDouble() }
  }

  override fun getDuration(): Double {
    return runOnMainBlocking {
      val duration = player.duration
      if (duration >= 0) duration.toDouble() else 0.0
    }
  }

  override fun getPlaybackState(): String {
    return playbackState
  }

  override fun setVolume(volume: Double) {
    runOnMainBlocking { player.volume = volume.toFloat() }
  }

  override fun getVolume(): Double {
    return runOnMainBlocking { player.volume.toDouble() }
  }

  override fun setRate(rate: Double) {
    runOnMainBlocking {
      playbackRate = rate.toFloat()
      player.playbackParameters = PlaybackParameters(playbackRate)
    }
  }

  override fun getRate(): Double {
    return playbackRate.toDouble()
  }

  private fun playInternal(index: Int?) {
    if (queue.isEmpty()) return
    if (index != null) {
      if (index < 0 || index >= queue.size) return
      player.seekTo(index, 0)
    } else if (currentIndex < 0) {
      player.seekTo(0, 0)
    }
    applyRepeatMode()
    player.prepare()
    player.play()
    player.playbackParameters = PlaybackParameters(playbackRate)
    setPlaybackState("playing")
    ExpoNativeTrackPlayerService.start(reactApplicationContext, player)
  }

  private fun stopInternal() {
    player.pause()
    player.seekTo(0)
    setPlaybackState("stopped")
    ExpoNativeTrackPlayerService.stop(reactApplicationContext)
  }

  private fun handleTrackEnded() {
    if (repeatMode == "track") {
      player.seekTo(currentIndex, 0)
      player.play()
      return
    }
    if (repeatMode == "queue") {
      if (currentIndex >= queue.size - 1) {
        player.seekTo(0, 0)
        player.play()
      }
      return
    }
    if (repeatMode == "loop_portion") {
      player.seekTo(currentIndex, loopStartMs ?: 0L)
      player.play()
      return
    }
    if (currentIndex < queue.size - 1) {
      player.seekTo(currentIndex + 1, 0)
      player.play()
    } else {
      setPlaybackState("stopped")
    }
  }

  private fun applyRepeatMode() {
    player.repeatMode = when (repeatMode) {
      "track" -> Player.REPEAT_MODE_ONE
      "queue" -> Player.REPEAT_MODE_ALL
      else -> Player.REPEAT_MODE_OFF
    }
  }

  private fun startLoopWatcher() {
    handler.post(object : Runnable {
      override fun run() {
        handleLoopPortionIfNeeded(player.currentPosition)
        handler.postDelayed(this, 250)
      }
    })
  }

  @Suppress("UNCHECKED_CAST")
  private fun <T> runOnMainBlocking(action: () -> T): T {
    if (Looper.myLooper() == Looper.getMainLooper()) {
      return action()
    }
    val latch = CountDownLatch(1)
    val result = AtomicReference<T?>()
    val error = AtomicReference<Throwable?>()
    handler.post {
      try {
        result.set(action())
      } catch (throwable: Throwable) {
        error.set(throwable)
      } finally {
        latch.countDown()
      }
    }
    latch.await()
    error.get()?.let { throw RuntimeException(it) }
    return result.get() as T
  }

  private fun handleLoopPortionIfNeeded(positionMs: Long) {
    if (repeatMode != "loop_portion") return
    val startMs = loopStartMs ?: return
    val endMs = loopEndMs ?: return
    if (endMs <= startMs) return
    if (positionMs >= endMs) {
      player.seekTo(currentIndex, startMs)
    }
  }

  private fun mediaItemFor(track: Map<String, Any?>): MediaItem {
    val url = track["url"] as? String ?: ""
    val id = track["id"] as? String ?: url
    val title = track["title"] as? String
    val artist = track["artist"] as? String
    val albumName = track["albumName"] as? String
    return MediaItem.Builder()
      .setMediaId(id)
      .setUri(url)
      .setMediaMetadata(
        MediaMetadata.Builder()
          .setTitle(title)
          .setArtist(artist)
          .setAlbumTitle(albumName)
          .build()
      )
      .build()
  }

  private fun setPlaybackState(state: String) {
    playbackState = state
  }

  companion object {
    const val NAME = NativeExpoNativeTrackPlayerSpec.NAME
    private const val TAG = "ExpoNativeTrackPlayer"
  }

  private fun toStoredMap(map: ReadableMap): Map<String, Any?> {
    val result = mutableMapOf<String, Any?>()
    val iterator = map.keySetIterator()
    while (iterator.hasNextKey()) {
      val key = iterator.nextKey()
      when (map.getType(key)) {
        ReadableType.Null -> result[key] = null
        ReadableType.Boolean -> result[key] = map.getBoolean(key)
        ReadableType.Number -> result[key] = map.getDouble(key)
        ReadableType.String -> result[key] = map.getString(key)
        ReadableType.Map -> {
          val child = map.getMap(key)
          result[key] = if (child == null) null else toStoredMap(child)
        }
        ReadableType.Array -> {
          val child = map.getArray(key)
          result[key] = if (child == null) null else toStoredArray(child)
        }
      }
    }
    return result
  }

  private fun toStoredArray(array: ReadableArray): List<Any?> {
    val result = mutableListOf<Any?>()
    for (index in 0 until array.size()) {
      when (array.getType(index)) {
        ReadableType.Null -> result.add(null)
        ReadableType.Boolean -> result.add(array.getBoolean(index))
        ReadableType.Number -> result.add(array.getDouble(index))
        ReadableType.String -> result.add(array.getString(index))
        ReadableType.Map -> {
          val child = array.getMap(index)
          result.add(if (child == null) null else toStoredMap(child))
        }
        ReadableType.Array -> {
          val child = array.getArray(index)
          result.add(if (child == null) null else toStoredArray(child))
        }
      }
    }
    return result
  }

  private fun toWritableMap(map: Map<String, Any?>): WritableMap {
    val result = Arguments.createMap()
    map.forEach { (key, value) ->
      when (value) {
        null -> result.putNull(key)
        is Boolean -> result.putBoolean(key, value)
        is Number -> result.putDouble(key, value.toDouble())
        is String -> result.putString(key, value)
        is Map<*, *> -> {
          @Suppress("UNCHECKED_CAST")
          result.putMap(key, toWritableMap(value as Map<String, Any?>))
        }
        is List<*> -> result.putArray(key, toWritableArray(value))
        else -> result.putNull(key)
      }
    }
    return result
  }

  private fun toWritableArray(array: List<*>): WritableArray {
    val result = Arguments.createArray()
    array.forEach { value ->
      when (value) {
        null -> result.pushNull()
        is Boolean -> result.pushBoolean(value)
        is Number -> result.pushDouble(value.toDouble())
        is String -> result.pushString(value)
        is Map<*, *> -> {
          @Suppress("UNCHECKED_CAST")
          result.pushMap(toWritableMap(value as Map<String, Any?>))
        }
        is List<*> -> result.pushArray(toWritableArray(value))
        else -> result.pushNull()
      }
    }
    return result
  }
}
