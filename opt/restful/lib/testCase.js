const util            = require("util");
const assert = require('assert');
const exec = util.promisify(require('child_process').exec);

const __nodesInfo = require("/opt/etc/config.json");
const __$wrapAPI = (_urn) =>  '/api/pg/v1' + _urn;

const __testCase01 = async (_ctx) => {
  console.log("Stop the nodes");
  const __retState = {};
  // 01. Stop both nodes
  var __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/all"));
  var {stdout, stderr} = await exec(__curl);
  var __ret = JSON.parse(stdout);
  try{
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["01"] = {cmd: __curl};
  }catch(_err){
    __retState["01"] = {msg: "Stop two nodes ", step: "01"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 02. Start local node as master
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/master"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'single');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["02"] = {cmd: __curl};
  }catch(_err){
    __retState["02"] = {msg: "Start local node as the master", step: "02", cmd: __curl};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 04. Start remote node as slave
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/instance/slave"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'master');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'slave');
    __retState["04"] = {cmd: __curl};
  }catch(_err){
    __retState["04"] = {msg: "Start remote node as the slave", step: "04"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));
  // 06. Stop the node01(master)
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/instance/master"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'recovery');
    __retState["11"] = {cmd: __curl};
  }catch(_err){
    __retState["11"] = {msg: "Stop local node (master)", step: "11"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 07. Stop the node02(slave)
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/instance/current"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from stopping slave is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["12"] = {cmd: __curl};
  }catch(_err){
    __retState["12"] = {msg: "Stop remote node (slave)", step: "12"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 21. Start local node as master
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/current"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'single');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["21"] = {cmd: __curl};
  }catch(_err){
    __retState["21"] = {msg: "Start local node as the master", step: "21"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 23. Start remote node as slave
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/instance/current"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'master');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'slave');
    __retState["23"] = {cmd: __curl};
  }catch(_err){
    __retState["23"] = {msg: "Start remote node as the slave", step: "23"};
    return __retState;
  }

  // 24.  Stop all the nodes to reset
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/masterSlave"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["24"] = {cmd: __curl};
  }catch(_err){
    __retState["24"] = {msg: "Start remote node as the slave", step: "24"};
    return __retState;
  }

  return __retState;   
};


const __testCase02 = async (_ctx) => {
  console.log("Stop the nodes");
  const __retState = {};
  // 01. Stop both nodes
  var __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/slaveMaster"));
  var {stdout, stderr} = await exec(__curl);
  var __ret = JSON.parse(stdout);
  try{
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["01"] = {cmd: __curl};
  }catch(_err){
    __retState["01"] = {msg: "Stop two nodes ", step: "01"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 02. Start local node as master
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/all/masterSalve"));
  var {stdout, stderr} = await exec(__curl);
  try{
    await new Promise(done => setTimeout(done, 2000));
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'master');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'slave');
    __retState["02"] = {cmd: __curl};
  }catch(_err){
    __retState["02"] = {msg: "Start local node as the master", step: "02", cmd: __curl};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));
  // 11. Stop the node01(master)
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/slave"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'single');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["11"] = {cmd: __curl};
  }catch(_err){
    __retState["11"] = {msg: "Stop local node (master)", step: "06"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 13. Stop the node02(slave)
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/current"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from stopping slave is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["13"] = {cmd: __curl};
  }catch(_err){
    __retState["13"] = {msg: "Stop remote node (slave)", step: "07"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 21. Start local node as master
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/current"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'single');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["21"] = {cmd: __curl};
  }catch(_err){
    __retState["21"] = {msg: "Start local node as the master", step: "08"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 23. Start remote node as slave
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/instance/current"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'master');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'slave');
    __retState["23"] = {cmd: __curl};
  }catch(_err){
    __retState["23"] = {msg: "Start remote node as the slave", step: "10"};
    return __retState;
  }

  // 24.  Stop all the nodes to reset
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/slaveMaster"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["24"] = {cmd: __curl};
  }catch(_err){
    __retState["24"] = {msg: "Start remote node as the slave", step: "11"};
    return __retState;
  }

  return __retState;   
};

const __testCase03 = async (_ctx) => {
  console.log("Stop the nodes");
  const __retState = {};
  // 01. Stop both nodes
  var __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/slaveMaster"));
  var {stdout, stderr} = await exec(__curl);
  console.log("****** 1. Stopped the status <%s>", stdout);
  var __ret = JSON.parse(stdout);
  try{
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["01"] = {cmd: __curl};
  }catch(_err){
    __retState["01"] = {msg: "Stop two nodes ", step: "01"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 02. Start local node as master
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/all/masterSalve"));
  var {stdout, stderr} = await exec(__curl);
  try{
    await new Promise(done => setTimeout(done, 2000));
    console.log("****** 2. After start the master slave <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'master');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'slave');
    __retState["02"] = {cmd: __curl};
  }catch(_err){
    __retState["02"] = {msg: "Start local node as the master", step: "02", cmd: __curl};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 11. Stop the node01(master)
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/switchover/slaveMaster"));
  var {stdout, stderr} = await exec(__curl);
  console.log("****** 3. After switch over the master slave <%s>", stdout);
  try{
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'slave');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'master');
    __retState["11"] = {cmd: __curl};
  }catch(_err){
    __retState["11"] = {msg: "Stop local node (master)", step: "11"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 21.  Stop all the nodes to reset
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/slaveMaster"));
  var {stdout, stderr} = await exec(__curl);
  try{
    await new Promise(done => setTimeout(done, 2000));
    console.log("****** 4. After stop master slave <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["21"] = {cmd: __curl};
  }catch(_err){
    __retState["21"] = {msg: "Start remote node as the slave", step: "21"};
    return __retState;
  }

  return __retState;   
};


const __testCase04 = async (_ctx) => {
  console.log("Stop the nodes");
  const __retState = {};
  // 01. Stop both nodes
  var __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/slaveMaster"));
  var {stdout, stderr} = await exec(__curl);
  console.log("****** 1. Stopped the status <%s>", stdout);
  var __ret = JSON.parse(stdout);
  try{
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["01"] = {cmd: __curl};
  }catch(_err){
    __retState["01"] = {msg: "Stop two nodes ", step: "01"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 02. Start local node as master
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/all/slaveMaster"));
  var {stdout, stderr} = await exec(__curl);
  try{
    await new Promise(done => setTimeout(done, 2000));
    console.log("****** 2. After start the master slave <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'master');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'slave');
    __retState["02"] = {cmd: __curl};
  }catch(_err){
    __retState["02"] = {msg: "Start local node as the master", step: "02", cmd: __curl};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 11. Stop the node01(master)
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/switchover/slaveMaster"));
  var {stdout, stderr} = await exec(__curl);
  console.log("****** 3. After switch over the master slave <%s>", stdout);
  try{
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'slave');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'master');
    __retState["11"] = {cmd: __curl};
  }catch(_err){
    __retState["11"] = {msg: "Stop local node (master)", step: "11"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 21.  Stop all the nodes to reset
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/slaveMaster"));
  var {stdout, stderr} = await exec(__curl);
  try{
    await new Promise(done => setTimeout(done, 2000));
    console.log("****** 4. After stop master slave <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["21"] = {cmd: __curl};
  }catch(_err){
    __retState["21"] = {msg: "Start remote node as the slave", step: "21"};
    return __retState;
  }

  return __retState;   
};

const __testCase05 = async (_ctx) => {
  console.log("Stop the nodes");
  const __retState = {};
  // 01. Stop both nodes
  var __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/all"));
  var {stdout, stderr} = await exec(__curl);
  var __ret = JSON.parse(stdout);
  try{
    console.log("****** 01. The cluster stopped <%s>", stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["01"] = {cmd: __curl};
  }catch(_err){
    __retState["01"] = {msg: "Stop two nodes ", step: "01"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 02. Start local node as master
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/master"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("****** 02. Start the maste node  <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'single');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["02"] = {cmd: __curl};
  }catch(_err){
    __retState["02"] = {msg: "Start local node as the master", step: "02", cmd: __curl};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 04. Start remote node as slave
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/instance/slave"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("****** 04. Start the slave node <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'master');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'slave');
    __retState["04"] = {cmd: __curl};
  }catch(_err){
    __retState["04"] = {msg: "Start remote node as the slave", step: "04"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));
  // 11. Stop the node01(master)
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/instance/master"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("****** 11. After stop the master <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'recovery');
    __retState["11"] = {cmd: __curl};
  }catch(_err){
    __retState["11"] = {msg: "Stop local node (master)", step: "11"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 12. Failover by the restart
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/instance/failover/restart"));
  var {stdout, stderr} = await exec(__curl);
  try{
    await new Promise(done => setTimeout(done, 2000));
    console.log("****** 12. After failover the slave <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'single');
    __retState["12"] = {cmd: __curl};
  }catch(_err){
    __retState["12"] = {msg: "Stop remote node (slave)", step: "12"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 21. Start local node as master
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/slave"));
  var {stdout, stderr} = await exec(__curl);
  try{
    await new Promise(done => setTimeout(done, 2000));
    console.log("****** 21. After after the original master as slave <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'slave');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'master');
    __retState["21"] = {cmd: __curl};
  }catch(_err){
    __retState["21"] = {msg: "Start local node as the master", step: "21"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 23.  Stop all the nodes to reset
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/masterSlave"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["23"] = {cmd: __curl};
  }catch(_err){
    __retState["23"] = {msg: "Start remote node as the slave", step: "23"};
    return __retState;
  }

  return __retState;   
};


const __testCase06 = async (_ctx) => {
  console.log("Stop the nodes");
  const __retState = {};
  // 01. Stop both nodes
  var __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/all"));
  var {stdout, stderr} = await exec(__curl);
  var __ret = JSON.parse(stdout);
  try{
    console.log("****** 01. The cluster stopped <%s>", stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["01"] = {cmd: __curl};
  }catch(_err){
    __retState["01"] = {msg: "Stop two nodes ", step: "01"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 02. Start local node as master
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/master"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("****** 02. Start the maste node  <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'single');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["02"] = {cmd: __curl};
  }catch(_err){
    __retState["02"] = {msg: "Start local node as the master", step: "02", cmd: __curl};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 04. Start remote node as slave
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/instance/slave"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("****** 04. Start the slave node <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'master');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'slave');
    __retState["04"] = {cmd: __curl};
  }catch(_err){
    __retState["04"] = {msg: "Start remote node as the slave", step: "04"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));
  // 11. Stop the node01(master)
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/instance/master"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("****** 11. After stop the master <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'recovery');
    __retState["11"] = {cmd: __curl};
  }catch(_err){
    __retState["11"] = {msg: "Stop local node (master)", step: "11"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 12. Failover by the restart
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.remoteIP, __$wrapAPI("/instance/failover/promote"));
  var {stdout, stderr} = await exec(__curl);
  try{
    await new Promise(done => setTimeout(done, 2000));
    console.log("****** 12. After failover the slave <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'single');
    __retState["12"] = {cmd: __curl};
  }catch(_err){
    __retState["12"] = {msg: "Stop remote node (slave)", step: "12"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 21. Start local node as master
  __curl = util.format("curl -X POST http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/slave"));
  var {stdout, stderr} = await exec(__curl);
  try{
    await new Promise(done => setTimeout(done, 2000));
    console.log("****** 21. After after the original master as slave <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'slave');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'master');
    __retState["21"] = {cmd: __curl};
  }catch(_err){
    __retState["21"] = {msg: "Start local node as the master", step: "21"};
    return __retState;
  }

  await new Promise(done => setTimeout(done, 2000));

  // 23.  Stop all the nodes to reset
  __curl = util.format("curl -X DELETE http://%s:8079%s", __nodesInfo.localIP, __$wrapAPI("/instance/masterSlave"));
  var {stdout, stderr} = await exec(__curl);
  try{
    console.log("The outpur from start as master is <%s>", stdout);
    var __ret = JSON.parse(stdout);
    assert.strictEqual(__ret[__nodesInfo.localIP], 'inactive');
    assert.strictEqual(__ret[__nodesInfo.remoteIP], 'inactive');
    __retState["23"] = {cmd: __curl};
  }catch(_err){
    __retState["23"] = {msg: "Start remote node as the slave", step: "23"};
    return __retState;
  }

  return __retState;   
};

module.exports = {
  testCase01: __testCase01,
  testCase02: __testCase02,
  testCase03: __testCase03,
  testCase04: __testCase04,
  testCase05: __testCase05,
  testCase06: __testCase06
};
