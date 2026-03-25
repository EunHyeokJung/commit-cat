package com.commitcat.plugin.listeners

import com.commitcat.plugin.ActivityClient
import com.intellij.openapi.editor.Document
import com.intellij.openapi.fileEditor.FileDocumentManagerListener

class CommitCatDocumentSaveListener : FileDocumentManagerListener {
    override fun beforeDocumentSaving(document: Document) {
        ActivityClient.sendSave()
    }
}
