package com.commitcat.plugin

import com.intellij.openapi.Disposable
import com.intellij.openapi.components.Service
import com.intellij.openapi.components.service
import java.util.Timer
import java.util.TimerTask

@Service(Service.Level.APP)
class HeartbeatService : Disposable {
    private var timer: Timer? = null

    @Volatile
    var isAppActive: Boolean = true

    fun start() {
        if (timer != null) return
        timer = Timer("CommitCat-Heartbeat", true).apply {
            scheduleAtFixedRate(object : TimerTask() {
                override fun run() {
                    if (isAppActive) {
                        ActivityClient.sendHeartbeat()
                    }
                }
            }, INTERVAL_MS, INTERVAL_MS)
        }
    }

    override fun dispose() {
        timer?.cancel()
        timer = null
    }

    companion object {
        private const val INTERVAL_MS = 60_000L
        fun getInstance(): HeartbeatService = service()
    }
}
