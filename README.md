# Postgres HA
## Restful
  |No | command| comment            |example  |
  |-- | ----   | ----               | -----   |
  |1  | start  | start the instance |curl -X POST http://host/start/:scope|
### curl -X POST http://pg-node01/start/:scope
### curl -X POST http://pg-node01/stop/:scope
### curl -X GET  http://pg-node01/state/:scope
### curl -X GET  http://pg-node01/lsn/:scope
### curl -X GET  http://pg-node01/validLsn/:timeline/:highLsn/:lowLsn
### curl -X GET  http://pg-node01/walFiles/:timeline/:highLsn/:lowLsn
### curl -X GET  http://pg-node01/walFiles/:walFile
### curl -X GET  http://pg-node01/in_recovery
## Test cases
### Slave restart
### Master restart
### Switch Over(Slave->Master)
### Switch Over(Master->Slave)
### Fail over (Restart slave)
### Fail over (Promote slave)
