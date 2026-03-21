package com.cbmp.media;

import com.drew.imaging.ImageMetadataReader;
import com.drew.lang.GeoLocation;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Date;
import java.util.Map;

/**
 * Reads EXIF from JPEG/HEIC/TIFF/WebP (when supported) using Drew Noakes metadata-extractor.
 * GPS: EXIF GPS IFD (many phone cameras embed lat/lon when location is enabled).
 * Date: DateTimeOriginal preferred, then DateTimeDigitized.
 */
public final class ImageExifExtractor {

    private ImageExifExtractor() {
    }

    public static void enrichImagePayload(Path imageFile, Map<String, Object> body) {
        try {
            Metadata metadata = ImageMetadataReader.readMetadata(imageFile.toFile());

            ExifSubIFDDirectory exif = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (exif != null) {
                Date taken = exif.getDateOriginal();
                if (taken == null) {
                    try {
                        taken = exif.getDateDigitized();
                    } catch (Exception ignored) {
                    }
                }
                if (taken != null) {
                    body.put("capturedAt", Instant.ofEpochMilli(taken.getTime()).toString());
                }
            }

            GpsDirectory gps = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gps != null) {
                GeoLocation loc = gps.getGeoLocation();
                if (loc != null && !loc.isZero()) {
                    body.put("latitude", loc.getLatitude());
                    body.put("longitude", loc.getLongitude());
                }
            }
        } catch (Exception ignored) {
            // PNG / no EXIF / corrupt: keep server defaults from caller
        }
    }
}
