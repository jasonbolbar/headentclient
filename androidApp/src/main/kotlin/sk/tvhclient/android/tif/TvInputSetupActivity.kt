package sk.tvhclient.android.tif

import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import sk.tvhclient.shared.Tvh

/**
 * Setup Activity launched by Android TV when configuring Headent Client as an input
 * source in Live Channels ("Canales de TV en directo").
 */
class TvInputSetupActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val server = Tvh.store.active()

        setContent {
            MaterialTheme {
                SetupScreen(
                    serverName = server?.name ?: "Tvheadend",
                    hasServer = server != null,
                    onStartSync = { onDone ->
                        val request = OneTimeWorkRequestBuilder<TvhSyncWorker>().build()
                        val wm = WorkManager.getInstance(this)
                        wm.enqueue(request)
                        TvhSyncWorker.schedulePeriodicSync(this)

                        wm.getWorkInfoByIdLiveData(request.id).observe(this) { info ->
                            if (info != null && info.state.isFinished) {
                                setResult(Activity.RESULT_OK)
                                onDone(info.state == WorkInfo.State.SUCCEEDED)
                            }
                        }
                    },
                    onFinish = {
                        setResult(Activity.RESULT_OK)
                        finish()
                    }
                )
            }
        }
    }
}

@Composable
private fun SetupScreen(
    serverName: String,
    hasServer: Boolean,
    onStartSync: (onDone: (Boolean) -> Unit) -> Unit,
    onFinish: () -> Unit
) {
    var isSyncing by remember { mutableStateOf(false) }
    var syncCompleted by remember { mutableStateOf(false) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0B1220))
            .padding(48.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.65f)
                .clip(RoundedCornerShape(24.dp))
                .background(Color(0xFF162032))
                .padding(36.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF0F766E)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.LiveTv,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(36.dp)
                )
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = "Configuración de Live Channels",
                color = Color.White,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = if (hasServer) {
                    "Servidor detectado: $serverName\nSincroniza tus canales y la guía EPG con el sistema de Android TV."
                } else {
                    "Configura tu servidor Tvheadend en la app principal antes de sincronizar."
                },
                color = Color(0xFF94A3B8),
                fontSize = 14.sp,
                lineHeight = 20.sp,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )

            Spacer(modifier = Modifier.height(28.dp))

            if (isSyncing) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    CircularProgressIndicator(
                        color = Color(0xFF14B8A6),
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 3.dp
                    )
                    Spacer(modifier = Modifier.width(16.dp))
                    Text(
                        text = "Sincronizando canales y guía EPG...",
                        color = Color(0xFFE2E8F0),
                        fontSize = 14.sp
                    )
                }
            } else if (syncCompleted) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        imageVector = Icons.Default.CheckCircle,
                        contentDescription = null,
                        tint = Color(0xFF10B981),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "¡Sincronización completada con éxito!",
                        color = Color(0xFF10B981),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = onFinish,
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF14B8A6)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(0.5f)
                ) {
                    Text(text = "Finalizar", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            } else {
                Button(
                    onClick = {
                        isSyncing = true
                        onStartSync { success ->
                            isSyncing = false
                            syncCompleted = success
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF14B8A6)),
                    shape = RoundedCornerShape(12.dp),
                    modifier = Modifier.fillMaxWidth(0.6f)
                ) {
                    Icon(imageVector = Icons.Default.Sync, contentDescription = null, tint = Color.Black)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(text = "Iniciar Sincronización", color = Color.Black, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
