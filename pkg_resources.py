import importlib.resources
from io import BytesIO


def resource_filename(package, resource):
    """Resolve resource paths for mlconjug3."""
    return importlib.resources.files(package).joinpath(resource).__fspath__()


def resource_stream(package, resource):
    """Return a binary stream for the requested resource."""
    data = importlib.resources.files(package).joinpath(resource).read_bytes()
    return BytesIO(data)
