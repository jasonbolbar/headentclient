package sk.tvhclient.android.tif

import android.app.Activity
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
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
                        onStartSync = { onProgress, onDone ->
                            server?.let { currentServer ->
                                lifecycleScope.launch {
                                    val (success, message) = TvhSyncManager.syncNow(
                                        context = this@TvInputSetupActivity,
                                        server = currentServer,
                                        onProgress = onProgress
                                    )
                                    if (success) {
                                        TvhSyncWorker.schedulePeriodicSync(this@TvInputSetupActivity)
                                        setResult(Activity.RESULT_OK)
                                    }
                                    onDone(success, message)
                                }
                            } ?: onDone(false, "No hay servidor configurado.")
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
    onStartSync: (onProgress: (String) -> Unit, onDone: (Boolean, String) -> Unit) -> Unit,
    onFinish: () -> Unit
) {
    var isSyncing by remember { mutableStateOf(false) }
    var syncStatusText by remember { mutableStateOf("") }
    var syncResult by remember { mutableStateOf<Pair<Boolean, String>?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0B1220))
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.7f)
                .clip(RoundedCornerShape(24.dp))
                .background(Color(0xFF162032))
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .clip(RoundedCornerShape(16.dp))
                    .background(Color(0xFF0F766E)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.LiveTv,
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(34.dp)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                text = "Configuración de Live Channels",
                color = Color.White,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = if (server != null) {
                    "Servidor: ${server.name} (${server.host}:${server.port})"
                } else {
                    "No se ha configurado ningún servidor Tvheadend."
                },
                color = Color(0xFF94A3B8),
                fontSize = 14.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(20.dp))

            // In-Progress State
            if (isSyncing) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    CircularProgressIndicator(
                        color = Color(0xFF14B8A6),
                        modifier = Modifier.size(28.dp),
                        strokeWidth = 3.dp
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = syncStatusText.ifBlank { "Conectando con el servidor..." },
                        color = Color(0xFFE2E8F0),
                        fontSize = 14.sp,
                        textAlign = TextAlign.Center
                    )
                }
            } else if (syncResult != null) {
                val (success, message) = syncResult!!
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(if (success) Color(0xFF064E3B) else Color(0xFF7F1D1D))
                        .padding(14.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            imageVector = if (success) Icons.Default.CheckCircle else Icons.Default.Error,
                            contentDescription = null,
                            tint = if (success) Color(0xFF34D399) else Color(0xFFF87171),
                            modifier = Modifier.size(24.dp)
                        )
                        Text(
                            text = message,
                            color = Color.White,
                            fontSize = 13.sp,
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Action Buttons
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                if (syncResult?.first == true) {
                    Button(
                        onClick = onFinish,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F766E))
                    ) {
                        Icon(Icons.Default.Check, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Finalizar y Ver Canales", color = Color.White)
                    }
                } else {
                    Button(
                        onClick = {
                            isSyncing = true
                            syncResult = null
                            syncStatusText = "Iniciando búsqueda de canales..."
                            onStartSync(
                                { progress -> syncStatusText = progress },
                                { success, msg ->
                                    isSyncing = false
                                    syncResult = Pair(success, msg)
                                }
                            )
                        },
                        enabled = !isSyncing && server != null,
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0F766E))
                    ) {
                        Icon(Icons.Default.Sync, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(if (isSyncing) "Sincronizando..." else "Buscar y Sincronizar Canales", color = Color.White)
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
