FROM postgres:16

# initialization scripts
COPY ./init.sql /docker-entrypoint-initdb.d/
COPY ./testData.sql /docker-entrypoint-initdb.d/

# Optional: custom config
# COPY postgresql.conf /etc/postgresql/postgresql.conf

