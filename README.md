# Postgres HA
## Table of contents
1. [Restful specification](#restful-specification)
2. [Test cases](#test-cases)

## Restful Specification
  |No | Resource                   | POST              | GET                                   |PUT                          | DELETE               |
  |-- | ----                       | ----              | -----                                 | -----                       | ----                 |
  |1  | /api/pg/v1/instance/:scope | Start pg instance | Get the instance state                | -                           | Stop the pg instance |
  |2  | /api/pg/v1/node/:scope     | Promote the slave | -                                     | -                           | -                    |
  |3  | /api/pg/v1/lsn/:scope      | -                 | Get the pg's lsn info                 | -                           | -                    |
  |4  | /api/pg/v1/walFiles/:scope | -                 | Get the wal files from specified lsn  | -                           | -                    |
  |5  | /api/pg/v1/walFile/:walFile| -                 | Get the wal file from remote          | Push the wal file to remote | -                    |
  |6  | /api/pg/v1/in_recovery     | -                 | Get the node's recovery mode          | -                           | -                    |
  |7  | /api/pg/v1/validLsn/:scope | -                 | Check whether the lsn is valid        | -                           | -                    |

### /api/pg/v1/instance/:scope 
#### GET
**Get the specified node's state**
```shell
$curl -X GET http://pg-node01:8079/api/pg/v1/instance/current
{"pg-node01":"single"}%
```
**Get all nodes' state**
```shell
$curl -X GET http://pg-node01:8079/api/pg/v1/instance/all
{"pg-node01":"single","pg-node02":"inactive"}%
```
  |No | state    | Comment     |
  |-  | -        | -           |
  | 1 | single   | single node |
  | 2 | master   | master node |
  | 3 | slave    | slave node  |
  | 4 | inactive | Not started |

#### POST

  | No | Scope           | Sequence           | Comment                                                             |
  | -  | -               | -                  | -                                                                   |
  | 1  | current         |                    | Start the specified node (pg_ctl stop -D /DATA)                     |
  | 2  | master          |                    | Start the specified node as master                                  |
  | 3  | slave           |                    | Start the specified node as slave                                   |
  | 4  | all             | masterSlave        | Start the node by the sequence(the master -> another slave)         |
  | 5  | failover        | restart            | Promote the slave node by restarting                                |
  | 6  | failover        | promote            | Promote the slave node by promoting                                 |
  | 7  | switchover      | masterSlave        | Switchover (master down -> slave down -> slave up -> master up)     |
  | 8  | switchover      | slaveMaster        | Switchover (slave down -> master down -> slave up -> master up)     |

**Start the node directly**
--todo
```shell
$curl -X POST http://pg-node01:8079/api/pg/v1/instance/current
```

**Start the node as master**
--todo
```shell
$curl -X POST http://pg-node01:8079/api/pg/v1/instance/master
```

**Start the node as slace**
--todo
```shell
$curl -X POST http://pg-node01:8079/api/pg/v1/instance/master
```

**Start the nodes be the sequence (Master -> Slave)**
```shell
$curl -X POST http://pg-node01:8079/api/pg/v1/instance/all
{"pg-node01":"master","pg-node02":"slave"}%
```

**Failover (stop slave -> start node as master)**
--todo
```shell
$curl -X POST http://pg-node01:8079/api/pg/v1/instance/switchover/masterSlave
```

**Failover (Promote)**
--todo
```shell
$curl -X POST http://pg-node01:8079/api/pg/v1/instance/switchover/slaveMaster
```

**Switch the master slave by the sequence (master down -> slave down -> slave start as master -> master start as slave)**
--todo
```shell
$curl -X POST http://pg-node01:8079/api/pg/v1/instance/switchover/masterSlave
```

**Switch the master slave by the sequence (slave down -> master down -> slave start as master -> master start as slave)**
--todo
```shell
$curl -X POST http://pg-node01:8079/api/pg/v1/instance/switchover/slaveMaster
```

#### DELETE
**Stop the specified node**
```shell
$curl -X DELETE http://pg-node01/api/pg/v1/instance/all
{"pg-node01":"inactive","pg-node02":"inactive"}
```
  | No | Scope       | Comment                                        |
  | -  | -           | -                                              |
  | 1  | current     | Stop the specified node (pg_ctl stop -D /DATA) |
  | 2  | master      | Find the master node to stop                   |
  | 3  | slave       | Find the slave node to stop                    |
  | 4  | all         | Stop by the sequence(slave -> master)          |
  | 5  | slaveMaster | same to all                                    |
  | 6  | masterSlave | Stop by the sequence(master -> slave)          |

### /api/pg/v1/node/:scope
```shell
curl -X POST http://pg-node01:8079/api/pg/v1/node/promote
{"pg-node-01":"single","pg-node-02":"inactive"}% 
```
### /api/pg/v1/lsn/:scope
**Get the node's lsn info**
```shell
$curl -X GET http://pg-node01:8079/api/pg/v1/lsn/current
{"hostname":{"chkPoint":"0/39000100","chkRedoPoint":"0/390000C8","walFile":"000000040000000000000039","timeLineID":"4","lastLsn":"0/39000170"}}
```

**Get all nodes's lsn  info**
```shell
$curl -X GET http://pg-node01:8079/api/pg/v1/lsn/all
{"pg-host-01":{"chkPoint":"0/39000100","chkRedoPoint":"0/390000C8","walFile":"000000040000000000000039","timeLineID":"4","lastLsn":"0/39000170"},
 "pg-host-02":{"chkPoint":"0/39000028","chkRedoPoint":"0/39000028","walFile":"000000030000000000000039","timeLineID":"3","lastLsn":"0/39000028"}}%
```
### /api/pg/v1/walFiles/:scope
**Call from timeline/lsn**
```shell
$curl -X GET http://hostname/api/pg/v1/walFiles/3/0/39000028
[{"file":"000000030000000000000039.partial","md5":"eedd5ebc09b162d8464ff53d9c98f492"},{"file":"00000004.history","md5":"6e2a9301e80b7a952fcd69d574c7dfc7"},{"file":"000000040000000000000039","md5":"add3d229ab7a6fa5c95de7c5e86aa5b4"}]
```

**Call from wal file**
```shell
$curl -X GET http://pg-node01:8079/api/pg/v1/walFiles/000000030000000000000039 
[{"file":"000000030000000000000039.partial","md5":"eedd5ebc09b162d8464ff53d9c98f492"},{"file":"00000004.history","md5":"6e2a9301e80b7a952fcd69d574c7dfc7"},{"file":"000000040000000000000039","md5":"add3d229ab7a6fa5c95de7c5e86aa5b4"}]
```

### /api/pg/v1/walFile/:walFile
**Upload the wal file to remote**
```shell
$curl -i -X POST -H "Content-Type: multipart/form-data" -F "data=@/tmp/000000030000000000000018" http://hostname/api/pg/v1/walFile/000000080000000000000039
HTTP/1.1 100 Continue

HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 80
Date: Wed, 24 Oct 2018 01:39:20 GMT
Connection: keep-alive

{"code":0,"msg":"The file </data/pg_wal/000000080000000000000039> was uploaded"}
```

**Download the wal file from remote**
```shell
$curl -X GET http://hostname/api/pg/v1/walFile/000000040000000000000039 --output /tmp/000000040000000000000039
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 16.0M  100 16.0M    0     0   127M      0 --:--:-- --:--:-- --:--:--  129M
```

### /api/pg/v1/in_recovery
```shell
$curl -X GET http://hostname/api/pg/v1/in_recovery
{"in_recovery":"f"}
```
### /api/pg/v1/validLsn 
```shell
$curl -X GET http://hostname/api/pg/v1/validLsn/3/0/39000028
{"code":0,"msg":"Valid lsn","cnt":"1"}
```

    | No | Field | Comment                           |
    | -  | -     | -                                 |
    | 1  | code  | return code                       |
    | 2  | msg   | return message                    |
    | 3  | cnt   | Number of entries beghind the lsn |

## Test cases
### Slave restart
### Master restart
### Switch Over(Slave->Master)
### Switch Over(Master->Slave)
### Fail over (Restart slave)
### Fail over (Promote slave)
