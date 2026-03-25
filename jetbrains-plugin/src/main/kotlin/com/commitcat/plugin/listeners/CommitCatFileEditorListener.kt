package com.commitcat.plugin.listeners

import com.commitcat.plugin.ActivityClient
import com.intellij.openapi.fileEditor.FileEditorManagerEvent
import com.intellij.openapi.fileEditor.FileEditorManagerListener

class CommitCatFileEditorListener : FileEditorManagerListener {
    override fun selectionChanged(event: FileEditorManagerEvent) {
        val file = event.newFile ?: return
        ActivityClient.sendFileChange(file.path, file.fileType.name.lowercase())
    }
}
