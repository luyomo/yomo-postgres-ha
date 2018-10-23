# Postgres HA
## Restful
  |No | Resource                   | POST              | GET                                   |PUT                          | DELETE               |
  |-- | ----                       | ----              | -----                                 | -----                       | ----                 |
  |1  | /api/pg/v1/instance/:scope | Start pg instance | Get the instance state                | -                           | Stop the pg instance |
  |2  | /api/pg/v1/lsn/:scope      | -                 | Get the pg's lsn info                 | -                           | -                    |
  |3  | /api/pg/v1/walFiles/:scope | -                 | Get the wal files from specified lsn  | -                           | -                    |
  |4  | /api/pg/v1/walFile/:walFile| -                 | Get the wal file from remote          | Push the wal file to remote | -                    |
  |4  | /api/pg/v1/in_recovery     | -                 | Get the node's recovery mode          | -                           | -                    |

### /api/pg/v1/instance/:scope 
### /api/pg/v1/lsn/:scope
### /api/pg/v1/walFiles/:scope
### /api/pg/v1/walFile/:walFile
### /api/pg/v1/in_recovery
```shell
$curl -X GET http://hostname/api/pg/v1/in_recovery
{"in_recovery":"f"}
```
## Test cases
### Slave restart
### Master restart
### Switch Over(Slave->Master)
### Switch Over(Master->Slave)
### Fail over (Restart slave)
### Fail over (Promote slave)
