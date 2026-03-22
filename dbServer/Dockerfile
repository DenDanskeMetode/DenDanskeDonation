FROM postgres:16

# initialization scripts
COPY ./init.sql /docker-entrypoint-initdb.d/
COPY ./testData.sql /docker-entrypoint-initdb.d/

# test images
COPY ./fisk.jpg /docker-entrypoint-initdb.d/fisk.jpg
COPY ./party-dog.jpg /docker-entrypoint-initdb.d/party-dog.jpg
COPY ./dendanskemetode.png /docker-entrypoint-initdb.d/dendanskemetode.png

# Optional: custom config
# COPY postgresql.conf /etc/postgresql/postgresql.conf

