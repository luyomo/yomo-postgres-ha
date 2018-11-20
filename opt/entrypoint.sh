#!/bin/bash

SOURCE_DEFAULT_PATH=/opt/etc
TARGET_DATA_PATH=${PGDATA:-"/data"}

initEtc(){

  # 1. Copy the postgres.conf
  cp ${SOURCE_DEFAULT_PATH}/postgresql.conf.default  ${TARGET_DATA_PATH}/postgresql.conf
  mkdir -p ${TARGET_DATA_PATH}/archive

  
  # 3. Prepare the pg_hba.conf for replicate
    sed 's/${SUBNET}/'${SUBNET:-0.0.0.0}'/g' ${SOURCE_DEFAULT_PATH}/pg_hba.conf.default \
  | sed 's/${MASK}/'${MASK:-32}'/g' \
  | sed 's/${REPLICATE_USER}/'${REPLICATE_USER:-replicate}'/g' > ${TARGET_DATA_PATH}/pg_hba.conf
  
  # 4. Prepare the reconver.conf file for slave
    sed 's/${REMOTE_NODE}/'${REMOTE_NODE:-PGNODE02}'/g' ${SOURCE_DEFAULT_PATH}/recovery.slave.conf \
  | sed 's/${DB_LISTENING_PORT}/'${DB_LISTENING_PORT:-8082}'/g' \
  | sed 's/${REPLICATE_USER}/'${REPLICATE_USER:-replicate}'/g' \
  | sed 's/${APPLY_DELAY}/'${APPLY_DELAY:-NONE}'/g' > ${TARGET_DATA_PATH}/recovery.slave.conf
  
  [ -z $APPLY_DELAY ] && sed -i /recovery_min_apply_delay/d ${TARGET_DATA_PATH}/recovery.slave.conf

}

if [ "$1" = "init_db" ]; then

  # 1. Start one new db from pg_ctl
  pg_ctl init -D ${TARGET_DATA_PATH}
 
  # 2. config file models
  initEtc 

  # 3. create the database/
  # 3.1 Start the instance
  pg_ctl start -D ${TARGET_DATA_PATH}

  # 3.2 Create the database
  psql -c "create database ${DATABASE:-datasync}"

  # 3.3 Create the user
  psql -c "create user ${DB_USER:-datasync} password '${DB_PASSWD:-datasync}'"
  psql -c "alter database ${DATABASE:-datasync} owner to ${DB_USER:-datasync}"

  # 3.4 Create the replicate user
  psql -c "create user ${REPLICATE_USER:-replicate} replication"

  pg_ctl stop -D ${TARGET_DATA_PATH}

elif [ "$1" = "init_etc" ]; then
  initEtc 

elif [ "$1" = "rest" ]; then
  # 1. Prepare the config.json for restful
    sed 's/${LOCAL_NODE}/'${LOCAL_NODE:-defaultLocalNode}'/' ${SOURCE_DEFAULT_PATH}/config.json.default \
  | sed 's/${REMOTE_NODE}/'${REMOTE_NODE:-defaultRemoteNode}'/' \
  | sed 's/${LISTENING_PORT}/'${LISTENING_PORT:-8086}'/' >  ${SOURCE_DEFAULT_PATH}/config.json

  # 2. Start the service
  node /opt/restful/index.js

else
  echo "Unexpected command"
fi
