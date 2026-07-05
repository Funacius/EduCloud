def success_response(message: str = "Request processed successfully", data=None) -> dict:
    return {
        "success": True,
        "message": message,
        "data": data if data is not None else {},
    }


def error_response(message: str = "Error message", error: str = "ERROR_CODE") -> dict:
    return {
        "success": False,
        "message": message,
        "error": error,
    }
