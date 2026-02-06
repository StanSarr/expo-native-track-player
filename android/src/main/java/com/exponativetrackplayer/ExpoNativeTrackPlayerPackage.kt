package com.exponativetrackplayer

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import java.util.HashMap

class ExpoNativeTrackPlayerPackage : BaseReactPackage() {
  private var module: ExpoNativeTrackPlayerModule? = null

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    if (name != ExpoNativeTrackPlayerModule.NAME) return null
    return module ?: ExpoNativeTrackPlayerModule(reactContext).also {
      module = it
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    return ReactModuleInfoProvider {
      val moduleInfos: MutableMap<String, ReactModuleInfo> = HashMap()
      moduleInfos[ExpoNativeTrackPlayerModule.NAME] = ReactModuleInfo(
        ExpoNativeTrackPlayerModule.NAME,
        ExpoNativeTrackPlayerModule.NAME,
        false,  // canOverrideExistingModule
        false,  // needsEagerInit
        false,  // isCxxModule
        true // isTurboModule
      )
      moduleInfos
    }
  }
}
