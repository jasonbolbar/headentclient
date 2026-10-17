package sk.tvhclient.android.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Terminal
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.BufferedReader
import java.io.InputStreamReader

@Composable
fun LogViewerDialog(
    onDismiss: () -> Unit
) {
    var logs by remember { mutableStateOf<List<String>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val scrollState = rememberScrollState()

    suspend fun fetchLogs() {
        isLoading = true
        val result = withContext(Dispatchers.IO) {
            try {
                // Fetch recent logs for our app components
                val process = Runtime.getRuntime().exec(
                    arrayOf(
                        "logcat",
                        "-d",
                        "-v",
                        "time",
                        "-t",
                        "150",
                        "TvhTvInputService:V",
                        "TvhSyncWorker:V",
                        "TvhApi:V",
                        "MainActivity:V",
                        "System.err:W",
                        "AndroidRuntime:E",
                        "*:S"
                    )
                )
                val lines = BufferedReader(InputStreamReader(process.inputStream)).readLines()
                if (lines.isEmpty()) {
                    listOf("No hay registros recientes. Prueba a sincronizar o conectar al servidor.")
                } else {
                    lines
                }
            } catch (e: Exception) {
                listOf("Error al capturar logs: ${e.message}")
            }
        }
        logs = result
        isLoading = false
    }

    LaunchedEffect(Unit) {
        fetchLogs()
    }

    val coroutineScope = rememberCoroutineScope()

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xD9000000))
                .padding(32.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(RoundedCornerShape(20.dp))
                    .background(Color(0xFF0F172A))
                    .padding(24.dp)
            ) {
                // Dialog Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(40.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Color(0xFF0284C7)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                Icons.Default.Terminal,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                        Column {
                            Text(
                                text = "Registro de Logs en Vivo",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                            Text(
                                text = "TvhTvInputService | TvhSyncWorker | TvhApi",
                                fontSize = 12.sp,
                                color = Color(0xFF94A3B8)
                            )
                        }
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Button(
                            onClick = {
                                kotlinx.coroutines.CoroutineScope(Dispatchers.Main).launchWhenStarted {
                                    fetchLogs()
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1E293B))
                        ) {
                            Icon(Icons.Default.Refresh, contentDescription = null, tint = Color(0xFF38BDF8))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Actualizar", color = Color.White, fontSize = 12.sp)
                        }

                        IconButton(
                            onClick = onDismiss,
                            modifier = Modifier
                                .size(36.dp)
                                .clip(RoundedCornerShape(8.dp))
                                .background(Color(0xFF1E293B))
                        ) {
                            Icon(Icons.Default.Close, contentDescription = null, tint = Color.White)
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Log Content Box
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF030712))
                        .padding(16.dp)
                        .verticalScroll(scrollState)
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            color = Color(0xFF38BDF8),
                            modifier = Modifier
                                .size(32.dp)
                                .align(Alignment.Center)
                        )
                    } else {
                        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                            logs.forEach { line ->
                                val color = when {
                                    line.contains(" E ") || line.contains("Error") || line.contains("Exception") -> Color(0xFFF87171)
                                    line.contains(" W ") || line.contains("Warn") -> Color(0xFFFBBF24)
                                    line.contains(" I ") -> Color(0xFF38BDF8)
                                    else -> Color(0xFFCBD5E1)
                                }
                                Text(
                                    text = line,
                                    color = color,
                                    fontSize = 11.sp,
                                    fontFamily = FontFamily.Monospace,
                                    lineHeight = 16.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
