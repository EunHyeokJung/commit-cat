package com.commitcat.plugin.listeners

import com.commitcat.plugin.ActivityClient
import com.intellij.execution.ExecutionListener
import com.intellij.execution.process.ProcessHandler
import com.intellij.execution.runners.ExecutionEnvironment

class CommitCatExecutionListener : ExecutionListener {
    override fun processTerminated(
        executorId: String,
        env: ExecutionEnvironment,
        handler: ProcessHandler,
        exitCode: Int
    ) {
        if (exitCode == 0) {
            ActivityClient.sendBuildSuccess()
        } else {
            ActivityClient.sendBuildFail()
        }
    }
}
