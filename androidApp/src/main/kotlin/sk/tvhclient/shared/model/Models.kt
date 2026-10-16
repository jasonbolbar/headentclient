package sk.tvhclient.shared.model

data class TvhServer(
    val id: String = "default",
    val name: String = "Tvheadend",
    val host: String = "192.168.1.100",
    val port: Int = 9981,
    val htspPort: Int = 9982,
    val user: String = "",
    val pass: String = "",
    val profile: String = "pass"
)

data class Channel(
    val uuid: String,
    val name: String,
    val number: Int? = null,
    val numberMinor: Int? = null,
    val iconPublicUrl: String? = null,
    val tags: List<String> = emptyList(),
    val services: List<String> = emptyList(),
    val serviceTypes: List<String> = emptyList(),
    val enabled: Boolean = true,
    val isRadioByServices: Boolean = false
) {
    val isRadioByService: Boolean
        get() = isRadioByServices

    val numberText: String
        get() = if (number != null) {
            if (numberMinor != null && numberMinor > 0) "$number.$numberMinor" else "$number"
        } else ""
}

data class EpgEvent(
    val eventId: Long = 0L,
    val channelUuid: String = "",
    val title: String = "",
    val subtitle: String = "",
    val summary: String = "",
    val description: String = "",
    val start: Long = 0L,
    val stop: Long = 0L,
    val genre: List<Int> = emptyList(),
    val episodeTitle: String? = null,
    val seasonNumber: Int? = null,
    val episodeNumber: Int? = null,
    val episodeOnscreen: String = ""
) {
    val bestDescription: String
        get() = description.ifBlank { summary.ifBlank { subtitle } }
}
