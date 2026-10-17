package sk.tvhclient.android.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import sk.tvhclient.shared.Tvh
import sk.tvhclient.shared.api.TvhApi
import sk.tvhclient.shared.model.TvhServer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServerConfigScreen(
    initialServer: TvhServer? = null,
    onServerSaved: (TvhServer) -> Unit,
    onCancel: (() -> Unit)? = null
) {
    var name by remember { mutableStateOf(initialServer?.name ?: "Mi Tvheadend") }
    var host by remember { mutableStateOf(initialServer?.host ?: "192.168.1.100") }
    var port by remember { mutableStateOf((initialServer?.port ?: 9981).toString()) }
    var htspPort by remember { mutableStateOf((initialServer?.htspPort ?: 9982).toString()) }
    var user by remember { mutableStateOf(initialServer?.user ?: "") }
    var pass by remember { mutableStateOf(initialServer?.pass ?: "") }
    var profile by remember { mutableStateOf(initialServer?.profile ?: "pass") }
    var useSoftwareDecoding by remember { mutableStateOf(initialServer?.useSoftwareDecoding ?: true) }

    var isTesting by remember { mutableStateOf(false) }
    var testResult by remember { mutableStateOf<Pair<Boolean, String>?>(null) }
    val coroutineScope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    val currentCandidateServer = TvhServer(
        id = initialServer?.id ?: "server_${System.currentTimeMillis()}",
        name = name.ifBlank { "Tvheadend" },
        host = host.trim(),
        port = port.toIntOrNull() ?: 9981,
        htspPort = htspPort.toIntOrNull() ?: 9982,
        user = user.trim(),
        pass = pass,
        profile = profile.ifBlank { "pass" },
        useSoftwareDecoding = useSoftwareDecoding
    )

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF0F172A))
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth(0.85f)
                .clip(RoundedCornerShape(20.dp))
                .background(Color(0xFF1E293B))
                .padding(28.dp)
                .verticalScroll(scrollState),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(Color(0xFF0284C7)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Dns,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(28.dp)
                    )
                }
                Column {
                    Text(
                        text = "Configuración del Servidor Tvheadend",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Text(
                        text = "Introduce la IP y credenciales de tu servidor Tvheadend local",
                        fontSize = 13.sp,
                        color = Color(0xFF94A3B8)
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Inputs Form
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Name
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Nombre del Servidor") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF38BDF8),
                        unfocusedBorderColor = Color(0xFF475569)
                    )
                )

                // Host / IP
                OutlinedTextField(
                    value = host,
                    onValueChange = { host = it },
                    label = { Text("Dirección IP / Host (ej. 192.168.1.100)") },
                    singleLine = true,
                    modifier = Modifier.weight(1.5f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF38BDF8),
                        unfocusedBorderColor = Color(0xFF475569)
                    )
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // HTTP Port
                OutlinedTextField(
                    value = port,
                    onValueChange = { port = it },
                    label = { Text("Puerto HTTP (9981)") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF38BDF8),
                        unfocusedBorderColor = Color(0xFF475569)
                    )
                )

                // HTSP Port
                OutlinedTextField(
                    value = htspPort,
                    onValueChange = { htspPort = it },
                    label = { Text("Puerto HTSP (9982)") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF38BDF8),
                        unfocusedBorderColor = Color(0xFF475569)
                    )
                )

                // Profile
                OutlinedTextField(
                    value = profile,
                    onValueChange = { profile = it },
                    label = { Text("Perfil de Stream (pass)") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF38BDF8),
                        unfocusedBorderColor = Color(0xFF475569)
                    )
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // User
                OutlinedTextField(
                    value = user,
                    onValueChange = { user = it },
                    label = { Text("Usuario (opcional)") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF38BDF8),
                        unfocusedBorderColor = Color(0xFF475569)
                    )
                )

                // Password
                OutlinedTextField(
                    value = pass,
                    onValueChange = { pass = it },
                    label = { Text("Contraseña (opcional)") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = Color(0xFF38BDF8),
                        unfocusedBorderColor = Color(0xFF475569)
                    )
                )
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Software Decoding Toggle
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                shape = RoundedCornerShape(12.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Decodificación por Software (CPU)",
                            color = Color.White,
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp
                        )
                        Text(
                            text = "Recomendado: mantiene el audio y vídeo perfectamente sincronizados al cambiar de pista",
                            color = Color(0xFF94A3B8),
                            fontSize = 12.sp
                        )
                    }
                    Switch(
                        checked = useSoftwareDecoding,
                        onCheckedChange = { useSoftwareDecoding = it },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = Color(0xFF0284C7)
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Test Result Feedback Banner
            testResult?.let { (success, message) ->
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(if (success) Color(0xFF064E3B) else Color(0xFF7F1D1D))
                        .padding(12.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            imageVector = if (success) Icons.Default.CheckCircle else Icons.Default.Error,
                            contentDescription = null,
                            tint = if (success) Color(0xFF34D399) else Color(0xFFF87171),
                            modifier = Modifier.size(20.dp)
                        )
                        Text(
                            text = message,
                            color = Color.White,
                            fontSize = 13.sp
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Buttons Bar
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Test Connection Button
                Button(
                    onClick = {
                        isTesting = true
                        testResult = null
                        coroutineScope.launch {
                            val result = withContext(Dispatchers.IO) {
                                val api = TvhApi(currentCandidateServer)
                                api.testConnection()
                            }
                            testResult = result
                            isTesting = false
                        }
                    },
                    enabled = !isTesting && host.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF334155)),
                    modifier = Modifier.weight(1f)
                ) {
                    if (isTesting) {
                        CircularProgressIndicator(
                            color = Color.White,
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Probando...", color = Color.White)
                    } else {
                        Icon(Icons.Default.NetworkCheck, contentDescription = null, tint = Color(0xFF38BDF8))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Probar Conexión", color = Color.White)
                    }
                }

                // Save Server Button
                Button(
                    onClick = {
                        Tvh.store.saveServer(currentCandidateServer)
                        onServerSaved(currentCandidateServer)
                    },
                    enabled = host.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7)),
                    modifier = Modifier.weight(1.5f)
                ) {
                    Icon(Icons.Default.Save, contentDescription = null, tint = Color.White)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Guardar Servidor", color = Color.White, fontWeight = FontWeight.Bold)
                }

                // Cancel Button if available
                if (onCancel != null) {
                    OutlinedButton(
                        onClick = onCancel,
                        modifier = Modifier.weight(0.8f)
                    ) {
                        Text("Cancelar", color = Color(0xFF94A3B8))
                    }
                }
            }
        }
    }
}
