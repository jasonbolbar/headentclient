package sk.tvhclient.android.tif

import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.LiveTv
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
import sk.tvhclient.android.ui.ServerConfigScreen
import sk.tvhclient.shared.Tvh
import sk.tvhclient.shared.model.TvhServer

class TvInputSetupActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                var server by remember { mutableStateOf(Tvh.store.active()) }
                var showConfig by remember { mutableStateOf(server == null) }

                if (showConfig) {
                    ServerConfigScreen(
                        initialServer = server,
                        onServerSaved = { savedServer ->
                            server = savedServer
                            showConfig = false
                        },
                        onCancel = if (server != null) {
                            { showConfig = false }
                        } else null
                    )
                } else {
                    SetupScreen(
                        server = server,
                        onOpenConfig = { showConfig = true },
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
}

@Composable
private fun SetupScreen(
    server: TvhServer?,
    onOpenConfig: () -> Unit,
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
                text = if (server != null) {
                    "Servidor detectado: ${server.name} (${server.host}:${server.port})\nSincroniza tus canales y la guía EPG con el sistema de Android TV."
                } else {
                    "No se ha configurado ningún servidor Tvheadend."
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
                        tint = Color(0xFF34D399),
                        modifier = Modifier.size(24.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = "¡Sincronización finalizada correctamente!",
                        color = Color(0xFF34D399),
                        fontSize = 14.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }

            Spacer(modifier = Modifier.height(28.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                if (syncCompleted) {
                    Button(
                        onClick = onFinish,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F766E))
                    ) {
                        Text("Cerrar y Ver Canales", color = Color.White)
                    }
                } else {
                    Button(
                        onClick = {
                            isSyncing = true
                            onStartSync { success ->
                                isSyncing = false
                                if (success) {
                                    syncCompleted = true
                                }
                            }
                        },
                        enabled = !isSyncing && server != null,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F766E))
                    ) {
                        Icon(Icons.Default.Sync, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Iniciar Sincronización", color = Color.White)
                    }

                    OutlinedButton(
                        onClick = onOpenConfig,
                        enabled = !isSyncing
                    ) {
                        Icon(Icons.Default.Settings, contentDescription = null, tint = Color(0xFF38BDF8))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (server == null) "Configurar Servidor" else "Cambiar Servidor", color = Color.White)
                    }
                }
            }
        }
    }
}
