def upload_file_placeholder(file_type: str) -> dict:
    # TODO API Developer - Enrollment, Upload & Testing: Replace with S3 upload using IAM role or safe credentials.
    # Do not store real AWS credentials in source code.
    return {"file_type": file_type, "url": "https://example.com/placeholder-file"}
