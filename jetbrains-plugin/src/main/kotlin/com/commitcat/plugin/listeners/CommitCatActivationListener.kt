package com.commitcat.plugin.listeners

import com.commitcat.plugin.HeartbeatService
import com.intellij.openapi.application.ApplicationActivationListener
import com.intellij.openapi.wm.IdeFrame

class CommitCatActivationListener : ApplicationActivationListener {
    override fun applicationActivated(ideFrame: IdeFrame) {
        val service = HeartbeatService.getInstance()
        service.isAppActive = true
        service.start()
    }

    override fun applicationDeactivated(ideFrame: IdeFrame) {
        HeartbeatService.getInstance().isAppActive = false
    }
}
