package sk.tvhclient.android.tif

import android.content.ComponentName
import android.content.Context
import android.media.tv.TvContract
import sk.tvhclient.android.tif.TvhTvInputService

object TvContractUtils {

    /**
     * Builds the unique input ID registered by Android TV for this service.
     */
    fun buildInputId(context: Context): String {
        return TvContract.buildInputId(
            ComponentName(context, TvhTvInputService::class.java)
        )
    }

    /**
     * Maps DVB genre nibble / codes from Tvheadend to canonical Android TV genres.
     */
    fun mapDvbGenreToCanonical(genreCode: Int): String? {
        val top = if (genreCode <= 15) genreCode else genreCode / 16
        return when (top) {
            0x01 -> TvContract.Programs.Genres.MOVIES
            0x02 -> TvContract.Programs.Genres.NEWS
            0x03 -> TvContract.Programs.Genres.ENTERTAINMENT
            0x04 -> TvContract.Programs.Genres.SPORTS
            0x05 -> TvContract.Programs.Genres.FAMILY_KIDS
            0x06 -> TvContract.Programs.Genres.MUSIC
            0x07 -> TvContract.Programs.Genres.ARTS
            0x08 -> TvContract.Programs.Genres.NEWS
            0x09 -> TvContract.Programs.Genres.EDUCATION
            else -> null
        }
    }
}
