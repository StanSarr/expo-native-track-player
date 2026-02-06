package com.exponativetrackplayer

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat
import androidx.media3.common.Player
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import androidx.media3.ui.PlayerNotificationManager

class ExpoNativeTrackPlayerService : MediaSessionService() {
  override fun onCreate() {
    super.onCreate()
    serviceInstance = this
  }

  override fun onDestroy() {
    serviceInstance = null
    super.onDestroy()
  }

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? {
    return mediaSession
  }

  override fun onTaskRemoved(rootIntent: Intent?) {
    super.onTaskRemoved(rootIntent)
    stopSelf()
  }

  companion object {
    private const val CHANNEL_ID = "expo_native_track_player"
    private const val CHANNEL_NAME = "Playback"
    private const val NOTIFICATION_ID = 4125
    private const val SERVICE_ACTION = "com.exponativetrackplayer.PLAYBACK_SERVICE"

    @Volatile
    private var mediaSession: MediaSession? = null

    @Volatile
    private var notificationManager: PlayerNotificationManager? = null

    @Volatile
    private var serviceInstance: ExpoNativeTrackPlayerService? = null

    fun start(context: Context, player: Player) {
      ensureSession(context, player)
      val intent = Intent(context, ExpoNativeTrackPlayerService::class.java).apply {
        action = SERVICE_ACTION
      }
      ContextCompat.startForegroundService(context, intent)
    }

    fun stop(context: Context) {
      notificationManager?.setPlayer(null)
      notificationManager = null
      mediaSession?.release()
      mediaSession = null
      context.stopService(Intent(context, ExpoNativeTrackPlayerService::class.java))
    }

    private fun ensureSession(context: Context, player: Player) {
      if (mediaSession == null) {
        mediaSession = MediaSession.Builder(context, player).build()
      } else {
        mediaSession?.player?.apply {
          if (this != player) {
            mediaSession?.release()
            mediaSession = MediaSession.Builder(context, player).build()
          }
        }
      }
      if (notificationManager == null) {
        createNotificationChannel(context)
        notificationManager = PlayerNotificationManager.Builder(
          context,
          NOTIFICATION_ID,
          CHANNEL_ID
        )
          .setNotificationListener(object : PlayerNotificationManager.NotificationListener {
            override fun onNotificationPosted(
              notificationId: Int,
              notification: android.app.Notification,
              ongoing: Boolean
            ) {
              if (ongoing) {
                serviceInstance?.startForeground(notificationId, notification)
              }
            }

            override fun onNotificationCancelled(
              notificationId: Int,
              dismissedByUser: Boolean
            ) {
              serviceInstance?.stopForeground(STOP_FOREGROUND_REMOVE)
            }
          })
          .build()
          .apply { setPlayer(player) }
      } else {
        notificationManager?.setPlayer(player)
      }
    }

    private fun createNotificationChannel(context: Context) {
      val notificationManager =
        context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      val channel = NotificationChannel(
        CHANNEL_ID,
        CHANNEL_NAME,
        NotificationManager.IMPORTANCE_LOW
      )
      notificationManager.createNotificationChannel(channel)
    }
  }
}
