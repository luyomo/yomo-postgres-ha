FROM debian as builder

ENV http_proxy=http://10.136.0.60:8080 https_proxy=http://10.136.0.60:8080 PATH=/opt/postgres/10.5/bin:$PATH

RUN apt-get update && apt-get remove -y libprotobuf-c-dev libprotobuf-dev && apt-get install -y build-essential pkg-config libreadline-dev zlib1g-dev libproj-dev liblwgeom-dev libprotobuf-c-dev rsync openssh-server libprotobuf-dev wget tar xz-utils zip

WORKDIR /opt

RUN wget https://ftp.postgresql.org/pub/source/v10.5/postgresql-10.5.tar.gz

RUN tar xvf postgresql-10.5.tar.gz 

RUN cd /opt/postgresql-10.5 && ./configure --prefix=/opt/postgres/10.5 --enable-debug && make && make install

RUN cd /opt && wget https://github.com/debezium/postgres-decoderbufs/archive/v0.8.3.Final.zip && unzip v0.8.3.Final.zip

RUN cd /opt/postgres-decoderbufs-0.8.3.Final && make clean && make && make install

FROM debian

COPY --from=builder /opt/postgres /opt/postgres

COPY --from=yomo-node:11 /opt/node/11.0.0 /opt/node/11.0.0

RUN groupadd postgres && useradd postgres -l -g postgres && mkdir /home/postgres && chown postgres:postgres /home/postgres

ENV http_proxy=http://10.136.0.60:8080 https_proxy=http://10.136.0.60:8080 PATH=/opt/postgres/10.5/bin:/opt/node/11.0.0/bin:$PATH

RUN apt-get update && apt-get install -y liblwgeom-2.3-0 openssh-server rsync libprotobuf-c-dev curl xxd && install -d -o postgres -g postgres -m 755 /data && apt-get clean

COPY --chown=postgres opt /opt

ENV http_proxy= https_proxy=

USER postgres

ENTRYPOINT ["/opt/entrypoint.sh"] 

CMD ["rest"]
#ADD opt/postgres-decoderbufs /opt/postgres-decoderbufs 


#initdb -D /opt/data
