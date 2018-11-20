#!/bin/bash

pg_waldump -s $2 $1 2>/dev/null | head -n 1
