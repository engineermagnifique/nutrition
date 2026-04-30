import logging
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

logger = logging.getLogger('nutritionxai')


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        return Response(
            {
                'status': 'error',
                'message': _flatten_errors(response.data),
                'code': response.status_code,
            },
            status=response.status_code,
        )

    logger.exception('Unhandled exception in view', exc_info=exc)
    return Response(
        {'status': 'error', 'message': 'An unexpected error occurred.', 'code': 500},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _flatten_errors(data):
    if isinstance(data, dict):
        if 'detail' in data:
            return str(data['detail'])
        return {k: _flatten_errors(v) for k, v in data.items()}
    if isinstance(data, list):
        return [_flatten_errors(i) for i in data]
    return str(data)


def success_response(data=None, message='Success', status_code=status.HTTP_200_OK):
    body = {'status': 'success', 'message': message}
    if data is not None:
        body['data'] = data
    return Response(body, status=status_code)
