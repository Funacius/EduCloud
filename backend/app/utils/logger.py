import logging


def get_logger(name: str) -> logging.Logger:
    # TODO API Developer - Enrollment, Upload & Testing: Configure CloudWatch logging later.
    logging.basicConfig(level=logging.INFO)
    return logging.getLogger(name)
