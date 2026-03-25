package com.commitcat.plugin

import java.net.HttpURLConnection
import java.net.URI
import java.util.concurrent.CompletableFuture

object ActivityClient {
    private const val URL = "http://127.0.0.1:39547/activity"
    private const val TIMEOUT_MS = 3000

    fun post(json: String) {
        CompletableFuture.runAsync {
            try {
                val conn = URI(URL).toURL().openConnection() as HttpURLConnection
                conn.requestMethod = "POST"
                conn.doOutput = true
                conn.connectTimeout = TIMEOUT_MS
                conn.readTimeout = TIMEOUT_MS
                conn.setRequestProperty("Content-Type", "application/json")
                conn.outputStream.use { it.write(json.toByteArray()) }
                conn.inputStream.use { it.readBytes() }
                conn.disconnect()
            } catch (_: Exception) {
                // CommitCat not running — silently ignore
            }
        }
    }

    fun sendHeartbeat() {
        post("""{"type":"coding_time","seconds":60}""")
    }

    fun sendFileChange(filename: String, language: String) {
        val f = filename.replace("\\", "\\\\").replace("\"", "\\\"")
        val l = language.replace("\\", "\\\\").replace("\"", "\\\"")
        post("""{"type":"file_change","filename":"$f","language":"$l"}""")
    }

    fun sendSave() {
        post("""{"type":"save"}""")
    }

    fun sendBuildSuccess() {
        post("""{"type":"build_success"}""")
    }

    fun sendBuildFail() {
        post("""{"type":"build_fail"}""")
    }
}
