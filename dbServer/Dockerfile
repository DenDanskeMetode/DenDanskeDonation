FROM postgres:16

RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-16-cron \
    && rm -rf /var/lib/apt/lists/*

# test images
COPY ./fisk.jpg /docker-entrypoint-initdb.d/fisk.jpg
COPY ./party-dog.jpg /docker-entrypoint-initdb.d/party-dog.jpg
COPY ./dendanskemetode.png /docker-entrypoint-initdb.d/dendanskemetode.png

# Optional: custom config
# COPY postgresql.conf /etc/postgresql/postgresql.conf
# initialization scripts (prefixed so they run in order)
COPY ./init.sql /docker-entrypoint-initdb.d/01_init.sql
COPY ./testData.sql /docker-entrypoint-initdb.d/02_testData.sql

# Enable pg_cron. Set cron.database_name to match POSTGRES_DB if it differs from 'postgres'.
CMD ["postgres", "-c", "shared_preload_libraries=pg_cron"]

