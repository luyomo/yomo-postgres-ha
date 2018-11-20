const bodyParser      = require('koa-bodyparser')
    , Koa             = require('koa2')
    , Router          = require('koa-router')
    , util            = require("util")
    , fs              = require("fs")
    , asyncBusboy     = require('async-busboy')
    , _               = require('lodash')
    , send            = require('koa-send')
    , testCase        = require('./lib/testCase.js');
const exec = util.promisify(require('child_process').exec);

const __nodesInfo = require("/opt/etc/config.json");
const __$wrapAPI = (_urn) =>  '/api/pg/v1' + _urn;

var __$PGDATA = process.env.PGDATA?process.env.PGDATA:"/data";
const __$wrapPATH = (_path) =>  __$PGDATA + _path;

var app = new Koa();
var router = new Router();

const __$resState = {
  0 : "inactive",
  1 : "single",
  2 : "master",
  3 : "slave",
  4 : "recovery"
};


console.log("The directory <%s>", __$PGDATA);

const __readSlots = async (_slotName, _scope) => {
  const { stdout, stderr} = await exec(util.format("/opt/restful/bin/pgSlotLsn.sh %s", __$wrapPATH("/pg_replslot/" + _slotName + "/state")));
  var __slotInfo = JSON.parse(stdout);
  return (_scope=== "lsn")?_.pick(__slotInfo, ["confirmed_flush"]):__slotInfo;
};

/*
 *  1. inactive   - no db instance
 *  2. master    
 *  3. slave
 *  4. single
 */
const __pgState = async (_ctx, _next) => {
  const { stdout, stderr, code} = await exec("/opt/restful/bin/pgState.sh");
  console.log('stdout: <%s> and type is <%s>', stdout.replace(/\n$/, ''), typeof(stdout));
  console.log('stderr:', stderr);
  console.log('err:', code);
  return parseInt(stdout.replace(/\n$/, ''));
};

