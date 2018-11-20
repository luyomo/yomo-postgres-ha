#!/bin/bash

PROC_CNT=`ps -ef | grep postgres | grep 'writer process' | grep -v 'grep' | wc -l`
if [ $PROC_CNT -eq 0  ]; then
  ACTIVE_PROC=0
elif [ $PROC_CNT -gt 0 ] ; then
  ACTIVE_PROC=1
fi

if [ $ACTIVE_PROC -eq 0 ]; then
  echo $ACTIVE_PROC
  exit 0;
fi

IS_SLAVE=`ps -ef | grep "postgres: wal receiver process" | grep -v grep | wc -l`
IS_MASTER=`ps -ef | grep "postgres: wal sender process" | grep -v grep | wc -l`
IS_RECOVERY=`ps -ef | grep "postgres: startup process   recovering" | grep -v grep | wc -l`
if [ $IS_SLAVE -eq 0 ] && [ $IS_MASTER -eq 0 ] && [ $IS_RECOVERY -eq 0 ]; then
  INS_TYPE=1
elif [ $IS_MASTER -gt 0 ]; then
  INS_TYPE=2
elif [ $IS_SLAVE -gt 0 ]; then
  INS_TYPE=3
elif [ $IS_RECOVERY -gt 0 ]; then
  INS_TYPE=4
fi

echo $INS_TYPE
