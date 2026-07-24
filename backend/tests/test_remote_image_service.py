import pytest
from fastapi import HTTPException

from app.services.remote_image_service import download_remote_image


@pytest.mark.parametrize(
    "url",
    [
        "http://127.0.0.1/image.png",
        "http://localhost/image.png",
        "http://169.254.169.254/latest/meta-data/",
    ],
)
def test_remote_image_import_rejects_local_addresses(url):
    with pytest.raises(HTTPException) as caught:
        download_remote_image(url)

    assert caught.value.status_code == 422
