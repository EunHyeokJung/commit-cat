package com.commitcat.plugin.widget

import com.intellij.openapi.wm.StatusBar
import com.intellij.openapi.wm.StatusBarWidget
import com.intellij.util.Consumer
import java.awt.Component
import java.awt.event.MouseEvent

class CommitCatStatusBarWidget : StatusBarWidget, StatusBarWidget.TextPresentation {
    override fun ID(): String = CommitCatWidgetFactory.WIDGET_ID
    override fun getPresentation(): StatusBarWidget.WidgetPresentation = this
    override fun getText(): String = "\uD83D\uDC31 CommitCat"
    override fun getTooltipText(): String = "CommitCat is tracking your activity"
    override fun getAlignment(): Float = Component.CENTER_ALIGNMENT
    override fun getClickConsumer(): Consumer<MouseEvent>? = null
    override fun install(statusBar: StatusBar) {}
    override fun dispose() {}
}
