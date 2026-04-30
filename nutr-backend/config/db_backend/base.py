from functools import cached_property
from django.db.backends.mysql.base import DatabaseWrapper as MySQLDatabaseWrapper


class DatabaseWrapper(MySQLDatabaseWrapper):
    """Custom MySQL backend for XAMPP's MariaDB 10.4.

    Django 6 uses MariaDB-specific RETURNING syntax (added in 10.5).
    Presenting the connection as MySQL 8.0 causes Django to use the
    compatible LAST_INSERT_ID() path, which works on MariaDB 10.4.
    """

    def check_database_version_supported(self):
        pass

    @cached_property
    def mysql_is_mariadb(self):
        return False

    @cached_property
    def mysql_version(self):
        return (8, 0, 36)
