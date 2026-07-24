import ipaddress
import socket
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

from fastapi import HTTPException, status


SUPPORTED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


def _validate_public_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Thumbnail URL must be a valid HTTP or HTTPS address.",
        )
    if parsed.username or parsed.password:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Thumbnail URL must not contain credentials.",
        )
    try:
        port = parsed.port or (443 if parsed.scheme == "https" else 80)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Thumbnail URL contains an invalid port.",
        ) from error
    if port not in {80, 443}:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Thumbnail URL must use port 80 or 443.",
        )

    try:
        addresses = socket.getaddrinfo(parsed.hostname, port, type=socket.SOCK_STREAM)
    except socket.gaierror as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Thumbnail host could not be resolved.",
        ) from error

    for address in addresses:
        ip = ipaddress.ip_address(address[4][0])
        if not ip.is_global:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Private or local thumbnail addresses are not allowed.",
            )


class _SafeRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, request, file_pointer, code, message, headers, new_url):
        _validate_public_url(new_url)
        return super().redirect_request(
            request,
            file_pointer,
            code,
            message,
            headers,
            new_url,
        )


def _matches_image_signature(content_type: str, data: bytes) -> bool:
    if content_type == "image/jpeg":
        return data.startswith(b"\xff\xd8\xff")
    if content_type == "image/png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    if content_type == "image/webp":
        return len(data) >= 12 and data.startswith(b"RIFF") and data[8:12] == b"WEBP"
    return False


def download_remote_image(url: str, *, max_bytes: int = 10 * 1024 * 1024) -> tuple[bytes, str, str]:
    _validate_public_url(url)
    request = Request(
        url,
        headers={
            "Accept": "image/jpeg,image/png,image/webp",
            "User-Agent": "EduCloudThumbnailImporter/1.0",
        },
    )

    try:
        with build_opener(_SafeRedirectHandler()).open(request, timeout=10) as response:
            content_type = response.headers.get_content_type().lower()
            if content_type not in SUPPORTED_IMAGE_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Remote URL must return a JPG, PNG, or WebP image.",
                )

            content_length = response.headers.get("Content-Length")
            if content_length and int(content_length) > max_bytes:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Remote thumbnail is larger than 10 MB.",
                )

            data = response.read(max_bytes + 1)
    except HTTPException:
        raise
    except (HTTPError, URLError, TimeoutError, OSError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to download the remote thumbnail.",
        ) from error

    if len(data) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Remote thumbnail is larger than 10 MB.",
        )
    if not _matches_image_signature(content_type, data):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Remote file content is not a supported image.",
        )

    return data, content_type, SUPPORTED_IMAGE_TYPES[content_type]
