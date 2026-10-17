package sk.tvhclient.android

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.lifecycleScope
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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkInfo
import androidx.work.WorkManager
import sk.tvhclient.android.tif.TvInputSetupActivity
import sk.tvhclient.android.tif.TvhSyncWorker
import sk.tvhclient.android.ui.ServerConfigScreen
import sk.tvhclient.shared.Tvh
import sk.tvhclient.shared.model.TvhServer

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            MaterialTheme {
                var server by remember { mutableStateOf(Tvh.store.active()) }
                var showConfigScreen by remember { mutableStateOf(server == null) }
                var isSyncing by remember { mutableStateOf(false) }
                var syncMessage by remember { mutableStateOf<String?>(null) }

                if (showConfigScreen) {
                    ServerConfigScreen(
                        initialServer = server,
                        onServerSaved = { savedServer ->
                            server = savedServer
                            showConfigScreen = false
                            Toast.makeText(
                                this,
                                "Servidor ${savedServer.name} guardado correctamente",
                                Toast.LENGTH_SHORT
                            ).show()
                            // Schedule periodic sync
                            TvhSyncWorker.schedulePeriodicSync(this)
                        },
                        onCancel = if (server != null) {
                            { showConfigScreen = false }
                        } else null
                    )
                } else {
                    Surface(
                        modifier = Modifier.fillMaxSize(),
                        color = Color(0xFF0F172A)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(36.dp),
                            verticalArrangement = Arrangement.Center,
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(72.dp)
                                    .clip(RoundedCornerShape(20.dp))
                                    .background(Color(0xFF0284C7)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(
                                    imageVector = Icons.Default.LiveTv,
                                    contentDescription = "Headent Client",
                                    tint = Color.White,
                                    modifier = Modifier.size(44.dp)
                                )
                            }

                            Spacer(modifier = Modifier.height(16.dp))

                            Text(
                                text = "Headent Client",
                                fontSize = 32.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )

                            Text(
                                text = "Cliente nativo de Tvheadend para Android TV y Live Channels (TIF)",
                                fontSize = 14.sp,
                                color = Color(0xFF94A3B8),
                                modifier = Modifier.padding(top = 4.dp)
                            )

                            Spacer(modifier = Modifier.height(28.dp))

                            // Active Server Card
                            server?.let { currentServer ->
                                Card(
                                    modifier = Modifier.fillMaxWidth(0.65f),
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFF1E293B)),
                                    shape = RoundedCornerShape(16.dp)
                                ) {
                                    Column(modifier = Modifier.padding(20.dp)) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            horizontalArrangement = Arrangement.SpaceBetween,
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Row(
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                                            ) {
                                                Icon(
                                                    Icons.Default.Dns,
                                                    contentDescription = null,
                                                    tint = Color(0xFF38BDF8)
                                                )
                                                Text(
                                                    text = currentServer.name,
                                                    fontWeight = FontWeight.Bold,
                                                    color = Color.White,
                                                    fontSize = 17.sp
                                                )
                                            }

                                            Text(
                                                text = "Activo",
                                                color = Color(0xFF34D399),
                                                fontWeight = FontWeight.SemiBold,
                                                fontSize = 12.sp,
                                                modifier = Modifier
                                                    .clip(RoundedCornerShape(6.dp))
                                                    .background(Color(0xFF064E3B))
                                                    .padding(horizontal = 8.dp, vertical = 4.dp)
                                            )
                                        }

                                        Spacer(modifier = Modifier.height(10.dp))

                                        Text(
                                            text = "Dirección: ${currentServer.host}:${currentServer.port} (HTSP: ${currentServer.htspPort})",
                                            color = Color(0xFF94A3B8),
                                            fontSize = 13.sp
                                        )

                                        Text(
                                            text = "Perfil de streaming: ${currentServer.profile} | Usuario: ${currentServer.user.ifBlank { "Sin credenciales" }}",
                                            color = Color(0xFF64748B),
                                            fontSize = 12.sp,
                                            modifier = Modifier.padding(top = 2.dp)
                                        )
                                    }
                                }
                            }

                            Spacer(modifier = Modifier.height(24.dp))

                            // Sync feedback message if any
                            syncMessage?.let { msg ->
                                Text(
                                    text = msg,
                                    color = Color(0xFF38BDF8),
                                    fontSize = 14.sp,
                                    modifier = Modifier.padding(bottom = 12.dp)
                                )
                            }

                            // Action Buttons
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(16.dp),
                                modifier = Modifier.fillMaxWidth(0.65f)
                            ) {
                                // Sincronizar Canales TIF Button
                                Button(
                                    onClick = {
                                        server?.let { currentServer ->
                                            isSyncing = true
                                            syncMessage = "Iniciando búsqueda de canales..."
                                            lifecycleScope.launch {
                                                val (success, message) = sk.tvhclient.android.tif.TvhSyncManager.syncNow(
                                                    context = this@MainActivity,
                                                    server = currentServer,
                                                    onProgress = { step -> syncMessage = step }
                                                )
                                                isSyncing = false
                                                syncMessage = message
                                                if (success) {
                                                    sk.tvhclient.android.tif.TvhSyncWorker.schedulePeriodicSync(this@MainActivity)
                                                }
                                            }
                                        }
                                    },
                                    enabled = !isSyncing,
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7)),
                                    modifier = Modifier.weight(1.3f)
                                ) {
                                    if (isSyncing) {
                                        CircularProgressIndicator(
                                            color = Color.White,
                                            modifier = Modifier.size(16.dp),
                                            strokeWidth = 2.dp
                                        )
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Sincronizando...")
                                    } else {
                                        Icon(Icons.Default.Sync, contentDescription = null)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Sincronizar Canales TIF")
                                    }
                                }

                                // Editar Servidor Button
                                OutlinedButton(
                                    onClick = { showConfigScreen = true },
                                    modifier = Modifier.weight(1f)
                                ) {
                                    Icon(Icons.Default.Settings, contentDescription = null, tint = Color(0xFF38BDF8))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Configurar Servidor", color = Color.White)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
