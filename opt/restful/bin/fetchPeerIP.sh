#!/bin/bash

ss | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}:$1" | awk '{print $6}'

