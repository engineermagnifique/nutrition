from drf_spectacular.extensions import OpenApiAuthenticationExtension


class FirebaseAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = 'core.authentication.FirebaseAuthentication'
    name = 'BearerAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'Firebase JWT  |  dev: devtoken:<user_id>',
            'description': (
                'Pass a Firebase ID token obtained after sign-in.\n\n'
                '**Development shortcut** (DEBUG=True only): '
                'use `devtoken:<user_id>` — e.g. `devtoken:3` for Marie (elderly) '
                'or `devtoken:1` for institution admin.'
            ),
        }

    def get_security_requirement(self, auto_schema):
        return [{self.name: []}]
