package com.commitcat.plugin.widget

import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.StatusBarWidget
import com.intellij.openapi.wm.StatusBarWidgetFactory

class CommitCatWidgetFactory : StatusBarWidgetFactory {
    override fun getId(): String = WIDGET_ID
    override fun getDisplayName(): String = "CommitCat"
    override fun createWidget(project: Project): StatusBarWidget = CommitCatStatusBarWidget()
    override fun isAvailable(project: Project): Boolean = true
    override fun isEnabledByDefault(): Boolean = true

    companion object {
        const val WIDGET_ID = "CommitCatWidget"
    }
}
