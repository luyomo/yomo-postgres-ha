#!/bin/bash

echo -n "{"

#slot name
echo -n '"slot_name":"'
xxd  $1 | awk ' /000000[1-4]0/ { for(_idx=2; _idx<10; _idx++){ if ( $_idx == 0 ) break; printf $_idx } };' | xxd -r -p
echo -n '"'

#oid
echo -n ',"oid":"'
xxd  $1 | awk ' /00000050/ { for(_idx=3; _idx>1; _idx--){ printf sprintf("%d", "0x"substr($_idx,3,2) substr($_idx,1,2) ) } }; END { printf  _ret } ' 
echo -n '"'

#catalog_xmin
echo -n ',"catalog_xmin":"'
xxd  $1 | awk ' /00000050/ { for(_idx=9; _idx>7; _idx--){ printf sprintf("%d", "0x"substr($_idx,3,2) substr($_idx,1,2) ) } }; END { printf  _ret } ' 
echo -n '"'

#xmin
echo  -n ',"xmin":"'
xxd  $1 | awk ' /00000050/ { for(_idx=7; _idx>5; _idx--){ printf sprintf("%d", "0x"substr($_idx,3,2) substr($_idx,1,2) ) } }; END { printf  _ret } ' 
echo -n '"'

#restart_lsn
echo -n ',"restart_lsn":"'
xxd  $1 | awk ' /00000060/ { for(_idx=5; _idx>1; _idx--){ printf substr($_idx,3,2) substr($_idx,1,2) } }; END { printf  _ret } '
echo -n '"'
#confirmed_flush
echo -n ',"confirmed_flush":"'
xxd  $1 | awk ' /00000060/ { for(_idx=9; _idx>5; _idx--){ printf substr($_idx,3,2) substr($_idx,1,2) } }; END { printf  _ret } '
echo -n '"'

##Plugin name
echo -n ',"plugin":"'
xxd  $1 | awk ' /000000[7-a]0/ { for(_idx=2; _idx<10; _idx++){ if($_idx == 0) break; if(substr($_idx,3,2) == "00") { printf substr($_idx, 1,2) }  else { printf $_idx} } };' | xxd -r -p
echo -n '"'
echo -n "}"