const __pgCtlState = async () => {
  var { stdout, stderr, code} = await exec("pg_controldata");
  //console.log('stdout: <%s> and type is <%s>', stdout.replace(/\n$/, ''), typeof(stdout));
  console.log('stderr:', stderr);
  const __retJson = {};
  __retJson["chkPoint"] = (/Latest checkpoint location:\s+(.*)\n/.exec(stdout))[1];
  __retJson["chkRedoPoint"] = (/Latest checkpoint's REDO location:\s+(.*)\n/.exec(stdout))[1];
  __retJson["walFile"] = (/Latest checkpoint's REDO WAL file:\s+(.*)\n/.exec(stdout))[1];
  __retJson["timeLineID"] = (/Latest checkpoint's TimeLineID:\s+(.*)\n/.exec(stdout))[1];
  var { stdout, stderr } = await exec("/opt/restful/bin/pgLatestLsn.sh " + process.env.PGDATA + "/pg_wal/" + __retJson["walFile"]);
  __retJson["lastLsn"] = (/lsn: (.*), prev/.exec(stdout))[1];
  return __retJson;
};

const __isValidLsn = async (_walFile, _lsn) => {
  console.log("/opt/restful/bin/pgSearchLsn.sh " + _walFile + " " + _lsn);
  var { stdout, stderr} = await exec("/opt/restful/bin/pgSearchLsn.sh " + process.env.PGDATA + "/pg_wal/" + _walFile + " " + _lsn);
  console.log('stdout: <%s> and type is <%s>', stdout.replace(/\n$/, ''), typeof(stdout));
  console.log('stderr:', stderr);
  if(stdout === ""){
    return {code: 3, msg: "No Entry" };
  }

  var __parseRec = /first record is after.*skipping over/.exec(stdout);
  if(__parseRec){
    return {code: 2, msg: "Invalid lsn in the file"};
  }

  const __foundLsn = (/lsn: (.*), prev/.exec(stdout))[1];
  if(__foundLsn === _lsn){
    var { stdout, stderr} = await exec("/opt/restful/bin/pgCntLsn.sh " + process.env.PGDATA + "/pg_wal/" +  _walFile + " " + _lsn);
    return {code: 0, msg: "Valid lsn", cnt: stdout.replace(/\n$/, '')};
  }else{
    return {code: 4, msg: stdout};
  }
};

const __stopPG = async (_ctx, _next) => {
  if(_ctx.params.scope === "current"){
    if(parseInt(await __pgState()) === 0 ) {
      _ctx.body = {code: 1, msg: util.format("%s is down already", __nodesInfo["localIP"])};
    }
    const { stdout, stderr} = await exec("pg_ctl stop");
    console.log('stdout: <%s> and type is <%s>', stdout.replace(/\n$/, ''), typeof(stdout));
    console.log('stderr:', stderr);
    _ctx.body = {code: 0, msg: util.format("The node <%s> was shutdown", __nodesInfo["localIP"])}
  }else if(_ctx.params.scope  === "master"){
    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/all")));
    const __nodesState = JSON.parse(stdout);
    var __idx = 0;
    const __objects = _.concat(_.keys(_.pickBy(__nodesState, _e => _e === "master")));
    console.log("All the objects to close is <%s>", util.inspect(__objects));
    for(__idx=0; __idx<__objects.length; __idx++){
      console.log("The object to close herte is <%s>", __objects[__idx])
      var {stdout, stderr} = await exec(util.format("curl -X DELETE http://%s:8079%s", __objects[__idx], __$wrapAPI("/instance/current")));
      console.log("The output from stopping the master <%s>", stdout);
    }
  }else if(_ctx.params.scope  === "slave"){
    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/all")));
    const __nodesState = JSON.parse(stdout);
    var __idx = 0;
    const __objects = _.concat(_.keys(_.pickBy(__nodesState, _e => _e === "slave")));
    console.log("All the objects to close is <%s>", util.inspect(__objects));
    for(__idx=0; __idx<__objects.length; __idx++){
      console.log("The object to close herte is <%s>", __objects[__idx])
      var {stdout, stderr} = await exec(util.format("curl -X DELETE http://%s:8079%s", __objects[__idx], __$wrapAPI("/instance/current")));
      console.log("The output from stopping the master <%s>", stdout);
    }
  }else if(_.includes(["slaveMaster", "all"], _ctx.params.scope) ){
    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/all")));
    const __nodesState = JSON.parse(stdout);

    var __idx = 0;
    const __objects = _.concat(_.keys(_.pickBy(__nodesState, _e => _e === "slave")), _.keys(_.pickBy(__nodesState, _e => _e === "master")), _.keys(_.pickBy(__nodesState, _e => _e === "single")));
    console.log("All the objects to close is <%s>", util.inspect(__objects));
    for(__idx=0; __idx<__objects.length; __idx++){
      console.log("The object to close herte is <%s>", __objects[__idx])
      var {stdout, stderr} = await exec(util.format("curl -X DELETE http://%s:8079%s", __objects[__idx], __$wrapAPI("/instance/current")));
      console.log("01 The output from stopping the slave <%s>", stdout);
    }

  }else if(_ctx.params.scope === "masterSlave"){
    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/all")));
    const __nodesState = JSON.parse(stdout);
    var __idx = 0;
    const __objects = _.concat(_.keys(_.pickBy(__nodesState, _e => _e === "master")), _.keys(_.pickBy(__nodesState, _e => _e === "slave")), _.keys(_.pickBy(__nodesState, _e => _e === "single")));
    console.log("All the objects to close is <%s>", util.inspect(__objects));
    for(__idx=0; __idx<__objects.length; __idx++){
      console.log("The object to close herte is <%s>", __objects[__idx])
      var {stdout, stderr} = await exec(util.format("curl -X DELETE http://%s:8079%s", __objects[__idx], __$wrapAPI("/instance/current")));
      console.log("02 The output from stopping the slave <%s>", stdout);
    }
  }
  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/instance/all')));
  _ctx.body = stdout;
};

const __startPGAsMaster = async () => {
  // * 1. Get both nodes' ip
  // * 2. Get the each node's status
  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/instance/all')));
  const __nodesState = JSON.parse(stdout);
  if(__nodesState[__nodesInfo.localIP] !== "inactive"){
    return {code:5, msg: "This node is already started"};
  }

  if(__nodesState[__nodesInfo.remoteIP]!== 'inactive'){
    return {code:6, msg: "This counter part node has been started"};
  }

  // * 3. Fetch the pg_wal file from remote if it's behind the remote one
  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/lsn/all')));
  const __lsnState = JSON.parse(stdout);

  // * 4. Fetch the archive file from remote if it's behind the remote one
  const __localLsn = __lsnState[__nodesInfo.localIP];
  const __remoteLsn = __lsnState[__nodesInfo.remoteIP];
  if(__localLsn.lastLsn < __remoteLsn.lastLsn ){
    //The last lsn is valid in the remote pg
    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s/%s/%s", __nodesInfo.remoteIP, __$wrapAPI('/validLsn'), __localLsn.timeLineID, __localLsn.lastLsn));
    const __lsnState = JSON.parse(stdout);
    if(__lsnState.code !== 0){
      return {code: 5, msg: util.format("Invalid lsn <%s> <%s>", __nodesInfo.remoteIP, __localLsn.lastLsn ) }
    }

    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s/%s", __nodesInfo.localIP, __$wrapAPI('/walFiles'), __localLsn.walFile));
    const __localWalFiles = JSON.parse(stdout);

    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s/%s", __nodesInfo.remoteIP, __$wrapAPI('/walFiles'), __localLsn.walFile));
    const __remoteWalFiles = JSON.parse(stdout);
    console.log("The files here are <%s>", stdout);

    const __diffWalFiles = _.differenceBy( __remoteWalFiles, __localWalFiles, _obj => _obj.file + "+" + _obj.md5);

    var __idx = 0;
    for(__idx = 0; __idx < __diffWalFiles.length; __idx++){
      var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s/%s --output %s%s", __nodesInfo.remoteIP, __$wrapAPI('/walFile'), __diffWalFiles[__idx].file, __$wrapPATH('/pg_wal/'), __diffWalFiles[__idx].file));
    }

  }

  // * 5. Fetch the latest slot to local
  var {stdout, stderr} = await exec(util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/slots/file')));
  const __slotStat = JSON.parse(stdout);

  // * 6. Make sure the recovery.conf is not there 
  if(fs.existsSync(__$wrapPATH("/recovery.conf"))){ fs.unlinkSync(__$wrapPATH("/recovery.conf")); }

  // * 7. Start the instance in this node
  var { stdout, stderr} = await exec("pg_ctl start -l /tmp/pg.log");
  console.log('stdout: <%s> and type is <%s>', stdout.replace(/\n$/, ''), typeof(stdout));
  console.log('stderr:', stderr);

  return {code:0, msg: "Successfully in starting the master node"}
};

const __startPGAsSlave = async () => {
  // *  1. Get the state from local and remote node
  // ** 1.1 If this node is active, return
  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/instance/all')));
  const __nodesState = JSON.parse(stdout);
  if(__nodesState[__nodesInfo.localIP] !== "inactive"){
    return {code:11, msg: "This node is already started"};
  }

  // ** 1.2 If the remote node is not active, return
  if(__nodesState[__nodesInfo.remoteIP] === "inactive"){
    return {code:12, msg: "The master hasd not been started"};
  }

  // ** 1.3 If the last lsn is not valid in the remote wal, return
  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/lsn/current')));
  const __localLsn = JSON.parse(stdout);
  console.log("The local lsn is <%s>", util.inspect(__localLsn));

  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s/%s/%s", __nodesInfo.remoteIP, __$wrapAPI('/validLsn'), __localLsn[__nodesInfo.localIP].timeLineID, __localLsn[__nodesInfo.localIP].lastLsn));
  const __lsnState = JSON.parse(stdout);
  console.log("The lsn is valid or not <%s>",util.inspect( __lsnState) );
  if(__lsnState.code !== 0){
    return {code:13, msg: 'Invalid lsn in the remote server', err: __lsnState.msg}
  }

  // * Download wal files from master(pg_wal/archive)
  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s/%s", __nodesInfo.remoteIP, __$wrapAPI('/walFiles'), __localLsn[__nodesInfo.localIP].walFile));
  const __remoteWalFiles = JSON.parse(stdout);
  console.log("All the files to take <%s>", util.inspect(__remoteWalFiles));

  var __idx = 0;
  for(__idx = 0; __idx < __remoteWalFiles.length; __idx++){
    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s/%s --output %s%s", __nodesInfo.remoteIP, __$wrapAPI('/walFile'), __remoteWalFiles[__idx].file, __$wrapPATH('/pg_wal/'), __remoteWalFiles[__idx].file));
  }

  // * 2 Create the recovery.conf if not exists
  if(!fs.existsSync(__$wrapPATH("/recovery.conf"))){ fs.symlinkSync(__$wrapPATH("/recovery.slave.conf"), __$wrapPATH('/recovery.conf')); }

  // * 3. Start the node as the slave
  var { stdout, stderr} = await exec("pg_ctl start -l /tmp/pg.log");
  console.log('stdout: <%s> and type is <%s>', stdout.replace(/\n$/, ''), typeof(stdout));
  console.log('stderr:', stderr);

  return {code:0, msg: "Successfully in starting the slave node"}
};

const __startPG = async (_ctx, _next) => {
  // If it's up, ignore it
  var __clusterState = __pgState();
  if(__clusterState > 0 ) {
    _ctx.body = "Active as " + __$resState[__clusterState];
    return;
  }

  if(_ctx.params.scope=== "current"){
    var { stdout, stderr} = await exec("pg_ctl start -l /tmp/pg.log");
    console.log('stdout: <%s> and type is <%s>', stdout.replace(/\n$/, ''), typeof(stdout));
    console.log('stderr:', stderr);
  }else if(_ctx.params.scope === "master"){
    //Call function __startPGAsMaster to bring the current server up as the master node
    await __startPGAsMaster ();
  }else if(_ctx.params.scope === "slave"){
    //Call function to bring the current server up as the slave node
    await __startPGAsSlave();
  }else if(_ctx.params.scope === "all"){
    //Call function to bring the current server up as the single node
    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/instance/all')));
    const __nodesState = JSON.parse(stdout);

    if((__nodesState[__nodesInfo.localIP] !== "inactive") || (__nodesState[__nodesInfo.remoteIP]!== 'inactive')){
      _ctx.body = JSON.stringify({code:5, msg: "Not all the nodes are inactive"});
      return;
    }
    console.log("Come herte to start the nodes");

    // * 4. Start the original slave node as the master
    console.log("The command to start <%s>", util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/instance/master')));
    var {stdout, stderr} = await exec(util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/instance/master')));
    console.log("01 The output from starting the master<%s>", stdout);

    // * 5. Start the original master node as the slave
    var {stdout, stderr} = await exec(util.format("curl -X POST http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI('/instance/slave')));
    console.log("02 The output from starting the slave <%s>", stdout);
  }else if(_ctx.params.scope === "failover"){
    await __failOver(_ctx.params.seq);
  }else if(_ctx.params.scope === "switchover"){
    _ctx.body = JSON.stringify(await __switchOver(_ctx.params.seq));
    return;
  }else{
    _ctx.body = JSON.stringify({code:2, msg: "invalid scope, {master/slave/single}"});
    return;
  }

  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/instance/all')));
  _ctx.body = stdout;
};

const __getFileLists = async (_walFile) => {
  const __fileMd5 = [];
  var __tmpParsedFile;
  console.log("The file to read <%s>", _walFile);
  const __listFiles = _.filter(fs.readdirSync(__$wrapPATH("/pg_wal")), _file => { 
    return (
     ((_file.length===24?true:false) && ( _file  >= _walFile))
     || ( (__tmpParsedFile = /([0-9A-F]{24}).partial$/.exec(_file)) && __tmpParsedFile[1] >= _walFile )
     || ( (__tmpParsedFile = /([0-9A-F]{8}).history$/.exec(_file)) && __tmpParsedFile[1] > /^([0-9A-F]{8})[0-9A-F]{16}$/.exec(_walFile)[1]  )
  )}  );

  __idx = 0;
  for(__idx=0; __idx < __listFiles.length; __idx++){
    const { stdout, stderr} = await exec("md5sum " + __$wrapPATH("/pg_wal/") + __listFiles[__idx]);
    __fileMd5.push( {file: stdout.split(/[\s]+/)[1].replace(/.*\/pg_wal\//, ''), md5: stdout.split(/[\s]+/)[0]});
    
  };
  return __fileMd5;
};

const __switchOver = async (_seq) => {

  const __clusterInfo = {}, __nodesState = {};

  // * 1. Get the cluster status
  const __clusterState = await __pgState();
  console.log("The current state is  <%s>", util.inspect(__clusterState));
  if(_.includes([0, 1, 4], __clusterState) ){
  // ** 1.1 Sinle node        -> {type: 'single'}
  // *** 1.1.1 Return {code:1, msg:"Single node, failed to switch over"}
    return {type: __$resState[__clusterState], msg: "Single node, failed to switch over"};
  }

  // ** 1.2 Master-Slave node -> {type: 'master-slave' , master: "192.168.1.10", slave: "192.168.1.11"}
  if(__clusterState === 2){
    // Call switch over to the slave node
    __nodesState["master"] = __nodesInfo["localIP"];
    __nodesState["slave"] = __nodesInfo["remoteIP"];
  // **** 1.2.1.2 Get master node 
  } else if(__clusterState === 3){
  // *** 1.2.2 current node is slave
    __nodesState["master"] = __nodesInfo["remoteIP"];
    __nodesState["slave"] = __nodesInfo["localIP"];
  }

  console.log("The node states are <%s>", util.inspect(__nodesState));

  // * 2. Stop the slave node /slaveMaster or masterSlave
  var {stdout, stderr} = await exec(util.format("curl -X DELETE http://%s:8079%s/%s", __nodesState.slave, __$wrapAPI('/instance'),  _seq));
  console.log("The output from stopping both nodes <%s>", stdout);

  // * 3. Start the master slave by the sequence (master->slave)
  var {stdout, stderr} = await exec(util.format("curl -X POST http://%s:8079%s", __nodesState.slave, __$wrapAPI('/instance/all')));
  console.log("02. The output from starting the master/slave<%s>", stdout);

  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/instance/all')));
  return JSON.parse(stdout);
};

const __failOver = async (_option) => {
  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/all")));
  const __nodesState = JSON.parse(stdout);
  console.log("The node state is <%s>", util.inspect(__nodesState));

  // * 1. Only one node is active
  if ( ((_.keys( _.pickBy(__nodesState, _e => _e === 'recovery'))).length !== 1 ) || 
       ( (_.keys(_.pickBy(__nodesState, _e => _e === 'inactive'))).length !== 1 )){
    return JSON.stringify({code: 2, msg: "Not meet the one node active and one node inactive"});
  }
  const __recoveryNode = _.keys( _.pickBy(__nodesState, _e => _e === 'recovery'))[0];
  
  // * 2. The active node is in the recovery mode
  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __recoveryNode, __$wrapAPI("/in_recovery")));
  const __recoveryState = JSON.parse(stdout);
  console.log("The node <%s> state is <%s>", __recoveryNode,  util.inspect(__recoveryState));
  if(__recoveryState["in_recovery"] !== 't'){
    return JSON.stringify({code: 3, msg: util.format("The node <%s> is not in the recovery mode", __recoveryState)});
  }

  // * 3. Branch option:
  if(_option === "promote"){
  // ** 3.1 promote
  // *** 3.1.1 Promote the slave node as master
  console.log("The command to promote is <%s>", util.format("curl -X POST http://%s:8079%s", __recoveryNode, __$wrapAPI('/node/promote')));
    var {stdout, stderr} = await exec(util.format("curl -X POST http://%s:8079%s", __recoveryNode, __$wrapAPI('/node/promote')));
//    if(fs.existsSync("/data/recovery.done")){ fs.unlinkSync("/data/recovery.done"); }
  // *** 3.1.2 Start the original master node as slave
  }else if(_option === "restart"){
  // ** 3.2 restart
  // *** 3.2.1 Stop the slave node
    var {stdout, stderr} = await exec(util.format("curl -X DELETE http://%s:8079%s", __recoveryNode, __$wrapAPI('/instance/current')));
    console.log("The output from stopping the master <%s>", stdout);

  // *** 3.2.1 Start the slave node as master
    var {stdout, stderr} = await exec(util.format("curl -X POST http://%s:8079%s", __recoveryNode, __$wrapAPI('/instance/master')));
    console.log("03. The output from starting the master<%s>", stdout);
  }else{
    return JSON.stringify({code: 4, msg: util.format("Invalid option to bring the slave up<%s>", _option)});
  }

//  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079/state/all", __nodesInfo.localIP));
//  return stdout;
};

//router.post("/switchover/:sequence", async (_ctx, _next) => {
//  _ctx.body = await __switchOver(_ctx.params.sequence);
//} );

//router.post("/failover/:option", async (_ctx, _next) => {
//  _ctx.body = await __failOver(_ctx.params.option);
//} );

router.post(__$wrapAPI("/instance/:scope"), __startPG);

router.post(__$wrapAPI("/instance/:scope/:seq"), __startPG);

router.delete(__$wrapAPI("/instance/:scope"), __stopPG);

router.get(__$wrapAPI("/instance/:scope"), async (_ctx, _next) => {
  const __ret = {};

  if(_ctx.params.scope === "current"){
    __ret[__nodesInfo["localIP"]] = __$resState[(await __pgState())];
  }else if(_ctx.params.scope === "all"){
    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/instance/current')));
console.log("The state is <%s>", stdout);
    _.assignIn(__ret, JSON.parse(stdout));

    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI('/instance/current')));
    _.assignIn(__ret, JSON.parse(stdout));
  }

  _ctx.body = JSON.stringify(__ret);

});

router.get(__$wrapAPI("/lsn/:scope"), async (_ctx, _next) => {
  var __ret = {};
  if(_ctx.params.scope === "current"){
    __ret[__nodesInfo["localIP"]] = await __pgCtlState();
  } else if(_ctx.params.scope === 'all'){
console.log("The command to fetch <%s>", util.format("curl -X GET http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/lsn/current")) );
    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/lsn/current")));
    _.assignIn(__ret, JSON.parse(stdout));

    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/lsn/current")));
    _.assignIn(__ret, JSON.parse(stdout));
  }
  _ctx.body = JSON.stringify(__ret);
});


router.post(__$wrapAPI("/walFile/:walFile"), async (_ctx, _next) => {
  const {files, fields} = await asyncBusboy(_ctx.req);
  const __targetFile = __$wrapPATH("/pg_wal/") + _ctx.params.walFile;
  console.log("The files is <%s>", __targetFile );
  try{
    fs.copyFileSync(files[0].path, __targetFile);
    _ctx.body = JSON.stringify({code:0, msg: util.format("The file <%s> was uploaded", __targetFile)});
  }catch(_err){
    console.log("The error is <%s>", util.inspect(_err));
  }
});

router.get(__$wrapAPI("/walFile/:walFile"), async (_ctx, _next) => {
  const __walFile = _ctx.params.walFile;
  if(fs.existsSync(__$wrapPATH("/pg_wal/") + __walFile)){
    await send(_ctx, __walFile, {root: __$wrapPATH("/pg_wal")}, );
  }
});

router.get(__$wrapAPI("/walFiles/:timeline/:lsn01/:lsn02"), async(_ctx, _next) => {
  const __walFile = ("0".repeat(10) + _ctx.params.timeline ).slice(-8) + ("0".repeat(10) + _ctx.params.lsn01).slice(-8) + ("0".repeat(10) + _ctx.params.lsn02.slice(0, -6)).slice(-8);
  _ctx.body = JSON.stringify(await __getFileLists(__walFile));
});

router.get(__$wrapAPI("/walFiles/:walFile"), async(_ctx, _next) => {
  _ctx.body = JSON.stringify(await __getFileLists(_ctx.params.walFile));
});

router.get(__$wrapAPI("/in_recovery"), async(_ctx, _next) => {
  const { stdout, stderr, code} = await exec("psql -t -c 'select pg_is_in_recovery()'");


  console.log("The status is <%s>", stdout.replace(/\n/g, '').trim());
  _ctx.body = JSON.stringify({in_recovery: stdout.replace(/\n/g, '').trim()})
});

router.post(__$wrapAPI("/node/:promote"), async(_ctx, _next) => {
  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/in_recovery')));
  const __recoveryState = JSON.parse(stdout);

  console.log("The return is <%s>",util.inspect(__recoveryState));
  if(__recoveryState["in_recovery"] === 'f'){
    return JSON.stringify({code:1, msg: 'Not in the recovery mode '});
  }

  var { stdout, stderr} = await exec("pg_ctl promote");
  console.log("The promote error message <%s>", stdout);
  var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI('/instance/all')));
  _ctx.body = stdout;
});

router.get(__$wrapAPI("/validLsn/:timeline/:lsn01/:lsn02"), async(_ctx, _next) => {
  const __walFile = ("0".repeat(10) + _ctx.params.timeline ).slice(-8) + ("0".repeat(10) + _ctx.params.lsn01).slice(-8) + ("0".repeat(10) + _ctx.params.lsn02.slice(0, -6)).slice(-8);
  console.log("The wal file is <%s>", __walFile);
  if(!fs.existsSync(__$wrapPATH("/pg_wal/") + __walFile) && fs.existsSync(__$wrapPATH("/pg_wal/") + __walFile + ".partial")){
    fs.symlinkSync(__$wrapPATH("/pg_wal/") + __walFile + ".partial", __$wrapPATH("/pg_wal/") + __walFile);
  }
  if(fs.existsSync(__$wrapPATH("/pg_wal/") + __walFile)){
    console.log("The file exists");
    _ctx.body = JSON.stringify( await __isValidLsn (__walFile, _ctx.params.lsn01 + "/" + ("0".repeat(10) + _ctx.params.lsn02).slice(-8)  ) );
  }else{
    _ctx.body = JSON.stringify({code: 1, msg: "wal file not exists"});
  }

  if(fs.lstatSync(__$wrapPATH("/pg_wal/") + __walFile).isSymbolicLink()){
    fs.unlinkSync(__$wrapPATH("/pg_wal/") + __walFile);
  }
});

//Fetch the slot's info/lsn/file from remote
router.get(__$wrapAPI("/slot/:slotname/:scope"), async(_ctx, _next) => {
console.log("-----------------The slot name is <%s> and scope is <%s>", _ctx.params.slotname, _ctx.params.scope);
  if(_.includes( ["lsn", "all"], _ctx.params.scope )){
    _ctx.body = JSON.stringify(await __readSlots(_ctx.params.slotname, _ctx.params.scope));
  }else if (_ctx.params.scope === "file"){
    const __slotFile = __$wrapPATH( util.format("/pg_replslot/%s/state", _ctx.params.slotname) );
    if(fs.existsSync(__slotFile)){
      await send(_ctx,"state", {root: __$wrapPATH(util.format("/pg_replslot/%s", _ctx.params.slotname) ) } );
    }else{
      _ctx.body = JSON.stringify({"code" : 1, msg: "No slot file there "});
    }
  }
});

//Getch the slot file onlen when the remote lsn is newer than the request one
router.get(__$wrapAPI("/slot/:slotname/:scope/:lsn"), async(_ctx, _next) => {
console.log("The slot name is <%s> and scope is <%s>", _ctx.params.slotname, _ctx.params.scope);
  if (_ctx.params.scope === "file"){
    const __localSlotInfo = await __readSlots(_ctx.params.slotname, 'lsn');
    console.log("The request is <%s> and remote is <%s>", _ctx.params.lsn.toUpperCase(), __localSlotInfo.confirmed_flush.toUpperCase());
    if(_ctx.params.lsn.toUpperCase() > __localSlotInfo.confirmed_flush.toUpperCase()){
      _ctx.body = JSON.stringify({code:2, msg: "The remote slot is ahead of the request one", lsn: __localSlotInfo.confirmed_flush});
      return;
    }
    const __slotFile = __$wrapPATH(  util.format("/pg_replslot/%s/state", _ctx.params.slotname) );
    if(fs.existsSync(__slotFile)){
      await send(_ctx,"state", {root: __$wrapPATH(util.format("/pg_replslot/%s", _ctx.params.slotname)) } );
    }else{
      _ctx.body = JSON.stringify({"code" : 1, msg: "No slot file there "});
    }
  }
});

router.get(__$wrapAPI("/slots/:scope"), async (_ctx, _next) => {
  if(_ctx.params.scope === "meta"){
    const __fileLsn = {};
    const __listFiles = fs.readdirSync(__$wrapPATH("/pg_replslot"));
  
    __idx = 0;
    for(__idx=0; __idx < __listFiles.length; __idx++){
      const __localSlotInfo = await __readSlots(__listFiles[__idx], 'lsn');
      __fileLsn[__listFiles[__idx]] = __localSlotInfo.confirmed_flush;
    };
    _ctx.body = JSON.stringify(__fileLsn);
    return;
  }else if(_ctx.params.scope === "all"){
    const __fileLsn = {};
    __fileLsn[__nodesInfo.localIP]  = {};
    __fileLsn[__nodesInfo.remoteIP] = {};
    const __listFiles = fs.readdirSync(__$wrapPATH("/pg_replslot"));
  
    __idx = 0;
    for(__idx=0; __idx < __listFiles.length; __idx++){
      const __localSlotInfo = await __readSlots(__listFiles[__idx], 'lsn');
      __fileLsn[__nodesInfo.localIP][__listFiles[__idx]] = __localSlotInfo.confirmed_flush;
    };

    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/slots/meta")));
    const __remoteMeta = JSON.parse(stdout);

    __fileLsn[__nodesInfo.remoteIP] = __remoteMeta

    _ctx.body = JSON.stringify(__fileLsn);
    return;
  }
});

router.get(__$wrapAPI("/pg/:path"), async (_ctx, _next) => {
  console.log("* 01. Get the parameters from context <%s> and the replacement one is <%s>", _ctx.params.path, "/data/" + _ctx.params.path.replace(/-/g, '/') );
  const __dataPath = _ctx.params.path.replace(/-/g, '/');
  console.log("* 02. Check the path existes <%s>", __dataPath);
  if(!fs.existsSync( "/data/" + __dataPath  )){ 
    _ctx.body = JSON.stringify({code: 1, msg: 'The folder does not exsited'});
    return;
  } else {
    console.log("The file exists in the server");
  }

  const __tarFile = util.format("%s.tar.gz", _.last(("/"+__dataPath).split('/')));

  if(fs.existsSync("/tmp" + __tarFile)){ fs.unlinkSync("/tmp" + __tarFile ); } 

  const __cmd = util.format("tar -zcvf /tmp/%s -C /data %s", __tarFile, __dataPath );
  console.log("* 03. Tar the file <%s> <%s> and <%s>", __dataPath,  _.last("/" + __dataPath.split('/')), __cmd );
  var {stdout, stderr} = await exec(__cmd);

  console.log("* 04. Send the file <%s> ", __tarFile);
  await send(_ctx, __tarFile, {root: "/tmp"}, );
});

router.post(__$wrapAPI("/pg/:way/:path"), async (_ctx, _next) => {
  const __dataPath = "/data/" + _ctx.params.path.replace(/-/g, '/') ;
  process.env.PGDATA = __dataPath;

  if(_ctx.params.way === "sync"){

    console.log("* 01. Get the parameters from context <%s> and the replacement one is <%s>", _ctx.params.path, __dataPath);
    console.log("* 02. Check the path existes");
    if(fs.existsSync(__dataPath)){ 
      _ctx.body = JSON.stringify({code: 1, msg: 'The folder has been exsited'});
      return;
    } else {
      console.log("The file exists in the server");
    }
  
    const __tarFile = util.format("%s.tar.gz", _.last(__dataPath.split('/')));
    const __curl = util.format("curl -X GET http://%s:8079%s/%s --output %s/%s", __nodesInfo.remoteIP, __$wrapAPI('/pg'), _ctx.params.path, '/tmp', __tarFile );
    console.log("The curl is to run <%s>", __curl);
    var {stdout, stderr} = await exec(__curl);
  
    var __cmd = util.format("tar xvf /tmp/%s -C /data", __tarFile);
    var {stdout, stderr} = await exec(__cmd);
  
    if(fs.existsSync("/tmp/" + __tarFile)){ fs.unlinkSync("/tmp/" + __tarFile); }
  
    var __cmd = util.format("/opt/entrypoint.sh init_etc");
    var {stdout, stderr} = await exec(__cmd);
  }else if (_ctx.params.way === "init"){
    var __cmd = util.format("/opt/entrypoint.sh init_db");
    var {stdout, stderr} = await exec(__cmd);
    console.log("The result is <%s>", stdout);
  }
});

router.post(__$wrapAPI("/slots/:scope"), async (_ctx, _next) => {
  const __ret = {};
  __ret["before-sync"] = {};
  if(_ctx.params.scope === "file"){
    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/slots/meta")));
    const __remoteSlotMeta = JSON.parse(stdout);
    console.log("The stdiyt is <%s>", util.inspect(__remoteSlotMeta));
    __ret["remote"] = __remoteSlotMeta;
    var __idx;
    for (__slot in __remoteSlotMeta){
      console.log("The slot is <%s>", util.inspect(__slot));
      const __localSlotInfo = await __readSlots(__slot, 'lsn');
      __ret["before-sync"][__slot] = __localSlotInfo.confirmed_flush;
      if(__localSlotInfo.confirmed_flush < __remoteSlotMeta[__slot] || __localSlotInfo.confirmed_flush === ""){
        if(!fs.existsSync(__$wrapPATH( "/pg_replslot" + "/" + __slot) )){
          fs.mkdirSync( __$wrapPATH("/pg_replslot" + "/" + __slot) , 0700);
        }
        var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s/%s/file --output %s/%s/%s", __nodesInfo.remoteIP, __$wrapAPI("/slot"), __slot, __$wrapPATH("/pg_replslot"), __slot, "state"));
      }
    }
    var {stdout, stderr} = await exec(util.format("curl -X GET http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/slots/meta")));
    __ret["after-sync"] = JSON.parse(stdout);
    _ctx.body = JSON.stringify(__ret);
  }
});

router.post(__$wrapAPI('/test/:testCase'), async (_ctx, _next) =>{
  console.log("Come ehre <%s> ", _ctx.params.testCase);
  const __funcCB = testCase[_ctx.params.testCase];
  if(__funcCB) { 
    _ctx.body = JSON.stringify(await __funcCB(_ctx));
  }else{
    _ctx.body = JSON.stringify({code:1, msg: 'No test case found'});
  }
});

router.post(__$wrapAPI('/nodes/:scope'), async (_ctx, _next) => {
  if(_ctx.params.scope === "env"){
    __nodesInfo.localIP  = process.env.LOCAL_NODE;
    __nodesInfo.remoteIP = process.env.REMOTE_NODE;
    _ctx.body = JSON.stringify({local_node: __nodesInfo.localIP, remote_node: __nodesInfo.remoteIP});
  }
});

app.use(bodyParser());

app
  .use(router.routes(app))
  .use(router.allowedMethods());

var server = app.listen(8086, '0.0.0.0');

